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

export interface TimelineEstimateDriver {
  featureName: string;
  category: string;
  addedHoursEstimate: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TimelineEstimateResult {
  hoursP50: number;
  hoursP90: number;
  calendarDaysMin: number;
  calendarDaysMax: number;
  complexityIndex: number;
  recommendedSprintWeeks: string;
  confidenceScore: number;
  topEffortDrivers: TimelineEstimateDriver[];
  riskFactors: string[];
  isFallback?: boolean;
}

/**
 * Deterministic baseline timeline & sprint effort estimator.
 * Matches the Scikit-Learn Gradient Boosting Quantile Regressor in Retriever (Milestone 84),
 * ensuring resilient zero-downtime offline fallback for Scoping Lab and Client Workspace.
 */
export function estimateScopeTimeline(
  selection: QuoteSelection,
  allFeatures: FeatureItem[],
  baseEngines?: BaseEngineItem[]
): TimelineEstimateResult {
  const engineId = selection.engineId?.toLowerCase() || 'saas';
  const selectedFeatureIds = new Set((selection.featureIds || []).map((id) => id.toLowerCase()));
  const selectedFeatures = allFeatures.filter((f) => selectedFeatureIds.has(f.id.toLowerCase()));

  // Base engine baseline hours
  let baseHours = 24;
  let engineComplexityScore = 2.0;
  if (engineId.includes('landing')) {
    baseHours = 12;
    engineComplexityScore = 1.0;
  } else if (engineId.includes('standalone') || engineId.includes('embed')) {
    baseHours = 20;
    engineComplexityScore = 2.5;
  } else if (engineId.includes('saas')) {
    baseHours = 42;
    engineComplexityScore = 4.0;
  }

  // Feature category tallies & hour contributions
  let authHours = 0;
  let dbHours = 0;
  let aiHours = 0;
  let voiceHours = 0;
  let paymentHours = 0;
  let adminHours = 0;

  const drivers: TimelineEstimateDriver[] = [];
  const riskFactors: string[] = [];

  for (const f of selectedFeatures) {
    const fid = f.id.toLowerCase();
    const name = f.name || f.id;

    if (fid.includes('voice') || fid.includes('webrtc') || fid.includes('call')) {
      voiceHours += 22;
      drivers.push({ featureName: name, category: 'Real-Time / Voice AI', addedHoursEstimate: 22, riskLevel: 'high' });
    } else if (fid.includes('vector') || fid.includes('rag') || fid.includes('agent') || fid.includes('vision') || fid.includes('ocr') || fid.includes('ai')) {
      aiHours += 16;
      drivers.push({ featureName: name, category: 'AI / RAG / Vector', addedHoursEstimate: 16, riskLevel: 'high' });
    } else if (fid.includes('auth') || fid.includes('rbac') || fid.includes('portal') || fid.includes('login')) {
      authHours += 8;
      drivers.push({ featureName: name, category: 'Auth & Security', addedHoursEstimate: 8, riskLevel: 'medium' });
    } else if (fid.includes('database') || fid.includes('postgres') || fid.includes('storage') || fid.includes('cache')) {
      dbHours += 6.5;
      drivers.push({ featureName: name, category: 'Database & Storage', addedHoursEstimate: 6.5, riskLevel: 'medium' });
    } else if (fid.includes('pay') || fid.includes('razorpay') || fid.includes('stripe') || fid.includes('billing') || fid.includes('invoice')) {
      paymentHours += 10;
      drivers.push({ featureName: name, category: 'Payment & Commerce', addedHoursEstimate: 10, riskLevel: 'medium' });
    } else if (fid.includes('admin') || fid.includes('crm') || fid.includes('cms') || fid.includes('blog') || fid.includes('dashboard')) {
      adminHours += 7.5;
      drivers.push({ featureName: name, category: 'Admin & Operations', addedHoursEstimate: 7.5, riskLevel: 'low' });
    } else {
      drivers.push({ featureName: name, category: 'Functional Module', addedHoursEstimate: 5, riskLevel: 'low' });
    }
  }

  // Dependency coupling
  let depth = 1;
  if (authHours > 0) depth += 1;
  if (dbHours > 0 || paymentHours > 0 || adminHours > 0) depth += 1;
  if (aiHours > 0 || voiceHours > 0) depth += 1;

  // Brand complexity
  let brandMultiplier = 1.0;
  if (selection.brandAssetId) {
    const bid = selection.brandAssetId.toLowerCase();
    if (bid.includes('complete') || bid.includes('enterprise')) brandMultiplier = 1.20;
    else if (bid.includes('essential') || bid.includes('motion')) brandMultiplier = 1.10;
  }

  const moduleHours = authHours + dbHours + aiHours + voiceHours + paymentHours + adminHours;
  const depthMultiplier = 1.0 + (depth - 1) * 0.10;
  const rawP50 = (baseHours + moduleHours) * depthMultiplier * brandMultiplier;
  const hoursP50 = Math.round(Math.max(10, rawP50) * 10) / 10;
  const hoursP90 = Math.round(Math.max(hoursP50 * 1.25, rawP50 * 1.30) * 10) / 10;

  // Complexity index (1.0 to 5.0)
  const totalFeatures = selectedFeatures.length;
  let compScore = 1.0 + (engineComplexityScore * 0.4) + (totalFeatures * 0.15) + (depth * 0.20) + ((aiHours > 0 ? 0.35 : 0)) + ((voiceHours > 0 ? 0.50 : 0));
  compScore = Math.min(5.0, Math.max(1.0, Math.round(compScore * 10) / 10));

  // Calendar days
  const calendarDaysMin = Math.max(3, Math.ceil(hoursP50 / 5.5));
  const calendarDaysMax = Math.max(calendarDaysMin + 2, Math.ceil(hoursP90 / 4.0));

  // Sprint label
  let recommendedSprintWeeks = '1 Week Sprint';
  if (calendarDaysMax <= 7) {
    recommendedSprintWeeks = '1 Week Sprint';
  } else if (calendarDaysMax <= 14) {
    recommendedSprintWeeks = '1 to 2 Weeks Sprint';
  } else if (calendarDaysMax <= 21) {
    recommendedSprintWeeks = '2 to 3 Weeks Sprint';
  } else {
    recommendedSprintWeeks = '3 to 4 Weeks Sprint';
  }

  // Risk warnings
  if (voiceHours > 0) {
    riskFactors.push('Real-Time WebRTC / Voice AI integration introduces audio stream latency variance (+18-24h)');
  }
  if (aiHours >= 30) {
    riskFactors.push('Multi-model AI & Vector RAG pipelines require rigorous evaluation testbeds (+14-20h)');
  }
  if (depth >= 4) {
    riskFactors.push('Deep architectural DAG coupling requires staged milestone integration gates');
  }

  drivers.sort((a, b) => b.addedHoursEstimate - a.addedHoursEstimate);

  return {
    hoursP50,
    hoursP90,
    calendarDaysMin,
    calendarDaysMax,
    complexityIndex: compScore,
    recommendedSprintWeeks,
    confidenceScore: 0.92,
    topEffortDrivers: drivers.slice(0, 5),
    riskFactors,
    isFallback: true,
  };
}
