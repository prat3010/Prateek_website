import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { sendAdminScopeSavedNotification } from '@/lib/emailNotification';


export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const scopeCode = payload.scopeCode as string | undefined;
    if (!scopeCode) {
      return NextResponse.json({ error: 'Missing scopeCode' }, { status: 400 });
    }

    // Degraded dev/CI mode: no Supabase environment, skip auth + persistence.
    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Scope brief acknowledged (degraded mode).' });
    }

    // Canonical client email always comes from the verified session token.
    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

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

    // 2. Convert any matching intake_leads draft to converted status
    try {
      await supabase
        .from('intake_leads')
        .update({ status: 'converted' })
        .eq('contact_email', clientEmail)
        .eq('status', 'draft');
    } catch {}

    const existingChecklist = (payload.onboardingChecklist || payload.onboarding_checklist || {}) as Record<string, unknown>;
    const onboardingChecklistMerged = {
      ...existingChecklist,
      ...(payload.designReadiness ? { design_readiness: payload.designReadiness } : {}),
      ...(payload.hostingOwnership ? { hosting_ownership: payload.hostingOwnership } : {}),
      ...(payload.taxInvoicingPreference ? { tax_invoicing_preference: payload.taxInvoicingPreference } : {}),
      ...(payload.inspirationLinks ? { inspiration_links: payload.inspirationLinks } : {}),
    };

    // 3. Target normalized `client_scopes` table
    const scopeData = {
      scope_code: scopeCode,
      client_id: clientId,
      client_email: clientEmail,
      company_name: payload.companyName || 'My Custom Project',
      client_phone: payload.contactPhone || '',
      base_engine: payload.baseEngineTitle || 'Full-Stack Web Engine',
      features: payload.selectedFeatures || [],
      brand_asset: payload.brandAssetOption || 'Standard',
      maintenance_plan: payload.maintenancePlan || 'Self-Managed (30-Day Warranty)',
      total_cost_inr: Number(payload.totalCostINR) || 0,
      total_cost_usd: Number(payload.totalCostUSD) || 0,
      currency: payload.currency || 'INR',
      timeline: payload.timeline || 'Standard Turnaround',
      business_kpi: payload.businessKPI || payload.business_kpi || '',
      payment_structure: payload.paymentStructure || payload.payment_structure || '50/50',
      signed_at: payload.signedAt || payload.signed_at || undefined,
      signed_by_email: payload.signedByEmail || payload.signed_by_email || undefined,
      onboarding_checklist: onboardingChecklistMerged,
      updated_at: new Date().toISOString(),
    };

    // Check existing in normalized table
    const { data: existingScope, error: selectErr } = await supabase
      .from('client_scopes')
      .select('scope_code, client_email')
      .eq('scope_code', scopeCode)
      .maybeSingle();

    if (selectErr) {
      console.warn('Select client_scopes DB error:', selectErr);
      return NextResponse.json({ error: selectErr.message }, { status: 500 });
    }

    if (existingScope) {
      if (existingScope.client_email && existingScope.client_email !== clientEmail) {
        return NextResponse.json({ error: 'Forbidden: scope belongs to another account.' }, { status: 403 });
      }

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
      });

      if (insertErr) {
        console.warn('Insert client_scopes DB error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    sendAdminScopeSavedNotification({
      scopeCode,
      companyName: scopeData.company_name,
      clientEmail,
      baseEngineTitle: scopeData.base_engine,
      totalCostINR: scopeData.total_cost_inr,
      totalCostUSD: scopeData.total_cost_usd,
    }).catch(err => console.warn('Failed to send admin scope saved notification:', err));

    return NextResponse.json({ success: true, message: 'Scope brief persisted successfully.' });
  } catch (err: unknown) {
    console.error('Save Scope API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}