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

    // 3. Target normalized `client_scopes` table first, fallback to `client_orders`
    const targetTable = 'client_scopes';
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
      updated_at: new Date().toISOString(),
    };

    // Check existing in normalized table
    const { data: existingScope, error: selectErr } = await supabase
      .from(targetTable)
      .select('scope_code, client_email')
      .eq('scope_code', scopeCode)
      .maybeSingle();

    if (selectErr) {
      // Fallback to legacy client_orders if client_scopes table doesn't exist yet
      const { data: legacyExisting } = await supabase
        .from('client_orders')
        .select('scope_code, client_email')
        .eq('scope_code', scopeCode)
        .maybeSingle();

      if (legacyExisting) {
        if (legacyExisting.client_email && legacyExisting.client_email !== clientEmail) {
          return NextResponse.json({ error: 'Forbidden: scope belongs to another account.' }, { status: 403 });
        }
        await supabase
          .from('client_orders')
          .update(scopeData)
          .eq('scope_code', scopeCode);
      } else {
        await supabase.from('client_orders').insert({
          ...scopeData,
          status: 'Draft Proposal',
          delivery_stage: 'architecture',
          deposit_paid: false,
        });
      }
      return NextResponse.json({ success: true, message: 'Scope brief persisted successfully (legacy mode).' });
    }

    if (existingScope) {
      if (existingScope.client_email && existingScope.client_email !== clientEmail) {
        return NextResponse.json({ error: 'Forbidden: scope belongs to another account.' }, { status: 403 });
      }

      const { error: updateErr } = await supabase
        .from(targetTable)
        .update(scopeData)
        .eq('scope_code', scopeCode);

      if (updateErr) {
        console.warn('Update client_scopes DB error:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await supabase.from(targetTable).insert({
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

    // Also mirror to client_orders to guarantee backward compatibility
    try {
      const { data: legacyCheck } = await supabase
        .from('client_orders')
        .select('scope_code')
        .eq('scope_code', scopeCode)
        .maybeSingle();

      if (legacyCheck) {
        await supabase.from('client_orders').update(scopeData).eq('scope_code', scopeCode);
      } else {
        await supabase.from('client_orders').insert({
          ...scopeData,
          status: 'Draft Proposal',
          delivery_stage: 'architecture',
          deposit_paid: false,
        });
      }
    } catch {}

    return NextResponse.json({ success: true, message: 'Scope brief persisted successfully.' });
  } catch (err: unknown) {
    console.error('Save Scope API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}