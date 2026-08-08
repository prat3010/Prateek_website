import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

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

    const { data: existing } = await supabase
      .from('client_orders')
      .select('scope_code')
      .eq('scope_code', scopeCode)
      .maybeSingle();

    if (existing) {
      // Update only client-editable fields; server-managed fields
      // (status, delivery_stage, deposit_paid) are preserved.
      const { error } = await supabase
        .from('client_orders')
        .update({
          company_name: payload.companyName || 'My Custom Project',
          client_phone: payload.contactPhone || '',
          base_engine: payload.baseEngineTitle || 'Full-Stack Web Engine',
          features: payload.selectedFeatures || [],
          brand_asset: payload.brandAssetOption || 'Standard',
          maintenance_plan: payload.maintenancePlan || 'Self-Managed (30-Day Warranty)',
          total_cost_inr: payload.totalCostINR || 0,
          total_cost_usd: payload.totalCostUSD || 0,
          currency: payload.currency || 'INR',
          timeline: payload.timeline || 'Standard Turnaround',
          updated_at: new Date().toISOString(),
        })
        .eq('scope_code', scopeCode);

      if (error) {
        console.warn('Update scope DB error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from('client_orders').insert({
        scope_code: scopeCode,
        client_email: clientEmail,
        company_name: payload.companyName || 'My Custom Project',
        client_phone: payload.contactPhone || '',
        base_engine: payload.baseEngineTitle || 'Full-Stack Web Engine',
        features: payload.selectedFeatures || [],
        brand_asset: payload.brandAssetOption || 'Standard',
        maintenance_plan: payload.maintenancePlan || 'Self-Managed (30-Day Warranty)',
        total_cost_inr: payload.totalCostINR || 0,
        total_cost_usd: payload.totalCostUSD || 0,
        currency: payload.currency || 'INR',
        timeline: payload.timeline || 'Standard Turnaround',
        status: 'Draft Proposal',
        delivery_stage: 'architecture',
        deposit_paid: false,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('Insert scope DB error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Scope brief persisted successfully.' });
  } catch (err: unknown) {
    console.error('Save Scope API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}