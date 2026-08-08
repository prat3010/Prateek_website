'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabaseAuth, signInWithGoogle, signOut } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
});

/**
 * Checks whether a JWT access token's `exp` claim has already passed.
 * Malformed tokens are treated as expired so they get refreshed.
 */
export function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );
    return !json.exp || json.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/**
 * Decodes authentic JWT access token payload returned by Supabase Auth in URL hash
 */
function parseJwtUser(accessToken: string): User | null {
  try {
    const base64Url = accessToken.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.sub || !payload.email) return null;

    return {
      id: payload.sub,
      app_metadata: payload.app_metadata || { provider: 'google' },
      user_metadata: payload.user_metadata || {},
      aud: payload.aud || 'authenticated',
      created_at: new Date().toISOString(),
      email: payload.email,
      phone: payload.phone || '',
      role: payload.role || 'authenticated',
      updated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Failed to decode JWT user from hash:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('prateeq_active_user');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as User;
      if (parsed.email === 'client@example.com' || parsed.app_metadata?.provider === 'guest') {
        localStorage.removeItem('prateeq_active_user');
        return null;
      }
      return parsed;
    } catch (e) {
      console.warn('Failed to parse cached user:', e);
      return null;
    }
  });
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const hashStr = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hashStr);

        // 1. Capture OAuth Error Parameters
        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error');
        if (errorDesc) {
          console.error('Supabase OAuth Error:', errorDesc);
          alert(`Google Sign-In Error: ${decodeURIComponent(errorDesc).replace(/\+/g, ' ')}`);
        }

        // 2. Direct Extraction from URL Hash Fragment (#access_token=...)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          const userFromJwt = parseJwtUser(accessToken);
          if (userFromJwt && mounted) {
            setUser(userFromJwt);
            localStorage.setItem('prateeq_active_user', JSON.stringify(userFromJwt));
            document.cookie = `prateeq_active_user=${encodeURIComponent(JSON.stringify(userFromJwt))}; path=/; max-age=2592000; SameSite=Lax;`;

            // Clear hash fragment from address bar cleanly
            try {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch {}

            // Sync session in background with Supabase JS client
            supabaseAuth.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            }).then(({ data }) => {
              if (data.session && mounted) {
                setSession(data.session);
                if (data.session.user) {
                  setUser(data.session.user);
                  localStorage.setItem('prateeq_active_user', JSON.stringify(data.session.user));
                }
              }
            }).catch((err) => console.warn('Background setSession warning:', err));

            setLoading(false);
            return;
          }
        }

        // 3. PKCE Code Exchange Fallback
        const code = searchParams.get('code');
        if (code) {
          try {
            const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);
            if (!error && data.session?.user && mounted) {
              setSession(data.session);
              setUser(data.session.user);
              localStorage.setItem('prateeq_active_user', JSON.stringify(data.session.user));
              setLoading(false);
              return;
            }
          } catch (codeErr) {
            console.warn('Code exchange warning:', codeErr);
          }
        }
      }

      // 4. Read initial Supabase session
      try {
        const { data: { session } } = await supabaseAuth.auth.getSession();
        if (mounted && session?.user) {
          setSession(session);
          setUser(session.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('prateeq_active_user', JSON.stringify(session.user));
          }
        }
      } catch (err) {
        console.warn('Get session warning:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // 5. Listen for Auth State Changes
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('prateeq_active_user', JSON.stringify(session.user));
        }
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('prateeq_active_user');
          document.cookie = 'prateeq_active_user=; path=/; max-age=0;';
        }
      }
      setLoading(false);
    });

    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginWithGoogle = async (redirectTo?: string) => {
    setLoading(true);
    await signInWithGoogle(redirectTo).catch((err) => {
      setLoading(false);
      throw err;
    });
  };

  const handleLogout = async () => {
    await signOut().catch(() => {});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prateeq_active_user');
      document.cookie = 'prateeq_active_user=; path=/; max-age=0;';
    }
    setUser(null);
    setSession(null);
  };

  // Resolves a fresh access token at call time, refreshing the session when
  // the stored token is expired or missing so callers never send stale JWTs.
  const getAccessToken = React.useCallback(async (): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const { data: { session: activeSession } } = await supabaseAuth.auth.getSession();
      if (activeSession?.access_token && !isJwtExpired(activeSession.access_token)) {
        return activeSession.access_token;
      }
      if (activeSession?.refresh_token) {
        const { data: refreshed, error } = await supabaseAuth.auth.refreshSession({
          refresh_token: activeSession.refresh_token,
        });
        if (!error && refreshed.session?.access_token) {
          return refreshed.session.access_token;
        }
      }
      return null;
    } catch (err) {
      console.warn('Access token resolution failed:', err);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        loginWithGoogle: handleLoginWithGoogle,
        logout: handleLogout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
