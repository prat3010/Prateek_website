'use client';

import { useRef, useEffect, useState } from 'react';
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

  const smoothProgress = useSpring(rawProgress, { stiffness: 85, damping: 22, mass: 1 });

  // Scroll-linked opacity: soft fade-in as it enters, solid in the center, soft fade-out as it exits
  const scrollOpacity = useTransform(() => {
    if (!isMeasured) return 0;
    const p = smoothProgress.get();
    const cO = centerOnlyRef.current;

    if (cO) {
      const maxP = metricsRef.current.maxReachable || 1;
      return Math.min(p / (maxP * 0.4 || 0.4), 1);
    }

    if (p < 0.25) {
      return p / 0.25;
    } else if (p < 0.7) {
      return 1;
    } else {
      return Math.max(0, 1 - (p - 0.7) / 0.25);
    }
  });

  const x = useTransform(() => {
    const p = smoothProgress.get();
    resizeTick.get();
    if (!resizeTick.get()) return 0;
    const dir = directionRef.current;
    const vO = verticalOffsetRef.current;
    const cO = centerOnlyRef.current;

    // Subtle travel distance (180px) instead of viewport-wide flying
    const travelDistance = 180;
    const start = dir === 'right' ? travelDistance : -travelDistance;

    if (cO) {
      const maxP = metricsRef.current.maxReachable || 1;
      return start * (1 - Math.min(p / (maxP || 1), 1));
    }

    const end = dir === 'right' ? -travelDistance : travelDistance;

    if (vO) {
      if (p < 0.3) {
        return start * (1 - p / 0.3);
      } else if (p < 0.6) {
        return 0;
      } else {
        return end * Math.min((p - 0.6) / 0.3, 1);
      }
    }

    // Standard section: Slide in, settle at 0 for reading, then slide out
    if (p < 0.3) {
      return start * (1 - p / 0.3);
    } else if (p < 0.7) {
      return 0;
    } else {
      return end * Math.min((p - 0.7) / 0.3, 1);
    }
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
        style={{ x, y, opacity: scrollOpacity }}
      >
        {children}
      </m.div>
    </div>
  );
}

