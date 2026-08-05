import type {
  BaseEngineItem,
  BrandAssetOption,
  FeatureItem,
  GoalArchetype,
  MaintenancePlanOption,
} from '@/data/resume';

export type Currency = 'INR' | 'USD';

export const ESTIMATE_DISCLAIMER =
  'All listed prices are starting prices for the stated baseline scope. Final pricing may vary based on ' +
  'functionality, integrations, content volume, data migration, compliance requirements, delivery timeline, ' +
  'third-party dependencies, technical complexity, and project-specific risk. A final line-item quotation and ' +
  'Scoping Specification will be issued before development begins.';

export const CARE_OVERAGE_DEFAULT =
  'Overage beyond the included hours requires written approval and is billed separately. Unused hours do not roll over.';

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

/** Existing geo-IP `region` cookie value ('india' | 'global') → currency. */
export function resolveDefaultCurrency(region: string | null | undefined): Currency {
  return region === 'india' ? 'INR' : 'USD';
}

export interface QuoteSelection {
  engineId: string;
  featureIds: string[];
  brandAssetId: string;
  maintenancePlanId: string;
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
  /** Total build (engine + features + brand) in the selected currency. */
  total: number;
  totalINR: number;
  totalUSD: number;
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

  const totalINR = engineINR + featuresINR + brandINR;
  const totalUSD = engineUSD + featuresUSD + brandUSD;

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
    total: currency === 'INR' ? totalINR : totalUSD,
    totalINR,
    totalUSD,
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
