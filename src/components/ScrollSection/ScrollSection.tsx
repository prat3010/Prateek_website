'use client';

import { useRef, useEffect } from 'react';
import { m, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useLenisScroll } from '@/context/LenisProvider';

interface Props {
  children: React.ReactNode;
  direction: 'left' | 'right';
  verticalOffset?: number;
  centerOnly?: boolean;
  gap?: number;
}

export default function ScrollSection({ children, direction, verticalOffset, centerOnly, gap = 0 }: Props) {
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
        y.set(0);
        return;
      }

      const end = direction === 'right' ? -vw : vw;

      if (verticalOffset) {
        const entryEnd = 0.3;
        const verticalEnd = 0.6;

        if (p < entryEnd) {
          const t = p / entryEnd;
          x.set(start + (0 - start) * t);
          y.set(0);
        } else if (p < verticalEnd) {
          const t = (p - entryEnd) / (verticalEnd - entryEnd);
          const eased = 1 - Math.pow(1 - t, 2);
          x.set(0);
          y.set(-verticalOffset * eased);
        } else {
          x.set(end * (p - verticalEnd) / (1 - verticalEnd));
          y.set(-verticalOffset);
        }
      } else {
        x.set(start + (end - start) * p);
        y.set(0);
      }
    });
    return unsub;
  }, [smoothProgress, direction, verticalOffset, centerOnly]);

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

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        measure();
        update(scrollY.get());
      }, 100);
    };
    window.addEventListener('resize', onResize);

    return () => {
      unsub();
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [scrollY, rawProgress]);

  if (prefersReducedMotion) {
    return <div ref={wrapperRef} style={gap ? { marginBottom: gap } : undefined}>{children}</div>;
  }

  return (
    <div ref={wrapperRef} style={gap ? { marginBottom: gap } : undefined}>
      <m.div style={{ x, y, willChange: 'transform' }}>
        {children}
      </m.div>
    </div>
  );
}
