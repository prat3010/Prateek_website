'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';

export type Theme = 'light' | 'noir';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  isNoir: boolean;
}

interface ThemeTransitionContextType {
  isTransitioning: boolean;
  transitionCoords: { x: number; y: number };
  pendingTheme: Theme | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const ThemeTransitionContext = createContext<ThemeTransitionContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme || 'light');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCoords, setTransitionCoords] = useState({ x: 50, y: 50 });
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);

  // Decouple toggleTheme callback from theme/isTransitioning changes using refs
  const themeRef = useRef<Theme>(theme);
  const isTransitioningRef = useRef<boolean>(isTransitioning);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // Initialize theme on mount from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'noir' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      document.cookie = `theme=${savedTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme: Theme = prefersDark ? 'noir' : 'light';
      setTheme(systemTheme);
      document.documentElement.setAttribute('data-theme', systemTheme);
      document.cookie = `theme=${systemTheme}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const toggleTheme = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (isTransitioningRef.current) return;

      const currentTheme = themeRef.current;
      const nextTheme: Theme = currentTheme === 'light' ? 'noir' : 'light';
      
      // Calculate origin coordinates for ink spill (as percentage of screen)
      let x = 50;
      let y = 50;
      if (e) {
        x = (e.clientX / window.innerWidth) * 100;
        y = (e.clientY / window.innerHeight) * 100;
      }

      setTransitionCoords({ x, y });
      setPendingTheme(nextTheme);
      setIsTransitioning(true);
      isTransitioningRef.current = true;

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
      }, 850);
    },
    []
  );

  const isNoir = theme === 'noir';

  const themeValue = useMemo(() => ({
    theme,
    toggleTheme,
    isNoir,
  }), [theme, toggleTheme, isNoir]);

  const transitionValue = useMemo(() => ({
    isTransitioning,
    transitionCoords,
    pendingTheme,
  }), [isTransitioning, transitionCoords, pendingTheme]);

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
