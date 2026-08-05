import { describe, expect, it } from 'vitest';
import {
  COMMISSION_BANDS,
  COMMISSION_DEPOSIT_SPLIT,
  COMMISSION_DISBURSEMENT_WINDOW,
  COMMISSION_EXAMPLE,
  RECURRING_COMMISSION_RATE,
  calculateCommission,
  getCommissionBand,
} from '@/lib/commission';

describe('commission config invariants', () => {
  it('exports bands A/B/C with rates 10/12/15', () => {
    expect(COMMISSION_BANDS.map((b) => [b.id, b.rate])).toEqual([
      ['A', 10],
      ['B', 12],
      ['C', 15],
    ]);
  });

  it('recurring rate, deposit split and window are config-derived', () => {
    expect(RECURRING_COMMISSION_RATE).toBe(10);
    expect(COMMISSION_DEPOSIT_SPLIT).toBe(0.5);
    expect(COMMISSION_DISBURSEMENT_WINDOW).toBe('48 business hours');
  });

  it('bands are non-overlapping and cover all positive values', () => {
    const [a, b, c] = COMMISSION_BANDS;
    expect(a.maxINR).toBe(75000);
    expect(b.minINR).toBe(75001);
    expect(b.maxINR).toBe(249999);
    expect(c.minINR).toBe(250000);
    expect(a.maxUSD).toBe(1000);
    expect(b.minUSD).toBe(1001);
    expect(b.maxUSD).toBe(3299);
    expect(c.minUSD).toBe(3300);
  });
});

describe('getCommissionBand boundary resolution (INR)', () => {
  it.each([
    [1, 'A'],
    [75000, 'A'],
    [75001, 'B'],
    [249999, 'B'],
    [250000, 'C'],
    [9999999, 'C'],
  ])('₹%i → Band %s', (amount, bandId) => {
    expect(getCommissionBand(amount, 'INR').id).toBe(bandId);
  });
});

describe('getCommissionBand boundary resolution (USD)', () => {
  it.each([
    [1, 'A'],
    [1000, 'A'],
    [1001, 'B'],
    [3299, 'B'],
    [3300, 'C'],
    [99999, 'C'],
  ])('$%i → Band %s', (amount, bandId) => {
    expect(getCommissionBand(amount, 'USD').id).toBe(bandId);
  });
});

describe('calculateCommission maths', () => {
  it('₹3,20,000 SaaS → Band C → 15% → ₹48,000 total, ₹24,000 split', () => {
    const result = calculateCommission(320000, 'INR');
    expect(result.band.id).toBe('C');
    expect(result.total).toBe(48000);
    expect(result.split).toBe(24000);
    expect(result.amount).toBe(320000);
  });

  it('₹75,000 → Band A → 10% → ₹7,500', () => {
    const result = calculateCommission(75000, 'INR');
    expect(result.total).toBe(7500);
    expect(result.split).toBe(3750);
  });

  it('₹75,001 → Band B → 12% → ₹9,000.12 → rounds to ₹9,000', () => {
    const result = calculateCommission(75001, 'INR');
    expect(result.total).toBe(9000);
  });

  it('$3,300 → Band C → 15% → $495', () => {
    const result = calculateCommission(3300, 'USD');
    expect(result.total).toBe(495);
    expect(result.split).toBe(248);
  });
});

describe('commission example', () => {
  it('matches the SaaS worked example used in the agreement PDF', () => {
    expect(COMMISSION_EXAMPLE.contractValueINR).toBe(320000);
    expect(COMMISSION_EXAMPLE.tier).toBe('C');
    expect(COMMISSION_EXAMPLE.totalCommission).toBe(48000);
    expect(COMMISSION_EXAMPLE.splitAmount).toBe(24000);
    expect(COMMISSION_EXAMPLE.rate).toBe(15);
  });
});
