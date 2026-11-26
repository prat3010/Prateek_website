import type { CommissionBand } from '@/lib/commission';

export function consoleBandRange(band: CommissionBand): string {
  if (band.minINR == null) return `up to ₹${band.maxINR?.toLocaleString('en-IN')} / $${band.maxUSD?.toLocaleString('en-US')}`;
  if (band.maxINR == null) return `₹${band.minINR.toLocaleString('en-IN')}+ / $${band.minUSD?.toLocaleString('en-US')}+`;
  return `₹${band.minINR.toLocaleString('en-IN')}-${band.maxINR.toLocaleString('en-IN')} / $${band.minUSD?.toLocaleString('en-US')}-${band.maxUSD?.toLocaleString('en-US')}`;
}

export function consoleCutFor(band: CommissionBand): string {
  return `${band.rate}%`;
}

