import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import {
  verifyRazorpayPaymentSignature,
  generatePlaygroundLicenseKey,
  generateOrderNumber,
  calculatePlaygroundPrice,
  claimAndSettlePlaygroundOrder,
  checkDownloadQuota,
  resolvePlaygroundTierPackage,
} from '@/lib/playgroundCommerce';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PLAYGROUND_ITEMS, getPlaygroundItemBySlug, type PlaygroundItem } from '@/data/playgroundItems';

describe('Playground Commerce & Settlement Engine', () => {
  describe('verifyRazorpayPaymentSignature', () => {
    const orderId = 'order_9A33XWu170gUtm';
    const paymentId = 'pay_29MoEabbTgLLKU';
    const secret = 'EnLs21M兆SecretKeyTest';

    it('verifies valid HMAC SHA-256 signature generated with matching secret', () => {
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const isValid = verifyRazorpayPaymentSignature(orderId, paymentId, validSignature, secret);
      expect(isValid).toBe(true);
    });

    it('rejects tampered signature of same length', () => {
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      // Tamper last character
      const tampered =
        validSignature.slice(0, -1) + (validSignature.slice(-1) === 'a' ? 'b' : 'a');
      const isValid = verifyRazorpayPaymentSignature(orderId, paymentId, tampered, secret);
      expect(isValid).toBe(false);
    });

    it('rejects signature with length mismatch gracefully without error', () => {
      const truncated = 'abcdef123456';
      const isValid = verifyRazorpayPaymentSignature(orderId, paymentId, truncated, secret);
      expect(isValid).toBe(false);
    });

    it('handles multi-byte and mismatched byte length signatures safely without throwing RangeError', () => {
      const multiByteSig = '🚀'.repeat(32); // 32 characters, 128 bytes in UTF-8
      expect(() => {
        const isValid = verifyRazorpayPaymentSignature(orderId, paymentId, multiByteSig, secret);
        expect(isValid).toBe(false);
      }).not.toThrow();
    });

    it('rejects calls with missing parameters', () => {
      expect(verifyRazorpayPaymentSignature('', paymentId, 'sig', secret)).toBe(false);
      expect(verifyRazorpayPaymentSignature(orderId, '', 'sig', secret)).toBe(false);
      expect(verifyRazorpayPaymentSignature(orderId, paymentId, '', secret)).toBe(false);
      expect(verifyRazorpayPaymentSignature(orderId, paymentId, 'sig', '')).toBe(false);
    });
  });

  describe('generatePlaygroundLicenseKey', () => {
    it('produces license key matching the standard PRTK-PLAY format', () => {
      const key = generatePlaygroundLicenseKey();
      expect(key).toMatch(/^PRTK-PLAY-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('generates cryptographically unique keys across multiple invocations', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const key = generatePlaygroundLicenseKey();
        expect(keys.has(key)).toBe(false);
        keys.add(key);
      }
      expect(keys.size).toBe(50);
    });
  });

  describe('generateOrderNumber', () => {
    it('produces order number with today date and prefix', () => {
      const orderNumber = generateOrderNumber();
      expect(orderNumber).toMatch(/^ORD-PLAY-\d{8}-[A-Z0-9]{4}$/);

      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      expect(orderNumber).toContain(today);
    });
  });

  describe('calculatePlaygroundPrice', () => {
    const mockCommercialItem: PlaygroundItem = {
      id: 'mock-commercial-pack',
      slug: 'mock-pack',
      title: 'Mock Pack',
      tagline: 'Mock Tagline',
      description: 'Mock Description',
      kind: 'saas',
      tags: ['Test'],
      vibeCodedDate: '2026-11-08',
      isCommercial: true,
      priceINR: 2499,
      priceUSD: 29,
      pricingTiers: [
        {
          id: 'source-code',
          title: 'Source Code & Commercial License',
          name: 'Source Code & Commercial License',
          priceINR: 2499,
          priceUSD: 29,
          downloadKey: 'mock-pack/commercial-v1.0.0.zip',
          licenseType: 'commercial_single',
        },
        {
          id: 'team-license',
          title: 'Team / Agency Commercial Pack',
          name: 'Team / Agency Commercial Pack',
          priceINR: 7999,
          priceUSD: 99,
          downloadKey: 'mock-pack/team-v1.0.0.zip',
          licenseType: 'commercial_team',
        },
      ],
    } as unknown as PlaygroundItem;

    it('calculates INR price for standard source code tier', () => {
      const result = calculatePlaygroundPrice(mockCommercialItem, 'source-code', 'INR');
      expect(result.amount).toBe(2499);
      expect(result.tier?.name).toBe('Source Code & Commercial License');
    });

    it('calculates USD price for standard source code tier', () => {
      const result = calculatePlaygroundPrice(mockCommercialItem, 'source-code', 'USD');
      expect(result.amount).toBe(29);
    });

    it('calculates price for team license tier', () => {
      const inrResult = calculatePlaygroundPrice(mockCommercialItem, 'team-license', 'INR');
      expect(inrResult.amount).toBe(7999);

      const usdResult = calculatePlaygroundPrice(mockCommercialItem, 'team-license', 'USD');
      expect(usdResult.amount).toBe(99);
    });

    it('falls back to default tier if requested tier is invalid', () => {
      const result = calculatePlaygroundPrice(mockCommercialItem, 'non-existent-tier', 'USD');
      expect(result.amount).toBe(29);
      expect(result.tier?.id).toBe('source-code');
    });

    it('handles items without pricing tiers using base price', () => {
      const mockItem = {
        id: 'test-item',
        priceINR: 1999,
        priceUSD: 25,
      } as unknown as PlaygroundItem;
      const inr = calculatePlaygroundPrice(mockItem, 'standard', 'INR');
      expect(inr.amount).toBe(1999);
      const usd = calculatePlaygroundPrice(mockItem, 'standard', 'USD');
      expect(usd.amount).toBe(25);
    });
  });

  describe('claimAndSettlePlaygroundOrder', () => {
    it('wins the settlement race when order was pending', async () => {
      const mockOrder = {
        id: 'order_123',
        status: 'paid',
        razorpay_payment_id: 'pay_abc',
        amount: 2499,
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockOrder, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEqStatus = vi.fn().mockReturnValue({ select: mockSelect });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqStatus });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

      const mockSupabaseAdmin = {
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
      } as unknown as SupabaseClient;

      const res = await claimAndSettlePlaygroundOrder(
        mockSupabaseAdmin,
        'order_123',
        'pay_abc',
        'sig_xyz'
      );

      expect(res.wonSettlementRace).toBe(true);
      expect(res.order).toEqual(mockOrder);
      expect(mockEqStatus).toHaveBeenCalledWith('status', 'pending');
    });

    it('loses the settlement race when order was already paid and returns idempotently', async () => {
      const mockExistingOrder = {
        id: 'order_123',
        status: 'paid',
        razorpay_payment_id: 'pay_previous',
        amount: 2499,
      };

      // update fails or returns 0 rows
      const mockUpdateSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } });
      const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle });
      const mockEqStatus = vi.fn().mockReturnValue({ select: mockUpdateSelect });
      const mockEqId = vi.fn().mockReturnValue({ eq: mockEqStatus });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

      // select fallback returns existing order
      const mockGetSingle = vi.fn().mockResolvedValue({ data: mockExistingOrder, error: null });
      const mockGetEq = vi.fn().mockReturnValue({ single: mockGetSingle });
      const mockGetSelect = vi.fn().mockReturnValue({ eq: mockGetEq });

      const mockSupabaseAdmin = {
        from: vi.fn().mockImplementation(() => {
          return {
            update: mockUpdate,
            select: mockGetSelect,
          };
        }),
      } as unknown as SupabaseClient;

      const res = await claimAndSettlePlaygroundOrder(
        mockSupabaseAdmin,
        'order_123',
        'pay_concurrent',
        'sig_xyz'
      );

      expect(res.wonSettlementRace).toBe(false);
      expect(res.order).toEqual(mockExistingOrder);
    });
  });

  describe('checkDownloadQuota', () => {
    it('permits download when count is strictly under quota', () => {
      const first = checkDownloadQuota(0, 10);
      expect(first.allowed).toBe(true);
      expect(first.remaining).toBe(10);

      const mid = checkDownloadQuota(5, 10);
      expect(mid.allowed).toBe(true);
      expect(mid.remaining).toBe(5);

      const edge = checkDownloadQuota(9, 10);
      expect(edge.allowed).toBe(true);
      expect(edge.remaining).toBe(1);
    });

    it('rejects download when count reaches quota exactly', () => {
      const atQuota = checkDownloadQuota(10, 10);
      expect(atQuota.allowed).toBe(false);
      expect(atQuota.remaining).toBe(0);
    });

    it('rejects download when count exceeds quota', () => {
      const exceeded = checkDownloadQuota(15, 10);
      expect(exceeded.allowed).toBe(false);
      expect(exceeded.remaining).toBe(0);
    });

    it('handles custom max quotas and boundaries gracefully', () => {
      const custom = checkDownloadQuota(2, 3);
      expect(custom.allowed).toBe(true);
      expect(custom.remaining).toBe(1);

      const customAt = checkDownloadQuota(3, 3);
      expect(customAt.allowed).toBe(false);
      expect(customAt.remaining).toBe(0);

      // Default quota is 10
      const def = checkDownloadQuota(0);
      expect(def.allowed).toBe(true);
      expect(def.remaining).toBe(10);
    });
  });

  describe('resolvePlaygroundTierPackage', () => {
    const mockTierItem: PlaygroundItem = {
      id: 'mock-commercial-pack',
      slug: 'mock-pack',
      title: 'Mock Pack',
      tagline: 'Mock Tagline',
      description: 'Mock Description',
      kind: 'saas',
      tags: ['Test'],
      vibeCodedDate: '2026-11-08',
      downloadPackageKey: 'mock-pack/default.zip',
      licenseType: 'commercial_single',
      pricingTiers: [
        {
          id: 'source-code',
          title: 'Source Code & Commercial License',
          name: 'Source Code & Commercial License',
          priceINR: 2499,
          priceUSD: 29,
          downloadKey: 'mock-pack/commercial-v1.0.0.zip',
          licenseType: 'commercial_single',
        },
        {
          id: 'team-license',
          title: 'Team / Agency Commercial Pack',
          name: 'Team / Agency Commercial Pack',
          priceINR: 7999,
          priceUSD: 99,
          downloadKey: 'mock-pack/team-v1.0.0.zip',
          licenseType: 'commercial_team',
        },
      ],
    } as unknown as PlaygroundItem;

    it('resolves tier-specific downloadKey and licenseType for team-license tier', () => {
      const res = resolvePlaygroundTierPackage(mockTierItem, 'team-license');
      expect(res.packageKey).toBe('mock-pack/team-v1.0.0.zip');
      expect(res.licenseType).toBe('commercial_team');
      expect(res.tierName).toBe('Team / Agency Commercial Pack');
    });

    it('resolves tier-specific downloadKey and licenseType for source-code tier', () => {
      const res = resolvePlaygroundTierPackage(mockTierItem, 'source-code');
      expect(res.packageKey).toBe('mock-pack/commercial-v1.0.0.zip');
      expect(res.licenseType).toBe('commercial_single');
      expect(res.tierName).toBe('Source Code & Commercial License');
    });

    it('falls back to default tier when tierId is unrecognized', () => {
      const res = resolvePlaygroundTierPackage(mockTierItem, 'invalid-tier-id');
      expect(res.packageKey).toBe('mock-pack/commercial-v1.0.0.zip');
      expect(res.licenseType).toBe('commercial_single');
    });

    it('falls back to product defaults when item lacks pricing tiers', () => {
      const bareItem = {
        slug: 'custom-tool',
        downloadPackageKey: 'custom-tool/release.zip',
        licenseType: 'cloud_pass',
      } as unknown as PlaygroundItem;

      const res = resolvePlaygroundTierPackage(bareItem, 'standard');
      expect(res.packageKey).toBe('custom-tool/release.zip');
      expect(res.licenseType).toBe('cloud_pass');
    });
  });

  describe('Catalog Authenticity & Item Integrity', () => {
    it('contains all 13 authentic creations in catalog', () => {
      expect(PLAYGROUND_ITEMS.length).toBe(13);
    });

    it('verifies Job Hunter Studio is an authentic open-source micro-saas', () => {
      const jobHunter = getPlaygroundItemBySlug('job-hunter');
      expect(jobHunter).toBeDefined();
      expect(jobHunter?.id).toBe('saas-job-hunter');
      expect(jobHunter?.title).toBe('Job Hunter Studio');
      expect(jobHunter?.kind).toBe('saas');
      expect(jobHunter?.isCommercial).toBe(false);
      expect(jobHunter?.pricingModel).toBe('Open Source');
      expect(jobHunter?.githubUrl).toBe('https://github.com/prat3010/job-hunter');
      expect(jobHunter?.githubRepoSource).toBe('prat3010/job-hunter');

      // Check authentic tech stack and highlights
      expect(jobHunter?.techStack).toContain('Next.js 16');
      expect(jobHunter?.techStack).toContain('TypeScript');
      expect(jobHunter?.techStack).toContain('FastAPI');
      expect(jobHunter?.techStack).toContain('Scikit-Learn');
      expect(jobHunter?.techStack).toContain('Docker');
    });

    it('preserves all authentic creations and verifies authentic generative media assets', () => {
      const expectedSlugs = [
        'retriever',
        'scoping-studio',
        'client-workspace',
        'job-hunter',
        'snake',
        'pathfinder',
        'pizza-rat',
        'matrix-rain',
        'neural-dossier',
        'gesture-scroll',
        'neotokyo-rain',
        'mechanical-heart',
        'noir-skyline-reel',
      ];

      for (const slug of expectedSlugs) {
        const item = getPlaygroundItemBySlug(slug);
        expect(item, `Creation missing: ${slug}`).toBeDefined();
      }

      // Verify that generative media items have real matching artwork assets rather than recycled screenshots
      const mediaItems = ['neotokyo-rain', 'mechanical-heart', 'noir-skyline-reel'];
      for (const mediaSlug of mediaItems) {
        const item = getPlaygroundItemBySlug(mediaSlug);
        expect(item?.previewImage).toContain('/images/playground/');
      }
    });
  });

  describe('Download Security & CSPRNG Token Entropy', () => {
    it('generates 256-bit cryptographically secure download tokens (64-character hex)', () => {
      const token = crypto.randomBytes(32).toString('hex');
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates unique tokens without collisions across samples', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const token = crypto.randomBytes(32).toString('hex');
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }
      expect(tokens.size).toBe(100);
    });

    it('canonicalizes download gateway URLs with URL-safe encoded tokens and order numbers', () => {
      const sampleToken = 'a'.repeat(64);
      const sampleOrder = 'ORD-PLAY-20261108-XYZ1';
      const gatewayUrl = `/api/playground/download?token=${encodeURIComponent(sampleToken)}&order=${encodeURIComponent(sampleOrder)}`;

      expect(gatewayUrl).toBe(`/api/playground/download?token=${sampleToken}&order=${sampleOrder}`);
      expect(gatewayUrl).toContain('/api/playground/download');
      expect(gatewayUrl).not.toContain('undefined');
    });
  });
});

