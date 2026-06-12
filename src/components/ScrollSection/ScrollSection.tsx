'use client';

import { useRef, useEffect, useState } from 'react';
import { m, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
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
  maxReachable: number;
}

function measure(el: HTMLElement): SectionMetrics {
  const sectionStart = el.offsetTop;
  const sectionHeight = el.offsetHeight;
  const windowH = window.innerHeight;
  const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
  const denominator = sectionHeight + windowH;
  const maxReachable = denominator > 0
    ? Math.max(0, Math.min(1, (totalScrollable + windowH - sectionStart) / denominator))
    : 1;

  return {
    sectionStart,
    sectionHeight,
    windowH,
    totalScrollable,
    maxReachable,
  };
}

export default function ScrollSection({ children, direction, verticalOffset, centerOnly, gap = 0 }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useLenisScroll();
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [isMeasured, setIsMeasured] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const metricsRef = useRef<SectionMetrics>({
    sectionStart: 0, sectionHeight: 0, windowH: 0, totalScrollable: 0, maxReachable: 1,
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
    return Math.max(0, Math.min(m.maxReachable,
      (latest + m.windowH - m.sectionStart) / (m.sectionHeight + m.windowH)
    ));
  });

  // Scroll-linked opacity: soft fade-in as it enters, solid in the center, soft fade-out as it exits
  const scrollOpacity = useTransform(() => {
    if (!isMeasured) return 0;
    const p = rawProgress.get();
    const cO = centerOnlyRef.current;

    if (cO) {
      const maxP = metricsRef.current.maxReachable || 1;
      return Math.min(p / (maxP * 0.3 || 0.3), 1);
    }

    if (p < 0.25) {
      return p / 0.25;
    } else if (p < 0.75) {
      return 1;
    } else {
      const maxP = metricsRef.current.maxReachable || 1;
      if (maxP <= 0.75) return 1;
      const exitRange = maxP - 0.75;
      return Math.max(0, 1 - (p - 0.75) / exitRange);
    }
  });

  const y = useTransform(() => {
    resizeTick.get();
    if (!resizeTick.get()) return 0;
    const p = rawProgress.get();
    const cO = centerOnlyRef.current;
    const vO = verticalOffsetRef.current || 0;

    // Subtle vertical offset for entry/exit (35px for a premium feel)
    const entryOffset = 35;

    if (cO) {
      const maxP = metricsRef.current.maxReachable || 1;
      const fadeZone = maxP * 0.3 || 0.3;
      if (p < fadeZone) {
        return entryOffset * (1 - p / fadeZone);
      }
      return 0;
    }

    let currentY = 0;
    if (p < 0.25) {
      // Slide up on entry: y goes from entryOffset (35px) to 0
      currentY = entryOffset * (1 - p / 0.25);
    } else if (p < 0.75) {
      // Keep static for reading
      currentY = 0;
    } else {
      // Slide up on exit: y goes from 0 to -entryOffset (-35px)
      const maxP = metricsRef.current.maxReachable || 1;
      if (maxP > 0.75) {
        const exitRange = maxP - 0.75;
        const t = Math.min((p - 0.75) / exitRange, 1);
        currentY = -entryOffset * t;
      }
    }

    // Add clean, direct vertical parallax if offset is defined
    if (vO) {
      currentY += -vO * p;
    }

    return currentY;
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    metricsRef.current = measure(el);
    setIsMeasured(true);
    resizeTick.set(resizeTick.get() + 1);

    const ro = new ResizeObserver(() => {
      metricsRef.current = measure(el);
      setIsMeasured(true);
      resizeTick.set(resizeTick.get() + 1);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [resizeTick]);

  if (prefersReducedMotion || isMobile) {
    return <div ref={wrapperRef} style={gap ? { marginBottom: gap } : undefined}>{children}</div>;
  }

  return (
    <div ref={wrapperRef} style={gap ? { marginBottom: gap } : undefined}>
      <m.div 
        className={styles.scrollInner} 
        style={{ y, opacity: scrollOpacity }}
      >
        {children}
      </m.div>
    </div>
  );
}

