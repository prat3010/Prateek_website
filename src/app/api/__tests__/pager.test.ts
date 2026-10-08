import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/data/supabase', () => ({
  supabase: null,
}));

import { GET } from '../pager/route';

describe('GET /api/pager', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid JSON with active status and messages array', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('active');
    expect(Array.isArray(data.messages)).toBe(true);
    expect(data.messages.length).toBeGreaterThan(0);
  });
});
