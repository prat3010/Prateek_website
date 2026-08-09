import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    if (!payload.baseEngineTitle && !payload.companyName && !payload.contactEmail) {
      return NextResponse.json({ error: 'Invalid intake lead payload' }, { status: 400 });
    }

    const scopeCode = payload.scopeCode || `SCOPE-${Math.floor(10000 + Math.random() * 90000)}`;
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

    const leadData = {
      draft_token: draftToken,
      scope_code: scopeCode,
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
