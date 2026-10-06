import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { calculateInvoiceTotals } from '@/lib/invoicing';
import { createRazorpayOrderSchema } from '@/lib/clientOrder';

const USD_TO_INR_RATE = 85;

export async function POST(req: Request) {
  try {
    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parseResult = createRazorpayOrderSchema.safeParse(payload);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.message }, { status: 400 });
    }

    const { scopeCode, invoiceId, invoiceNumber, paymentStructure } = parseResult.data;

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

    // Direct invoice payment flow
    if (invoiceId || invoiceNumber) {
      let invoiceQuery = supabase
        .from('invoices')
        .select('*')
        .eq('customer_email', clientEmail);

      if (invoiceId) {
        invoiceQuery = invoiceQuery.eq('id', invoiceId);
      } else if (invoiceNumber) {
        invoiceQuery = invoiceQuery.eq('invoice_number', invoiceNumber);
      }

      const { data: invoice, error: invLookupErr } = await invoiceQuery.maybeSingle();

      if (invLookupErr) {
        console.error('Could not load requested invoice:', invLookupErr);
        return NextResponse.json({ error: 'Could not load invoice.' }, { status: 500 });
      }

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice was not found.' }, { status: 404 });
      }

      if (invoice.payment_status === 'paid') {
        return NextResponse.json({ error: 'Invoice has already been paid.' }, { status: 409 });
      }

      const originalCurrency = invoice.currency || 'INR';
      const isUSD = originalCurrency === 'USD';
      const rawTotal = Number(invoice.amount || 0);

      if (rawTotal <= 0) {
        return NextResponse.json({ error: 'Invalid invoice amount.' }, { status: 400 });
      }

      const razorpayCurrency = 'INR';
      const inrAmount = isUSD ? Math.round(rawTotal * USD_TO_INR_RATE) : rawTotal;
      const amountInSubunits = Math.max(100, Math.round(inrAmount * 100));

      if (!KEY_ID || !KEY_SECRET) {
        if (isDev) {
          const mockOrderId = `order_mock_${Date.now()}`;
          try {
            await supabase.from('invoices').update({ razorpay_order_id: mockOrderId }).eq('id', invoice.id);
          } catch (e) {
            console.warn('Failed to attach mock order id to invoice:', e);
          }
          return NextResponse.json({
            isMock: true,
            orderId: mockOrderId,
            amount: amountInSubunits,
            currency: razorpayCurrency,
            keyId: 'rzp_test_mock',
          });
        }
        return NextResponse.json({ error: 'Razorpay API credentials not configured on server.' }, { status: 500 });
      }

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
            receipt: (invoice.invoice_number || invoice.id).slice(0, 40),
            payment_capture: 1,
            notes: {
              invoice_id: invoice.id,
              invoice_number: invoice.invoice_number,
              customer_email: clientEmail,
              customer_name: invoice.customer_name || 'Client',
            },
          }),
        });
      } catch (fetchErr) {
        console.warn('Razorpay server fetch offline:', fetchErr);
        if (isDev) {
          const mockOrderId = `order_mock_${Date.now()}`;
          await supabase.from('invoices').update({ razorpay_order_id: mockOrderId }).eq('id', invoice.id);
          return NextResponse.json({
            isMock: true,
            orderId: mockOrderId,
            amount: amountInSubunits,
            currency: razorpayCurrency,
            keyId: KEY_ID,
          });
        }
        return NextResponse.json({ error: 'Unable to reach Razorpay servers.' }, { status: 502 });
      }

      if (!razorpayRes || !razorpayRes.ok) {
        const errText = razorpayRes ? await razorpayRes.text() : 'No response';
        console.error('Razorpay create order API error for invoice:', errText);
        if (isDev) {
          const mockOrderId = `order_mock_${Date.now()}`;
          await supabase.from('invoices').update({ razorpay_order_id: mockOrderId }).eq('id', invoice.id);
          return NextResponse.json({
            isMock: true,
            orderId: mockOrderId,
            amount: amountInSubunits,
            currency: razorpayCurrency,
            keyId: KEY_ID,
          });
        }
        return NextResponse.json({ error: 'Failed to initialize Razorpay order.' }, { status: 500 });
      }

      const orderData = await razorpayRes.json();
      await supabase.from('invoices').update({ razorpay_order_id: orderData.id }).eq('id', invoice.id);

      return NextResponse.json({
        isMock: false,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: razorpayCurrency,
        keyId: KEY_ID,
      });
    }

    if (!scopeCode) {
      return NextResponse.json({ error: 'Either scopeCode or invoiceId must be provided.' }, { status: 400 });
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
      deposit_paid?: boolean;
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

    if (scope.deposit_paid) {
      return NextResponse.json(
        { error: 'Deposit has already been recorded for this scope.' },
        { status: 409 }
      );
    }

    const targetPaymentStructure = paymentStructure || scope.payment_structure || '50/50';
    if (paymentStructure && paymentStructure !== scope.payment_structure && scope.id) {
      try {
        await supabase
          .from('client_scopes')
          .update({ payment_structure: paymentStructure })
          .eq('id', scope.id);
      } catch (updateErr) {
        console.warn('Failed to update scope payment structure:', updateErr);
      }
    }

    const originalCurrency = scope.currency || 'INR';
    const isUSD = originalCurrency === 'USD';
    const rawTotal = isUSD ? Number(scope.total_cost_usd || 0) : Number(scope.total_cost_inr || 0);

    if (rawTotal <= 0) {
      return NextResponse.json({ error: 'Invalid scope cost amount.' }, { status: 400 });
    }

    const isThreePart = targetPaymentStructure === '40/30/30';
    const multiplier = isThreePart ? 0.4 : 0.5;
    const depositAmount = Math.round(rawTotal * multiplier);

    // Convert USD to INR for standard Razorpay checkout to prevent "International cards not supported" error
    const razorpayCurrency = 'INR';
    const inrDepositAmount = isUSD ? Math.round(depositAmount * USD_TO_INR_RATE) : depositAmount;
    const amountInSubunits = Math.max(100, inrDepositAmount * 100);

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
          tax_type: 'inclusive',
        },
      ],
    });

    const createInvoiceRecord = async (orderId: string) => {
      if (!supabase) return;
      try {
        await supabase.from('invoices').insert({
          invoice_number: `INV-${orderId.slice(-8).toUpperCase()}`,
          scope_id: scope?.id || null,
          client_id: scope?.client_id || null,
          customer_name: scope?.company_name || 'Valued Client',
          customer_email: clientEmail,
          place_of_supply: 'Delhi',
          is_gst: invoiceCalc.is_gst,
          line_items: invoiceCalc.line_items,
          tax_breakup: invoiceCalc.tax_breakup,
          milestone_name: `${percentageText} Scope Deposit & Development Lock`,
          amount: invoiceCalc.grand_total,
          currency: originalCurrency,
          payment_status: 'pending',
          razorpay_order_id: orderId,
          issue_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
          expiry_date: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } catch (invErr) {
        console.warn('Invoice ledger insert warning:', invErr);
      }
    };

    if (!KEY_ID || !KEY_SECRET) {
      if (isDev) {
        const mockOrderId = `order_mock_${Date.now()}`;
        await createInvoiceRecord(mockOrderId);
        return NextResponse.json({
          isMock: true,
          orderId: mockOrderId,
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
        const mockOrderId = `order_mock_${Date.now()}`;
        await createInvoiceRecord(mockOrderId);
        return NextResponse.json({
          isMock: true,
          orderId: mockOrderId,
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
        const mockOrderId = `order_mock_${Date.now()}`;
        await createInvoiceRecord(mockOrderId);
        return NextResponse.json({
          isMock: true,
          orderId: mockOrderId,
          amount: amountInSubunits,
          currency: razorpayCurrency,
          keyId: KEY_ID,
        });
      }
      return NextResponse.json({ error: 'Failed to initialize Razorpay order.' }, { status: 500 });
    }

    const orderData = await razorpayRes.json();
    await createInvoiceRecord(orderData.id);

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
