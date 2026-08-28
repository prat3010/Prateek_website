import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const scopeCode = searchParams.get('scopeCode');

    if (!scopeCode) {
      return NextResponse.json({ error: 'Missing scopeCode parameter' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ changeOrders: [] });
    }

    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    // Verify scope ownership
    const { data: scope, error: scopeErr } = await supabase
      .from('client_scopes')
      .select('id, client_email')
      .eq('scope_code', scopeCode)
      .maybeSingle();

    if (scopeErr) {
      return NextResponse.json({ error: scopeErr.message }, { status: 500 });
    }
    if (!scope || scope.client_email !== clientEmail) {
      return NextResponse.json({ error: 'Scope not found or unauthorized' }, { status: 404 });
    }

    const { data: changeOrders, error: coErr } = await supabase
      .from('scope_change_orders')
      .select('*')
      .eq('scope_id', scope.id)
      .order('created_at', { ascending: false });

    if (coErr) {
      return NextResponse.json({ error: coErr.message }, { status: 500 });
    }

    return NextResponse.json({ changeOrders: changeOrders || [] });
  } catch (err: unknown) {
    console.error('GET Change Orders API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const {
      scopeCode,
      addedFeatures = [],
      removedFeatures = [],
      priceDeltaINR = 0,
      priceDeltaUSD = 0,
      timelineImpact = 'Standard Delivery',
      metadata = {},
    } = payload;

    if (!scopeCode) {
      return NextResponse.json({ error: 'Missing scopeCode' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Change Order created (degraded mode).',
        changeOrder: {
          id: 'mock-co-id',
          change_order_number: `CO-${scopeCode}-01`,
          status: 'pending',
        },
      });
    }

    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    // 1. Verify Scope Existence and Ownership
    const { data: scope, error: scopeErr } = await supabase
      .from('client_scopes')
      .select('id, client_id, client_email, company_name, currency, deposit_paid')
      .eq('scope_code', scopeCode)
      .maybeSingle();

    if (scopeErr) {
      return NextResponse.json({ error: scopeErr.message }, { status: 500 });
    }
    if (!scope || scope.client_email !== clientEmail) {
      return NextResponse.json({ error: 'Scope not found or unauthorized' }, { status: 404 });
    }

    if (!scope.deposit_paid) {
      return NextResponse.json({ error: 'Deposit has not been paid for this scope. Please customize the draft directly.' }, { status: 400 });
    }

    // 2. Generate Change Order Number
    const countRes = await supabase
      .from('scope_change_orders')
      .select('id', { count: 'exact', head: true })
      .eq('scope_id', scope.id);
    const coIndex = (countRes.count ?? 0) + 1;
    const coNumber = `CO-${scopeCode}-${String(coIndex).padStart(2, '0')}`;

    // 3. Create Milestone Invoice if price delta > 0
    let invoiceId: string | null = null;
    const currency = scope.currency || 'INR';
    const amount = currency === 'INR' ? Number(priceDeltaINR) : Number(priceDeltaUSD);

    if (amount > 0) {
      const invNumber = `INV-${scopeCode}-CO${String(coIndex).padStart(2, '0')}`;
      const { data: newInvoice, error: invErr } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invNumber,
          scope_id: scope.id,
          client_id: scope.client_id,
          customer_name: scope.company_name,
          customer_email: clientEmail,
          milestone_name: `Phase 2 Change Order: ${coNumber}`,
          amount,
          currency,
          payment_status: 'pending',
          issue_date: new Date().toISOString(),
          customer_notes: `Change Order Additions: ${addedFeatures.join(', ')}`,
        })
        .select('id')
        .maybeSingle();

      if (!invErr && newInvoice) {
        invoiceId = newInvoice.id;
      }
    }

    // 4. Insert Change Order
    const { data: changeOrder, error: insertErr } = await supabase
      .from('scope_change_orders')
      .insert({
        scope_id: scope.id,
        change_order_number: coNumber,
        requested_by_email: clientEmail,
        added_features: addedFeatures,
        removed_features: removedFeatures,
        price_delta_inr: Number(priceDeltaINR),
        price_delta_usd: Number(priceDeltaUSD),
        timeline_impact: timelineImpact,
        status: invoiceId ? 'invoiced' : 'pending',
        invoice_id: invoiceId,
        metadata,
      })
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      changeOrder,
      invoiceId,
    }, { status: 201 });
  } catch (err: unknown) {
    console.error('POST Change Orders API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}
