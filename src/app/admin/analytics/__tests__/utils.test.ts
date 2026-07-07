import { describe, it, expect, vi, afterEach } from 'vitest';
import { safeDecode, getCountryName, getRelativeTime, classifyReferrer } from '@/app/admin/analytics/_lib/utils';

describe('safeDecode', () => {
  it('returns empty string for null input', () => {
    expect(safeDecode(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(safeDecode('')).toBe('');
  });

  it('decodes valid URI-encoded string', () => {
    expect(safeDecode('hello%20world')).toBe('hello world');
  });

  it('returns original string on malformed percent-encoding', () => {
    expect(safeDecode('%E0%A4%A')).toBe('%E0%A4%A');
  });

  it('decodes special characters', () => {
    expect(safeDecode('%26%3C%3E')).toBe('&<>');
  });
});

describe('getCountryName', () => {
  it('returns full name for valid 2-letter code', () => {
    expect(getCountryName('US')).toBe('United States');
  });

  it('returns Local / Unknown for null', () => {
    expect(getCountryName(null)).toBe('Local / Unknown');
  });

  it('returns Local / Unknown for Local/Unknown', () => {
    expect(getCountryName('Local/Unknown')).toBe('Local / Unknown');
  });

  it('returns Local / Unknown for Unknown', () => {
    expect(getCountryName('Unknown')).toBe('Local / Unknown');
  });

  it('returns code as-is for codes longer than 2 chars', () => {
    expect(getCountryName('USA')).toBe('USA');
  });

  it('handles lowercase codes', () => {
    expect(getCountryName('us')).toBe('United States');
  });

  it('returns display name or code for invalid 2-letter code', () => {
    const result = getCountryName('ZZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for less than 60 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T12:00:30Z'));
    expect(getRelativeTime('2026-07-07T12:00:00Z')).toBe('just now');
  });

  it('returns minutes ago for 1-59 minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T12:05:00Z'));
    expect(getRelativeTime('2026-07-07T12:00:00Z')).toBe('5m ago');
  });

  it('returns hours ago for 1-23 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T14:00:00Z'));
    expect(getRelativeTime('2026-07-07T12:00:00Z')).toBe('2h ago');
  });

  it('returns days ago for 1+ days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-09T12:00:00Z'));
    expect(getRelativeTime('2026-07-07T12:00:00Z')).toBe('2d ago');
  });

  it('returns "just now" for exactly 59 seconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-07T12:00:59Z'));
    expect(getRelativeTime('2026-07-07T12:00:00Z')).toBe('just now');
  });
});

describe('classifyReferrer', () => {
  it('returns Direct / Search for null', () => {
    expect(classifyReferrer(null)).toBe('Direct / Search');
  });

  it('returns Direct / Search for empty string', () => {
    expect(classifyReferrer('')).toBe('Direct / Search');
  });

  it('returns Direct / Search for "Direct"', () => {
    expect(classifyReferrer('Direct')).toBe('Direct / Search');
  });

  it('classifies GitHub URLs', () => {
    expect(classifyReferrer('https://github.com/prateek')).toBe('GitHub');
    expect(classifyReferrer('github')).toBe('GitHub');
  });

  it('classifies LinkedIn URLs', () => {
    expect(classifyReferrer('https://linkedin.com/in/prateek')).toBe('LinkedIn');
    expect(classifyReferrer('linkedin')).toBe('LinkedIn');
  });

  it('classifies Twitter/X URLs', () => {
    expect(classifyReferrer('https://t.co/abc')).toBe('Twitter / X');
    expect(classifyReferrer('twitter')).toBe('Twitter / X');
    expect(classifyReferrer('x')).toBe('Twitter / X');
  });

  it('classifies Google URLs', () => {
    expect(classifyReferrer('https://www.google.com/search')).toBe('Google Search');
  });

  it('extracts hostname from unknown HTTP URLs', () => {
    expect(classifyReferrer('https://example.com/page')).toBe('example.com');
  });

  it('returns raw referrer for non-URL strings', () => {
    expect(classifyReferrer('some-referrer')).toBe('some-referrer');
  });
});
