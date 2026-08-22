import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '../terminal/snake-leaderboard/route';

describe('Snake Leaderboard API (/api/terminal/snake-leaderboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET returns global record and leaderboard entries', async () => {
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.globalRecord).toBeDefined();
    expect(data.globalRecord.player_name).toBeDefined();
    expect(data.globalRecord.score).toBeGreaterThan(0);
    expect(Array.isArray(data.leaderboard)).toBe(true);
  });

  it('POST rejects invalid or missing score', async () => {
    const req = new Request('http://localhost/api/terminal/snake-leaderboard', {
      method: 'POST',
      body: JSON.stringify({ player_name: 'TEST', score: -5 }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('POST records valid score and returns updated leaderboard', async () => {
    const req = new Request('http://localhost/api/terminal/snake-leaderboard', {
      method: 'POST',
      body: JSON.stringify({ player_name: 'NEO_TESTER', score: 250 }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.player_name).toBe('NEO_TESTER');
    expect(data.score).toBe(250);
    expect(data.isNewGlobalRecord).toBe(true);
    expect(data.globalRecord.score).toBe(250);
  });
});
