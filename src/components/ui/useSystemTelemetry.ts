'use client';

import { useState, useEffect, useRef } from 'react';

export interface SystemStats {
  fps: number;
  bundleSize: number;
  domNodes: number;
  uptime: string;
}

export interface WebVitalsMetrics {
  lcp: number;
  fid: number;
  cls: number;
  hasInteraction: boolean;
}

export function useSystemTelemetry(triggerCount: number = 0) {
  const [stats, setStats] = useState<SystemStats>({
    fps: 60,
    bundleSize: 184,
    domNodes: 0,
    uptime: '00:00:00',
  });

  const [webVitals, setWebVitals] = useState<WebVitalsMetrics>({
    lcp: 0,
    fid: 0,
    cls: 0,
    hasInteraction: false,
  });

  const isVisibleRef = useRef(true);

  // Dynamically update DOM nodes count when terminal history renders or changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const animId = requestAnimationFrame(() => {
        const nodes = document.getElementsByTagName('*').length;
        setStats((prev) => ({ ...prev, domNodes: nodes }));
      });
      return () => cancelAnimationFrame(animId);
    }
  }, [triggerCount]);

  // FPS requestAnimationFrame counter (pauses when tab is hidden)
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number | null = null;

    const countFrames = () => {
      if (document.hidden) {
        animId = null;
        return;
      }
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setStats((prev) => ({ ...prev, fps: currentFps }));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(countFrames);
    };

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden && animId === null) {
        lastTime = performance.now();
        frameCount = 0;
        animId = requestAnimationFrame(countFrames);
      } else if (document.hidden && animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    animId = requestAnimationFrame(countFrames);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Hardware sync: script sizes, DOM nodes, and uptime
  useEffect(() => {
    const calculateBundleSize = () => {
      if (typeof performance === 'undefined') return 184;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(
        (r) => r.initiatorType === 'script' || r.name.endsWith('.js')
      );
      const totalBytes = jsResources.reduce(
        (acc, r) => acc + (r.transferSize || r.encodedBodySize || r.decodedBodySize || 0),
        0
      );
      return Math.round(totalBytes / 1024) || 245;
    };

    const initialDomNodes = typeof document !== 'undefined' ? document.getElementsByTagName('*').length : 0;
    const initialBundle = calculateBundleSize();

    requestAnimationFrame(() => {
      setStats((prev) => ({
        ...prev,
        domNodes: initialDomNodes,
        bundleSize: initialBundle,
      }));
    });

    const timer = setInterval(() => {
      if (!isVisibleRef.current) return;
      const diff = typeof performance !== 'undefined' ? performance.now() : 0;
      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const uptimeStr = `${hours}:${mins}:${secs}`;

      setStats((prev) => {
        if (prev.uptime === uptimeStr) return prev;
        return { ...prev, uptime: uptimeStr };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Native Web Vitals Performance Observers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lcpObserver: PerformanceObserver | null = null;
    let fidObserver: PerformanceObserver | null = null;
    let clsObserver: PerformanceObserver | null = null;

    try {
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          const lcpVal = Number((lastEntry.startTime / 1000).toFixed(2));
          setWebVitals((prev) => ({ ...prev, lcp: lcpVal }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}

    try {
      fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0] as PerformanceEventTiming;
          const fidVal = Math.round(firstInput.processingStart - firstInput.startTime);
          setWebVitals((prev) => ({ ...prev, fid: fidVal, hasInteraction: true }));
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {}

    try {
      let accumulatedCls = 0;
      clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as unknown as { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            accumulatedCls += layoutShift.value;
            setWebVitals((prev) => ({ ...prev, cls: Number(accumulatedCls.toFixed(3)) }));
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {}

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, []);

  return { stats, webVitals };
}
