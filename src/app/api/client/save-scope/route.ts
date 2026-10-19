import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';
import {
  sendAdminScopeSavedNotification,
  sendAdminOnboardingCompletedNotification,
} from '@/lib/emailNotification';
import { saveScopeSchema } from '@/lib/clientOrder';
import { recalculateCanonicalScopeQuote, type PromoDiscountInfo } from '@/lib/pricing';

const CHECKLIST_KEYS = [
  'brand_assets_uploaded',
  'domain_dns_ready',
  'repo_collaborator_added',
  'kickoff_call_scheduled',
];

function isChecklistComplete(checklist: Record<string, unknown> | null | undefined): boolean {
  if (!checklist || typeof checklist !== 'object') return false;
  return CHECKLIST_KEYS.every((k) => Boolean(checklist[k]));
}

export async function POST(req: Request) {
  try {
    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = saveScopeSchema.safeParse(rawJson);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.message, issues: parseResult.error.issues }, { status: 400 });
    }

    const payload = parseResult.data;
    const rawObj = (rawJson && typeof rawJson === 'object' ? rawJson : {}) as Record<string, unknown>;
    const scopeCode = payload.scopeCode;

    // Degraded dev/CI mode: no Supabase environment, skip auth + persistence.
    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Scope brief acknowledged (degraded mode).' });
    }

    // Canonical client email always comes from the verified session token.
    const sessionEmail = await getVerifiedSessionEmail(req);
    if (!sessionEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    const isAdmin = isAdminEmail(sessionEmail);

    // Check existing in normalized table first so we know ownership & prior state
    const { data: existingScope, error: selectErr } = await supabase
      .from('client_scopes')
      .select('id, scope_code, client_email, base_engine, total_cost_inr, signed_at, onboarding_checklist')
      .eq('scope_code', scopeCode)
      .maybeSingle();

    if (selectErr) {
      console.warn('Select client_scopes DB error:', selectErr);
      return NextResponse.json({ error: selectErr.message }, { status: 500 });
    }

    if (existingScope && existingScope.client_email && existingScope.client_email !== sessionEmail && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: scope belongs to another account.' }, { status: 403 });
    }

    const clientEmail = (isAdmin && existingScope?.client_email) ? existingScope.client_email : sessionEmail;

    // 1. Ensure Client Profile entity exists in `clients`
    let clientId: string | undefined;
    try {
      const { data: clientRow } = await supabase
        .from('clients')
        .select('id')
        .eq('email', clientEmail)
        .maybeSingle();

      if (clientRow) {
        clientId = clientRow.id;
        if (payload.companyName || payload.contactPhone) {
          await supabase
            .from('clients')
            .update({
              company_name: payload.companyName || undefined,
              phone: payload.contactPhone || undefined,
              updated_at: new Date().toISOString(),
            })
            .eq('id', clientId);
        }
      } else {
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            email: clientEmail,
            company_name: payload.companyName || 'My Custom Project',
            phone: payload.contactPhone || '',
          })
          .select('id')
          .maybeSingle();
        clientId = newClient?.id;
      }
    } catch (clientErr) {
      console.warn('Client profile sync warning:', clientErr);
    }

    // 2. Convert any matching intake_leads draft/new row to converted status
    try {
      const leadUpdate = supabase
        .from('intake_leads')
        .update({ status: 'converted' })
        .eq('contact_email', clientEmail);
      if (typeof (leadUpdate as unknown as { in?: unknown }).in === 'function') {
        await (leadUpdate as unknown as { in: (col: string, vals: string[]) => Promise<unknown> }).in('status', ['new', 'draft']);
      } else {
        await leadUpdate.eq('status', 'draft');
      }
    } catch {}

    const existingChecklist = (payload.onboardingChecklist || {}) as Record<string, unknown>;
    const onboardingChecklistMerged = {
      ...existingChecklist,
      ...(payload.designReadiness ? { design_readiness: payload.designReadiness } : {}),
      ...(payload.hostingOwnership ? { hosting_ownership: payload.hostingOwnership } : {}),
      ...(payload.taxInvoicingPreference ? { tax_invoicing_preference: payload.taxInvoicingPreference } : {}),
      ...(payload.inspirationLinks ? { inspiration_links: payload.inspirationLinks } : {}),
    };

    // Recalculate canonical pricing when engine matches catalog
    const canonical = recalculateCanonicalScopeQuote({
      baseEngineTitle: payload.baseEngineTitle,
      selectedFeatures: payload.selectedFeatures || [],
      brandAssetOption: payload.brandAssetOption,
      maintenancePlan: payload.maintenancePlan,
      promoCode: (payload.metadata?.promoCode as PromoDiscountInfo | undefined) ?? null,
      fallbackINR: Number(payload.totalCostINR) || 0,
      fallbackUSD: Number(payload.totalCostUSD) || 0,
    });

    const verifiedCostINR = canonical.matched ? canonical.totalINR : (Number(payload.totalCostINR) || 0);
    const verifiedCostUSD = canonical.matched ? canonical.totalUSD : (Number(payload.totalCostUSD) || 0);

    // 3. Target normalized `client_scopes` table
    const scopeData: Record<string, unknown> = {
      scope_code: scopeCode,
      client_id: clientId,
      client_email: clientEmail,
      company_name: payload.companyName || 'My Custom Project',
      client_phone: payload.contactPhone || '',
      base_engine: payload.baseEngineTitle || 'Full-Stack Web Engine',
      features: payload.selectedFeatures || [],
      brand_asset: payload.brandAssetOption || 'Standard',
      maintenance_plan: payload.maintenancePlan || 'Self-Managed (30-Day Warranty)',
      total_cost_inr: verifiedCostINR,
      total_cost_usd: verifiedCostUSD,
      currency: payload.currency || 'INR',
      timeline: payload.timeline || 'Standard Turnaround',
      business_kpi: payload.businessKPI || '',
      payment_structure: payload.paymentStructure || '50/50',
      signed_at: payload.signedAt || undefined,
      signed_by_email: payload.signedByEmail || undefined,
      onboarding_checklist: onboardingChecklistMerged,
      sow_hash: payload.sowHash || undefined,
      retriever_tenant_id: payload.retrieverTenantId || undefined,
      metadata: payload.metadata || {},
      updated_at: new Date().toISOString(),
    };

    if (isAdmin) {
      if (typeof rawObj.deliveryStage === 'string' && rawObj.deliveryStage) {
        scopeData.delivery_stage = rawObj.deliveryStage;
      }
      if (typeof rawObj.status === 'string' && rawObj.status) {
        scopeData.status = rawObj.status;
      }
      if (typeof rawObj.depositPaid === 'boolean') {
        scopeData.deposit_paid = rawObj.depositPaid;
      }
      if (typeof rawObj.balancePaid === 'boolean') {
        scopeData.balance_paid = rawObj.balancePaid;
      }
      if (typeof rawObj.isFullyPaid === 'boolean') {
        scopeData.is_fully_paid = rawObj.isFullyPaid;
      }
    }

    const savedScopeId: string | undefined = existingScope?.id;

    if (existingScope) {
      const { error: updateErr } = await supabase
        .from('client_scopes')
        .update(scopeData)
        .eq('scope_code', scopeCode);

      if (updateErr) {
        console.warn('Update client_scopes DB error:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await supabase.from('client_scopes').insert({
        ...scopeData,
        status: 'Draft Proposal',
        delivery_stage: 'architecture',
        deposit_paid: false,
        balance_paid: false,
        is_fully_paid: false,
      });

      if (insertErr) {
        console.warn('Insert client_scopes DB error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    // If admin provided deliverables in payload, upsert into project_deliverables
    if (isAdmin && rawObj.deliverables && typeof rawObj.deliverables === 'object' && savedScopeId) {
      try {
        const deliv = rawObj.deliverables as Record<string, unknown>;
        await supabase.from('project_deliverables').upsert(
          {
            scope_id: savedScopeId,
            staging_url: typeof deliv.staging_url === 'string' ? deliv.staging_url : '',
            production_url: typeof deliv.production_url === 'string' ? deliv.production_url : '',
            github_repo: typeof deliv.github_repo === 'string' ? deliv.github_repo : '',
            figma_url: typeof deliv.figma_url === 'string' ? deliv.figma_url : '',
            signoff_pdf_url: typeof deliv.signoff_pdf_url === 'string' ? deliv.signoff_pdf_url : '',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'scope_id' }
        );
      } catch (delivErr) {
        console.warn('Admin deliverables upsert warning:', delivErr);
      }
    }

    // Determine whether to fire admin email notification (avoid spamming on individual checklist toggles)
    const wasChecklistComplete = isChecklistComplete(
      existingScope?.onboarding_checklist as Record<string, unknown> | undefined
    );
    const nowChecklistComplete = isChecklistComplete(onboardingChecklistMerged);

    if (!wasChecklistComplete && nowChecklistComplete) {
      const summaryLines = Object.entries(onboardingChecklistMerged)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join('\n');
      sendAdminOnboardingCompletedNotification({
        scopeCode,
        companyName: String(scopeData.company_name),
        clientEmail,
        checklistSummary: summaryLines,
      }).catch((err) => console.warn('Failed to send onboarding completion notification:', err));
    } else {
      const isNewScope = !existingScope;
      const isCommercialChange =
        existingScope &&
        (existingScope.base_engine !== scopeData.base_engine ||
          Number(existingScope.total_cost_inr) !== Number(scopeData.total_cost_inr) ||
          (!existingScope.signed_at && Boolean(scopeData.signed_at)));

      if (isNewScope || isCommercialChange) {
        sendAdminScopeSavedNotification({
          scopeCode,
          companyName: String(scopeData.company_name),
          clientEmail,
          baseEngineTitle: String(scopeData.base_engine),
          totalCostINR: Number(scopeData.total_cost_inr),
          totalCostUSD: Number(scopeData.total_cost_usd),
        }).catch((err) => console.warn('Failed to send admin scope saved notification:', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Scope brief persisted successfully.',
      scope: {
        id: savedScopeId || `scope-${scopeCode}`,
        scope_code: scopeCode,
        total_cost_inr: verifiedCostINR,
        total_cost_usd: verifiedCostUSD,
      },
    });
  } catch (err: unknown) {
    console.error('Save Scope API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}