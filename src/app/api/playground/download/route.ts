import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getPlaygroundItemBySlug, type PlaygroundItem } from '@/data/playgroundItems';
import { checkDownloadQuota, resolvePlaygroundTierPackage } from '@/lib/playgroundCommerce';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const orderNumber = searchParams.get('order');

    if (!token || !orderNumber) {
      return NextResponse.json(
        { error: 'Missing token or order parameters' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Storage service unavailable in offline mode' },
        { status: 503 }
      );
    }

    // 1. Look up paid order by cryptographic download token and order number
    const { data: order, error: orderErr } = await supabase
      .from('playground_orders')
      .select('*')
      .eq('download_token', token)
      .eq('order_number', orderNumber)
      .eq('status', 'paid')
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: 'Invalid or expired download authorization' },
        { status: 404 }
      );
    }

    // 2. Enforce download quota guardrail
    const maxDownloads = order.max_downloads || 10;
    const currentCount = order.download_count || 0;
    const quota = checkDownloadQuota(currentCount, maxDownloads);

    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: `Download quota exceeded (${maxDownloads}/${maxDownloads} downloads used). Contact support@prateeq.in for package renewal.`,
        },
        { status: 403 }
      );
    }

    // 3. Resolve package storage key matching purchased tier
    let localProduct = getPlaygroundItemBySlug(order.product_slug);
    try {
      const { data: productRow } = await supabase
        .from('playground_products')
        .select('*')
        .eq('slug', order.product_slug)
        .maybeSingle();

      if (productRow) {
        localProduct = {
          ...localProduct,
          ...productRow,
          pricingTiers: productRow.pricing_tiers || localProduct?.pricingTiers,
          downloadPackageKey: productRow.download_package_key || localProduct?.downloadPackageKey,
        } as unknown as PlaygroundItem;
      }
    } catch (lookupErr) {
      console.warn('Storage package key lookup warning:', lookupErr);
    }

    const packageKey = localProduct
      ? resolvePlaygroundTierPackage(localProduct, order.tier_id).packageKey
      : `${order.product_slug}/package.zip`;

    // 4. Generate fresh 5-minute signed URL from private bucket
    const { data: signedData, error: signError } = await supabase.storage
      .from('playground-releases')
      .createSignedUrl(packageKey, 300, { download: true });

    if (signError || !signedData?.signedUrl) {
      console.warn('Supabase storage asset signed URL error:', signError);
      return NextResponse.json(
        {
          error: 'Package asset is being staged. Please retry in a few moments or contact support@prateeq.in.',
          orderNumber: order.order_number,
        },
        { status: 404 }
      );
    }

    // 5. Atomically increment download count with optimistic concurrency retry loop
    let incrementSuccess = false;
    let effectiveCount = currentCount;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: updatedRows, error: updateErr } = await supabase
        .from('playground_orders')
        .update({ download_count: effectiveCount + 1 })
        .eq('id', order.id)
        .eq('download_count', effectiveCount)
        .lt('download_count', maxDownloads)
        .select('id, download_count');

      if (!updateErr && updatedRows && updatedRows.length > 0) {
        incrementSuccess = true;
        break;
      }

      // Concurrency collision: re-fetch fresh counter from database
      const { data: freshOrder } = await supabase
        .from('playground_orders')
        .select('download_count, max_downloads')
        .eq('id', order.id)
        .maybeSingle();

      if (!freshOrder) break;
      effectiveCount = freshOrder.download_count ?? 0;
      const latestMax = freshOrder.max_downloads ?? maxDownloads;

      if (effectiveCount >= latestMax) {
        return NextResponse.json(
          {
            error: `Download quota exceeded (${effectiveCount}/${latestMax} downloads used). Contact support@prateeq.in for package renewal.`,
          },
          { status: 403 }
        );
      }
    }

    if (!incrementSuccess) {
      return NextResponse.json(
        {
          error: `Download quota exceeded (${maxDownloads}/${maxDownloads} downloads used). Contact support@prateeq.in for package renewal.`,
        },
        { status: 403 }
      );
    }

    // 6. Redirect client browser directly to secure time-limited binary stream
    return NextResponse.redirect(signedData.signedUrl, 307);
  } catch (err: unknown) {
    console.error('Playground tokenized download error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
