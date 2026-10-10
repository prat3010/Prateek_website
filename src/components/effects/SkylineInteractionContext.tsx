'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useLenisScroll } from '@/context/LenisProvider';

interface SkylineStatusValue {
  isTabVisible: boolean;
  isIdle: boolean;
  scrollVelocityRef: React.RefObject<number>;
  mousePosRef: React.RefObject<{ x: number; y: number }>;
  lastClickRef: React.RefObject<{ x: number; y: number; time: number } | null>;
}

export interface SkylineInteractionValue extends SkylineStatusValue {
  geometryVersion: number;
  tick: number;
}

const SkylineStatusContext = createContext<SkylineStatusValue | null>(null);
const SkylineInteractionContext = createContext<SkylineInteractionValue | null>(null);

const IDLE_TIMEOUT_MS = 60_000;

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

  const { velocity: scrollVelocity } = useLenisScroll();
  const scrollVelocityRef = useRef(0);
  const mousePosRef = useRef({ x: -100, y: -100 });
  const lastClickRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const unsub = scrollVelocity.on('change', (v) => {
      scrollVelocityRef.current = Math.abs(v);
    });
    return unsub;
  }, [scrollVelocity]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleClick = (e: MouseEvent) => {
      lastClickRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    };
    window.addEventListener('mousemove', handleMouseMove, { capture: true, passive: true });
    window.addEventListener('click', handleClick, { capture: true, passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove, { capture: true });
      window.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

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
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScrollEnd = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        invalidateGeometry();
      }, 250);
    };
    window.addEventListener('scroll', handleScrollEnd, { passive: true });
    window.addEventListener('resize', invalidateGeometry, { passive: true });
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScrollEnd);
      window.removeEventListener('resize', invalidateGeometry);
    };
  }, [invalidateGeometry]);

  // Memoized status value: NEVER changes on scroll or 160ms tick, completely freezing virtual DOM re-renders of SkylineInner
  const statusValue = React.useMemo<SkylineStatusValue>(() => ({
    isTabVisible,
    isIdle,
    scrollVelocityRef,
    mousePosRef,
    lastClickRef,
  }), [isTabVisible, isIdle]);

  // Ticking interaction value for creature state machines
  const interactionValue = React.useMemo<SkylineInteractionValue>(() => ({
    ...statusValue,
    geometryVersion,
    tick,
  }), [statusValue, geometryVersion, tick]);

  return (
    <SkylineStatusContext.Provider value={statusValue}>
      <SkylineInteractionContext.Provider value={interactionValue}>
        {children}
      </SkylineInteractionContext.Provider>
    </SkylineStatusContext.Provider>
  );
}

/** Hook for components that only need skyline status/idle state without subscribing to 160ms ticks (prevents skyline re-renders) */
export function useSkylineStatus(): SkylineStatusValue {
  const statusCtx = useContext(SkylineStatusContext);
  const interactionCtx = useContext(SkylineInteractionContext);
  const ctx = statusCtx ?? interactionCtx;
  if (!ctx) {
    throw new Error('useSkylineStatus must be used within SkylineInteractionProvider');
  }
  return ctx;
}

/** Hook for creatures that need the active 160ms tick state machine */
export function useSkylineInteraction(): SkylineInteractionValue {
  const ctx = useContext(SkylineInteractionContext);
  if (!ctx) {
    throw new Error('useSkylineInteraction must be used within SkylineInteractionProvider');
  }
  return ctx;
}
