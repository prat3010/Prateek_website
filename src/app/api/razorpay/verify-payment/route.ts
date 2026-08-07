import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';

export async function POST(req: Request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      scopeCode,
      companyName,
      userEmail,
      amount,
      currency,
    } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment signature details.' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'q6ZPvwbH736cSl6B9tC2pBBR';

    // Verify HMAC SHA-256 signature
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Invalid Razorpay signature mismatch!');
      return NextResponse.json({ error: 'Invalid HMAC payment signature.' }, { status: 400 });
    }

    // Persist verified payment in Supabase database if available
    if (supabase) {
      const { error: dbError } = await supabase.from('client_orders').upsert({
        scope_code: scopeCode || 'DIRECT-PAY',
        company_name: companyName || 'Client Project',
        client_email: userEmail || 'client@example.com',
        total_cost_inr: currency === 'INR' ? amount * 2 : 0,
        total_cost_usd: currency === 'USD' ? amount * 2 : 0,
        currency,
        deposit_paid: true,
        razorpay_payment_id,
        razorpay_order_id,
        status: 'DEPOSIT PAID (50%)',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'scope_code' });

      if (dbError) {
        console.warn('Database save warning for order:', dbError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment signature verified successfully.',
      payment_id: razorpay_payment_id,
    });
  } catch (err: unknown) {
    console.error('Verify Razorpay Payment endpoint error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}
