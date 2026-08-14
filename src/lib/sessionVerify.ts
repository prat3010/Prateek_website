import 'server-only';
import { supabase } from '@/data/supabase';

/**
 * Extracts the Supabase session email from the Bearer access token on the
 * request. Returns null when the token is missing, invalid, expired, or unverified.
 * Cryptographic signature verification is strictly enforced via Supabase Auth.
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
    return null;
  } catch (err: unknown) {
    console.warn('Client scope session verification warning:', err);
    return null;
  }
}

/**
 * Returns the verified session user ({ id, email }) from the Bearer access token on the
 * request. Returns null when the token is missing, invalid, expired, or unverified.
 */
export async function getVerifiedSessionUser(req: Request): Promise<{ id: string; email: string } | null> {
  if (!supabase) return null;
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.trim().replace(/^Bearer\s+/i, '');
  if (!token) return null;

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user?.id && data.user?.email) {
      return { id: data.user.id, email: data.user.email };
    }
    return null;
  } catch (err: unknown) {
    console.warn('Session verification warning:', err);
    return null;
  }
}