import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://osaqaemntuzrjouzobvx.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYXFhZW1udHV6cmpvdXpvYnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTI2NDAsImV4cCI6MjA5NTg2ODY0MH0.gYgeBTCcz4zxb-CHTPI8qrbogRcwMArTfHiZ9twcf7k';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;

// Dual Cookie + LocalStorage adapter with chunking to guarantee session persistence across Safari ITP & redirects
export const universalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      if (item) return item;
    } catch {}

    const encKey = encodeURIComponent(key);
    // Check if item was stored as multi-cookie chunks
    const chunksMatch = document.cookie.match(new RegExp('(?:^|; )' + encKey + '_chunks=([^;]*)'));
    if (chunksMatch) {
      const count = parseInt(decodeURIComponent(chunksMatch[1]), 10);
      if (!isNaN(count) && count > 0) {
        let combined = '';
        for (let i = 0; i < count; i++) {
          const chunkMatch = document.cookie.match(new RegExp('(?:^|; )' + encKey + '_chunk_' + i + '=([^;]*)'));
          if (!chunkMatch) return null;
          combined += decodeURIComponent(chunkMatch[1]);
        }
        return combined;
      }
    }

    const match = document.cookie.match(new RegExp('(?:^|; )' + encKey + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {}
    try {
      const encKey = encodeURIComponent(key);
      const isSecure = window.location.protocol === 'https:' ? ' Secure;' : '';
      const encodedVal = encodeURIComponent(value);
      const CHUNK_SIZE = 3000;

      if (encodedVal.length <= CHUNK_SIZE) {
        // Single cookie write
        document.cookie = `${encKey}=${encodedVal}; path=/; max-age=2592000; SameSite=Lax;${isSecure}`;
        // Clean up any old chunk cookies
        document.cookie = `${encKey}_chunks=; path=/; max-age=0; SameSite=Lax;${isSecure}`;
      } else {
        // Multi-cookie chunked write
        const totalChunks = Math.ceil(encodedVal.length / CHUNK_SIZE);
        for (let i = 0; i < totalChunks; i++) {
          const chunkVal = encodedVal.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          document.cookie = `${encKey}_chunk_${i}=${chunkVal}; path=/; max-age=2592000; SameSite=Lax;${isSecure}`;
        }
        document.cookie = `${encKey}_chunks=${totalChunks}; path=/; max-age=2592000; SameSite=Lax;${isSecure}`;
        // Clear single cookie if it previously existed
        document.cookie = `${encKey}=; path=/; max-age=0; SameSite=Lax;${isSecure}`;
      }
    } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {}
    const encKey = encodeURIComponent(key);
    const isSecure = window.location.protocol === 'https:' ? ' Secure;' : '';

    // Remove single cookie
    document.cookie = `${encKey}=; path=/; max-age=0; SameSite=Lax;${isSecure}`;

    // Remove chunk cookies
    const chunksMatch = document.cookie.match(new RegExp('(?:^|; )' + encKey + '_chunks=([^;]*)'));
    if (chunksMatch) {
      const count = parseInt(decodeURIComponent(chunksMatch[1]), 10);
      if (!isNaN(count)) {
        for (let i = 0; i < count; i++) {
          document.cookie = `${encKey}_chunk_${i}=; path=/; max-age=0; SameSite=Lax;${isSecure}`;
        }
      }
    }
    document.cookie = `${encKey}_chunks=; path=/; max-age=0; SameSite=Lax;${isSecure}`;
  },
};

export const supabaseAuth = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Initiates Google OAuth Sign-In flow with Supabase Auth.
 * Strips query parameters to ensure canonical match against Supabase Auth Redirect URIs.
 */
export async function signInWithGoogle(redirectTo?: string) {
  let origin = typeof window !== 'undefined' ? window.location.origin : 'https://prateeq.in';
  if (origin.includes('www.prateeq.in')) {
    origin = origin.replace('www.prateeq.in', 'prateeq.in');
  }
  const pathOnly = redirectTo ? redirectTo.split('?')[0] : '/dashboard';
  const targetRedirect = `${origin}/auth/callback?next=${encodeURIComponent(pathOnly)}`;

  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: targetRedirect,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    console.error('Google OAuth Trigger Error:', error);
    throw error;
  }
  return data;
}

/**
 * Signs out the current user session
 */
export async function signOut() {
  const { error } = await supabaseAuth.auth.signOut();
  if (error) throw error;
}
