import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatPricePair,
  resolveDefaultCurrency,
  calcQuote,
  resolveFeatureDependencies,
  ESTIMATE_DISCLAIMER,
} from '@/lib/pricing';
import type { BaseEngineItem, FeatureItem, BrandAssetOption, MaintenancePlanOption } from '@/data/resume';

describe('Scoping Lab & CPQ Calculation Integration Smoke Tests', () => {
  const sampleEngines: BaseEngineItem[] = [
    {
      id: 'landing',
      tier: 'Tier 1',
      title: 'High-Impact Landing Page',
      priceINR: 20000,
      priceUSD: 299,
      laymanDescription: 'Single-page landing experience',
      techSpecs: 'Next.js 16 + CSS Modules',
    },
    {
      id: 'saas',
      tier: 'Tier 3',
      title: 'Full-Stack SaaS MVP',
      priceINR: 85000,
      priceUSD: 1199,
      laymanDescription: 'Full-stack application with database and auth',
      techSpecs: 'Next.js 16 + Supabase + PostgreSQL',
    },
  ];

  const sampleFeatures: FeatureItem[] = [
    {
      id: 'auth_jwt',
      label: 'OAuth & Session Auth',
      priceINR: 10000,
      priceUSD: 150,
      laymanDescription: 'Universal session provider',
      techSpecs: 'PKCE OAuth + JWT Cookies',
    },
    {
      id: 'stripe_pay',
      label: 'Stripe / Razorpay Checkout',
      priceINR: 15000,
      priceUSD: 200,
      laymanDescription: 'Escrow payment bridge',
      techSpecs: 'Razorpay Orders API + Webhooks',
      dependsOn: ['auth_jwt'],
    },
    {
      id: 'analytics',
      label: 'GDPR Daily Hashed Analytics',
      priceINR: 8000,
      priceUSD: 100,
      laymanDescription: 'Zero-cookie proxy telemetry',
      techSpecs: 'Proxy middleware + SHA-256 IP hash',
    },
  ];

  const sampleBrandAssets: BrandAssetOption[] = [
    { id: 'none', label: 'I will provide all brand assets', priceINR: 0, priceUSD: 0, description: 'Client provided' },
    { id: 'complete', label: 'Full Custom Design System', priceINR: 25000, priceUSD: 350, description: 'Typography, palette, tokens' },
  ];

  const sampleCarePlans: MaintenancePlanOption[] = [
    {
      id: 'none',
      name: 'No ongoing retainer',
      priceINR: 0,
      priceUSD: 0,
      period: '/mo',
      badge: 'Standalone',
      laymanDescription: 'One-off delivery with 30-day warranty',
      techSpecs: 'Self-hosted handoff',
      includes: ['Full source code', 'Deployment guide'],
    },
    {
      id: 'growth',
      name: 'Priority SLA & Cloud Ops',
      priceINR: 15000,
      priceUSD: 200,
      period: '/mo',
      badge: 'Recommended',
      laymanDescription: 'Ongoing maintenance, security updates, and priority SLA',
      techSpecs: '24/7 telemetry monitoring & monthly dependency upgrades',
      includes: ['Uptime monitoring', 'Security patches', 'Priority support'],
    },
  ];

  describe('Currency & Price Formatting Invariants', () => {
    it('resolves default currency based on geo-IP region cookie', () => {
      expect(resolveDefaultCurrency('global')).toBe('USD');
      expect(resolveDefaultCurrency('india')).toBe('INR');
      expect(resolveDefaultCurrency('IN')).toBe('INR');
      expect(resolveDefaultCurrency(null)).toBe('INR');
    });

    it('formats single currency amounts correctly', () => {
      expect(formatMoney(20000, 'INR')).toBe('₹20,000');
      expect(formatMoney(299, 'USD')).toBe('$299');
    });

    it('formats dual-currency pairs with selected currency first', () => {
      expect(formatPricePair(20000, 299, 'INR')).toBe('₹20,000 / $299');
      expect(formatPricePair(20000, 299, 'USD')).toBe('$299 / ₹20,000');
    });
  });

  describe('Transitive Feature Dependency Resolution', () => {
    it('returns missing parent dependencies when a dependent feature is selected', () => {
      const selected = ['stripe_pay'];
      const extra = resolveFeatureDependencies(selected, sampleFeatures);
      expect(extra).toContain('auth_jwt');
    });

    it('returns empty array for independent features with no unselected dependencies', () => {
      const selected = ['analytics'];
      const extra = resolveFeatureDependencies(selected, sampleFeatures);
      expect(extra).toEqual([]);
    });
  });

  describe('Quote Calculation Precision', () => {
    it('calculates total quote matching INR and USD line items exactly', () => {
      const selection = {
        engineId: 'saas',
        featureIds: ['stripe_pay', 'auth_jwt'],
        brandAssetId: 'complete',
        maintenancePlanId: 'growth',
      };

      const quote = calcQuote(
        sampleEngines,
        sampleFeatures,
        sampleBrandAssets,
        sampleCarePlans,
        selection,
        'INR'
      );

      // Base: 85,000 + (15,000 + 10,000) + Brand: 25,000 = 135,000 INR
      // USD: 1,199 + (200 + 150) + 350 = 1,899 USD
      expect(quote.totalINR).toBe(135000);
      expect(quote.totalUSD).toBe(1899);
      expect(quote.total).toBe(135000);
      expect(quote.maintenancePriceINR).toBe(15000);
      expect(quote.maintenancePriceUSD).toBe(200);

      // Verify itemized breakdown labels
      const itemLabels = quote.itemized.map((i) => i.label);
      expect(itemLabels).toContain('Tier 3: Full-Stack SaaS MVP');
      expect(itemLabels).toContain('Stripe / Razorpay Checkout');
      expect(itemLabels).toContain('OAuth & Session Auth');
      expect(itemLabels).toContain('Full Custom Design System');
    });

    it('contains non-negotiable estimate disclaimer in quote output', () => {
      expect(ESTIMATE_DISCLAIMER).toContain('starting prices');
      expect(ESTIMATE_DISCLAIMER).toContain('Scoping Specification');
    });
  });
});
