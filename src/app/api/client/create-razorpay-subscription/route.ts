import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function POST(req: Request) {
  try {
    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = await req.json().catch(() => ({}));
    const planId = (payload.planId as string) || 'plan_starter_inr';
    const totalCount = Number(payload.totalCount) || 12;

    const clientEmail = await getVerifiedSessionEmail(req);
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

    if (!KEY_ID || !KEY_SECRET) {
      if (isDev || !supabase) {
        return NextResponse.json({
          isMock: true,
          subscriptionId: `sub_mock_${Date.now()}`,
          planId,
          keyId: KEY_ID || 'rzp_test_mock',
        });
      }
      return NextResponse.json({ error: 'Razorpay API credentials not configured on server.' }, { status: 500 });
    }

    const authHeader = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;

    try {
      const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          plan_id: planId,
          total_count: totalCount,
          quantity: 1,
          customer_notify: 1,
          notes: {
            client_email: clientEmail || 'guest@prateeq.in',
            source: 'prateeq_website',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Razorpay create subscription API error:', errText);
        if (isDev) {
          return NextResponse.json({
            isMock: true,
            subscriptionId: `sub_mock_${Date.now()}`,
            planId,
            keyId: KEY_ID,
          });
        }
        return NextResponse.json({ error: 'Failed to initialize Razorpay subscription plan.' }, { status: 500 });
      }

      const subData = await response.json();

      return NextResponse.json({
        subscriptionId: subData.id,
        planId: subData.plan_id,
        status: subData.status,
        keyId: KEY_ID,
      });
    } catch (fetchErr) {
      console.warn('Razorpay subscription fetch warning:', fetchErr);
      if (isDev) {
        return NextResponse.json({
          isMock: true,
          subscriptionId: `sub_mock_${Date.now()}`,
          planId,
          keyId: KEY_ID,
        });
      }
      return NextResponse.json({ error: 'Unable to connect to Razorpay subscription gateway.' }, { status: 502 });
    }
  } catch (err) {
    console.error('Create Razorpay Subscription API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
