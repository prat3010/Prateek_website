'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function useScrollProgress(): number {
  const [scrollProgress, setScrollProgress] = useState(0);
  const frameRef = useRef<number>(0);
  const ticking = useRef(false);

  const updateProgress = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

    if (docHeight <= 0) {
      setScrollProgress(0);
    } else {
      setScrollProgress(Math.min(1, Math.max(0, scrollTop / docHeight)));
    }

    ticking.current = false;
  }, []);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      ticking.current = true;
      frameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [updateProgress]);

  useEffect(() => {
    // Calculate initial value
    updateProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frameRef.current);
    };
  }, [handleScroll, updateProgress]);

  return scrollProgress;
}
