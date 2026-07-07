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
