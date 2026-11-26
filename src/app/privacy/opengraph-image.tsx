import { createBrandOgImage } from '@/lib/ogCard';

export const runtime = 'nodejs';
export const alt = 'Privacy & Telemetry Architecture | Prateeq Sharma';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return createBrandOgImage({
    badge: 'AUDITED SPEC // PRIVACY BY ARCHITECTURE',
    title: 'Privacy, Daily Salt Telemetry & PostgreSQL RLS',
    subtitle:
      'Zero ad trackers, SHA-256 daily rotating IP hashing, zero-knowledge Razorpay payments, and strict multi-tenant RLS isolation.',
    pills: ['GDPR / DPDP 2023', 'ZERO AD TRACKERS', 'PGVECTOR RLS', 'DAILY SALT'],
    pathLabel: 'prateeq.in/privacy',
  });
}
