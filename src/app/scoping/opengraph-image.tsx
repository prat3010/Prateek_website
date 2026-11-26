import { createBrandOgImage } from '@/lib/ogCard';

export const runtime = 'nodejs';
export const alt = 'Project Scoping Lab & Instant Quote Engine | Prateeq Sharma';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return createBrandOgImage({
    badge: 'SCOPING LAB // FIXED-SCOPE CPQ',
    title: 'Configure Architecture & Get an Instant Quote',
    subtitle:
      'Pick your web engine, AI modules, brand kit, and care plan for transparent INR/USD pricing and instant PDF proposal export.',
    pills: ['TRANSPARENT INR / USD', 'INSTANT PDF SOW', 'ZERO SALES CALLS', '100% IP TRANSFER'],
    pathLabel: 'prateeq.in/scoping',
  });
}
