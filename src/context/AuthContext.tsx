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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  loginWithGoogle: async () => {},
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

    // 1. Check for URL OAuth errors (e.g. redirect_uri_mismatch or disabled provider)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDesc = searchParams.get('error_description') || hashParams.get('error_description') || searchParams.get('error') || hashParams.get('error');
      if (errorDesc) {
        console.error('Supabase OAuth Redirect Error:', errorDesc);
        alert(`Google Sign-In Notice: ${decodeURIComponent(errorDesc).replace(/\+/g, ' ')}`);
      }
    }

    // 2. Read initial Supabase session
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('prateeq_active_user', JSON.stringify(session.user));
        }
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('Get session warning:', err);
      if (mounted) setLoading(false);
    });

    // 3. Listen for auth state changes (handles PKCE & OAuth Hash redirects)
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

    // 4. Safety fallback timeout so loading spinner never hangs
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2500);

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
