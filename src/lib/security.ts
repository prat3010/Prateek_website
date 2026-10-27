import nodeCrypto from 'crypto';

// Helper to hash IP addresses with a daily rotating salt (GDPR compliant unique visitor tracking)
export async function getIpHash(ip: string): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // Daily rotating salt
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '-' + today);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Constant-time string comparison to prevent timing side-channel attacks on secret tokens
export function timingSafeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return nodeCrypto.timingSafeEqual(bufA, bufB);
}

// Blocklist of common bot exploit patterns to skip database logging
export const HONEYPOT_PATTERNS = [
  /\.php$/,
  /wp-admin/i,
  /xmlrpc/i,
  /\.env/,
  /actuator/i,
  /setup/i,
  /config/i,
  /\.well-known/i
];
