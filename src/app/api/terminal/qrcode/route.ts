import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawAmount = body.amount;
    const amount = Number(rawAmount);

    if (!rawAmount || isNaN(amount) || amount <= 0 || !isFinite(amount)) {
      return NextResponse.json(
        { error: 'Please enter a valid positive amount (e.g. qrcode 500).' },
        { status: 400 }
      );
    }

    if (amount > 500000) {
      return NextResponse.json(
        { error: 'Amount exceeds maximum single transaction limit of ₹500,000.' },
        { status: 400 }
      );
    }

    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    if (!KEY_ID || !KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay API credentials (NEXT_PUBLIC_RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are not configured.' },
        { status: 503 }
      );
    }

    const amountInPaise = Math.round(amount * 100);
    const authHeader = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;

    const rzpRes = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        type: 'upi_qr',
        name: 'Terminal Custom Payment',
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: amountInPaise,
        description: `Dynamic QR code generated from terminal for ₹${amount.toLocaleString('en-IN')}`,
        notes: {
          source: 'cobalt_terminal',
          amount_inr: amount,
        },
      }),
    });

    const qrData = await rzpRes.json();

    if (!rzpRes.ok) {
      const errorMsg = qrData.error?.description || 'Failed to generate Razorpay QR Code.';
      return NextResponse.json({ error: errorMsg }, { status: rzpRes.status });
    }

    const imageUrl = qrData.image_content || qrData.image_url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Razorpay response did not include a valid QR code image.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      qrId: qrData.id,
      imageUrl,
      amount,
      fixedAmount: qrData.fixed_amount ?? true,
      closeBy: qrData.close_by || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
