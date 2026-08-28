import type {
  BaseEngineItem,
  BrandAssetOption,
  FeatureItem,
  GoalArchetype,
  MaintenancePlanOption,
  QuickServiceItem,
} from '@/data/resume';

export type Currency = 'INR' | 'USD';

export const ESTIMATE_DISCLAIMER =
  'All listed prices are starting prices for the stated baseline scope. Final pricing may vary based on ' +
  'functionality, integrations, content volume, data migration, compliance requirements, delivery timeline, ' +
  'third-party dependencies, technical complexity, and project-specific risk. A final line-item quotation and ' +
  'Scoping Specification will be issued before development begins.';


export function formatMoney(amount: number, currency: Currency): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const formatted = amount.toLocaleString(locale);
  return currency === 'INR' ? `₹${formatted}` : `$${formatted}`;
}

/** Full dual-currency display (primary currency first). */
export function formatPricePair(inr: number, usd: number, currency: Currency): string {
  const inrStr = `₹${inr.toLocaleString('en-IN')}`;
  const usdStr = `$${usd.toLocaleString('en-US')}`;
  return currency === 'INR' ? `${inrStr} / ${usdStr}` : `${usdStr} / ${inrStr}`;
}

/** Existing geo-IP `region` cookie value ('india' | 'global') → currency. Default: 'INR' for India location. */
export function resolveDefaultCurrency(region: string | null | undefined): Currency {
  if (region === 'global') return 'USD';
  if (region === 'india' || region === 'IN' || region === 'in') return 'INR';

  if (typeof window !== 'undefined' && typeof Intl !== 'undefined') {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) {
        return 'INR';
      }
    } catch {
      // ignore
    }
  }

  return 'INR';
}

export interface PromoDiscountInfo {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmountINR: number;
  discountAmountUSD: number;
}

export interface QuoteSelection {
  engineId: string;
  featureIds: string[];
  brandAssetId: string;
  maintenancePlanId: string;
  promoCode?: PromoDiscountInfo | null;
}

export interface QuoteLineItem {
  label: string;
  priceINR: number;
  priceUSD: number;
}

export interface QuoteResult {
  currency: Currency;
  engine: BaseEngineItem | null;
  features: FeatureItem[];
  brandAsset: BrandAssetOption | null;
  maintenancePlan: MaintenancePlanOption | null;
  enginePrice: number;
  featuresPrice: number;
  brandPrice: number;
  maintenancePrice: number;
  enginePriceINR: number;
  enginePriceUSD: number;
  featuresPriceINR: number;
  featuresPriceUSD: number;
  brandPriceINR: number;
  brandPriceUSD: number;
  maintenancePriceINR: number;
  maintenancePriceUSD: number;
  /** Volume bundle discount tier applied on features (0, 5, or 10) */
  bundleDiscountPercent: number;
  bundleDiscountAmountINR: number;
  bundleDiscountAmountUSD: number;
  /** Promo code discount applied */
  promoDiscount: PromoDiscountInfo | null;
  promoDiscountAmountINR: number;
  promoDiscountAmountUSD: number;
  /** Gross build total (engine + features + brand) before discounts */
  grossTotal: number;
  grossTotalINR: number;
  grossTotalUSD: number;
  /** Net build total after all discounts */
  netTotal: number;
  netTotalINR: number;
  netTotalUSD: number;
  /** Total build in active currency (maps to netTotal for backward compatibility) */
  total: number;
  totalINR: number;
  totalUSD: number;
  /** 50% upfront deposit and 50% delivery balance */
  deposit: number;
  depositINR: number;
  depositUSD: number;
  balance: number;
  balanceINR: number;
  balanceUSD: number;
  itemized: QuoteLineItem[];
}

