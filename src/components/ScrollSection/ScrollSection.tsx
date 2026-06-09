'use client';

import { useRef, useEffect } from 'react';
import { m, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useLenisScroll } from '@/context/LenisProvider';

interface Props {
  children: React.ReactNode;
  direction: 'left' | 'right';
  verticalOffset?: number;
  verticalDelay?: number;
  centerOnly?: boolean;
}

export default function ScrollSection({ children, direction, verticalOffset, verticalDelay = 0, centerOnly }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useLenisScroll();
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, { stiffness: 80, damping: 20, mass: 1 });
  const prefersReducedMotion = useReducedMotion();
  const maxPRef = useRef(1);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const unsub = smoothProgress.on('change', (p) => {
      const vw = window.innerWidth;
      const start = direction === 'right' ? vw : -vw;
      if (centerOnly) {
        x.set(start * (1 - Math.min(p / (maxPRef.current || 1), 1)));
      } else {
        const end = direction === 'right' ? -vw : vw;
        x.set(start + (end - start) * p);
      }
      if (verticalOffset) {
        if (p <= verticalDelay) { y.set(0); return; }
        const t = Math.min((p - verticalDelay) / (0.5 - verticalDelay), 1);
        const eased = 1 - Math.pow(1 - t, 2);
        y.set(-verticalOffset * (1 - eased));
      }
    });
    return unsub;
  }, [smoothProgress, direction, verticalOffset, verticalDelay, centerOnly]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    let sectionStart = 0;
    let sectionHeight = 0;
    let windowH = window.innerHeight;

    const measure = () => {
      sectionStart = el.offsetTop;
      sectionHeight = el.offsetHeight;
      windowH = window.innerHeight;
    };

    const update = (latest: number) => {
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
      const maxReachable = Math.max(0, Math.min(1,
        (totalScrollable + windowH - sectionStart) / (sectionHeight + windowH)
      ));
      maxPRef.current = maxReachable;
      const p = Math.max(0, Math.min(maxReachable,
        (latest + windowH - sectionStart) / (sectionHeight + windowH)
      ));
      rawProgress.set(p);
    };

    measure();
    update(scrollY.get());

    const unsub = scrollY.on('change', update);

    const onResize = () => {
      measure();
      update(scrollY.get());
    };
    window.addEventListener('resize', onResize);

    return () => {
      unsub();
      window.removeEventListener('resize', onResize);
    };
  }, [scrollY, rawProgress]);

  if (prefersReducedMotion) {
    return <section>{children}</section>;
  }

  return (
    <div ref={wrapperRef}>
      <m.div style={{ x, y, willChange: 'transform' }}>
        {children}
      </m.div>
    </div>
  );
}
