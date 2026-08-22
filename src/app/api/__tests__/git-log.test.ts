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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));
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

  it('fetches live commits from GitHub API when available', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/commits/abc1234')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sha: 'abc1234567890',
            commit: {
              author: { name: 'Prateeq', email: 'test@example.com', date: '2026-08-22T06:00:00Z' },
              message: 'feat: live github commit',
            },
            stats: { total: 5, additions: 4, deletions: 1 },
            files: [{ filename: 'src/app/page.tsx', additions: 4, deletions: 1 }],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            sha: 'abc1234567890',
            commit: {
              author: { name: 'Prateeq', date: '2026-08-22T06:00:00Z' },
              message: 'feat: live github commit',
            },
          },
        ],
      });
    });

    vi.stubGlobal('fetch', mockFetch);

    const listReq = makeRequest('http://localhost/api/git-log?repo=prat3010/Prateek_website');
    const listRes = await GET(listReq);
    const listBody = await listRes.json();
    expect(listRes.status).toBe(200);
    expect(listBody.commits[0].subject).toBe('feat: live github commit');

    const detailReq = makeRequest('http://localhost/api/git-log?commit=abc1234');
    const detailRes = await GET(detailReq);
    const detailBody = await detailRes.json();
    expect(detailRes.status).toBe(200);
    expect(detailBody.content).toContain('src/app/page.tsx');
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

