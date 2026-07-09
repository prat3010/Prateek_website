'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSkylineInteraction } from '../SkylineInteractionContext';
import styles from '../NoirSkyline.module.css';

const BILLBOARD_SIDES = { left: 135, right: 205 };
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

  const sideRef = useRef(side);
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
    sideRef.current = side;
    boundingRectRef.current = null;
  }, [side]);

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  useEffect(() => {
    boundingRectRef.current = null;
  }, [geometryVersion]);

  const startScurry = useCallback((nextSide: 'left' | 'right') => {
    if (reducedMotion || scurryingRef.current) return;
    scurryingRef.current = true;
    setScurrying(true);
    boundingRectRef.current = null;

    const startX = BILLBOARD_SIDES[sideRef.current];
    const endX = BILLBOARD_SIDES[nextSide];
    const duration = 480;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!isVisibleRef.current || isIdleRef.current) { rafRef.current = null; return; }
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const t = progress;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      setPosX(startX + eased * (endX - startX));
      setPosY(BILLBOARD_Y - ARC_PEAK * Math.sin(Math.PI * progress));
      boundingRectRef.current = null;

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
  }, [reducedMotion]);

  // Mouse hit detection via shared context (replaces per-creature capture listener)
  useEffect(() => {
    if (reducedMotion) return;
    if (scurryingRef.current || !pigeonRef.current) return;

    if (!boundingRectRef.current) {
      boundingRectRef.current = pigeonRef.current.getBoundingClientRect();
    }
    const rect = boundingRectRef.current;
    if (!rect) return;

    const padding = 25;
    const mouse = mousePosRef.current;
    const isOver =
      mouse.x >= rect.left - padding && mouse.x <= rect.right + padding &&
      mouse.y >= rect.top - padding && mouse.y <= rect.bottom + padding;
    if (isOver) {
      const nextSide = sideRef.current === 'left' ? 'right' : 'left';
      startScurry(nextSide);
    }
  }, [tick, reducedMotion, mousePosRef, startScurry]);

  // Shared tick drives velocity-based alert state (160ms tick from SkylineInteractionContext)
  useEffect(() => {
    if (reducedMotion) return;
    const vel = scrollVelocityRef.current;
    if (vel > 60 && !alertRef.current && !scurryingRef.current) setAlert(true);
    else if (vel <= 60 && alertRef.current && !scurryingRef.current) setAlert(false);
  }, [tick, reducedMotion, scrollVelocityRef]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const facingLeft = side === 'right';
  const scaleX = facingLeft ? -1.5 : 1.5;

  if (reducedMotion) return null;

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
