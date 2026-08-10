import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

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

    let qrId: string | null = null;

    // Call Razorpay API to log/track the dynamic QR Code entity if server credentials are set
    if (KEY_ID && KEY_SECRET) {
      try {
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

        if (rzpRes.ok) {
          const qrData = await rzpRes.json();
          qrId = qrData.id || null;
        }
      } catch {
        // Fallback gracefully to direct UPI generation if Razorpay API call is unreachable
      }
    }

    // Direct NPCI compliant upi:// URI scheme so phone cameras open UPI apps directly (PhonePe, GPay, Paytm)
    const vpa = process.env.NEXT_PUBLIC_UPI_VPA || process.env.RAZORPAY_UPI_VPA || 'prateeqsharma@ybl';
    const payeeName = 'Prateek Sharma';
    const note = `Terminal Payment${qrId ? ` (${qrId})` : ''}`;

    const directUpiString = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

    // Generate base64 PNG QR code encoding the direct upi:// link
    const imageUrl = await QRCode.toDataURL(directUpiString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      qrId,
      imageUrl,
      amount,
      fixedAmount: true,
      payloadType: 'upi_direct',
      upiString: directUpiString,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
