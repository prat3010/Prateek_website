import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../sanitize';

describe('escapeHtml', () => {
  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns string unchanged when no special characters present', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escapeHtml('a < b')).toBe('a &lt; b');
  });

  it('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('a "b" c')).toBe('a &quot;b&quot; c');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("a 'b' c")).toBe('a &#x27;b&#x27; c');
  });

  it('escapes forward slashes', () => {
    expect(escapeHtml('a/b')).toBe('a&#x2F;b');
  });

  it('escapes all special characters in a complex string', () => {
    const input = '<script>alert("xss");</script>';
    const result = escapeHtml(input);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
  });
});
