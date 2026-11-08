import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { inviteCustomerToGitHubRepo } from '@/lib/playgroundCommerce';
import { getPlaygroundItemBySlug } from '@/data/playgroundItems';

export async function GET(req: Request) {
  try {
    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json({ orders: [] });
    }

    // 1. Fetch paid orders for this verified email
    const { data: orders, error: ordersErr } = await supabase
      .from('playground_orders')
      .select('*')
      .eq('customer_email', clientEmail.toLowerCase().trim())
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.error('Failed to fetch client playground orders:', ordersErr);
      return NextResponse.json({ error: 'Could not fetch licenses.' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // 2. Fetch associated licenses
    const orderIds = orders.map((o) => o.id);
    const { data: licenses } = await supabase
      .from('playground_licenses')
      .select('*')
      .in('order_id', orderIds);

    const licenseMap = new Map((licenses || []).map((l) => [l.order_id, l]));

    // 3. Map orders with license keys and repository source
    const mappedOrders = orders.map((order) => {
      const lic = licenseMap.get(order.id);
      const localProduct = getPlaygroundItemBySlug(order.product_slug);

      return {
        id: order.id,
        orderNumber: order.order_number,
        productSlug: order.product_slug,
        productTitle: order.product_title,
        amount: Number(order.amount),
        currency: order.currency,
        paidAt: order.paid_at || order.created_at,
        downloadToken: order.download_token,
        downloadCount: order.download_count,
        maxDownloads: order.max_downloads,
        githubUsername: order.github_username,
        githubRepoSource: localProduct?.githubRepoSource || null,
        licenseKey: lic?.license_key || 'PENDING_ACTIVATION',
        licenseType: lic?.license_type || 'commercial_single',
        isActive: lic?.is_active ?? true,
      };
    });

    return NextResponse.json({ orders: mappedOrders });
  } catch (err: unknown) {
    console.error('Playground licenses API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const orderId = typeof body?.orderId === 'string' ? body.orderId : undefined;
    const githubUsername = typeof body?.githubUsername === 'string' ? body.githubUsername : undefined;
    if (!orderId || !githubUsername) {
      return NextResponse.json({ error: 'orderId and githubUsername are required' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database service offline' }, { status: 503 });
    }

    // 1. Verify order ownership
    const { data: order, error: orderErr } = await supabase
      .from('playground_orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_email', clientEmail.toLowerCase().trim())
      .eq('status', 'paid')
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
    }

    // 2. Update GitHub handle on order
    const cleanUsername = githubUsername.replace(/^@/, '').trim();
    await supabase
      .from('playground_orders')
      .update({ github_username: cleanUsername })
      .eq('id', orderId);

    // 3. Resolve repo source
    const localProduct = getPlaygroundItemBySlug(order.product_slug);
    let repoSource = localProduct?.githubRepoSource;

    if (!repoSource) {
      const { data: productRow } = await supabase
        .from('playground_products')
        .select('github_repo_source')
        .eq('slug', order.product_slug)
        .maybeSingle();
      repoSource = productRow?.github_repo_source;
    }

    if (!repoSource) {
      return NextResponse.json({
        success: true,
        message: 'GitHub username updated (no private repository linked to this item)',
      });
    }

    // 4. Trigger GitHub collaborator invite
    const inviteRes = await inviteCustomerToGitHubRepo(repoSource, cleanUsername);
    if (!inviteRes.success) {
      return NextResponse.json({
        success: false,
        warning: `Updated handle, but invitation failed: ${inviteRes.error}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Collaborator invitation sent to @${cleanUsername} for ${repoSource}`,
    });
  } catch (err: unknown) {
    console.error('Playground licenses update error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
