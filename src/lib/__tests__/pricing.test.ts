import { describe, expect, it } from 'vitest';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import {
  calcQuote,
  formatMoney,
  formatPricePair,
  packageTotalForArchetype,
  packageTotals,
  resolveDefaultCurrency,
  resolveFeatureDependencies,
} from '@/lib/pricing';
import type { BaseEngineItem, FeatureItem } from '@/data/resume';

const { engines, features, brandAssets, maintenancePlans, goals } = questionnaireDefaults;

describe('formatting helpers', () => {
  it('formatMoney renders INR with Indian grouping', () => {
    expect(formatMoney(320000, 'INR')).toBe('₹3,20,000');
  });

  it('formatMoney renders USD plain', () => {
    expect(formatMoney(4350, 'USD')).toBe('$4,350');
  });

  it('formatPricePair orders by selected currency', () => {
    expect(formatPricePair(30000, 400, 'INR')).toBe('₹30,000 / $400');
    expect(formatPricePair(30000, 400, 'USD')).toBe('$400 / ₹30,000');
  });

  it('resolveDefaultCurrency maps geo region to currency', () => {
    expect(resolveDefaultCurrency('india')).toBe('INR');
    expect(resolveDefaultCurrency('global')).toBe('USD');
    expect(resolveDefaultCurrency(null)).toBe('USD');
  });
});

describe('engine and feature prices', () => {
  it('landing engine is ₹30,000 / $400', () => {
    const landing = engines.find((e) => e.id === 'landing') as BaseEngineItem;
    expect(landing.priceINR).toBe(30000);
    expect(landing.priceUSD).toBe(400);
  });

  it('multipage engine is ₹55,000 / $750', () => {
    const multipage = engines.find((e) => e.id === 'multipage') as BaseEngineItem;
    expect(multipage.priceINR).toBe(55000);
    expect(multipage.priceUSD).toBe(750);
  });

  it('saas engine is ₹1,75,000 / $2,400', () => {
    const saas = engines.find((e) => e.id === 'saas') as BaseEngineItem;
    expect(saas.priceINR).toBe(175000);
    expect(saas.priceUSD).toBe(2400);
  });

  it('RAG add-on is ₹1,25,000 / $1,700', () => {
    const rag = features.find((f) => f.id === 'ai_rag') as FeatureItem;
    expect(rag.priceINR).toBe(125000);
    expect(rag.priceUSD).toBe(1700);
  });

  it('commerce add-on is ₹75,000 / $1,000 and depends on payments + auth', () => {
    const commerce = features.find((f) => f.id === 'commerce') as FeatureItem;
    expect(commerce.priceINR).toBe(75000);
    expect(commerce.priceUSD).toBe(1000);
    expect(commerce.dependsOn).toEqual(['payments', 'auth']);
  });
});

describe('resolveFeatureDependencies', () => {
  it('pulls transitive dependencies for a feature that needs others', () => {
    const deps = resolveFeatureDependencies(['commerce'], features);
    expect(deps).toEqual(['payments', 'auth']);
  });

  it('handles multi-level dependency chains', () => {
    const deps = resolveFeatureDependencies(['lms'], features);
    expect(deps).toContain('payments');
    expect(deps).toContain('auth');
  });

  it('returns nothing for a feature with no dependencies', () => {
    expect(resolveFeatureDependencies(['email'], features)).toEqual([]);
  });

  it('does not duplicate already-selected ids', () => {
    const deps = resolveFeatureDependencies(['commerce', 'payments'], features);
    expect(deps).toEqual(['auth']);
  });
});

describe('calcQuote', () => {
  const selection = {
    engineId: 'multipage',
    featureIds: ['email'],
    brandAssetId: 'copy',
    maintenancePlanId: 'standard',
  };

  it('totals engine + feature + brand in INR', () => {
    const quote = calcQuote(engines, features, brandAssets, maintenancePlans, selection, 'INR');
    expect(quote.enginePriceINR).toBe(55000);
    expect(quote.featuresPriceINR).toBe(15000);
    expect(quote.brandPriceINR).toBe(15000);
    expect(quote.totalINR).toBe(55000 + 15000 + 15000);
    expect(quote.total).toBe(quote.totalINR);
    expect(quote.currency).toBe('INR');
  });

  it('reports the same totals in USD', () => {
    const quote = calcQuote(engines, features, brandAssets, maintenancePlans, selection, 'USD');
    expect(quote.enginePriceUSD).toBe(750);
    expect(quote.featuresPriceUSD).toBe(200);
    expect(quote.brandPriceUSD).toBe(200);
    expect(quote.totalUSD).toBe(750 + 200 + 200);
    expect(quote.total).toBe(quote.totalUSD);
  });

  it('resolves maintenance plan and exposes maintenance price', () => {
    const quote = calcQuote(engines, features, brandAssets, maintenancePlans, selection, 'INR');
    expect(quote.maintenancePlan?.id).toBe('standard');
    expect(quote.maintenancePriceINR).toBe(10000);
    expect(quote.maintenancePriceUSD).toBe(140);
  });

  it('never includes brand in itemized totals when brand price is zero', () => {
    const noBrand = calcQuote(
      engines,
      features,
      brandAssets,
      maintenancePlans,
      { ...selection, brandAssetId: 'none' },
      'INR',
    );
    expect(noBrand.brandPriceINR).toBe(0);
    expect(noBrand.itemized.every((i) => i.priceINR > 0)).toBe(true);
  });
});

describe('goal archetype package totals', () => {
  const expected: Record<string, { inr: number; usd: number }> = {
    landing_page: { inr: 45000, usd: 600 },
    business_multipage: { inr: 70000, usd: 950 },
    ecommerce: { inr: 215000, usd: 2900 },
    booking_appointments: { inr: 165000, usd: 2250 },
    saas_app: { inr: 320000, usd: 4350 },
    lms_portal: { inr: 360000, usd: 4900 },
    crm_admin: { inr: 335000, usd: 4550 },
    ai_rag_app: { inr: 400000, usd: 5450 },
  };

  it.each(Object.entries(expected))(
    'package total for %s is ₹%i / $%i',
    (goalId, totals) => {
      const goal = goals.find((g) => g.id === goalId)!;
      expect(packageTotalForArchetype(goal, engines, features, 'INR')).toBe(totals.inr);
      expect(packageTotalForArchetype(goal, engines, features, 'USD')).toBe(totals.usd);
    },
  );

  it('packageTotals returns one entry per goal', () => {
    const totals = packageTotals(goals, engines, features, 'INR');
    expect(totals).toHaveLength(goals.length);
    expect(new Set(totals.map((t) => t.goalId)).size).toBe(goals.length);
  });

  it('custom reference archetype stays engine-only', () => {
    const custom = goals.find((g) => g.id === 'custom');
    if (!custom) return;
    expect(packageTotalForArchetype(custom, engines, features, 'INR')).toBe(
      engines.find((e) => e.id === custom.recommendedEngineId)?.priceINR ?? 0,
    );
  });
});
