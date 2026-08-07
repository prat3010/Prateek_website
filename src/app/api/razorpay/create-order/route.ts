import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { amount, currency = 'INR', receipt } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount provided.' }, { status: 400 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TMyS4YM83bVpqF';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'q6ZPvwbH736cSl6B9tC2pBBR';

    // Amount in smallest subunit (paise for INR, cents for USD)
    const amountInSubunits = Math.round(amount * 100);

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      console.error('Razorpay Orders API error:', order);
      return NextResponse.json({ error: order.error?.description || 'Razorpay order creation failed.' }, { status: res.status });
    }

    return NextResponse.json(order);
  } catch (err: unknown) {
    console.error('Create Razorpay Order endpoint error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal Server Error' }, { status: 500 });
  }
}
