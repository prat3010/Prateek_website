import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { clientEmail, scopeCode, companyName, contactPhone, baseEngineTitle, selectedFeatures, brandAssetOption, maintenancePlan, totalCostINR, totalCostUSD, currency, timeline } = payload;

    if (!clientEmail || !scopeCode) {
      return NextResponse.json({ error: 'Missing clientEmail or scopeCode' }, { status: 400 });
    }

    if (supabase) {
      const { error } = await supabase.from('client_orders').upsert({
        scope_code: scopeCode,
        client_email: clientEmail,
        company_name: companyName || 'My Custom Project',
        client_phone: contactPhone || '',
        base_engine: baseEngineTitle || 'Full-Stack Web Engine',
        features: selectedFeatures || [],
        brand_asset: brandAssetOption || 'Standard',
        maintenance_plan: maintenancePlan || 'Self-Managed (30-Day Warranty)',
        total_cost_inr: totalCostINR || 0,
        total_cost_usd: totalCostUSD || 0,
        currency: currency || 'INR',
        timeline: timeline || 'Standard Turnaround',
        status: 'Draft Proposal',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'scope_code' });

      if (error) {
        console.warn('Save scope DB error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Scope brief persisted successfully.' });
  } catch (err: unknown) {
    console.error('Save Scope API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}
