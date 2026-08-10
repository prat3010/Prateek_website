import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

function generateRazorpayQrSvg(amount: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" width="300" height="340">
    <rect width="300" height="340" rx="16" fill="#090d16" stroke="#0ea5e9" stroke-width="2"/>
    <rect x="20" y="20" width="260" height="40" rx="8" fill="#0284c7"/>
    <text x="150" y="45" font-family="monospace" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">RAZORPAY UPI (₹${amount})</text>
    <rect x="30" y="80" width="240" height="240" rx="12" fill="#ffffff"/>
    <rect x="45" y="95" width="60" height="60" fill="#090d16"/><rect x="53" y="103" width="44" height="44" fill="#ffffff"/><rect x="61" y="111" width="28" height="28" fill="#0ea5e9"/>
    <rect x="195" y="95" width="60" height="60" fill="#090d16"/><rect x="203" y="103" width="44" height="44" fill="#ffffff"/><rect x="211" y="111" width="28" height="28" fill="#0ea5e9"/>
    <rect x="45" y="245" width="60" height="60" fill="#090d16"/><rect x="53" y="253" width="44" height="44" fill="#ffffff"/><rect x="61" y="261" width="28" height="28" fill="#0ea5e9"/>
    <rect x="120" y="95" width="12" height="12" fill="#090d16"/><rect x="140" y="95" width="12" height="12" fill="#0ea5e9"/><rect x="160" y="95" width="12" height="12" fill="#090d16"/>
    <rect x="120" y="115" width="12" height="12" fill="#0ea5e9"/><rect x="140" y="115" width="12" height="12" fill="#090d16"/><rect x="160" y="115" width="12" height="12" fill="#0ea5e9"/>
    <rect x="120" y="135" width="12" height="12" fill="#090d16"/><rect x="140" y="135" width="12" height="12" fill="#0ea5e9"/><rect x="160" y="135" width="12" height="12" fill="#090d16"/>
    <rect x="120" y="155" width="12" height="12" fill="#0ea5e9"/><rect x="140" y="155" width="12" height="12" fill="#090d16"/><rect x="160" y="155" width="12" height="12" fill="#0ea5e9"/>
    <rect x="180" y="155" width="12" height="12" fill="#090d16"/><rect x="200" y="155" width="12" height="12" fill="#0ea5e9"/><rect x="220" y="155" width="12" height="12" fill="#090d16"/>
    <rect x="120" y="175" width="12" height="12" fill="#090d16"/><rect x="140" y="175" width="12" height="12" fill="#0ea5e9"/><rect x="160" y="175" width="12" height="12" fill="#090d16"/>
    <rect x="180" y="175" width="12" height="12" fill="#0ea5e9"/><rect x="200" y="175" width="12" height="12" fill="#090d16"/><rect x="240" y="175" width="12" height="12" fill="#0ea5e9"/>
    <rect x="120" y="195" width="12" height="12" fill="#0ea5e9"/><rect x="140" y="195" width="12" height="12" fill="#090d16"/><rect x="160" y="195" width="12" height="12" fill="#0ea5e9"/>
    <rect x="180" y="195" width="12" height="12" fill="#090d16"/><rect x="200" y="195" width="12" height="12" fill="#0ea5e9"/><rect x="220" y="195" width="12" height="12" fill="#090d16"/>
    <rect x="120" y="215" width="12" height="12" fill="#090d16"/><rect x="140" y="215" width="12" height="12" fill="#0ea5e9"/><rect x="160" y="215" width="12" height="12" fill="#090d16"/>
    <rect x="180" y="215" width="12" height="12" fill="#0ea5e9"/><rect x="200" y="215" width="12" height="12" fill="#090d16"/><rect x="240" y="215" width="12" height="12" fill="#0ea5e9"/>
    <rect x="120" y="235" width="12" height="12" fill="#0ea5e9"/><rect x="140" y="235" width="12" height="12" fill="#090d16"/><rect x="160" y="235" width="12" height="12" fill="#0ea5e9"/>
    <rect x="180" y="235" width="12" height="12" fill="#090d16"/><rect x="200" y="235" width="12" height="12" fill="#0ea5e9"/><rect x="220" y="235" width="12" height="12" fill="#090d16"/>
    <rect x="120" y="255" width="12" height="12" fill="#090d16"/><rect x="140" y="255" width="12" height="12" fill="#0ea5e9"/><rect x="160" y="255" width="12" height="12" fill="#090d16"/>
    <rect x="180" y="255" width="12" height="12" fill="#0ea5e9"/><rect x="200" y="255" width="12" height="12" fill="#090d16"/><rect x="240" y="255" width="12" height="12" fill="#0ea5e9"/>
    <rect x="120" y="275" width="12" height="12" fill="#0ea5e9"/><rect x="140" y="275" width="12" height="12" fill="#090d16"/><rect x="160" y="275" width="12" height="12" fill="#0ea5e9"/>
    <rect x="180" y="275" width="12" height="12" fill="#090d16"/><rect x="200" y="275" width="12" height="12" fill="#0ea5e9"/><rect x="220" y="275" width="12" height="12" fill="#090d16"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function POST(req: Request) {
  try {
    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const body = await req.json().catch(() => ({}));
    const amountInr = Number(body.amount) || 500;

    if (amountInr <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    const amountInSubunits = amountInr * 100;
    const fallbackSvgUrl = generateRazorpayQrSvg(amountInr);

    if (!KEY_ID || !KEY_SECRET) {
      const mockQrId = `qr_mock_${Date.now()}`;
      if (supabase) {
        try {
          await supabase.from('terminal_qr_sessions').insert({
            qr_id: mockQrId,
            amount_inr: amountInr,
            status: 'active',
          });
        } catch (dbErr) {
          console.warn('Mock QR session insert warning:', dbErr);
        }
      }
      return NextResponse.json({
        success: true,
        isMock: true,
        qr_id: mockQrId,
        amount: amountInr,
        image_url: fallbackSvgUrl,
        payment_url: `upi://pay?pa=prateeqsharma@ybl&pn=Prateek%20Sharma&am=${amountInr}&cu=INR`,
      });
    }

    const authHeader = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;

    try {
      const response = await fetch('https://api.razorpay.com/v1/qr_codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          type: 'upi_qr',
          name: 'Prateek Studio Terminal Payment',
          usage: 'single_use',
          fixed_amount: true,
          payment_amount: amountInSubunits,
          description: `Terminal Console Retainer / Micro-Consulting (₹${amountInr})`,
          notes: {
            source: 'terminal_console',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Razorpay QR code creation failed:', errText);
        const mockQrId = `qr_mock_${Date.now()}`;
        return NextResponse.json({
          success: true,
          isMock: true,
          qr_id: mockQrId,
          amount: amountInr,
          image_url: fallbackSvgUrl,
          payment_url: `upi://pay?pa=prateeqsharma@ybl&pn=Prateek%20Sharma&am=${amountInr}&cu=INR`,
        });
      }

      const qrData = await response.json();
      const qrId = qrData.id;
      const imageUrl = qrData.image_url || fallbackSvgUrl;

      if (supabase) {
        try {
          await supabase.from('terminal_qr_sessions').insert({
            qr_id: qrId,
            amount_inr: amountInr,
            status: 'active',
          });
        } catch (dbErr) {
          console.warn('Terminal QR session insert warning:', dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        qr_id: qrId,
        amount: amountInr,
        image_url: imageUrl,
        payment_url: qrData.payment_url || `upi://pay?pa=prateeqsharma@ybl&pn=Prateek%20Sharma&am=${amountInr}&cu=INR`,
      });
    } catch (fetchErr) {
      console.warn('Razorpay QR API fetch error:', fetchErr);
      const mockQrId = `qr_mock_${Date.now()}`;
      return NextResponse.json({
        success: true,
        isMock: true,
        qr_id: mockQrId,
        amount: amountInr,
        image_url: fallbackSvgUrl,
        payment_url: `upi://pay?pa=prateeqsharma@ybl&pn=Prateek%20Sharma&am=${amountInr}&cu=INR`,
      });
    }
  } catch (err) {
    console.error('Create Terminal QR API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
