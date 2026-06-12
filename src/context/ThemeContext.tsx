'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

export type Theme = 'light' | 'noir';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isNoir: boolean;
  isDetailsHidden: boolean;
  toggleDetailsHidden: () => void;
}

interface ThemeTransitionContextType {
  isTransitioning: boolean;
  pendingTheme: Theme | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const ThemeTransitionContext = createContext<ThemeTransitionContextType | undefined>(undefined);

function getInitialTheme(initialTheme?: Theme): Theme {
  return initialTheme || 'light';
}

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme(initialTheme));
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
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const resolved: Theme = savedTheme === 'noir' || savedTheme === 'light'
        ? savedTheme
        : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'noir' : 'light';
      setTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
      document.cookie = `theme=${resolved}; path=/; max-age=31536000; SameSite=Lax`;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = useCallback(
    () => {
      if (isTransitioningRef.current) return;

      const currentTheme = themeRef.current;
      const nextTheme: Theme = currentTheme === 'light' ? 'noir' : 'light';

      setPendingTheme(nextTheme);
      setIsTransitioning(true);
      isTransitioningRef.current = true;
      document.documentElement.classList.add('is-theme-transitioning');

      // Halfway through the 800ms transition, flip the actual theme (when screen is covered)
      setTimeout(() => {
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        document.cookie = `theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
      }, 400);

      // End transition
      setTimeout(() => {
        setIsTransitioning(false);
        isTransitioningRef.current = false;
        setPendingTheme(null);
        document.documentElement.classList.remove('is-theme-transitioning');
      }, 850);
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
  }), [theme, toggleTheme, isNoir, isDetailsHidden, toggleDetailsHidden]);

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
