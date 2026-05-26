'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}

function getOffset(direction: Direction): { x: number; y: number } {
  switch (direction) {
    case 'up':
      return { x: 0, y: 50 };
    case 'down':
      return { x: 0, y: -50 };
    case 'left':
      return { x: 50, y: 0 };
    case 'right':
      return { x: -50, y: 0 };
  }
}

function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const prefersReducedMotion = usePrefersReducedMotion();

  // Respect prefers-reduced-motion: render children without animation
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = getOffset(direction);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0 }
          : { opacity: 0, x: offset.x, y: offset.y }
      }
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 120,
        delay: delay / 1000, // convert ms to seconds for framer-motion
      }}
    >
      {children}
    </motion.div>
  );
}
