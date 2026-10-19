import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';
import { sendAdminChangeOrderNotification } from '@/lib/emailNotification';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import type { FeatureItem } from '@/data/resume';

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

    // 3. Verify feature delta against catalog if addedFeatures match known catalog items
    const catalogFeatures = (questionnaireDefaults.features || []) as FeatureItem[];
    const matchedAdded = catalogFeatures.filter((f) =>
      Array.isArray(addedFeatures) &&
      addedFeatures.some(
        (af: string) =>
          typeof af === 'string' &&
          (af.toLowerCase() === f.id.toLowerCase() || af.toLowerCase() === f.label.toLowerCase())
      )
    );
    const catalogDeltaINR = matchedAdded.reduce((sum, f) => sum + (f.priceINR || 0), 0);
    const catalogDeltaUSD = matchedAdded.reduce((sum, f) => sum + (f.priceUSD || 0), 0);

    const verifiedDeltaINR = catalogDeltaINR > 0 ? catalogDeltaINR : Math.max(0, Number(priceDeltaINR) || 0);
    const verifiedDeltaUSD = catalogDeltaUSD > 0 ? catalogDeltaUSD : Math.max(0, Number(priceDeltaUSD) || 0);

    // 4. Create Milestone Invoice if price delta > 0
    let invoiceId: string | null = null;
    const currency = scope.currency || 'INR';
    const amount = currency === 'INR' ? verifiedDeltaINR : verifiedDeltaUSD;

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

    // 5. Insert Change Order
    const { data: changeOrder, error: insertErr } = await supabase
      .from('scope_change_orders')
      .insert({
        scope_id: scope.id,
        change_order_number: coNumber,
        requested_by_email: clientEmail,
        added_features: addedFeatures,
        removed_features: removedFeatures,
        price_delta_inr: verifiedDeltaINR,
        price_delta_usd: verifiedDeltaUSD,
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

    sendAdminChangeOrderNotification({
      changeOrderNumber: coNumber,
      scopeCode,
      companyName: scope.company_name || scopeCode,
      clientEmail,
      addedFeatures: Array.isArray(addedFeatures) ? addedFeatures : [],
      removedFeatures: Array.isArray(removedFeatures) ? removedFeatures : [],
      priceDeltaINR: verifiedDeltaINR,
      priceDeltaUSD: verifiedDeltaUSD,
    }).catch((err) => console.warn('Change order email alert warning:', err));

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

export async function PATCH(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Change order action simulated (degraded mode).' });
    }

    const sessionEmail = await getVerifiedSessionEmail(req);
    if (!sessionEmail || !isAdminEmail(sessionEmail)) {
      return NextResponse.json({ error: 'Unauthorized: admin access required.' }, { status: 403 });
    }

    let body: { changeOrderId?: string; action?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { changeOrderId, action } = body;
    if (!changeOrderId || !action || !['approve', 'reject', 'mark_paid'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid parameters. "changeOrderId" and "action" (approve | reject | mark_paid) are required.' },
        { status: 400 }
      );
    }

    // 1. Fetch target change order
    const { data: co, error: coErr } = await supabase
      .from('scope_change_orders')
      .select('*')
      .eq('id', changeOrderId)
      .maybeSingle();

    if (coErr) {
      return NextResponse.json({ error: coErr.message }, { status: 500 });
    }
    if (!co) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    if (action === 'approve') {
      const { data: updatedCo, error: upErr } = await supabase
        .from('scope_change_orders')
        .update({ status: 'approved', updated_at: nowIso })
        .eq('id', changeOrderId)
        .select('*')
        .single();

      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
      return NextResponse.json({ success: true, changeOrder: updatedCo });
    }

    if (action === 'reject') {
      const { data: updatedCo, error: upErr } = await supabase
        .from('scope_change_orders')
        .update({ status: 'rejected', updated_at: nowIso })
        .eq('id', changeOrderId)
        .select('*')
        .single();

      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      // Cancel linked invoice if present and not paid
      if (co.invoice_id) {
        await supabase
          .from('invoices')
          .update({ payment_status: 'cancelled', updated_at: nowIso })
          .eq('id', co.invoice_id)
          .neq('payment_status', 'paid');
      }

      return NextResponse.json({ success: true, changeOrder: updatedCo });
    }

    if (action === 'mark_paid') {
      // 1. Update Change Order status to 'paid'
      const { data: updatedCo, error: upErr } = await supabase
        .from('scope_change_orders')
        .update({ status: 'paid', updated_at: nowIso })
        .eq('id', changeOrderId)
        .select('*')
        .single();

      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

      // 2. Mark invoice paid if linked
      if (co.invoice_id) {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            paid_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', co.invoice_id);
      }

      // 3. Merge features and add price delta into client_scopes
      if (co.scope_id) {
        const { data: scope } = await supabase
          .from('client_scopes')
          .select('*')
          .eq('id', co.scope_id)
          .maybeSingle();

        if (scope) {
          const currentFeatures = Array.isArray(scope.features) ? scope.features : [];
          const added = Array.isArray(co.added_features) ? co.added_features : [];
          const removed = new Set(Array.isArray(co.removed_features) ? co.removed_features : []);
          const mergedFeatures = Array.from(
            new Set([...currentFeatures.filter((f: string) => !removed.has(f)), ...added])
          );

          await supabase
            .from('client_scopes')
            .update({
              features: mergedFeatures,
              total_cost_inr: (Number(scope.total_cost_inr) || 0) + (Number(co.price_delta_inr) || 0),
              total_cost_usd: (Number(scope.total_cost_usd) || 0) + (Number(co.price_delta_usd) || 0),
              updated_at: nowIso,
            })
            .eq('id', scope.id);
        }
      }

      return NextResponse.json({ success: true, changeOrder: updatedCo });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('PATCH Change Orders API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}

