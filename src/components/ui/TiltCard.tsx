'use client';

import React, { useRef, useSyncExternalStore } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import styles from './TiltCard.module.css';

interface TiltCardProps {
  children: React.ReactNode;
  maxAngle?: number;
  glare?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

const subscribeTouch = (callback: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const match = window.matchMedia('(pointer: coarse)');
  match.addEventListener('change', callback);
  return () => match.removeEventListener('change', callback);
};

const getTouchSnapshot = () => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(pointer: coarse)').matches;
};

const getTouchServerSnapshot = () => false;

export default function TiltCard({
  children,
  maxAngle = 5,
  glare = true,
  className,
  style,
  onClick,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isTouch = useSyncExternalStore(subscribeTouch, getTouchSnapshot, getTouchServerSnapshot);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);

  const springConfig = { stiffness: 280, damping: 22, mass: 0.15 };
  const rotateX = useSpring(rawRotateX, springConfig);
  const rotateY = useSpring(rawRotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    rawRotateX.set((0.5 - yPct) * maxAngle * 2);
    rawRotateY.set((xPct - 0.5) * maxAngle * 2);

    if (glare) {
      ref.current.style.setProperty('--glare-x', `${(xPct * 100).toFixed(1)}%`);
      ref.current.style.setProperty('--glare-y', `${(yPct * 100).toFixed(1)}%`);
      ref.current.style.setProperty('--glare-opacity', '1');
    }
  };

  const handleMouseLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    if (glare && ref.current) {
      ref.current.style.setProperty('--glare-opacity', '0');
    }
  };

  if (prefersReducedMotion || isTouch) {
    return (
      <div className={className} style={style} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={`${styles.tiltContainer} ${className || ''}`}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
      {glare && <div className={styles.glareLayer} aria-hidden="true" />}
    </motion.div>
  );
}
