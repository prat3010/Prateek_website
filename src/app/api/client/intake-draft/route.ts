import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { sendAdminIntakeLeadNotification } from '@/lib/emailNotification';
import { getIpHash } from '@/lib/security';
import { intakeDraftSchema } from '@/lib/clientOrder';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function POST(req: Request) {
  try {
    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = intakeDraftSchema.safeParse(rawJson);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.message, issues: parseResult.error.issues }, { status: 400 });
    }

    const payload = parseResult.data;
    const rawObj = (rawJson && typeof rawJson === 'object') ? (rawJson as Record<string, unknown>) : {};

    if (!payload.companyName && !payload.contactEmail) {
      return NextResponse.json({ error: 'Invalid intake lead payload: companyName or contactEmail required' }, { status: 400 });
    }

    const scopeCode = (typeof rawObj.scopeCode === 'string' && rawObj.scopeCode.trim())
      ? rawObj.scopeCode.trim()
      : `SCOPE-${Math.floor(10000 + Math.random() * 90000)}`;

    const draftToken = `draft_${scopeCode}_${Date.now()}`;

    if (!supabase) {
      const res = NextResponse.json({ success: true, draftId: draftToken, scopeCode });
      res.cookies.set('prateeq_draft_token', draftToken, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      res.cookies.set('prateeq_pending_scope_code', scopeCode, {
        path: '/',
        maxAge: 604800,
        sameSite: 'lax',
      });
      return res;
    }

    // 1. Check if an existing intake lead with this scope_code already exists for update
    if (scopeCode) {
      const { data: existingLead } = await supabase
        .from('intake_leads')
        .select('id, draft_token, notes_internal, contact_email, company_name, base_engine_title, contact_phone, total_cost_inr, total_cost_usd, timeline')
        .eq('scope_code', scopeCode)
        .maybeSingle();

      if (existingLead?.id) {
        // IDOR Defense: verify caller owns this lead via draft token cookie/body or verified session email
        const cookieMatch = (req.headers.get('cookie') || '').match(/(?:^|;\s*)prateeq_draft_token=([^;]+)/);
        const cookieDraftToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
        const clientDraftToken = (typeof rawObj.draftToken === 'string' && rawObj.draftToken.trim())
          ? rawObj.draftToken.trim()
          : cookieDraftToken;

        const sessionEmail = await getVerifiedSessionEmail(req);
        const isTokenOwner = Boolean(existingLead.draft_token && clientDraftToken === existingLead.draft_token);
        const isEmailOwner = Boolean(sessionEmail && existingLead.contact_email && sessionEmail.toLowerCase() === existingLead.contact_email.toLowerCase());

        if (existingLead.draft_token && !isTokenOwner && !isEmailOwner) {
          return NextResponse.json(
            { error: 'Forbidden: Invalid draft token or session for this scope code.' },
            { status: 403 }
          );
        }

        const updatePayload: Record<string, unknown> = {
          company_name: payload.companyName || undefined,
          contact_email: payload.contactEmail || undefined,
          contact_phone: payload.contactPhone || undefined,
          project_goal: payload.projectGoal || undefined,
          target_audience: payload.targetAudience || undefined,
          base_engine_id: payload.baseEngineId || undefined,
          base_engine_title: payload.baseEngineTitle || undefined,
          selected_features: payload.selectedFeatures || undefined,
          brand_asset_option: payload.brandAssetOption || undefined,
          maintenance_plan: payload.maintenancePlan || undefined,
          total_cost_inr: payload.totalCostINR !== undefined ? Number(payload.totalCostINR) : undefined,
          total_cost_usd: payload.totalCostUSD !== undefined ? Number(payload.totalCostUSD) : undefined,
          timeline: payload.timeline || undefined,
          inspiration_links: payload.inspirationLinks || undefined,
          additional_notes: payload.additionalNotes || undefined,
          chat_session_id: payload.chatSessionId || (typeof rawObj.chatSessionId === 'string' ? rawObj.chatSessionId.trim() : undefined),
          chat_transcript: payload.chatTranscript || (Array.isArray(rawObj.chatTranscript) ? rawObj.chatTranscript : undefined),
        };

        const effectiveEmail = payload.contactEmail || existingLead.contact_email;
        const effectiveCompany = payload.companyName || existingLead.company_name;
        const effectiveChat = payload.chatTranscript || (Array.isArray(rawObj.chatTranscript) ? rawObj.chatTranscript : undefined);

        const hasRealEmail = Boolean(effectiveEmail && effectiveEmail !== 'lead@unauthenticated.client');
        const hasCustomCompany = Boolean(
          effectiveCompany &&
          effectiveCompany !== 'Untitled Project' &&
          effectiveCompany !== 'My Custom Project'
        );
        const hasSufficientChat = Boolean(Array.isArray(effectiveChat) && effectiveChat.length >= 6);

        let shouldSendAlert = false;
        if (existingLead.notes_internal !== 'alert_sent' && (hasRealEmail || hasCustomCompany || hasSufficientChat)) {
          shouldSendAlert = true;
          updatePayload.notes_internal = 'alert_sent';
        }

        const { data, error } = await supabase
          .from('intake_leads')
          .update(updatePayload)
          .eq('id', existingLead.id)
          .select('id, draft_token')
          .maybeSingle();

        if (error) {
          console.warn('Update intake_lead DB error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (shouldSendAlert) {
          sendAdminIntakeLeadNotification({
            scopeCode,
            companyName: (effectiveCompany || 'Untitled Project') as string,
            contactEmail: (effectiveEmail || 'lead@unauthenticated.client') as string,
            contactPhone: (payload.contactPhone || existingLead.contact_phone || '') as string,
            baseEngineTitle: (payload.baseEngineTitle || existingLead.base_engine_title || 'Full-Stack Web Engine') as string,
            totalCostINR: payload.totalCostINR !== undefined ? Number(payload.totalCostINR) : Number(existingLead.total_cost_inr) || 0,
            totalCostUSD: payload.totalCostUSD !== undefined ? Number(payload.totalCostUSD) : Number(existingLead.total_cost_usd) || 0,
            timeline: (payload.timeline || existingLead.timeline || 'Standard') as string,
          }).catch(err => console.warn('Failed to send admin intake lead email alert on update:', err));
        }

        const res = NextResponse.json({ success: true, draftId: data?.id || existingLead.id, scopeCode });
        res.cookies.set('prateeq_draft_token', existingLead.draft_token || draftToken, {
          path: '/',
          maxAge: 604800,
          sameSite: 'lax',
        });
        res.cookies.set('prateeq_pending_scope_code', scopeCode, {
          path: '/',
          maxAge: 604800,
          sameSite: 'lax',
        });
        return res;
      }
    }

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
    const ipHash = await getIpHash(ip);

    // Rate limit: max 5 drafts per IP per hour
    const { count: recentCount } = await supabase
      .from('intake_leads')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 3600_000).toISOString());
    if (recentCount !== null && recentCount >= 5) {
      return NextResponse.json(
        { error: 'Too many draft submissions. Please try again later.' },
        { status: 429 }
      );
    }

    const leadData = {
      draft_token: draftToken,
      scope_code: scopeCode,
      ip_hash: ipHash,
      company_name: payload.companyName || 'Untitled Project',
      contact_email: payload.contactEmail || 'lead@unauthenticated.client',
      contact_phone: payload.contactPhone || '',
      project_goal: payload.projectGoal || '',
      target_audience: payload.targetAudience || '',
      base_engine_id: payload.baseEngineId || 'custom-engine',
      base_engine_title: payload.baseEngineTitle || 'Full-Stack Web Engine',
      selected_features: payload.selectedFeatures || [],
      brand_asset_option: payload.brandAssetOption || 'Standard',
      maintenance_plan: payload.maintenancePlan || 'Standard',
      total_cost_inr: Number(payload.totalCostINR) || 0,
      total_cost_usd: Number(payload.totalCostUSD) || 0,
      timeline: payload.timeline || 'Standard',
      inspiration_links: payload.inspirationLinks || '',
      additional_notes: payload.additionalNotes || '',
      chat_session_id: payload.chatSessionId || (typeof rawObj.chatSessionId === 'string' ? rawObj.chatSessionId.trim() : null),
      chat_transcript: payload.chatTranscript || (Array.isArray(rawObj.chatTranscript) ? rawObj.chatTranscript : []),
      notes_internal: '',
      status: 'new',
      created_at: new Date().toISOString(),
    };

    // Trigger admin email alert for meaningful intake lead (prevent spam from 1-message anonymous visits)
    const hasRealEmail = Boolean(leadData.contact_email && leadData.contact_email !== 'lead@unauthenticated.client');
    const hasCustomCompany = Boolean(
      leadData.company_name &&
      leadData.company_name !== 'Untitled Project' &&
      leadData.company_name !== 'My Custom Project'
    );
    const hasSufficientChat = Boolean(Array.isArray(leadData.chat_transcript) && leadData.chat_transcript.length >= 6);
    const shouldSendInsertAlert = hasRealEmail || hasCustomCompany || hasSufficientChat;

    if (shouldSendInsertAlert) {
      leadData.notes_internal = 'alert_sent';
    }

    const { data, error } = await supabase
      .from('intake_leads')
      .insert(leadData)
      .select('id, draft_token')
      .maybeSingle();

    if (error) {
      console.warn('Persist intake_lead DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (shouldSendInsertAlert) {
      sendAdminIntakeLeadNotification({
        scopeCode,
        companyName: leadData.company_name,
        contactEmail: leadData.contact_email,
        contactPhone: leadData.contact_phone,
        baseEngineTitle: leadData.base_engine_title,
        totalCostINR: leadData.total_cost_inr,
        totalCostUSD: leadData.total_cost_usd,
        timeline: leadData.timeline,
      }).catch(err => console.warn('Failed to send admin intake lead email alert:', err));
    }

    const response = NextResponse.json({ success: true, draftId: data?.id || draftToken, scopeCode });

    // Set cookie with 7 day retention
    response.cookies.set('prateeq_draft_token', draftToken, {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });
    response.cookies.set('prateeq_pending_scope_code', scopeCode, {
      path: '/',
      maxAge: 604800,
      sameSite: 'lax',
    });

    return response;
  } catch (err: unknown) {
    console.error('Intake draft API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

