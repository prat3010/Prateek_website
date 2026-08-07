'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabaseAuth, signInWithGoogle, signOut } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  loginAsGuestClient: (email?: string, name?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginAsGuestClient: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('prateeq_active_user');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as User;
      if (parsed.email === 'client@example.com') {
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
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // 1. Capture OAuth Error Parameters
        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error');
        if (errorDesc) {
          console.error('Supabase OAuth Error:', errorDesc);
          alert(`Google Sign-In Error: ${decodeURIComponent(errorDesc).replace(/\+/g, ' ')}`);
        }

        // 2. PKCE Code Exchange Fallback
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

        // 3. Implicit Hash Token Fallback
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        if (accessToken) {
          try {
            const { data, error } = await supabaseAuth.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            if (!error && data.session?.user && mounted) {
              setSession(data.session);
              setUser(data.session.user);
              localStorage.setItem('prateeq_active_user', JSON.stringify(data.session.user));
              setLoading(false);
              return;
            }
          } catch (hashErr) {
            console.warn('Hash setSession warning:', hashErr);
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

  const handleLoginAsGuestClient = (email?: string, name?: string) => {
    const guestUser: User = {
      id: `guest-${Date.now()}`,
      app_metadata: { provider: 'guest' },
      user_metadata: { full_name: name || 'Guest Client Account' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: email || 'client.demo@prateeq.in',
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    };
    setUser(guestUser);
    setSession({
      access_token: 'guest-demo-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'guest-refresh-token',
      user: guestUser,
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('prateeq_active_user', JSON.stringify(guestUser));
    }
  };

  const handleLogout = async () => {
    await signOut().catch(() => {});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prateeq_active_user');
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        loginWithGoogle: handleLoginWithGoogle,
        loginAsGuestClient: handleLoginAsGuestClient,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
