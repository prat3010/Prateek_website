import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getIpHash, HONEYPOT_PATTERNS } from '../security';

describe('getIpHash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a 64-character hex string', async () => {
    vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));
    const hash = await getIpHash('192.168.1.1');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces deterministic hash for same IP and date', async () => {
    vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));
    const hash1 = await getIpHash('10.0.0.1');
    const hash2 = await getIpHash('10.0.0.1');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different IPs', async () => {
    vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));
    const hash1 = await getIpHash('10.0.0.1');
    const hash2 = await getIpHash('10.0.0.2');
    expect(hash1).not.toBe(hash2);
  });

  it('produces different hashes on different days', async () => {
    vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));
    const hash1 = await getIpHash('10.0.0.1');

    vi.setSystemTime(new Date('2026-07-08T12:00:00Z'));
    const hash2 = await getIpHash('10.0.0.1');

    expect(hash1).not.toBe(hash2);
  });

  it('handles localhost IP', async () => {
    vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));
    const hash = await getIpHash('127.0.0.1');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('HONEYPOT_PATTERNS', () => {
  it('blocks .php extension', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/wp-login.php'))).toBe(true);
  });

  it('blocks wp-admin paths', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/wp-admin'))).toBe(true);
  });

  it('blocks xmlrpc', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/xmlrpc.php'))).toBe(true);
  });

  it('blocks .env files', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/.env'))).toBe(true);
  });

  it('blocks actuator paths', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/actuator'))).toBe(true);
  });

  it('blocks setup paths', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/setup'))).toBe(true);
  });

  it('blocks config paths', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/config'))).toBe(true);
  });

  it('blocks .well-known paths', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/.well-known'))).toBe(true);
  });

  it('does not block normal paths', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/'))).toBe(false);
    expect(HONEYPOT_PATTERNS.some(p => p.test('/blog'))).toBe(false);
    expect(HONEYPOT_PATTERNS.some(p => p.test('/projects'))).toBe(false);
    expect(HONEYPOT_PATTERNS.some(p => p.test('/contact'))).toBe(false);
  });

  it('does not block admin dashboard path', () => {
    expect(HONEYPOT_PATTERNS.some(p => p.test('/admin/analytics'))).toBe(false);
  });
});

describe('isJwtExpired', () => {
  const createMockJwt = (expInSeconds: number) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'user-123', exp: expInSeconds }));
    return `${header}.${payload}.mockSignature`;
  };

  it('returns true for malformed tokens', async () => {
    const { isJwtExpired } = await import('@/context/AuthContext');
    expect(isJwtExpired('')).toBe(true);
    expect(isJwtExpired('invalid.token')).toBe(true);
    expect(isJwtExpired('not-a-jwt')).toBe(true);
  });

  it('returns true for expired tokens', async () => {
    const { isJwtExpired } = await import('@/context/AuthContext');
    const expiredExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const expiredToken = createMockJwt(expiredExp);
    expect(isJwtExpired(expiredToken)).toBe(true);
  });

  it('returns false for valid future tokens', async () => {
    const { isJwtExpired } = await import('@/context/AuthContext');
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
    const validToken = createMockJwt(futureExp);
    expect(isJwtExpired(validToken)).toBe(false);
  });
});

describe('universalStorage', () => {
  it('manages key-value pairs in cookie and localStorage', async () => {
    const { universalStorage } = await import('../auth');
    universalStorage.setItem('test_session_key', 'test_token_value');
    const value = universalStorage.getItem('test_session_key');
    expect(value).toBe('test_token_value');

    universalStorage.removeItem('test_session_key');
    const cleared = universalStorage.getItem('test_session_key');
    expect(cleared).toBeNull();
  });
});

