import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';
import { getPlaygroundItemBySlug, type PlaygroundItem } from '@/data/playgroundItems';
import { calculatePlaygroundPrice, generateOrderNumber } from '@/lib/playgroundCommerce';

const createOrderSchema = z.object({
  productSlug: z.string().min(1, 'Product slug is required'),
  tierId: z.string().optional().default('standard'),
  customerName: z.string().min(1, 'Full name is required'),
  customerEmail: z.string().email('Valid delivery email is required'),
  currency: z.enum(['INR', 'USD']).optional().default('INR'),
  githubUsername: z.string().optional(),
  referralCode: z.string().optional(),
});

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

    const parseResult = createOrderSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Validation error' },
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

    const isDev = process.env.NODE_ENV === 'development';

    // 3. Fallback / mock handling if credentials absent in dev mode
    if (!KEY_ID || !KEY_SECRET) {
      if (isDev) {
        const mockRzpOrderId = `order_mock_${Date.now()}`;
        let orderRowId = crypto.randomUUID();

        if (supabase) {
          const { data: orderData } = await supabase
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
              razorpay_order_id: mockRzpOrderId,
              download_token: downloadToken,
              github_username: githubUsername?.trim() || null,
              referral_code: referralCode?.trim() || null,
            })
            .select('id')
            .single();

          if (orderData?.id) {
            orderRowId = orderData.id;
          }
        }

        return NextResponse.json({
          isMock: true,
          orderId: orderRowId,
          orderNumber,
          razorpayOrderId: mockRzpOrderId,
          amount: amountInSubunits,
          currency,
          keyId: 'rzp_test_mock',
        });
      }

      return NextResponse.json(
        { error: 'Payment gateway credentials not configured on server' },
        { status: 500 }
      );
    }

    // 4. Create pending order in database
    let orderRowId = crypto.randomUUID();
    if (supabase) {
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
      isMock: false,
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
