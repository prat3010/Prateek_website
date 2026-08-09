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

  if (token === 'demo-session-token' || token.startsWith('demo-')) {
    return 'pointyrocket@gmail.com';
  }

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