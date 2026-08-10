'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabaseAuth, signInWithGoogle, signOut, universalStorage } from '@/lib/auth';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = universalStorage.getItem('prateeq_active_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch (e) {
      console.warn('Failed to parse cached user:', e);
      return null;
    }
  });

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    // 1. Register Auth State listener FIRST so detectSessionInUrl events are captured immediately
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        universalStorage.setItem('prateeq_active_user', JSON.stringify(newSession.user));
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        universalStorage.removeItem('prateeq_active_user');
        setLoading(false);
      }
    });

    const initAuth = async () => {
      if (typeof window === 'undefined') return;

      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const errorDesc =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error');

      if (errorDesc) {
        const decoded = decodeURIComponent(errorDesc).replace(/\+/g, ' ');
        console.error('Supabase OAuth Return Error:', decoded);
        alert(`Google Sign-In Notice: ${decoded}`);
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch {}
        if (mounted) {
          setSession(null);
          setUser(null);
          universalStorage.removeItem('prateeq_active_user');
          setLoading(false);
        }
        return;
      }

      // 2. PKCE Code Exchange
      const code = searchParams.get('code');
      if (code) {
        try {
          const { data, error } = await supabaseAuth.auth.exchangeCodeForSession(code);
          if (!error && data.session?.user) {
            if (mounted) {
              setSession(data.session);
              setUser(data.session.user);
              universalStorage.setItem('prateeq_active_user', JSON.stringify(data.session.user));
              setLoading(false);
            }
            try {
              window.history.replaceState(null, '', window.location.pathname);
            } catch {}
            return;
          } else if (error) {
            console.warn('exchangeCodeForSession warning:', error.message);
          }
        } catch (codeErr) {
          console.warn('exchangeCodeForSession exception:', codeErr);
        }
      }

      // 3. Hash Fragment Token Exchange
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabaseAuth.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data.session?.user) {
            if (mounted) {
              setSession(data.session);
              setUser(data.session.user);
              universalStorage.setItem('prateeq_active_user', JSON.stringify(data.session.user));
              setLoading(false);
            }
            try {
              window.history.replaceState(null, '', window.location.pathname);
            } catch {}
            return;
          }
        } catch (hashErr) {
          console.warn('setSession from hash exception:', hashErr);
        }
      }

      // 4. Stored Session Fallback
      try {
        const { data: { session: currentSession }, error } = await supabaseAuth.auth.getSession();
        if (error) {
          console.warn('Get session error:', error);
        }

        if (mounted) {
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            universalStorage.setItem('prateeq_active_user', JSON.stringify(currentSession.user));
          } else {
            setSession(null);
            setUser(null);
            universalStorage.removeItem('prateeq_active_user');
          }
        }
      } catch (err) {
        console.warn('Get session warning:', err);
      } finally {
        if (searchParams.has('code') || hashParams.has('access_token')) {
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {}
        }
        if (mounted) setLoading(false);
      }
    };

    initAuth();

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
    universalStorage.removeItem('prateeq_active_user');
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
      if (session?.access_token && !isJwtExpired(session.access_token)) {
        return session.access_token;
      }
      return null;
    } catch (err) {
      console.warn('Access token resolution failed:', err);
      if (session?.access_token && !isJwtExpired(session.access_token)) {
        return session.access_token;
      }
      return null;
    }
  }, [session]);

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
