import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/data/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => {
        const query = {
          eq: () => query,
          maybeSingle: () => Promise.resolve({ data: { tenant_id: 'tenant-123', plan_tier: 'growth' } }),
        };
        return query;
      },
    }),
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async (req: Request) => {
    const auth = req.headers.get('Authorization');
    if (!auth) return null;
    return 'user@example.com';
  }),
}));

import { GET as GETTelemetry } from '@/app/api/rag/telemetry/route';

describe('GET /api/rag/telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated telemetry requests with 401', async () => {
    const req = new Request('http://localhost/api/rag/telemetry');
    const res = await GETTelemetry(req);
    expect(res.status).toBe(401);
  });

  it('returns valid quota, usage, and semantic cache metrics for authenticated caller', async () => {
    const req = new Request('http://localhost/api/rag/telemetry?tenantId=tenant-123', {
      headers: { Authorization: 'Bearer mock_token' },
    });
    const res = await GETTelemetry(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.planTier).toBe('growth');
    expect(data.quotas.maxMonthlyTokens).toBe(1_500_000);
    expect(data.usage.tokenUsagePercentage).toBeGreaterThanOrEqual(0);
    expect(data.semanticCache.costSavedUSD).toBeGreaterThan(0);
    expect(data.feedback.satisfactionRate).toBeGreaterThanOrEqual(0);
  });
});
