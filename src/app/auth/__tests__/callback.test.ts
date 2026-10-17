import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../callback/route';

const mockExchangeCodeForSession = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      verifyOtp: mockVerifyOtp,
    },
  })),
}));

vi.mock('@/lib/emailNotification', () => ({
  sendAdminSignupNotification: vi.fn(async () => ({})),
}));

describe('Auth Callback Route (GET /auth/callback)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges PKCE code for session and redirects to target path', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        session: {
          user: {
            id: 'u1',
            email: 'client@example.com',
            user_metadata: { name: 'Test Client' },
            app_metadata: { provider: 'google' },
            created_at: new Date().toISOString(),
          },
        },
      },
      error: null,
    });

    const req = new Request('https://prateeq.in/auth/callback?code=valid-code&next=/dashboard?scopeCode=SC-123');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://prateeq.in/dashboard?scopeCode=SC-123');
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-code');
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('prateeq_active_user');
  });

  it('verifies passwordless magic link token_hash and type', async () => {
    mockVerifyOtp.mockResolvedValueOnce({
      data: {
        session: {
          user: {
            id: 'u2',
            email: 'magic@company.com',
            user_metadata: { full_name: 'Magic User' },
            app_metadata: {},
            created_at: new Date().toISOString(),
          },
        },
      },
      error: null,
    });

    const req = new Request('https://prateeq.in/auth/callback?token_hash=magic-hash&type=email&next=/rag/app');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://prateeq.in/rag/app');
    expect(mockVerifyOtp).toHaveBeenCalledWith({ token_hash: 'magic-hash', type: 'email' });
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('prateeq_active_user');
  });

  it('does NOT hijack admin redirect when target path includes query parameters', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        session: {
          user: {
            id: 'admin1',
            email: 'prateeqsharma@gmail.com', // Admin email
            created_at: new Date().toISOString(),
          },
        },
      },
      error: null,
    });

    const target = '/dashboard?scopeCode=SC-999&imported=true';
    const req = new Request(`https://prateeq.in/auth/callback?code=admin-code&next=${encodeURIComponent(target)}`);
    const res = await GET(req);

    expect(res.status).toBe(307);
    // Must preserve query params rather than hijacking to /admin
    expect(res.headers.get('location')).toBe(`https://prateeq.in${target}`);
  });

  it('redirects admin to /admin when target path is exactly /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        session: {
          user: {
            id: 'admin1',
            email: 'prateeqsharma@gmail.com', // Admin email
            created_at: new Date().toISOString(),
          },
        },
      },
      error: null,
    });

    const req = new Request('https://prateeq.in/auth/callback?code=admin-code&next=/dashboard');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://prateeq.in/admin');
  });

  it('handles auth error in query parameters gracefully by redirecting with error', async () => {
    const req = new Request('https://prateeq.in/auth/callback?error=access_denied&error_description=User+cancelled&next=/dashboard');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard?error=User%20cancelled');
  });
});
