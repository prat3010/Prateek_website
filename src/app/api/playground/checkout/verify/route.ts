import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/data/supabase';
import { getPlaygroundItemBySlug, type PlaygroundItem } from '@/data/playgroundItems';
import { 
  verifyRazorpayPaymentSignature, 
  claimAndSettlePlaygroundOrder, 
  generatePlaygroundLicenseKey, 
  inviteCustomerToGitHubRepo,
  recordPlaygroundAffiliateCommission,
  resolvePlaygroundTierPackage
} from '@/lib/playgroundCommerce';
import { sendPlaygroundFulfillmentEmail } from '@/lib/emailNotification';

const verifySchema = z.object({
  orderId: z.string().min(1, 'Internal order ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

export async function POST(req: Request) {
  try {
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const parseResult = verifySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = parseResult.data;

    const isMock = process.env.NODE_ENV !== 'production' && razorpayOrderId.startsWith('order_mock_');

    // 1. Verify timing-safe HMAC signature unless in mock mode
    if (!isMock) {
      if (!KEY_SECRET) {
        return NextResponse.json({ error: 'Server payment secret not configured' }, { status: 500 });
      }

      const isValidSignature = verifyRazorpayPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        KEY_SECRET
      );

      if (!isValidSignature) {
        return NextResponse.json({ error: 'Invalid payment signature verification failed' }, { status: 400 });
      }
    }

    if (!supabase) {
      // Degraded / CI mode
      const mockKey = generatePlaygroundLicenseKey();
      return NextResponse.json({
        success: true,
        licenseKey: mockKey,
        downloadUrl: `https://mock.storage/playground-releases/mock-package.zip`,
        orderNumber: 'ORD-PLAY-MOCK-0001',
      });
    }

    // 2. Concurrency-safe atomic order settlement lock
    const { wonSettlementRace, order } = await claimAndSettlePlaygroundOrder(
      supabase,
      orderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!order) {
      return NextResponse.json({ error: 'Order not found for settlement' }, { status: 404 });
    }

    // 3. Resolve product details for package key and github repo source
    let product = getPlaygroundItemBySlug(order.product_slug);
    try {
      const { data: dbProduct } = await supabase
        .from('playground_products')
        .select('*')
        .eq('slug', order.product_slug)
        .maybeSingle();

      if (dbProduct) {
        product = {
          ...product,
          ...dbProduct,
          downloadPackageKey: dbProduct.download_package_key || product?.downloadPackageKey,
          githubRepoSource: dbProduct.github_repo_source || product?.githubRepoSource,
        } as unknown as PlaygroundItem;
      }
    } catch (lookupErr) {
      console.warn('Product lookup notice:', lookupErr);
    }

    const tierResolution = product
      ? resolvePlaygroundTierPackage(product, order.tier_id)
      : { packageKey: `${order.product_slug}/package.zip`, licenseType: 'commercial_single' };

    // 4. Resolve canonical download gateway URL to strictly enforce atomic quota incrementing and 300s TTL
    const downloadGatewayUrl = `/api/playground/download?token=${encodeURIComponent(order.download_token)}&order=${encodeURIComponent(order.order_number)}`;

    // 5. If this thread won the settlement race, issue license and dispatch fulfillment
    if (wonSettlementRace) {
      let licenseKey = generatePlaygroundLicenseKey();

      // Insert license record (strict 1-to-1 UNIQUE constraint on order_id)
      const { error: licErr } = await supabase
        .from('playground_licenses')
        .insert({
          license_key: licenseKey,
          order_id: order.id,
          customer_email: order.customer_email,
          product_slug: order.product_slug,
          license_type: tierResolution.licenseType,
          is_active: true,
        });

      if (licErr) {
        console.warn('License insert collision (checking concurrent record):', licErr);
        const { data: existingLic } = await supabase
          .from('playground_licenses')
          .select('license_key')
          .eq('order_id', order.id)
          .maybeSingle();
        if (existingLic?.license_key) {
          licenseKey = existingLic.license_key;
        }
      }

      // Send transactional fulfillment email via Resend
      sendPlaygroundFulfillmentEmail({
        customerName: order.customer_name || 'Valued Customer',
        customerEmail: order.customer_email,
        orderNumber: order.order_number,
        productTitle: order.product_title,
        productSlug: order.product_slug,
        amount: Number(order.amount),
        currency: order.currency,
        licenseKey,
        downloadSignedUrl: downloadGatewayUrl,
        downloadToken: order.download_token,
        githubUsername: order.github_username || undefined,
        githubRepoSource: product?.githubRepoSource,
      }).catch((emailErr) => {
        console.warn('Failed to send fulfillment email:', emailErr);
      });

      // Automated GitHub collaborator invitation (non-blocking)
      if (order.github_username && product?.githubRepoSource) {
        inviteCustomerToGitHubRepo(product.githubRepoSource, order.github_username)
          .catch((ghErr) => console.warn('GitHub collaborator invite warning:', ghErr));
      }

      // Record affiliate partner attribution if referral code exists
      if (order.referral_code) {
        recordPlaygroundAffiliateCommission(supabase, order)
          .catch((affErr) => console.warn('Affiliate commission logging warning:', affErr));
      }

      return NextResponse.json({
        success: true,
        downloadUrl: downloadGatewayUrl,
        licenseKey,
        orderNumber: order.order_number,
      });
    }

    // 6. If another process won the race (e.g. webhook settled first), poll for existing license
    let existingLicenseKey: string | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existingLicense } = await supabase
        .from('playground_licenses')
        .select('license_key')
        .eq('order_id', order.id)
        .maybeSingle();

      if (existingLicense?.license_key) {
        existingLicenseKey = existingLicense.license_key;
        break;
      }

      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({
      success: true,
      downloadUrl: downloadGatewayUrl,
      licenseKey: existingLicenseKey || 'PENDING_LICENSE',
      orderNumber: order.order_number,
    });
  } catch (err: unknown) {
    console.error('Playground checkout verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
