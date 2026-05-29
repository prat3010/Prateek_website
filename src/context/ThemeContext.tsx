'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'noir';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  isNoir: boolean;
  isTransitioning: boolean;
  transitionCoords: { x: number; y: number };
  pendingTheme: Theme | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionCoords, setTransitionCoords] = useState({ x: 50, y: 50 });
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);

  // Initialize theme on mount from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme === 'noir' || savedTheme === 'light') {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme: Theme = prefersDark ? 'noir' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
  }, []);

  const toggleTheme = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (isTransitioning) return;

      const nextTheme: Theme = theme === 'light' ? 'noir' : 'light';
      
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

      // Halfway through the 800ms transition, flip the actual theme (when screen is covered)
      setTimeout(() => {
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
      }, 400);

      // End transition
      setTimeout(() => {
        setIsTransitioning(false);
        setPendingTheme(null);
      }, 850);
    },
    [theme, isTransitioning]
  );

  const isNoir = theme === 'noir';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        isNoir,
        isTransitioning,
        transitionCoords,
        pendingTheme,
      }}
    >
      {children}
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
