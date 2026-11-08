import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlaygroundItem, PlaygroundPricingTier } from '@/data/playgroundItems';

/**
 * Timing-safe HMAC SHA-256 signature verification for Razorpay payment webhooks and browser callbacks.
 */
export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const genBuf = Buffer.from(generatedSignature, 'utf-8');
  const sigBuf = Buffer.from(signature, 'utf-8');

  if (genBuf.byteLength !== sigBuf.byteLength) {
    return false;
  }

  return crypto.timingSafeEqual(genBuf, sigBuf);
}

/**
 * Generates an immutable, cryptographically secure perpetual license key.
 * Format: PRTK-PLAY-XXXX-XXXX-XXXX-XXXX
 */
export function generatePlaygroundLicenseKey(): string {
  const segments: string[] = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `PRTK-PLAY-${segments.join('-')}`;
}

/**
 * Generates an order number in format: ORD-PLAY-YYYYMMDD-XXXX
 */
export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD-PLAY-${dateStr}-${randomSuffix}`;
}

export interface PlaygroundOrderRow {
  id: string;
  order_number: string;
  product_id?: string;
  product_slug: string;
  product_title: string;
  customer_name?: string;
  customer_email: string;
  tier_id?: string;
  amount: number;
  currency: string;
  status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  download_count: number;
  max_downloads: number;
  download_token: string;
  github_username?: string | null;
  referral_code?: string | null;
  referral_partner_id?: string | null;
  paid_at?: string | null;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Atomic order settlement guardrail.
 * Uses conditional transition `WHERE id = $orderId AND status = 'pending'`.
 * If this query updates 1 row, wonSettlementRace = true.
 * If 0 rows updated (e.g. webhook already settled order), reads settled row and returns wonSettlementRace = false.
 */
export async function claimAndSettlePlaygroundOrder(
  supabaseAdmin: SupabaseClient,
  orderId: string,
  paymentId: string,
  signature: string
): Promise<{ wonSettlementRace: boolean; order: PlaygroundOrderRow | null }> {
  const { data, error } = await supabaseAdmin
    .from('playground_orders')
    .update({
      status: 'paid',
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (error || !data) {
    // Status was already 'paid' or order not found; read existing record
    const { data: existing } = await supabaseAdmin
      .from('playground_orders')
      .select('*')
      .eq('id', orderId)
      .single();
    return { wonSettlementRace: false, order: existing };
  }

  return { wonSettlementRace: true, order: data };
}

/**
 * Resolves price and tier details for a product in INR or USD.
 */
export function calculatePlaygroundPrice(
  product: PlaygroundItem,
  tierId: string = 'standard',
  currency: 'INR' | 'USD' = 'INR'
): { amount: number; tier?: PlaygroundPricingTier } {
  // Check if product has explicit tiers
  const tiers = product.pricingTiers || [];
  const selectedTier = tiers.find((t) => t.id === tierId) || tiers[0];

  if (selectedTier) {
    const amount = currency === 'INR' ? selectedTier.priceINR : selectedTier.priceUSD;
    return {
      amount: Math.max(0, amount),
      tier: {
        ...selectedTier,
        name: selectedTier.name || selectedTier.title,
      },
    };
  }

  // Fallback to base product prices
  const basePrice = currency === 'INR' ? product.priceINR : product.priceUSD;
  const defaultAmount = currency === 'INR' ? 2499 : 29;
  return { amount: basePrice ?? defaultAmount, tier: undefined };
}

/**
 * Automated GitHub repository invitation via GitHub REST API.
 * Uses GITHUB_TOKEN or GITHUB_PAT with scoped permissions.
 * Non-blocking: failures do not block ZIP delivery.
 */
export async function inviteCustomerToGitHubRepo(
  repoSource: string,
  githubUsername: string
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || process.env.GH_TOKEN;
  if (!token) {
    return { success: false, error: 'GITHUB_TOKEN not configured in server environment' };
  }

  const cleanUser = githubUsername.replace(/^@/, '').trim();
  if (!cleanUser || !repoSource.includes('/')) {
    return { success: false, error: 'Invalid username or repository path' };
  }

  const [owner, repo] = repoSource.split('/');
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/collaborators/${cleanUser}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Prateeq-Playground-Commerce',
      },
      body: JSON.stringify({ permission: 'pull' }),
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      return { success: true };
    }

    const errText = await res.text();
    return { success: false, error: `GitHub API ${res.status}: ${errText}` };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error triggering GitHub collaborator invite' };
  }
}

/**
 * Records partner referral attribution for digital goods.
 * Digital products earn a 20% referral commission for registered partners.
 */
export async function recordPlaygroundAffiliateCommission(
  supabaseAdmin: SupabaseClient,
  order: PlaygroundOrderRow
): Promise<{ partnerId?: string; commissionAmount: number } | null> {
  const referralCode = order.referral_code;
  if (!referralCode) return null;

  try {
    // Check promo_codes table for partner attribution
    const { data: promo } = await supabaseAdmin
      .from('promo_codes')
      .select('partner_id')
      .ilike('code', referralCode)
      .single();

    const partnerId = promo?.partner_id || referralCode;
    const rate = 0.20; // 20% digital product commission
    const commissionAmount = Math.round(Number(order.amount) * rate);

    await supabaseAdmin
      .from('playground_orders')
      .update({ referral_partner_id: partnerId })
      .eq('id', order.id);

    return { partnerId, commissionAmount };
  } catch (err) {
    console.warn('[Playground Affiliate Warning] Failed to log affiliate attribution:', err);
    return null;
  }
}

/**
 * Evaluates whether a download request is permitted under the order's max download quota.
 */
export function checkDownloadQuota(
  downloadCount: number,
  maxDownloads: number = 10
): { allowed: boolean; remaining: number } {
  const count = Math.max(0, downloadCount);
  const max = Math.max(1, maxDownloads);
  const allowed = count < max;
  const remaining = Math.max(0, max - count);
  return { allowed, remaining };
}

/**
 * Resolves the download package key and license type for a product and tier.
 * Prioritizes tier-specific download keys and license types over base product defaults.
 */
export function resolvePlaygroundTierPackage(
  product: PlaygroundItem,
  tierId?: string
): { packageKey: string; licenseType: string; tierName?: string } {
  const tiers = product.pricingTiers || [];
  const selectedTier = (tierId ? tiers.find((t) => t.id === tierId) : undefined) || tiers[0];

  const packageKey =
    selectedTier?.downloadKey ||
    product.downloadPackageKey ||
    `${product.slug}/package.zip`;

  const licenseType =
    selectedTier?.licenseType ||
    product.licenseType ||
    'commercial_single';

  return {
    packageKey,
    licenseType,
    tierName: selectedTier?.name || selectedTier?.title,
  };
}

