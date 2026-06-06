'use client';

import { useRef, useEffect, type ReactNode } from 'react';
import styles from './ScrollReveal.module.css';

type Direction = 'up' | 'down' | 'left' | 'right';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
}

/**
 * Reveals children with a slide-in animation when they scroll into view.
 *
 * Implementation notes:
 * - Uses direct DOM class manipulation + CSS transitions instead of Framer Motion
 *   to avoid the hydration flicker (Framer Motion's initial={opacity:0} was
 *   applied AFTER server HTML rendered at opacity:1, causing content to flash
 *   invisible on every page load).
 * - Guards against animating elements already in the viewport on mount.
 * - A single IntersectionObserver per instance; disconnects after first trigger.
 * - Respects prefers-reduced-motion: no animation at all if set.
 */
export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the user's motion preference — leave content fully visible
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Elements already visible on load must NOT be hidden by JS.
    // This is the root cause of the hydration flicker: the server renders
    // content at opacity:1, then Framer Motion would set opacity:0 on mount.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;

    // Pass direction and delay into the CSS transition via custom properties
    const x =
      direction === 'left' ? '40px' : direction === 'right' ? '-40px' : '0px';
    const y =
      direction === 'up' ? '40px' : direction === 'down' ? '-40px' : '0px';
    el.style.setProperty('--reveal-x', x);
    el.style.setProperty('--reveal-y', y);
    el.style.setProperty('--reveal-delay', `${delay}ms`);

    // Apply hidden state (below fold — user can't see it yet)
    el.classList.add(styles.hidden);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Adding .visible while .hidden is present triggers the CSS transition
          el.classList.add(styles.visible);
          observer.disconnect();
        }
      },
      { rootMargin: '-80px', threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [direction, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
