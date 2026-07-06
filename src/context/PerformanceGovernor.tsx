'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type PerformanceTier = 'high' | 'medium' | 'low';

interface PerformanceGovernorContextValue {
  performanceTier: PerformanceTier;
}

const PerformanceGovernorContext = createContext<PerformanceGovernorContextValue>({
  performanceTier: 'high',
});

export function usePerformanceGovernor() {
  return useContext(PerformanceGovernorContext);
}

const SAMPLE_COUNT = 60;
const FPS_HIGH = 50;
const FPS_MEDIUM = 25;
const HYST = 5;

export function PerformanceGovernorProvider({ children }: { children: React.ReactNode }) {
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>('high');
  const samplesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(0);
  const tierRef = useRef<PerformanceTier>('high');

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        samplesRef.current = [];
        lastTimeRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let rafId: number;

    const tick = (time: number) => {
      if (lastTimeRef.current !== 0) {
        const delta = time - lastTimeRef.current;
        samplesRef.current.push(delta);
        if (samplesRef.current.length > SAMPLE_COUNT) {
          samplesRef.current.shift();
        }
      }
      lastTimeRef.current = time;

      const samples = samplesRef.current;
      if (samples.length >= 30) {
        const totalTime = samples.reduce((a, b) => a + b, 0);
        const fps = (samples.length / totalTime) * 1000;

        const current = tierRef.current;
        let next: PerformanceTier = current;

        switch (current) {
          case 'high':
            if (fps < FPS_HIGH - HYST) next = 'medium';
            break;
          case 'medium':
            if (fps < FPS_MEDIUM - HYST) {
              next = 'low';
            } else if (fps >= FPS_HIGH + HYST) {
              next = 'high';
            }
            break;
          case 'low':
            if (fps >= FPS_MEDIUM + HYST) next = 'medium';
            break;
        }

        if (next !== current) {
          tierRef.current = next;
          setPerformanceTier(next);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <PerformanceGovernorContext.Provider value={{ performanceTier }}>
      {children}
    </PerformanceGovernorContext.Provider>
  );
}
