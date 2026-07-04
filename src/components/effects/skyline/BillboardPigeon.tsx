'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLenisScroll } from '@/context/LenisProvider';
import styles from '../NoirSkyline.module.css';

const BILLBOARD_SIDES = { left: 95, right: 165 };
const BILLBOARD_Y = 698;
const ARC_PEAK = 10;

const BillboardPigeon: React.FC<{ reducedMotion?: boolean }> = ({ reducedMotion }) => {
  const [side, setSide] = useState<'left' | 'right'>('left');
  const [alert, setAlert] = useState(false);
  const [scurrying, setScurrying] = useState(false);
  const [posX, setPosX] = useState(BILLBOARD_SIDES.left);
  const [posY, setPosY] = useState(BILLBOARD_Y);

  const scurryingRef = useRef(false);
  const alertRef = useRef(alert);
  const rafRef = useRef<number | null>(null);
  const pigeonRef = useRef<SVGGElement>(null);
  const { velocity: scrollVelocity } = useLenisScroll();
  const velocityRef = useRef(0);

  const isVisibleRef = useRef(true);
  const sideRef = useRef(side);
  const boundingRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const handler = () => { isVisibleRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  useEffect(() => {
    sideRef.current = side;
    boundingRectRef.current = null; // Invalidate box when side updates
  }, [side]);

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  useEffect(() => {
    if (reducedMotion) return;
    const unsub = scrollVelocity.on('change', (v) => {
      velocityRef.current = Math.abs(v);
    });
    return unsub;
  }, [reducedMotion, scrollVelocity]);

  // Invalidate cached bounding box on window scroll or resize
  useEffect(() => {
    if (reducedMotion) return;
    const handleScrollOrResize = () => {
      boundingRectRef.current = null;
    };
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const startScurry = (nextSide: 'left' | 'right') => {
      if (scurryingRef.current) return;
      scurryingRef.current = true;
      setScurrying(true);
      boundingRectRef.current = null; // Clear cached position on scurry start

      const startX = BILLBOARD_SIDES[sideRef.current];
      const endX = BILLBOARD_SIDES[nextSide];
      const duration = 480; // ms (equivalent to 6 * 80ms)
      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (!isVisibleRef.current) { rafRef.current = requestAnimationFrame(animate); return; }
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth quadratic ease-in-out curve
        const t = progress;
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        setPosX(startX + eased * (endX - startX));
        setPosY(BILLBOARD_Y - ARC_PEAK * Math.sin(Math.PI * progress));
        boundingRectRef.current = null; // Invalidate during movement

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setPosX(endX);
          setPosY(BILLBOARD_Y);
          setSide(nextSide);
          setScurrying(false);
          scurryingRef.current = false;
          boundingRectRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    const handleInteraction = (e: MouseEvent) => {
      if (scurryingRef.current) return;
      if (!pigeonRef.current) return;

      if (!boundingRectRef.current) {
        boundingRectRef.current = pigeonRef.current.getBoundingClientRect();
      }
      const rect = boundingRectRef.current;
      if (!rect) return;

      const padding = 25;
      const isOver = e.clientX >= rect.left - padding && e.clientX <= rect.right + padding &&
                     e.clientY >= rect.top - padding && e.clientY <= rect.bottom + padding;
      if (!isOver) return;

      const nextSide = sideRef.current === 'left' ? 'right' : 'left';
      startScurry(nextSide);
    };

    window.addEventListener('mousemove', handleInteraction, { capture: true, passive: true });
    return () => window.removeEventListener('mousemove', handleInteraction, { capture: true });
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      if (!isVisibleRef.current) return;
      const vel = velocityRef.current;
      if (vel > 60 && !alertRef.current && !scurryingRef.current) setAlert(true);
      else if (vel <= 60 && alertRef.current && !scurryingRef.current) setAlert(false);
    }, 200);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
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