export function calcQuote(
  engines: BaseEngineItem[],
  features: FeatureItem[],
  brandAssets: BrandAssetOption[],
  maintenancePlans: MaintenancePlanOption[],
  selection: QuoteSelection,
  currency: Currency,
): QuoteResult {
  const engine = engines.find((e) => e.id === selection.engineId) ?? null;
  const selectedFeatures = features.filter((f) => selection.featureIds.includes(f.id));
  const brandAsset = brandAssets.find((b) => b.id === selection.brandAssetId) ?? null;
  const maintenancePlan = maintenancePlans.find((m) => m.id === selection.maintenancePlanId) ?? null;

  const engineINR = engine?.priceINR ?? 0;
  const engineUSD = engine?.priceUSD ?? 0;
  const featuresINR = selectedFeatures.reduce((sum, f) => sum + f.priceINR, 0);
  const featuresUSD = selectedFeatures.reduce((sum, f) => sum + f.priceUSD, 0);
  const brandINR = brandAsset?.priceINR ?? 0;
  const brandUSD = brandAsset?.priceUSD ?? 0;
  const maintenanceINR = maintenancePlan?.priceINR ?? 0;
  const maintenanceUSD = maintenancePlan?.priceUSD ?? 0;

  const grossTotalINR = engineINR + featuresINR + brandINR;
  const grossTotalUSD = engineUSD + featuresUSD + brandUSD;

  // Volume Bundle Discount (3-5 features = 5%, 6+ features = 10% off features)
  let bundleDiscountPercent = 0;
  if (selectedFeatures.length >= 6) {
    bundleDiscountPercent = 10;
  } else if (selectedFeatures.length >= 3) {
    bundleDiscountPercent = 5;
  }

  const bundleDiscountAmountINR = Math.round((featuresINR * bundleDiscountPercent) / 100);
  const bundleDiscountAmountUSD = Math.round((featuresUSD * bundleDiscountPercent) / 100);

  // Promo Code Discount Calculation
  let promoDiscountAmountINR = 0;
  let promoDiscountAmountUSD = 0;
  const promo = selection.promoCode ?? null;

  if (promo) {
    if (promo.discountType === 'percentage') {
      const baseAfterBundleINR = Math.max(0, grossTotalINR - bundleDiscountAmountINR);
      const baseAfterBundleUSD = Math.max(0, grossTotalUSD - bundleDiscountAmountUSD);
      promoDiscountAmountINR = Math.round((baseAfterBundleINR * promo.discountValue) / 100);
      promoDiscountAmountUSD = Math.round((baseAfterBundleUSD * promo.discountValue) / 100);
    } else if (promo.discountType === 'fixed') {
      promoDiscountAmountINR = promo.discountAmountINR || promo.discountValue;
      promoDiscountAmountUSD = promo.discountAmountUSD || promo.discountValue;
    }
  }

  const netTotalINR = Math.max(0, grossTotalINR - bundleDiscountAmountINR - promoDiscountAmountINR);
  const netTotalUSD = Math.max(0, grossTotalUSD - bundleDiscountAmountUSD - promoDiscountAmountUSD);

  const depositINR = Math.round(netTotalINR * 0.5);
  const depositUSD = Math.round(netTotalUSD * 0.5);
  const balanceINR = netTotalINR - depositINR;
  const balanceUSD = netTotalUSD - depositUSD;

  const netTotal = currency === 'INR' ? netTotalINR : netTotalUSD;
  const grossTotal = currency === 'INR' ? grossTotalINR : grossTotalUSD;
  const deposit = currency === 'INR' ? depositINR : depositUSD;
  const balance = currency === 'INR' ? balanceINR : balanceUSD;

  return {
    currency,
    engine,
    features: selectedFeatures,
    brandAsset,
    maintenancePlan,
    enginePrice: currency === 'INR' ? engineINR : engineUSD,
    featuresPrice: currency === 'INR' ? featuresINR : featuresUSD,
    brandPrice: currency === 'INR' ? brandINR : brandUSD,
    maintenancePrice: currency === 'INR' ? maintenanceINR : maintenanceUSD,
    enginePriceINR: engineINR,
    enginePriceUSD: engineUSD,
    featuresPriceINR: featuresINR,
    featuresPriceUSD: featuresUSD,
    brandPriceINR: brandINR,
    brandPriceUSD: brandUSD,
    maintenancePriceINR: maintenanceINR,
    maintenancePriceUSD: maintenanceUSD,
    bundleDiscountPercent,
    bundleDiscountAmountINR,
    bundleDiscountAmountUSD,
    promoDiscount: promo,
    promoDiscountAmountINR,
    promoDiscountAmountUSD,
    grossTotal,
    grossTotalINR,
    grossTotalUSD,
    netTotal,
    netTotalINR,
    netTotalUSD,
    total: netTotal,
    totalINR: netTotalINR,
    totalUSD: netTotalUSD,
    deposit,
    depositINR,
    depositUSD,
    balance,
    balanceINR,
    balanceUSD,
    itemized: [
      ...(engine ? [{ label: `${engine.tier}: ${engine.title}`, priceINR: engineINR, priceUSD: engineUSD }] : []),
      ...selectedFeatures.map((f) => ({ label: f.label, priceINR: f.priceINR, priceUSD: f.priceUSD })),
      ...(brandAsset && brandAsset.priceINR > 0
        ? [{ label: brandAsset.label, priceINR: brandINR, priceUSD: brandUSD }]
        : []),
    ],
  };
}

