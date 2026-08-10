import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

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
    const isDev = process.env.NODE_ENV === 'development';

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
        image_url: '/phonepe_qr.svg',
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
          image_url: '/phonepe_qr.svg',
          payment_url: `upi://pay?pa=prateeqsharma@ybl&pn=Prateek%20Sharma&am=${amountInr}&cu=INR`,
        });
      }

      const qrData = await response.json();
      const qrId = qrData.id;
      const imageUrl = qrData.image_url || '/phonepe_qr.svg';

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
        image_url: '/phonepe_qr.svg',
        payment_url: `upi://pay?pa=prateeqsharma@ybl&pn=Prateek%20Sharma&am=${amountInr}&cu=INR`,
      });
    }
  } catch (err) {
    console.error('Create Terminal QR API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
