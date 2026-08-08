import { describe, it, expect } from 'vitest';
import { isJwtExpired } from '@/context/AuthContext';

function buildToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fake-signature`;
}

describe('isJwtExpired', () => {
  it('returns false for a token with a future exp claim', () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isJwtExpired(token)).toBe(false);
  });

  it('returns true for a token with a past exp claim', () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    expect(isJwtExpired(token)).toBe(true);
  });

  it('returns true for a token without an exp claim', () => {
    expect(isJwtExpired(buildToken({ sub: 'abc' }))).toBe(true);
  });

  it('returns true for malformed tokens', () => {
    expect(isJwtExpired('not-a-jwt')).toBe(true);
    expect(isJwtExpired('')).toBe(true);
  });
});