/** Returns feature ids that must be selected because a chosen module depends on them. */
export function resolveFeatureDependencies(
  selectedIds: string[],
  features: FeatureItem[],
): string[] {
  const extra: string[] = [];
  const queue = [...selectedIds];
  const seen = new Set(selectedIds);
  while (queue.length > 0) {
    const id = queue.shift() as string;
    const feature = features.find((f) => f.id === id);
    for (const dep of feature?.dependsOn ?? []) {
      if (!seen.has(dep)) {
        seen.add(dep);
        extra.push(dep);
        queue.push(dep);
      }
    }
  }
  return extra;
}

/** Package total for a goal archetype = recommended engine + compulsory feature modules. */
export function packageTotalForArchetype(
  goal: GoalArchetype,
  engines: BaseEngineItem[],
  features: FeatureItem[],
  currency: Currency,
): number {
  const engine = engines.find((e) => e.id === goal.recommendedEngineId);
  const priceKey = currency === 'INR' ? 'priceINR' : 'priceUSD';
  const enginePrice = engine?.[priceKey] ?? 0;

  // Compulsory labels plus any transitive dependsOn modules they require, so the
  // package total always matches what the Scoping wizard would actually quote.
  const labelIds = features
    .filter((f) => goal.compulsoryFeatureLabels.includes(f.label))
    .map((f) => f.id);
  const requiredIds = new Set([...labelIds, ...resolveFeatureDependencies(labelIds, features)]);
  const featuresPrice = features
    .filter((f) => requiredIds.has(f.id))
    .reduce((sum, f) => sum + f[priceKey], 0);
  return enginePrice + featuresPrice;
}

export function packageTotals(
  goals: GoalArchetype[],
  engines: BaseEngineItem[],
  features: FeatureItem[],
  currency: Currency,
): { goalId: string; total: number }[] {
  return goals.map((goal) => ({
    goalId: goal.id,
    total: packageTotalForArchetype(goal, engines, features, currency),
  }));
}

/**
 * Calculate total for selected quick services (simple sum, no engine/brand/care).
 */
export function calcQuickServiceQuote(
  quickServices: QuickServiceItem[],
  selectedIds: string[],
  currency: Currency,
): { total: number; totalINR: number; totalUSD: number; items: QuickServiceItem[] } {
  const items = quickServices.filter(s => selectedIds.includes(s.id));
  const totalINR = items.reduce((sum, s) => sum + s.priceINR, 0);
  const totalUSD = items.reduce((sum, s) => sum + s.priceUSD, 0);
  return {
    total: currency === 'INR' ? totalINR : totalUSD,
    totalINR,
    totalUSD,
    items,
  };
}

/**
 * Finds all currently selected features that depend (directly or transitively) on targetFeatureId.
 * Uses Breadth-First Search (BFS) to traverse the dependency graph.
 */
export function findDependentFeatures(
  targetFeatureId: string,
  selectedFeatureIds: string[],
  allFeatures: FeatureItem[]
): FeatureItem[] {
  const dependentFeatures: FeatureItem[] = [];
  const selectedSet = new Set(selectedFeatureIds.filter((id) => id !== targetFeatureId));
  const queue: string[] = [targetFeatureId];
  const visited = new Set<string>([targetFeatureId]);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    
    // Find all selected features that declare currentId in their dependsOn array
    for (const f of allFeatures) {
      if (selectedSet.has(f.id) && f.dependsOn && f.dependsOn.includes(currentId)) {
        if (!visited.has(f.id)) {
          visited.add(f.id);
          dependentFeatures.push(f);
          queue.push(f.id); // Add to queue for transitive downstream search
        }
      }
    }
  }

  return dependentFeatures;
}

export interface CascadeRemovalSavingsResult {
  targetFeature: FeatureItem | null;
  dependentFeatures: FeatureItem[];
  totalSavingsINR: number;
  totalSavingsUSD: number;
  totalSavingsFormatted: string;
}

/**
 * Calculates total savings if target feature and all its dependent features are removed.
 */
export function calcCascadeRemovalSavings(
  targetFeatureId: string,
  dependentFeatureIds: string[],
  allFeatures: FeatureItem[],
  currency: Currency
): CascadeRemovalSavingsResult {
  const targetFeature = allFeatures.find((f) => f.id === targetFeatureId) ?? null;
  const dependentFeatures = allFeatures.filter((f) => dependentFeatureIds.includes(f.id));
  
  const allAffected = targetFeature ? [targetFeature, ...dependentFeatures] : dependentFeatures;
  const totalSavingsINR = allAffected.reduce((sum, f) => sum + (f.priceINR || 0), 0);
  const totalSavingsUSD = allAffected.reduce((sum, f) => sum + (f.priceUSD || 0), 0);

  return {
    targetFeature,
    dependentFeatures,
    totalSavingsINR,
    totalSavingsUSD,
    totalSavingsFormatted: formatPricePair(totalSavingsINR, totalSavingsUSD, currency),
  };
}
