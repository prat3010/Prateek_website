import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const logTraceMock = vi.fn().mockResolvedValue(undefined);
  const stitchSessionMock = vi.fn().mockResolvedValue(undefined);
  return { logTraceMock, stitchSessionMock };
});

vi.mock('@/lib/scopingObservability', () => ({
  logScopingChatTrace: mocks.logTraceMock,
  stitchAnonymousSession: mocks.stitchSessionMock,
}));

vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimitResponse: vi.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '../scoping/chat/route';

describe('Scoping Chat Observability & Telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('captures country, ip hash, latency, and intent on chat turn', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-ip-country': 'IN',
        'x-forwarded-for': '49.205.120.10',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      },
      body: JSON.stringify({
        message: 'I need an AI voice agent platform with real-time calling',
        sessionId: 'test_session_123',
        turnIndex: 2,
        currency: 'USD',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('set-cookie')).toContain('prateeq_chat_session_id=test_session_123');

    expect(mocks.logTraceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'test_session_123',
        turnIndex: 2,
        visitorCountry: 'IN',
        currency: 'USD',
        agentIntent: 'voice_ai_agent_app',
        modelUsed: expect.any(String),
        latencyMs: expect.any(Number),
      })
    );
  });
});
