'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS, type BreakpointName } from '@/lib/constants';

export function useMediaQuery(breakpoint: BreakpointName, direction: 'max' | 'min' = 'max'): boolean {
  const query = `(${direction}-width: ${BREAKPOINTS[breakpoint]}px)`;

  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery('MD');
}

export function useIsTablet(): boolean {
  return useMediaQuery('LG');
}
