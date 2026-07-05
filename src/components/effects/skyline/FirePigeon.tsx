'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLenisScroll } from '@/context/LenisProvider';
import { useSkylineInteraction } from '../SkylineInteractionContext';
import styles from '../NoirSkyline.module.css';

const PLATFORMS = [952, 997];

const FirePigeon: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion }) => {
  const [state, setState] = useState<'idle' | 'alert' | 'hopping_down' | 'waiting' | 'hopping_up'>('idle');
  const [posY, setPosY] = useState(PLATFORMS[0]);
  const ticksRef = useRef(0);
  const stateRef = useRef(state);
  const velocityRef = useRef(0);
  const fireRef = useRef<SVGGElement>(null);
  const { velocity: scrollVelocity } = useLenisScroll();

  const boundingRectRef = useRef<DOMRect | null>(null);
  const { isTabVisible, geometryVersion } = useSkylineInteraction();
  const isVisibleRef = useRef(isTabVisible);
  isVisibleRef.current = isTabVisible;

  useEffect(() => {
    if (reducedMotion) return;
    const unsub = scrollVelocity.on('change', (v) => { velocityRef.current = Math.abs(v); });
    return unsub;
  }, [reducedMotion, scrollVelocity]);

  useEffect(() => {
    stateRef.current = state;
    boundingRectRef.current = null;
  }, [state]);

  useEffect(() => {
    boundingRectRef.current = null;
  }, [geometryVersion]);

  // Smooth position interpolation during hopping states
  useEffect(() => {
    if (reducedMotion) return;

    if (state === 'hopping_down') {
      let startTime: number | null = null;
      const duration = 480; // ms (equivalent to 6 ticks * 80ms)
      let rafId: number | null = null;

      const animateDown = (timestamp: number) => {
        if (!isVisibleRef.current) { rafId = requestAnimationFrame(animateDown); return; }
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth quadratic ease-in-out curve
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        setPosY(PLATFORMS[0] + eased * (PLATFORMS[1] - PLATFORMS[0]));
        boundingRectRef.current = null;

        if (progress < 1) {
          rafId = requestAnimationFrame(animateDown);
        }
      };
      rafId = requestAnimationFrame(animateDown);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    } else if (state === 'hopping_up') {
      let startTime: number | null = null;
      const duration = 480; // ms
      let rafId: number | null = null;

      const animateUp = (timestamp: number) => {
        if (!isVisibleRef.current) { rafId = requestAnimationFrame(animateUp); return; }
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth quadratic ease-in-out curve
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        setPosY(PLATFORMS[1] - eased * (PLATFORMS[1] - PLATFORMS[0]));
        boundingRectRef.current = null;

        if (progress < 1) {
          rafId = requestAnimationFrame(animateUp);
        }
      };
      rafId = requestAnimationFrame(animateUp);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [state, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const handleGlobalInteraction = (e: MouseEvent) => {
      if (stateRef.current !== 'idle' && stateRef.current !== 'alert') return;
      if (!fireRef.current) return;

      if (!boundingRectRef.current) {
        boundingRectRef.current = fireRef.current.getBoundingClientRect();
      }
      const rect = boundingRectRef.current;
      if (!rect) return;

      const padding = 20;
      const isOver = e.clientX >= rect.left - padding && e.clientX <= rect.right + padding &&
                     e.clientY >= rect.top - padding && e.clientY <= rect.bottom + padding;
      if (isOver && stateRef.current === 'idle') {
        setState('alert');
      }
    };
    window.addEventListener('mousemove', handleGlobalInteraction, { capture: true, passive: true });
    return () => window.removeEventListener('mousemove', handleGlobalInteraction, { capture: true });
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      if (!isVisibleRef.current) return;
      const currentState = stateRef.current;
      if (currentState === 'idle') {
        ticksRef.current = 0;
        if (velocityRef.current > 60) setState('alert');
        return;
      }
      ticksRef.current++;
      const ticks = ticksRef.current;
      if (currentState === 'alert') {
        if (ticks >= 4) {
          ticksRef.current = 0;
          setState(velocityRef.current > 60 ? 'hopping_down' : 'idle');
        }
        return;
      }
      if (currentState === 'hopping_down') {
        // Position is handled by requestAnimationFrame, interval handles duration timer
        if (ticks >= 6) {
          ticksRef.current = 0;
          setPosY(PLATFORMS[1]);
          setState('waiting');
        }
      } else if (currentState === 'waiting') {
        if (ticks >= 36) {
          ticksRef.current = 0;
          setState('hopping_up');
        }
      } else if (currentState === 'hopping_up') {
        // Position is handled by requestAnimationFrame, interval handles duration timer
        if (ticks >= 6) {
          ticksRef.current = 0;
          setPosY(PLATFORMS[0]);
          setState('idle');
        }
      }
    }, 80);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  return (
    <g ref={fireRef} transform={`translate(1675, ${posY})`}>
      <g transform="scale(1.5)">
        <g className={state === 'alert' ? styles.pigeonHeadBob : styles.pigeonBob}>
          <ellipse cx="0" cy="-3" rx="3" ry="2.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
          <circle cx="3" cy="-5.5" r="1.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
          <path d="M 4 -5.5 L 5.5 -5 L 4 -4.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
          <path d="M -3 -2 L -5 -1 L -3 -0.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
          <line x1="-1" y1="0" x2="-1.5" y2="1.5" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
          <line x1="1" y1="0" x2="1.5" y2="1.5" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
        </g>
      </g>
    </g>
  );
};

export default FirePigeon;
