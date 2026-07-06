'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';

interface SkylineInteractionValue {
  isTabVisible: boolean;
  isIdle: boolean;
  tick: number;
  geometryVersion: number;
}

const SkylineInteractionContext = createContext<SkylineInteractionValue | null>(null);

const IDLE_TIMEOUT_MS = 30_000;

const ACTIVITY_EVENTS = ['mousemove', 'wheel', 'click', 'keydown', 'touchstart'] as const;

export function SkylineInteractionProvider({ children }: { children: ReactNode }) {
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isIdle, setIsIdle] = useState(false);
  const [tick, setTick] = useState(0);
  const geometryVersionRef = useRef(0);
  const [geometryVersion, setGeometryVersion] = useState(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);
  const isTabVisibleRef = useRef(true);

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      setIsIdle(true);
    }, IDLE_TIMEOUT_MS);
  }, [clearIdleTimer]);

  const resetIdle = useCallback(() => {
    if (isIdleRef.current) {
      isIdleRef.current = false;
      setIsIdle(false);
    }
    startIdleTimer();
  }, [startIdleTimer]);

  useEffect(() => {
    const handleVisibility = () => {
      const visible = !document.hidden;
      setIsTabVisible(visible);
      isTabVisibleRef.current = visible;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    startIdleTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetIdle, { passive: true });
    }
    return () => {
      clearIdleTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetIdle);
      }
    };
  }, [startIdleTimer, clearIdleTimer, resetIdle]);

  // Single shared 160ms tick for all skyline animated characters
  useEffect(() => {
    const id = setInterval(() => {
      if (isTabVisibleRef.current && !isIdleRef.current) {
        setTick(t => t + 1);
      }
    }, 160);
    return () => clearInterval(id);
  }, []);

  const invalidateGeometry = useCallback(() => {
    geometryVersionRef.current += 1;
    setGeometryVersion(geometryVersionRef.current);
  }, []);

  useEffect(() => {
    let lastScrollCall = 0;
    const handleScroll = () => {
      const now = performance.now();
      if (now - lastScrollCall < 100) return;
      lastScrollCall = now;
      invalidateGeometry();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', invalidateGeometry, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', invalidateGeometry);
    };
  }, [invalidateGeometry]);

  return (
    <SkylineInteractionContext.Provider value={{ isTabVisible, isIdle, tick, geometryVersion }}>
      {children}
    </SkylineInteractionContext.Provider>
  );
}

export function useSkylineInteraction(): SkylineInteractionValue {
  const ctx = useContext(SkylineInteractionContext);
  if (!ctx) {
    throw new Error('useSkylineInteraction must be used within SkylineInteractionProvider');
  }
  return ctx;
}
