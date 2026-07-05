'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';

interface SkylineInteractionValue {
  isTabVisible: boolean;
  geometryVersion: number;
}

const SkylineInteractionContext = createContext<SkylineInteractionValue | null>(null);

export function SkylineInteractionProvider({ children }: { children: ReactNode }) {
  const [isTabVisible, setIsTabVisible] = useState(true);
  const geometryVersionRef = useRef(0);
  const [geometryVersion, setGeometryVersion] = useState(0);

  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const invalidateGeometry = useCallback(() => {
    geometryVersionRef.current += 1;
    setGeometryVersion(geometryVersionRef.current);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', invalidateGeometry, { passive: true });
    window.addEventListener('resize', invalidateGeometry, { passive: true });
    return () => {
      window.removeEventListener('scroll', invalidateGeometry);
      window.removeEventListener('resize', invalidateGeometry);
    };
  }, [invalidateGeometry]);

  return (
    <SkylineInteractionContext.Provider value={{ isTabVisible, geometryVersion }}>
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
