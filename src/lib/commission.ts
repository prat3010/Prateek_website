import commissionConfig from '@/data/commissionConfig.json';
import type { Currency } from '@/lib/pricing';

export interface CommissionBand {
  id: string;
  label: string;
  rate: number;
  minINR: number | null;
  maxINR: number | null;
  minUSD: number | null;
  maxUSD: number | null;
}

export interface CommissionResult {
  band: CommissionBand;
  /** Contract value in the authoritative currency. */
  amount: number;
  /** Total commission in the authoritative currency. */
  total: number;
  /** Per-payout share (50/50). */
  split: number;
}

export const COMMISSION_BANDS: CommissionBand[] = commissionConfig.bands;
export const RECURRING_COMMISSION_RATE: number = commissionConfig.recurringRate;
export const COMMISSION_DEPOSIT_SPLIT: number = commissionConfig.depositSplit;
export const COMMISSION_DISBURSEMENT_WINDOW: string = commissionConfig.disbursementWindow;
export const COMMISSION_EXAMPLE = commissionConfig.example;

/** Resolves the commission band for a contract value. Bands are non-overlapping. */
export function getCommissionBand(amount: number, currency: Currency): CommissionBand {
  for (const band of COMMISSION_BANDS) {
    const min = currency === 'INR' ? band.minINR : band.minUSD;
    const max = currency === 'INR' ? band.maxINR : band.maxUSD;
    const aboveMin = min == null ? true : amount >= min;
    const belowMax = max == null ? true : amount <= max;
    if (aboveMin && belowMax) return band;
  }
  return COMMISSION_BANDS[COMMISSION_BANDS.length - 1];
}

export function calculateCommission(amount: number, currency: Currency): CommissionResult {
  const band = getCommissionBand(amount, currency);
  const total = Math.round((amount * band.rate) / 100);
  const split = Math.round(total * COMMISSION_DEPOSIT_SPLIT);
  return { band, amount, total, split };
}
