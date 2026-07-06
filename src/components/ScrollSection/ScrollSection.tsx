'use client';

import { useRef, useEffect, useState } from 'react';
import { m, useMotionValue, useReducedMotion } from 'framer-motion';
import { useLenisScroll } from '@/context/LenisProvider';
import styles from './ScrollSection.module.css';

interface Props {
  children: React.ReactNode;
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

export default function ScrollSection({ children, verticalOffset, centerOnly, gap = 0 }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useLenisScroll();
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  const scrollOpacity = useMotionValue(0);
  const y = useMotionValue(0);

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

  const verticalOffsetRef = useRef(verticalOffset);
  const centerOnlyRef = useRef(centerOnly);

  useEffect(() => {
    verticalOffsetRef.current = verticalOffset;
    centerOnlyRef.current = centerOnly;
  });

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (prefersReducedMotion || isMobile) return;

    const el = wrapperRef.current;
    if (!el) return;

    const computeAndSet = () => {
      const m = metricsRef.current;
      if (!m.sectionHeight) return;

      const latest = scrollY.get();
      const raw = Math.max(0, Math.min(m.maxReachable,
        (latest + m.windowH - m.sectionStart) / (m.sectionHeight + m.windowH)
      ));

      const cO = centerOnlyRef.current;
      const vO = verticalOffsetRef.current || 0;

      let opacity: number;
      if (cO) {
        const maxP = m.maxReachable || 1;
        opacity = Math.min(raw / (maxP * 0.3 || 0.3), 1);
      } else if (raw < 0.25) {
        opacity = raw / 0.25;
      } else if (raw < 0.75) {
        opacity = 1;
      } else {
        const maxP = m.maxReachable || 1;
        if (maxP > 0.75) {
          const exitRange = maxP - 0.75;
          opacity = Math.max(0, 1 - (raw - 0.75) / exitRange);
        } else {
          opacity = 1;
        }
      }

      const entryOffset = 35;
      let yVal = 0;

      if (cO) {
        const maxP = m.maxReachable || 1;
        const fadeZone = maxP * 0.3 || 0.3;
        if (raw < fadeZone) {
          yVal = entryOffset * (1 - raw / fadeZone);
        }
      } else {
        if (raw < 0.25) {
          yVal = entryOffset * (1 - raw / 0.25);
        } else if (raw < 0.75) {
          yVal = 0;
        } else {
          const maxP = m.maxReachable || 1;
          if (maxP > 0.75) {
            const exitRange = maxP - 0.75;
            const t = Math.min((raw - 0.75) / exitRange, 1);
            yVal = -entryOffset * t;
          }
        }
        if (vO) {
          yVal += -vO * raw;
        }
      }

      scrollOpacity.set(opacity);
      y.set(yVal);
    };

    const runMeasure = () => {
      metricsRef.current = measure(el);
      computeAndSet();
    };

    runMeasure();

    const ro = new ResizeObserver(() => {
      metricsRef.current = measure(el);
      computeAndSet();
    });
    ro.observe(el);
    if (document.body) {
      ro.observe(document.body);
    }

    const unsub = scrollY.on('change', computeAndSet);

    return () => {
      ro.disconnect();
      unsub();
    };
  }, [scrollY, prefersReducedMotion, isMobile]);
  /* eslint-enable react-hooks/exhaustive-deps */

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

