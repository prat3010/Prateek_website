'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { createContext, useContext, useEffect, ReactNode } from 'react';
import { MotionValue, useMotionValue } from 'framer-motion';

interface LenisContextValue {
  scrollY: MotionValue<number>;
  scrollProgress: MotionValue<number>;
  velocity: MotionValue<number>;
}

const LenisContext = createContext<LenisContextValue | null>(null);

function LenisSync({ children }: { children: ReactNode }) {
  const lenis = useLenis();
  const scrollY = useMotionValue(0);
  const scrollProgress = useMotionValue(0);
  const velocity = useMotionValue(0);

  useEffect(() => {
    if (!lenis) return;
    const unsub = lenis.on('scroll', () => {
      scrollY.set(lenis.scroll);
      scrollProgress.set(lenis.progress);
      velocity.set(lenis.velocity);
    });
    return unsub;
  }, [lenis, scrollY, scrollProgress, velocity]);

  return (
    <LenisContext.Provider value={{ scrollY, scrollProgress, velocity }}>
      {children}
    </LenisContext.Provider>
  );
}

export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      }}
    >
      <LenisSync>{children}</LenisSync>
    </ReactLenis>
  );
}

export function useLenisScroll(): LenisContextValue {
  const ctx = useContext(LenisContext);
  if (!ctx) {
    throw new Error('useLenisScroll must be used within LenisProvider');
  }
  return ctx;
}
