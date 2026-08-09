import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TNPVXp6uorhxs3';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'ovUdxjgONEk4RFGhqhabWKR0';
const USD_TO_INR_RATE = 85;

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const scopeCode = payload.scopeCode as string | undefined;

    if (!scopeCode) {
      return NextResponse.json({ error: 'Missing scopeCode' }, { status: 400 });
    }

    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    if (!supabase) {
      // CI / degraded mode
      return NextResponse.json({
        isMock: true,
        orderId: `order_mock_${Date.now()}`,
        amount: 8750000,
        currency: 'INR',
        keyId: KEY_ID,
      });
    }

    // Read scope from client_scopes (or client_orders fallback)
    let scope: {
      id?: string;
      client_id?: string;
      currency?: string;
      total_cost_inr?: number;
      total_cost_usd?: number;
      company_name?: string;
    } | null = null;

    try {
      const { data: s1 } = await supabase
        .from('client_scopes')
        .select('*')
        .eq('scope_code', scopeCode)
        .maybeSingle();

      scope = s1;

      if (!scope) {
        const { data: s2 } = await supabase
          .from('client_orders')
          .select('*')
          .eq('scope_code', scopeCode)
          .maybeSingle();
        scope = s2;
      }
    } catch (dbErr) {
      console.warn('Supabase lookup warning in create-razorpay-order:', dbErr);
    }

    const originalCurrency = scope?.currency || payload.currency || 'INR';
    const isUSD = originalCurrency === 'USD';
    const rawTotal = scope
      ? (isUSD ? Number(scope.total_cost_usd || 0) : Number(scope.total_cost_inr || 0))
      : (isUSD ? Number(payload.totalCostUSD || 2500) : Number(payload.totalCostINR || 175000));

    const depositAmount = Math.round(rawTotal * 0.5);

    // Convert USD to INR for standard Razorpay checkout to prevent "International cards not supported" error
    const razorpayCurrency = 'INR';
    const inrDepositAmount = isUSD ? Math.round(depositAmount * USD_TO_INR_RATE) : depositAmount;
    const amountInSubunits = Math.max(100, inrDepositAmount * 100);

    // Call Razorpay Order API
    const authHeader = 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    let razorpayRes: Response | null = null;
    try {
      razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInSubunits,
          currency: razorpayCurrency,
          receipt: scopeCode,
          notes: {
            scope_code: scopeCode,
            client_email: clientEmail,
            company_name: scope?.company_name || payload.companyName || 'My Custom Project',
            original_currency: originalCurrency,
            original_deposit: depositAmount,
          },
        }),
      });
    } catch (fetchErr) {
      console.warn('Razorpay server fetch offline (switching to mock order mode):', fetchErr);
      return NextResponse.json({
        isMock: true,
        orderId: `order_mock_${Date.now()}`,
        amount: amountInSubunits,
        currency: razorpayCurrency,
        keyId: KEY_ID,
      });
    }

    if (!razorpayRes || !razorpayRes.ok) {
      const errText = razorpayRes ? await razorpayRes.text() : 'No response';
      console.error('Razorpay create order API error (switching to mock order mode):', errText);
      return NextResponse.json({
        isMock: true,
        orderId: `order_mock_${Date.now()}`,
        amount: amountInSubunits,
        currency: razorpayCurrency,
        keyId: KEY_ID,
      });
    }

    const orderData = await razorpayRes.json();

    // Record invoice entry in database
    try {
      await supabase.from('invoices').insert({
        invoice_number: `INV-${orderData.id.slice(-8).toUpperCase()}`,
        scope_id: scope?.id || null,
        client_id: scope?.client_id || null,
        milestone_name: '50% Scope Deposit & Development Lock',
        amount: depositAmount,
        currency: originalCurrency,
        payment_status: 'pending',
        razorpay_order_id: orderData.id,
        due_date: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
    } catch (invErr) {
      console.warn('Invoice ledger insert warning:', invErr);
    }

    return NextResponse.json({
      isMock: false,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: razorpayCurrency,
      keyId: KEY_ID,
    });
  } catch (err: unknown) {
    console.error('Create Razorpay Order API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
