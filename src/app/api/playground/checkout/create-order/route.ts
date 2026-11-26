import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';
import { getPlaygroundItemBySlug, type PlaygroundItem } from '@/data/playgroundItems';
import { calculatePlaygroundPrice, generateOrderNumber } from '@/lib/playgroundCommerce';

interface CreateOrderInput {
  productSlug: string;
  tierId: string;
  customerName: string;
  customerEmail: string;
  currency: 'INR' | 'USD';
  githubUsername?: string;
  referralCode?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCreateOrderBody(raw: unknown): { ok: true; data: CreateOrderInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Validation error' };
  }
  const obj = raw as Record<string, unknown>;
  const productSlug = typeof obj.productSlug === 'string' ? obj.productSlug.trim() : '';
  if (productSlug.length < 1) {
    return { ok: false, error: 'Product slug is required' };
  }
  const tierId = obj.tierId === undefined ? 'standard' : typeof obj.tierId === 'string' ? obj.tierId.trim() : '';
  if (obj.tierId !== undefined && typeof obj.tierId !== 'string') {
    return { ok: false, error: 'Validation error' };
  }
  const customerName = typeof obj.customerName === 'string' ? obj.customerName.trim() : '';
  if (customerName.length < 1) {
    return { ok: false, error: 'Full name is required' };
  }
  const customerEmail = typeof obj.customerEmail === 'string' ? obj.customerEmail.toLowerCase().trim() : '';
  if (!EMAIL_RE.test(customerEmail)) {
    return { ok: false, error: 'Valid delivery email is required' };
  }
  const rawCurrency = obj.currency ?? 'INR';
  if (rawCurrency !== 'INR' && rawCurrency !== 'USD') {
    return { ok: false, error: 'Validation error' };
  }
  if (obj.githubUsername !== undefined && typeof obj.githubUsername !== 'string') {
    return { ok: false, error: 'Validation error' };
  }
  if (obj.referralCode !== undefined && typeof obj.referralCode !== 'string') {
    return { ok: false, error: 'Validation error' };
  }
  return {
    ok: true,
    data: {
      productSlug,
      tierId,
      customerName,
      customerEmail,
      currency: rawCurrency,
      githubUsername: typeof obj.githubUsername === 'string' ? obj.githubUsername.trim() : undefined,
      referralCode: typeof obj.referralCode === 'string' ? obj.referralCode.trim() : undefined,
    },
  };
}

export async function POST(req: Request) {
  try {
    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const parseResult = parseCreateOrderBody(body);
    if (!parseResult.ok) {
      return NextResponse.json(
        { error: parseResult.error },
        { status: 400 }
      );
    }

    const {
      productSlug,
      tierId,
      customerName,
      customerEmail,
      currency,
      githubUsername,
      referralCode,
    } = parseResult.data;

    // 1. Look up product from local catalog or Supabase
    let product = getPlaygroundItemBySlug(productSlug);
    let productId: string | null = null;

    if (supabase) {
      try {
        const { data: dbProduct } = await supabase
          .from('playground_products')
          .select('*')
          .eq('slug', productSlug)
          .maybeSingle();

        if (dbProduct) {
          productId = dbProduct.id;
          product = {
            ...product,
            ...dbProduct,
            id: dbProduct.id,
            isCommercial: dbProduct.is_commercial,
            priceINR: dbProduct.price_inr,
            priceUSD: dbProduct.price_usd,
            pricingTiers: dbProduct.pricing_tiers || product?.pricingTiers,
          } as unknown as PlaygroundItem;
        }
      } catch (err) {
        console.warn('Supabase product lookup warning:', err);
      }
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found in catalog' }, { status: 404 });
    }

    // 2. Compute canonical amount in requested currency
    const { amount, tier } = calculatePlaygroundPrice(product, tierId, currency);
    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid product pricing' }, { status: 400 });
    }

    const canonicalTierId = tier?.id || tierId;
    const orderNumber = generateOrderNumber();
    const downloadToken = crypto.randomBytes(32).toString('hex');
    const amountInSubunits = Math.round(amount * 100);

    // 3. Fail closed if Razorpay credentials or database are absent
    if (!KEY_ID || !KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment gateway credentials not configured on server' },
        { status: 500 }
      );
    }

    // 4. Create pending order in database
    let orderRowId = crypto.randomUUID();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable. Checkout order could not be recorded.' },
        { status: 503 }
      );
    } else {
      const { data: orderData, error: dbErr } = await supabase
        .from('playground_orders')
        .insert({
          order_number: orderNumber,
          product_id: productId,
          product_slug: product.slug,
          product_title: product.title,
          customer_name: customerName.trim(),
          customer_email: customerEmail.toLowerCase().trim(),
          tier_id: canonicalTierId,
          amount: amount,
          currency: currency,
          status: 'pending',
          download_token: downloadToken,
          github_username: githubUsername?.trim() || null,
          referral_code: referralCode?.trim() || null,
        })
        .select('id')
        .single();

      if (dbErr) {
        console.error('Failed to insert playground order ledger:', dbErr);
        return NextResponse.json({ error: 'Could not record order transaction' }, { status: 500 });
      }

      if (orderData?.id) {
        orderRowId = orderData.id;
      }
    }

    // 5. Call Razorpay Orders API
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
          currency,
          receipt: orderNumber,
          payment_capture: 1,
          notes: {
            order_type: 'playground',
            product_slug: product.slug,
            tier_id: canonicalTierId,
            customer_email: customerEmail,
            order_number: orderNumber,
            order_id: orderRowId,
          },
        }),
      });
    } catch (fetchErr) {
      console.error('Razorpay API request error:', fetchErr);
      return NextResponse.json({ error: 'Unable to connect to payment gateway' }, { status: 502 });
    }

    if (!razorpayRes || !razorpayRes.ok) {
      const errText = razorpayRes ? await razorpayRes.text() : 'No response';
      console.error('Razorpay order creation failed:', errText);
      return NextResponse.json({ error: 'Failed to initialize payment gateway order' }, { status: 500 });
    }

    const orderData = await razorpayRes.json();

    // 6. Update database record with Razorpay order ID
    if (supabase) {
      await supabase
        .from('playground_orders')
        .update({ razorpay_order_id: orderData.id })
        .eq('id', orderRowId);
    }

    return NextResponse.json({
      orderId: orderRowId,
      orderNumber,
      razorpayOrderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency || currency,
      keyId: KEY_ID,
    });
  } catch (err: unknown) {
    console.error('Playground checkout create-order error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
