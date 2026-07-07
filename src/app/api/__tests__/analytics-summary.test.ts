import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGte = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return mockSupabaseClient;
  },
}));

let mockSupabaseClient: unknown = null;

import { GET } from '@/app/api/analytics-summary/route';

beforeEach(() => {
  mockSupabaseClient = {
    from: vi.fn(() => ({
      select: mockSelect.mockReturnThis(),
      gte: mockGte.mockReturnThis(),
      order: mockOrder.mockReturnThis(),
      limit: mockLimit.mockResolvedValue({ data: [], error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'Function not found' } }),
  };
  vi.clearAllMocks();
});

describe('GET /api/analytics-summary', () => {
  it('returns success response', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('includes cache-control header', async () => {
    const res = await GET();
    expect(res.headers.get('Cache-Control')).toContain('public');
  });

  it('calls RPC first', async () => {
    await GET();
    expect((mockSupabaseClient as { rpc: ReturnType<typeof vi.fn> }).rpc).toHaveBeenCalled();
  });

  it('returns zeroed data when no visits exist', async () => {
    (mockSupabaseClient as { rpc: ReturnType<typeof vi.fn> }).rpc.mockResolvedValue({
      data: { total_views: 0, unique_visitors: 0 },
      error: null,
    });
    const res = await GET();
    const body = await res.json();
    expect(body.totalViews).toBe(0);
  });
});
