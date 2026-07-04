'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

export type Theme = 'light' | 'noir';
export type Audience = 'developer' | 'business';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isNoir: boolean;
  isDetailsHidden: boolean;
  toggleDetailsHidden: () => void;
  audience: Audience | null;
  setAudience: (audience: Audience) => void;
  prevAudience: Audience | null;
  modeTransitionSeed: number;
}

interface ThemeTransitionContextType {
  isTransitioning: boolean;
  pendingTheme: Theme | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const ThemeTransitionContext = createContext<ThemeTransitionContextType | undefined>(undefined);

export function ThemeProvider({ 
  children,
  initialTheme = 'light',
  initialAudience = null
}: { 
  children: React.ReactNode;
  initialTheme?: Theme;
  initialAudience?: Audience | null;
}) {
  const [theme, setTheme] = useState<Theme>(() => initialTheme);
  const [audience, setAudienceState] = useState<Audience | null>(() => initialAudience);
  const [prevAudience, setPrevAudience] = useState<Audience | null>(null);
  const [modeTransitionSeed, setModeTransitionSeed] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
  const [isDetailsHidden, setIsDetailsHidden] = useState(false);

  // Sync details visibility state with root HTML element class
  useEffect(() => {
    if (isDetailsHidden) {
      document.documentElement.classList.add('ui-details-hidden');
    } else {
      document.documentElement.classList.remove('ui-details-hidden');
    }
  }, [isDetailsHidden]);

  const toggleDetailsHidden = useCallback(() => {
    setIsDetailsHidden(prev => !prev);
  }, []);

  // Decouple toggleTheme callback from theme/isTransitioning changes using refs
  const themeRef = useRef<Theme>(theme);
  const isTransitioningRef = useRef<boolean>(isTransitioning);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // Sync theme from localStorage after hydration; the <head> blocking script
  // already sets data-theme, so this reconciles React state to match.
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const resolved: Theme = savedTheme === 'noir' || savedTheme === 'light'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noir' : 'light';
    
    const frameId = requestAnimationFrame(() => {
      setTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    });
    
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Sync audience from localStorage if cookies are missing or out of sync
  useEffect(() => {
    const savedAudience = localStorage.getItem('audience') as Audience | null;
    if (savedAudience && (savedAudience === 'developer' || savedAudience === 'business')) {
      if (audience !== savedAudience) {
        const frameId = requestAnimationFrame(() => {
          setAudienceState(savedAudience);
          document.cookie = `audience=${savedAudience}; path=/; max-age=31536000; SameSite=Lax`;
        });
        return () => cancelAnimationFrame(frameId);
      }
    }
  }, [audience]);

  const setAudience = useCallback((newAudience: Audience) => {
    setPrevAudience(audience);
    setModeTransitionSeed((s) => s + 1);
    setAudienceState(newAudience);
    localStorage.setItem('audience', newAudience);
    document.cookie = `audience=${newAudience}; path=/; max-age=31536000; SameSite=Lax`;
  }, [audience]);

  const toggleTheme = useCallback(
    () => {
      if (isTransitioningRef.current) return;

      const currentTheme = themeRef.current;
      const nextTheme: Theme = currentTheme === 'light' ? 'noir' : 'light';

      setPendingTheme(nextTheme);
      setIsTransitioning(true);
      isTransitioningRef.current = true;
      document.documentElement.classList.add('theme-transition');

      // Halfway through the 1000ms transition, flip the actual theme (when screen is covered)
      setTimeout(() => {
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
      }, 480);

      // End transition
      setTimeout(() => {
        setIsTransitioning(false);
        isTransitioningRef.current = false;
        setPendingTheme(null);
        document.documentElement.classList.remove('theme-transition');
      }, 1000);
    },
    []
  );

  const isNoir = theme === 'noir';

  const themeValue = useMemo(() => ({
    theme,
    toggleTheme,
    isNoir,
    isDetailsHidden,
    toggleDetailsHidden,
    audience,
    setAudience,
    prevAudience,
    modeTransitionSeed,
  }), [theme, toggleTheme, isNoir, isDetailsHidden, toggleDetailsHidden, audience, setAudience, prevAudience, modeTransitionSeed]);

  const transitionValue = useMemo(() => ({
    isTransitioning,
    pendingTheme,
  }), [isTransitioning, pendingTheme]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <ThemeTransitionContext.Provider value={transitionValue}>
        {children}
      </ThemeTransitionContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeTransition() {
  const context = useContext(ThemeTransitionContext);
  if (context === undefined) {
    throw new Error('useThemeTransition must be used within a ThemeProvider');
  }
  return context;
}
