import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { calculateInvoiceTotals } from '@/lib/invoicing';

const USD_TO_INR_RATE = 85;

export async function POST(req: Request) {
  try {
    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    let payload: Record<string, any>;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const scopeCode = typeof payload.scopeCode === 'string' ? payload.scopeCode.trim() : '';

    if (!scopeCode) {
      return NextResponse.json({ error: 'Missing or invalid scopeCode' }, { status: 400 });
    }

    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    const isDev = process.env.NODE_ENV === 'development';

    if (!supabase) {
      // CI / degraded mode
      return NextResponse.json({
        isMock: true,
        orderId: `order_mock_${Date.now()}`,
        amount: 8750000,
        currency: 'INR',
        keyId: KEY_ID || 'rzp_test_mock',
      });
    }

    // Read scope strictly from database to prevent client-side price tampering
    let scope: {
      id?: string;
      scope_code?: string;
      client_id?: string;
      client_email?: string;
      currency?: string;
      total_cost_inr?: number;
      total_cost_usd?: number;
      company_name?: string;
      payment_structure?: string;
    } | null = null;

    try {
      const { data, error } = await supabase
        .from('client_scopes')
        .select('*')
        .eq('scope_code', scopeCode)
        .eq('client_email', clientEmail)
        .maybeSingle();

      if (error) {
        console.error('Could not load the requested payment scope:', error);
        return NextResponse.json({ error: 'Could not load payment scope.' }, { status: 500 });
      }

      scope = data;
    } catch (dbErr) {
      console.warn('Supabase lookup warning in create-razorpay-order:', dbErr);
    }

    if (!scope) {
      return NextResponse.json(
        { error: 'Payment scope was not found.' },
        { status: 404 }
      );
    }

    const originalCurrency = scope.currency || 'INR';
    const isUSD = originalCurrency === 'USD';
    const rawTotal = isUSD ? Number(scope.total_cost_usd || 0) : Number(scope.total_cost_inr || 0);

    if (rawTotal <= 0) {
      return NextResponse.json({ error: 'Invalid scope cost amount.' }, { status: 400 });
    }

    const isThreePart = scope.payment_structure === '40/30/30';
    const multiplier = isThreePart ? 0.4 : 0.5;
    const depositAmount = Math.round(rawTotal * multiplier);

    // Convert USD to INR for standard Razorpay checkout to prevent "International cards not supported" error
    const razorpayCurrency = 'INR';
    const inrDepositAmount = isUSD ? Math.round(depositAmount * USD_TO_INR_RATE) : depositAmount;
    const amountInSubunits = Math.max(100, inrDepositAmount * 100);

    if (!KEY_ID || !KEY_SECRET) {
      if (isDev) {
        return NextResponse.json({
          isMock: true,
          orderId: `order_mock_${Date.now()}`,
          amount: amountInSubunits,
          currency: razorpayCurrency,
          keyId: 'rzp_test_mock',
        });
      }
      return NextResponse.json({ error: 'Razorpay API credentials not configured on server.' }, { status: 500 });
    }

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
          payment_capture: 1,
          notes: {
            scope_code: scopeCode,
            client_email: clientEmail,
            company_name: scope.company_name || 'My Custom Project',
            original_currency: originalCurrency,
            original_deposit: depositAmount,
          },
        }),
      });
    } catch (fetchErr) {
      console.warn('Razorpay server fetch offline:', fetchErr);
      if (isDev) {
        return NextResponse.json({
          isMock: true,
          orderId: `order_mock_${Date.now()}`,
          amount: amountInSubunits,
          currency: razorpayCurrency,
          keyId: KEY_ID,
        });
      }
      return NextResponse.json({ error: 'Unable to reach Razorpay servers.' }, { status: 502 });
    }

    if (!razorpayRes || !razorpayRes.ok) {
      const errText = razorpayRes ? await razorpayRes.text() : 'No response';
      console.error('Razorpay create order API error:', errText);
      if (isDev) {
        return NextResponse.json({
          isMock: true,
          orderId: `order_mock_${Date.now()}`,
          amount: amountInSubunits,
          currency: razorpayCurrency,
          keyId: KEY_ID,
        });
      }
      return NextResponse.json({ error: 'Failed to initialize Razorpay order.' }, { status: 500 });
    }

    const orderData = await razorpayRes.json();

    // Calculate rich invoice breakdown with SAC code and tax details
    const percentageText = isThreePart ? '40%' : '50%';
    const itemDescription = `${percentageText} deposit lock for project scope ${scopeCode}`;
    const invoiceCalc = calculateInvoiceTotals({
      currency: originalCurrency,
      place_of_supply: 'Delhi',
      line_items: [
        {
          name: `Scope Deposit (${percentageText}) — ${scope.company_name || scopeCode}`,
          description: itemDescription,
          sac_hsn: '998314',
          rate: depositAmount,
          quantity: 1,
          tax_rate: originalCurrency === 'INR' ? 18 : 0,
          tax_type: 'exclusive',
        },
      ],
    });

    // Record invoice entry in database
    try {
      await supabase.from('invoices').insert({
        invoice_number: `INV-${orderData.id.slice(-8).toUpperCase()}`,
        scope_id: scope?.id || null,
        client_id: scope?.client_id || null,
        customer_name: scope.company_name || 'Valued Client',
        customer_email: clientEmail,
        place_of_supply: 'Delhi',
        is_gst: invoiceCalc.is_gst,
        line_items: invoiceCalc.line_items,
        tax_breakup: invoiceCalc.tax_breakup,
        milestone_name: `${percentageText} Scope Deposit & Development Lock`,
        amount: invoiceCalc.grand_total,
        currency: originalCurrency,
        payment_status: 'pending',
        razorpay_order_id: orderData.id,
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        expiry_date: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
