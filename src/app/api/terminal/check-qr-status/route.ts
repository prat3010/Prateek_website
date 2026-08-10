import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qrId = searchParams.get('qr_id');

    if (!qrId) {
      return NextResponse.json({ error: 'Missing qr_id parameter' }, { status: 400 });
    }

    if (supabase) {
      try {
        const { data: session } = await supabase
          .from('terminal_qr_sessions')
          .select('*')
          .eq('qr_id', qrId)
          .maybeSingle();

        if (session && session.status === 'paid') {
          return NextResponse.json({
            status: 'paid',
            payment_id: session.payment_id || 'pay_confirmed',
            amount: session.amount_inr,
            paid_at: session.paid_at,
          });
        }
      } catch (dbErr) {
        console.warn('Database lookup warning in check-qr-status:', dbErr);
      }
    }

    // Direct check with Razorpay API if credentials exist
    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    if (KEY_ID && KEY_SECRET && !qrId.startsWith('qr_mock_')) {
      const authHeader = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;
      try {
        const response = await fetch(`https://api.razorpay.com/v1/qr_codes/${qrId}`, {
          headers: { Authorization: authHeader },
        });

        if (response.ok) {
          const qrData = await response.json();
          const paymentsAmount = qrData.payments_amount_received || 0;
          const status = paymentsAmount > 0 || qrData.status === 'closed' ? 'paid' : 'active';

          if (status === 'paid' && supabase) {
            await supabase
              .from('terminal_qr_sessions')
              .update({ status: 'paid', paid_at: new Date().toISOString() })
              .eq('qr_id', qrId);
          }

          return NextResponse.json({
            status,
            amount: paymentsAmount / 100 || qrData.payment_amount / 100,
          });
        }
      } catch (fetchErr) {
        console.warn('Razorpay check QR API fetch error:', fetchErr);
      }
    }

    return NextResponse.json({ status: 'active' });
  } catch (err) {
    console.error('Check QR status API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
