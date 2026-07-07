import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

function createResolvableChain(result: unknown) {
  const chain: Record<string, unknown> = {};

  const selectMock = vi.fn().mockReturnValue(chain);
  const insertMock = vi.fn().mockReturnValue(chain);
  const singleMock = vi.fn().mockResolvedValue(result);

  chain.select = selectMock;
  chain.insert = insertMock;
  chain.update = vi.fn().mockReturnValue(chain);
  chain.upsert = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.single = singleMock;
  chain.order = vi.fn().mockReturnValue({
    ...chain,
    select: selectMock,
    insert: insertMock,
    update: chain.update,
    upsert: chain.upsert,
    delete: chain.delete,
    eq: chain.eq,
    gte: chain.gte,
    limit: chain.limit,
    single: singleMock,
    then: (resolve: (value: unknown) => void) => resolve(result),
  });
  return chain;
}

const mockChain = createResolvableChain({ data: [{ id: 1, title: 'AWS' }], error: null }) as Record<string, ReturnType<typeof vi.fn>>;

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return { from: vi.fn(() => mockChain) };
  },
}));

import { GET, POST } from '@/app/api/certificates/route';

const TEST_KEY = 'test-sync-key';

beforeEach(() => {
  process.env.SYNC_API_KEY = TEST_KEY;
  vi.clearAllMocks();
  mockChain.select.mockReturnValue(mockChain);
  mockChain.insert.mockReturnValue(mockChain);
  mockChain.single.mockResolvedValue({ data: { id: 1, title: 'AWS' }, error: null });
});

function makePostRequest(body: unknown, apiKey?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['x-api-key'] = apiKey;
  return new Request('http://localhost/api/certificates', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('GET /api/certificates', () => {
  it('returns certificates data on success', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe('POST /api/certificates', () => {
  it('returns 401 without API key', async () => {
    const res = await POST(makePostRequest({ title: 'AWS' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong API key', async () => {
    const res = await POST(makePostRequest({ title: 'AWS' }, 'wrong-key'));
    expect(res.status).toBe(401);
  });

  it('returns 201 on success', async () => {
    const res = await POST(makePostRequest({ title: 'AWS' }, TEST_KEY));
    expect(res.status).toBe(201);
  });
});
