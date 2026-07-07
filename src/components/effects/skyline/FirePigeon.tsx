'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSkylineInteraction } from '../SkylineInteractionContext';
import styles from '../NoirSkyline.module.css';

const PLATFORMS = [952, 997];

const FirePigeon: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion }) => {
  const [state, setState] = useState<'idle' | 'alert' | 'hopping_down' | 'waiting' | 'hopping_up'>('idle');
  const [posY, setPosY] = useState(PLATFORMS[0]);
  const ticksRef = useRef(0);
  const stateRef = useRef(state);
  const fireRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number | null>(null);

  const boundingRectRef = useRef<DOMRect | null>(null);
  const { tick, isTabVisible, isIdle, geometryVersion, scrollVelocityRef, mousePosRef } = useSkylineInteraction();
  const isVisibleRef = useRef(isTabVisible);
  const isIdleRef = useRef(isIdle);

  useEffect(() => {
    isVisibleRef.current = isTabVisible;
  }, [isTabVisible]);

  useEffect(() => {
    isIdleRef.current = isIdle;
  }, [isIdle]);

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
    if (state !== 'hopping_down' && state !== 'hopping_up') return;

    const isDown = state === 'hopping_down';
    const startY = isDown ? PLATFORMS[0] : PLATFORMS[1];
    const endY = isDown ? PLATFORMS[1] : PLATFORMS[0];
    const duration = 480;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!isVisibleRef.current || isIdleRef.current) { rafRef.current = null; return; }
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      setPosY(startY + eased * (endY - startY));
      boundingRectRef.current = null;
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const currentState = stateRef.current;

    // Mouse hit detection (replaces per-creature capture listener)
    if ((currentState === 'idle' || currentState === 'alert') && fireRef.current) {
      if (!boundingRectRef.current) {
        boundingRectRef.current = fireRef.current.getBoundingClientRect();
      }
      const rect = boundingRectRef.current;
      if (rect) {
        const padding = 20;
        const mouse = mousePosRef.current;
        const isOver =
          mouse.x >= rect.left - padding && mouse.x <= rect.right + padding &&
          mouse.y >= rect.top - padding && mouse.y <= rect.bottom + padding;
        if (isOver && currentState === 'idle') {
          setState('alert');
          return;
        }
      }
    }

    if (currentState === 'idle') {
      ticksRef.current = 0;
      if (scrollVelocityRef.current > 60) setState('alert');
      return;
    }
    ticksRef.current++;
    const ticks = ticksRef.current;
    if (currentState === 'alert') {
      if (ticks >= 2) {
        ticksRef.current = 0;
        setState(scrollVelocityRef.current > 60 ? 'hopping_down' : 'idle');
      }
      return;
    }
    if (currentState === 'hopping_down') {
      if (ticks >= 3) {
        ticksRef.current = 0;
        setPosY(PLATFORMS[1]);
        setState('waiting');
      }
    } else if (currentState === 'waiting') {
      if (ticks >= 18) {
        ticksRef.current = 0;
        setState('hopping_up');
      }
    } else if (currentState === 'hopping_up') {
      if (ticks >= 3) {
        ticksRef.current = 0;
        setPosY(PLATFORMS[0]);
        setState('idle');
      }
    }
  }, [tick, reducedMotion, mousePosRef, scrollVelocityRef]);

  if (reducedMotion) return null;

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
