import 'server-only';
import { supabase } from '@/data/supabase';

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
    if (error || !data.user?.email) return null;
    return data.user.email;
  } catch (err) {
    console.warn('Client scope session verification warning:', err);
    return null;
  }
}