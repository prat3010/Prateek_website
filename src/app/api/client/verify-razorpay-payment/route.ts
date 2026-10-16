import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { sendPaymentConfirmationNotifications } from '@/lib/emailNotification';

export async function POST(req: Request) {
  try {
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = await req.json();
    const {
      scopeCode,
      invoiceId,
      invoiceNumber,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = payload;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment verification fields.' },
        { status: 400 }
      );
    }

    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    const isDev = process.env.NODE_ENV === 'development' || !supabase;
    const isMockBypass =
      isDev &&
      (razorpayOrderId.startsWith('order_mock_') ||
        razorpaySignature === 'test_signature_mock_fallback' ||
        razorpaySignature === 'mock_signature_dev_pass');

    if (!isMockBypass && !KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay secret key not configured on server.' }, { status: 500 });
    }

    if (!isMockBypass) {
      const expectedSignature = crypto
        .createHmac('sha256', KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (
        expectedSignature.length !== razorpaySignature.length ||
        !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature))
      ) {
        console.warn('Razorpay signature mismatch:', { expectedSignature, razorpaySignature });
        return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
      }
    }

    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Payment acknowledged (degraded mode).' });
    }

    const isDirectInvoiceSettlement = Boolean(invoiceId || invoiceNumber);

    // Verify scope if scopeCode provided
    let scope: {
      id: string;
      deposit_paid: boolean;
      scope_code?: string;
      company_name?: string;
      features?: string[];
      total_cost_inr?: number;
      total_cost_usd?: number;
    } | null = null;
    if (scopeCode) {
      const { data: scopeData, error: scopeError } = await supabase
        .from('client_scopes')
        .select('id, deposit_paid, scope_code, company_name, features, total_cost_inr, total_cost_usd')
        .eq('scope_code', scopeCode)
        .eq('client_email', clientEmail)
        .maybeSingle();

      if (scopeError) {
        console.error('Could not load payment scope:', scopeError);
        return NextResponse.json({ error: 'Could not load payment scope.' }, { status: 500 });
      }
      scope = scopeData;
      if (!scope) {
        return NextResponse.json({ error: 'Payment scope was not found.' }, { status: 404 });
      }
      if (scope.deposit_paid && !isDirectInvoiceSettlement) {
        return NextResponse.json({ error: 'Deposit has already been recorded for this scope.' }, { status: 409 });
      }
    }

    // Look up invoice by razorpay_order_id first, falling back to invoiceId or invoiceNumber
    let invoice: {
      id: string;
      invoice_number?: string;
      payment_status: string;
      razorpay_payment_id: string | null;
      scope_id: string | null;
      amount?: number;
      currency?: string;
      milestone_name?: string;
      customer_name?: string;
    } | null = null;
    const { data: invByOrder, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, payment_status, razorpay_payment_id, scope_id, amount, currency, milestone_name, customer_name')
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('customer_email', clientEmail)
      .maybeSingle();

    if (invoiceError) {
      console.error('Could not load payment invoice:', invoiceError);
      return NextResponse.json({ error: 'Could not load payment invoice.' }, { status: 500 });
    }

    invoice = invByOrder;

    if (!invoice && (invoiceId || invoiceNumber)) {
      let altQuery = supabase
        .from('invoices')
        .select('id, invoice_number, payment_status, razorpay_payment_id, scope_id, amount, currency, milestone_name, customer_name')
        .eq('customer_email', clientEmail);
      if (invoiceId) altQuery = altQuery.eq('id', invoiceId);
      else if (invoiceNumber) altQuery = altQuery.eq('invoice_number', invoiceNumber);
      const { data: altInv } = await altQuery.maybeSingle();
      if (altInv) {
        invoice = altInv;
      }
    }

    if (!invoice && !scope && !isMockBypass) {
      return NextResponse.json({ error: 'Payment invoice was not found.' }, { status: 404 });
    }

    if (invoice && (invoice.payment_status === 'paid' || invoice.razorpay_payment_id)) {
      return NextResponse.json({ error: 'This payment has already been recorded.' }, { status: 409 });
    }

    // If scope wasn't loaded from scopeCode, but invoice has scope_id, load linked scope
    // Note: Do NOT block with 409 when linkedScope.deposit_paid is true if the client is paying a separate unpaid invoice (e.g. Change Order or 50% Final Milestone Balance)
    if (!scope && invoice?.scope_id) {
      const { data: linkedScope } = await supabase
        .from('client_scopes')
        .select('id, deposit_paid, scope_code, company_name, features, total_cost_inr, total_cost_usd')
        .eq('id', invoice.scope_id)
        .eq('client_email', clientEmail)
        .maybeSingle();
      if (linkedScope) {
        scope = linkedScope;
        if (scope.deposit_paid && !isDirectInvoiceSettlement && !invoice) {
          return NextResponse.json({ error: 'Deposit has already been recorded for this scope.' }, { status: 409 });
        }
      }
    }

    // In dev / mock bypass mode, update the records immediately so local testing reflects paid state
    if (isMockBypass) {
      const nowIso = new Date().toISOString();
      if (invoice && invoice.payment_status !== 'paid') {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            paid_at: nowIso,
            razorpay_payment_id: razorpayPaymentId,
            updated_at: nowIso,
          })
          .eq('id', invoice.id);

        // If this invoice belongs to a Change Order, mark the Change Order paid and merge features/cost into scope
        try {
          const { data: coRow } = await supabase
            .from('scope_change_orders')
            .select('*')
            .eq('invoice_id', invoice.id)
            .maybeSingle();
          if (coRow && coRow.id) {
            await supabase
              .from('scope_change_orders')
              .update({ status: 'paid', updated_at: nowIso })
              .eq('id', coRow.id);

            if (scope) {
              const currentFeatures = Array.isArray(scope.features) ? scope.features : [];
              const added = Array.isArray(coRow.added_features) ? coRow.added_features : [];
              const removed = new Set(Array.isArray(coRow.removed_features) ? coRow.removed_features : []);
              const mergedFeatures = Array.from(
                new Set([...currentFeatures.filter((f) => !removed.has(f)), ...added])
              );
              await supabase
                .from('client_scopes')
                .update({
                  features: mergedFeatures,
                  total_cost_inr: (Number(scope.total_cost_inr) || 0) + (Number(coRow.price_delta_inr) || 0),
                  total_cost_usd: (Number(scope.total_cost_usd) || 0) + (Number(coRow.price_delta_usd) || 0),
                  updated_at: nowIso,
                })
                .eq('id', scope.id);
            }
          }
        } catch {}
      }

      if (scope && !scope.deposit_paid) {
        await supabase
          .from('client_scopes')
          .update({
            deposit_paid: true,
            delivery_stage: 'engineering',
            status: 'Active Sprint — In Engineering',
            updated_at: nowIso,
          })
          .eq('id', scope.id);
      }

      sendPaymentConfirmationNotifications({
        clientEmail,
        clientName: invoice?.customer_name || scope?.company_name,
        scopeCode: scope?.scope_code || scopeCode,
        projectName: scope?.company_name || invoice?.customer_name,
        invoiceNumber: invoice?.invoice_number || invoiceNumber,
        milestoneName: invoice?.milestone_name,
        amount: Number(invoice?.amount) || 0,
        currency: invoice?.currency || 'INR',
        paymentId: razorpayPaymentId,
      }).catch((err) => console.warn('Payment notification warning:', err));

      return NextResponse.json({
        success: true,
        message: 'Mock payment verified and ledger updated (dev mode).',
      });
    }

    // Razorpay's signed webhook is the sole authority allowed to make the
    // invoice and scope paid in production. A browser callback can prove it received a
    // Razorpay response, but it must not mutate the commercial ledger.
    return NextResponse.json({
      success: true,
      message: 'Payment signature verified. Your workspace will activate once the provider webhook is processed.',
    }, { status: 202 });
  } catch (err: unknown) {
    console.error('Verify Razorpay Payment API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
