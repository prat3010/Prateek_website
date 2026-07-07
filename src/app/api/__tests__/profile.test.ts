import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

function createMockChain(result: unknown) {
  const chain: Record<string, unknown> = {};
  const resolve = () => Promise.resolve(result);

  const selectMock = vi.fn().mockReturnValue(chain);
  const insertMock = vi.fn().mockReturnValue(chain);
  const updateMock = vi.fn().mockReturnValue(chain);
  const upsertMock = vi.fn().mockReturnValue(chain);
  const deleteMock = vi.fn().mockReturnValue(chain);
  const eqMock = vi.fn().mockReturnValue(chain);
  const orderMock = vi.fn().mockReturnValue(chain);
  const singleMock = vi.fn().mockImplementation(() => resolve());
  const gteMock = vi.fn().mockReturnValue(chain);
  const limitMock = vi.fn().mockImplementation(() => resolve());

  chain.select = selectMock;
  chain.insert = insertMock;
  chain.update = updateMock;
  chain.upsert = upsertMock;
  chain.delete = deleteMock;
  chain.eq = eqMock;
  chain.order = orderMock;
  chain.single = singleMock;
  chain.gte = gteMock;
  chain.limit = limitMock;
  chain.then = resolve;

  return chain;
}

const mockChain = createMockChain({ data: { data: { name: 'Prateek' } }, error: null }) as Record<string, ReturnType<typeof vi.fn>> & { then: () => Promise<unknown> };

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: vi.fn(() => mockChain),
    };
  },
}));

import { GET, PUT } from '@/app/api/profile/route';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SYNC_API_KEY', 'test-key');
  mockChain.select.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
  mockChain.upsert.mockReturnValue(mockChain);
  mockChain.eq.mockImplementation(() => mockChain);
  mockChain.single.mockImplementation(() => Promise.resolve({ data: { data: { name: 'Prateek' } }, error: null }));
});

describe('GET /api/profile', () => {
  it('returns profile data on success', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ name: 'Prateek' });
  });
});

describe('PUT /api/profile', () => {
  it('returns 401 without API key', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong API key', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'wrong' },
      body: JSON.stringify({ name: 'Test' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it('returns 200 on success', async () => {
    const req = new Request('http://localhost/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'test-key' },
      body: JSON.stringify({ name: 'Test' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
  });
});
