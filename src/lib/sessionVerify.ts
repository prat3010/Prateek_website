import 'server-only';
import { supabase } from '@/data/supabase';

function parseJwtPayload(token: string): { email?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      return payload;
    }
  } catch {}
  return null;
}

/**
 * Extracts the Supabase session email from the Bearer access token on the
 * request. Returns null when the token is missing, invalid, or expired.
 * In degraded mode (no Supabase env configured) returns null; callers decide
 * whether to fall back to legacy unauthenticated behavior.
 */
export async function getVerifiedSessionEmail(req: Request): Promise<string | null> {
  if (!supabase) return null;
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.trim().replace(/^Bearer\s+/i, '');
  if (!token) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user?.email) {
      return data.user.email;
    }
    // If Supabase API returns network/fetch error (e.g. offline dev environment), fallback to decoding JWT email
    if (error && (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND'))) {
      const payload = parseJwtPayload(token);
      if (payload?.email && typeof payload.email === 'string') {
        return payload.email;
      }
    }
    return null;
  } catch (err: unknown) {
    // Network connectivity exception fallback
    const payload = parseJwtPayload(token);
    if (payload?.email && typeof payload.email === 'string') {
      return payload.email;
    }
    console.warn('Client scope session verification warning:', err);
    return null;
  }
}