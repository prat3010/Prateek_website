import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://osaqaemntuzrjouzobvx.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYXFhZW1udHV6cmpvdXpvYnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyOTI2NDAsImV4cCI6MjA5NTg2ODY0MH0.gYgeBTCcz4zxb-CHTPI8qrbogRcwMArTfHiZ9twcf7k';

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultAnonKey;

// Dual Cookie + LocalStorage adapter to guarantee session persistence across Safari ITP & redirects
const universalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      if (item) return item;
    } catch {}
    const match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {}
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=2592000; SameSite=Lax;`;
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {}
    document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax;`;
  },
};

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: universalStorage,
  },
});

/**
 * Initiates Google OAuth Sign-In flow with Supabase Auth.
 * Redirects to window.location.origin to match Supabase Auth Site URL settings perfectly.
 */
export async function signInWithGoogle(redirectTo?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://prateeq.in';
  const targetRedirect = redirectTo && !redirectTo.startsWith('/') ? redirectTo : `${origin}${redirectTo || '/dashboard'}`;

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
