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
  const [loading] = useState(false);

  useEffect(() => {
    // Read initial Supabase session asynchronously
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('prateeq_active_user', JSON.stringify(session.user));
        }
      }
    }).catch((err) => {
      console.warn('Get session warning:', err);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLoginWithGoogle = async (redirectTo?: string) => {
    await signInWithGoogle(redirectTo);
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
