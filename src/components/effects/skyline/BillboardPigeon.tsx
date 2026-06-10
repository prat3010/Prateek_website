'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLenisScroll } from '@/context/LenisProvider';
import styles from '../NoirSkyline.module.css';

const BILLBOARD_SIDES = { left: 95, right: 165 };
const BILLBOARD_Y = 698;
const ARC_PEAK = 10;
const SCURRY_TICKS = 6;
const TICK_MS = 80;

const BillboardPigeon: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion }) => {
  const [side, setSide] = useState<'left' | 'right'>('left');
  const [alert, setAlert] = useState(false);
  const [scurrying, setScurrying] = useState(false);
  const [posX, setPosX] = useState(BILLBOARD_SIDES.left);
  const [posY, setPosY] = useState(BILLBOARD_Y);

  const scurryingRef = useRef(false);
  const alertRef = useRef(alert);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pigeonRef = useRef<SVGGElement>(null);
  const { velocity: scrollVelocity } = useLenisScroll();
  const velocityRef = useRef(0);

  useEffect(() => { alertRef.current = alert; }, [alert]);

  useEffect(() => {
    if (reducedMotion) return;
    const unsub = scrollVelocity.on('change', (v) => { velocityRef.current = Math.abs(v); });
    return unsub;
  }, [reducedMotion, scrollVelocity]);

  useEffect(() => {
    if (reducedMotion) return;

    const startScurry = (nextSide: 'left' | 'right') => {
      if (scurryingRef.current) return;
      scurryingRef.current = true;
      setScurrying(true);

      const startX = BILLBOARD_SIDES[side];
      const endX = BILLBOARD_SIDES[nextSide];
      let tick = 0;

      intervalRef.current = setInterval(() => {
        tick++;
        const t = tick / SCURRY_TICKS;
        const t2 = t * t;
        const eased = t < 0.5 ? 2 * t2 : 1 - (-2 * t + 2) ** 2 / 2;
        setPosX(startX + eased * (endX - startX));
        setPosY(BILLBOARD_Y - ARC_PEAK * Math.sin(Math.PI * t));

        if (tick >= SCURRY_TICKS) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          setPosX(endX);
          setPosY(BILLBOARD_Y);
          setSide(nextSide);
          setScurrying(false);
          scurryingRef.current = false;
        }
      }, TICK_MS);
    };

    const handleInteraction = (e: MouseEvent) => {
      if (scurryingRef.current) return;
      const rect = pigeonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const padding = 25;
      const isOver = e.clientX >= rect.left - padding && e.clientX <= rect.right + padding &&
                     e.clientY >= rect.top - padding && e.clientY <= rect.bottom + padding;
      if (!isOver) return;
      const nextSide = side === 'left' ? 'right' : 'left';
      startScurry(nextSide);
    };

    window.addEventListener('mousemove', handleInteraction, { capture: true, passive: true });
    return () => window.removeEventListener('mousemove', handleInteraction, { capture: true });
  }, [reducedMotion, side]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      const vel = velocityRef.current;
      if (vel > 60 && !alertRef.current && !scurryingRef.current) setAlert(true);
      else if (vel <= 60 && alertRef.current && !scurryingRef.current) setAlert(false);
    }, 200);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const facingLeft = side === 'right';
  const scaleX = facingLeft ? -1.5 : 1.5;

  if (reducedMotion) {
    return (
      <g ref={pigeonRef} transform={`translate(${BILLBOARD_SIDES.left}, ${BILLBOARD_Y})`}>
        <g transform="scale(1.5)">
          <g className={styles.pigeonBob}>
            <ellipse cx="0" cy="-3" rx="3" ry="2.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
            <circle cx="3" cy="-5.5" r="1.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
            <path d="M 4 -5.5 L 5.5 -5 L 4 -4.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
            <path d="M -3 -2 L -5 -1 L -3 -0.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
            <line x1="-1" y1="0" x2="-1.5" y2="1.5" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
            <line x1="1" y1="0" x2="1.5" y2="1.5" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
          </g>
        </g>
      </g>
    );
  }

  return (
    <g ref={pigeonRef} transform={`translate(${posX}, ${posY})`}>
      <g transform={`scale(${scaleX}, 1.5)`}>
        <g className={alert ? styles.pigeonHeadBob : styles.pigeonBob}>
          <ellipse cx="0" cy="-3" rx="3" ry="2.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
          <circle cx="3" cy="-5.5" r="1.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
          <path d="M 4 -5.5 L 5.5 -5 L 4 -4.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
          {scurrying && <path d="M -1.5 -4.5 L -0.5 -7 L 0.5 -4.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" className={styles.pigeonFlutter} />}
          <path d="M -3 -2 L -5 -1 L -3 -0.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
          <line x1="-1" y1="0" x2="-1.5" y2="1.5" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
          <line x1="1" y1="0" x2="1.5" y2="1.5" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
        </g>
      </g>
    </g>
  );
};

export default BillboardPigeon;
