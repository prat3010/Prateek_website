'use client';

import { useRef, useEffect } from 'react';
import { m, useMotionValue, useSpring, useReducedMotion, useTransform } from 'framer-motion';
import { useLenisScroll } from '@/context/LenisProvider';
import styles from './ScrollSection.module.css';

interface Props {
  children: React.ReactNode;
  direction: 'left' | 'right';
  verticalOffset?: number;
  centerOnly?: boolean;
  gap?: number;
}

interface SectionMetrics {
  sectionStart: number;
  sectionHeight: number;
  windowH: number;
  totalScrollable: number;
}

function measure(el: HTMLElement): SectionMetrics {
  return {
    sectionStart: el.offsetTop,
    sectionHeight: el.offsetHeight,
    windowH: window.innerHeight,
    totalScrollable: document.documentElement.scrollHeight - window.innerHeight,
  };
}

export default function ScrollSection({ children, direction, verticalOffset, centerOnly, gap = 0 }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useLenisScroll();
  const prefersReducedMotion = useReducedMotion();
  const maxPRef = useRef(1);
  const metricsRef = useRef<SectionMetrics>({
    sectionStart: 0, sectionHeight: 0, windowH: 0, totalScrollable: 0,
  });

  const directionRef = useRef(direction);
  const verticalOffsetRef = useRef(verticalOffset);
  const centerOnlyRef = useRef(centerOnly);

  useEffect(() => {
    directionRef.current = direction;
    verticalOffsetRef.current = verticalOffset;
    centerOnlyRef.current = centerOnly;
  });

  const resizeTick = useMotionValue(0);

  const rawProgress = useTransform(() => {
    resizeTick.get();
    const latest = scrollY.get();
    const m = metricsRef.current;
    if (!m.sectionHeight) return 0;
    const maxReachable = Math.max(0, Math.min(1,
      (m.totalScrollable + m.windowH - m.sectionStart) / (m.sectionHeight + m.windowH)
    ));
    maxPRef.current = maxReachable;
    return Math.max(0, Math.min(maxReachable,
      (latest + m.windowH - m.sectionStart) / (m.sectionHeight + m.windowH)
    ));
  });

  const smoothProgress = useSpring(rawProgress, { stiffness: 80, damping: 20, mass: 1 });

  const x = useTransform(() => {
    const p = smoothProgress.get();
    resizeTick.get();
    if (!resizeTick.get()) return 0;
    const dir = directionRef.current;
    const vO = verticalOffsetRef.current;
    const cO = centerOnlyRef.current;
    const vw = window.innerWidth;
    const start = dir === 'right' ? vw : -vw;

    if (cO) {
      return start * (1 - Math.min(p / (maxPRef.current || 1), 1));
    }

    const end = dir === 'right' ? -vw : vw;

    if (vO) {
      if (p < 0.3) {
        return start + (0 - start) * (p / 0.3);
      } else if (p < 0.6) {
        return 0;
      } else {
        return end * (p - 0.6) / 0.4;
      }
    }

    return start + (end - start) * p;
  });

  const y = useTransform(() => {
    resizeTick.get();
    if (!resizeTick.get()) return 0;
    const p = smoothProgress.get();
    const vO = verticalOffsetRef.current;
    if (!vO) return 0;
    if (p < 0.3) return 0;
    if (p < 0.6) {
      const t = (p - 0.3) / 0.3;
      return -vO * (1 - Math.pow(1 - t, 2));
    }
    return -vO;
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    metricsRef.current = measure(el);
    resizeTick.set(resizeTick.get() + 1);

    const ro = new ResizeObserver(() => {
      metricsRef.current = measure(el);
      resizeTick.set(resizeTick.get() + 1);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [resizeTick]);

  if (prefersReducedMotion) {
    return <div ref={wrapperRef} style={gap ? { marginBottom: gap } : undefined}>{children}</div>;
  }

  return (
    <div ref={wrapperRef} style={gap ? { marginBottom: gap } : undefined}>
      <m.div className={styles.scrollInner} style={{ x, y }}>
        {children}
      </m.div>
    </div>
  );
}
