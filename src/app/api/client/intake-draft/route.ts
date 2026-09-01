import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { sendAdminIntakeLeadNotification } from '@/lib/emailNotification';
import { getIpHash } from '@/lib/security';
import { intakeDraftSchema } from '@/lib/clientOrder';

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
      return res;
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
      status: 'new',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('intake_leads')
      .insert(leadData)
      .select('id, draft_token')
      .maybeSingle();

    if (error) {
      console.warn('Persist intake_lead DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Trigger admin email alert for new intake lead
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

