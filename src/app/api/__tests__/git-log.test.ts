import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue(JSON.stringify([
      { hash: 'abc1234', author: 'Prateek', date: '2 hours ago', subject: 'feat: test' },
      { hash: 'def5678', author: 'Prateek', date: '1 day ago', subject: 'fix: bug' },
    ])),
  },
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join('/')),
  },
}));

import { GET } from '@/app/api/git-log/route';

function makeRequest(url: string) {
  return new Request(url) as unknown as Request & { url: string };
}

describe('GET /api/git-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns commit list by default', async () => {
    const req = makeRequest('http://localhost/api/git-log');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe('list');
    expect(body.commits).toHaveLength(2);
  });

  it('returns commit detail for valid hash', async () => {
    const req = makeRequest('http://localhost/api/git-log?commit=abc1234');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe('detail');
    expect(body.content).toContain('abc1234');
  });

  it('returns 400 for invalid commit hash format', async () => {
    const req = makeRequest('http://localhost/api/git-log?commit=../../etc/passwd');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for valid hex hash that does not exist', async () => {
    const req = makeRequest('http://localhost/api/git-log?commit=aaaaaaa');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});
