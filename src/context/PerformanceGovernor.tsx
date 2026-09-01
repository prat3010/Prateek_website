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

const SAMPLE_COUNT = 30;
const FPS_HIGH = 50;
const FPS_MEDIUM = 25;
const HYST = 5;

export function PerformanceGovernorProvider({ children }: { children: React.ReactNode }) {
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier>(() => {
    if (typeof window !== 'undefined') {
      const cores = navigator.hardwareConcurrency ?? 4;
      if (cores < 4) return 'low';
    }
    return 'high';
  });
  const samplesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(0);
  const tierRef = useRef<PerformanceTier>('high');
  const isRunningRef = useRef(false);
  const lastSampleTimeRef = useRef(0);

  useEffect(() => {
    let rafId: number | null = null;

    const stopSampling = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      isRunningRef.current = false;
      samplesRef.current = [];
      lastTimeRef.current = 0;
    };

    const tick = (time: number) => {
      if (lastTimeRef.current !== 0) {
        const delta = time - lastTimeRef.current;
        samplesRef.current.push(delta);
      }
      lastTimeRef.current = time;

      const samples = samplesRef.current;
      if (samples.length >= SAMPLE_COUNT) {

        const totalTime = samples.reduce((a, b) => a + b, 0);
        const fps = (samples.length / totalTime) * 1000;

        const current = tierRef.current;
        let next: PerformanceTier = current;

        if (current === 'high' && fps < FPS_HIGH - HYST) {
          next = 'medium';
        } else if (current === 'medium') {
          if (fps < FPS_MEDIUM - HYST) next = 'low';
          else if (fps >= FPS_HIGH + HYST) next = 'high';
        } else if (current === 'low' && fps >= FPS_MEDIUM + HYST) {
          next = 'medium';
        }

        if (next !== current) {
          tierRef.current = next;
          setPerformanceTier(next);
        }

        stopSampling();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    const triggerBurstSample = () => {
      if (document.hidden) return;
      const now = performance.now();
      if (isRunningRef.current || now - lastSampleTimeRef.current < 10000) return;

      lastSampleTimeRef.current = now;
      isRunningRef.current = true;
      samplesRef.current = [];
      lastTimeRef.current = 0;
      rafId = requestAnimationFrame(tick);
    };

    const resumeEvents = ['scroll', 'touchstart'] as const;
    for (const ev of resumeEvents) {
      window.addEventListener(ev, triggerBurstSample, { passive: true });
    }

    // Run one initial burst on mount
    triggerBurstSample();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSampling();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopSampling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      for (const ev of resumeEvents) {
        window.removeEventListener(ev, triggerBurstSample);
      }
    };
  }, []);

  return (
    <PerformanceGovernorContext.Provider value={{ performanceTier }}>
      {children}
    </PerformanceGovernorContext.Provider>
  );
}
