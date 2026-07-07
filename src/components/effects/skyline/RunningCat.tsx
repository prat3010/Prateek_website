'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSkylineInteraction } from '../SkylineInteractionContext';
import styles from '../NoirSkyline.module.css';
import { LayerProps } from './types';

const RunningCat: React.FC<LayerProps> = ({ reducedMotion }) => {
  const [state, setState] = useState<
    'sitting' | 'alert' | 'standing' | 'walking' | 'jumping' | 'landing' | 'running' | 'hidden' | 'returning' | 'jumping_up' | 'landing_up' | 'walking_back' | 'sitting_down'
  >('sitting');
  const [frameIndex, setFrameIndex] = useState(0);
  const [posX, setPosX] = useState(320);
  const [posY, setPosY] = useState(750);

  const ticksRef = useRef(0);
  const stateRef = useRef(state);
  const catRef = useRef<SVGGElement>(null);
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

    // Shared tick drives state machine (single 160ms interval from SkylineInteractionContext)
    useEffect(() => {
      if (reducedMotion) return;
      const currentState = stateRef.current;

      // Mouse/click hit detection (replaces per-creature capture listeners)
      if (currentState === 'sitting' && catRef.current) {
        if (!boundingRectRef.current) {
          boundingRectRef.current = catRef.current.getBoundingClientRect();
        }
        const rect = boundingRectRef.current;
        if (rect) {
          const padding = 15;
          const mouse = mousePosRef.current;
          const isOver =
            mouse.x >= rect.left - padding &&
            mouse.x <= rect.right + padding &&
            mouse.y >= rect.top - padding &&
            mouse.y <= rect.bottom + padding;
          if (isOver) {
            ticksRef.current = 0;
            setState('standing');
            return;
          }
        }
      }

      if (currentState === 'sitting') {
        ticksRef.current = 0;
        if (scrollVelocityRef.current > 120) {
          setState('alert');
        }
        return;
      }

      ticksRef.current++;
      const ticks = ticksRef.current;

      if (currentState === 'alert') {
        if (ticks >= 4) {
          ticksRef.current = 0;
          if (scrollVelocityRef.current > 60) {
            setState('standing');
          } else {
            setState('sitting');
          }
        }
        return;
      }

      if (currentState === 'standing') {
        if (ticks >= 5) {
          ticksRef.current = 0;
          setState('walking');
        }
      } else if (currentState === 'walking') {
        setPosX((x) => x - 6);
        setFrameIndex((f) => (f + 1) % 2);
        if (ticks >= 5) {
          ticksRef.current = 0;
          setState('jumping');
        }
      } else if (currentState === 'jumping') {
        // Position driven by RAF effect, only handle state transition here
        if (ticks >= 4) {
          ticksRef.current = 0;
          setPosX(260);
          setPosY(820);
          setState('landing');
        }
      } else if (currentState === 'landing') {
        if (ticks >= 2) {
          ticksRef.current = 0;
          setState('running');
        }
      } else if (currentState === 'running') {
        setPosX((x) => Math.max(-50, x - 24));
        setFrameIndex((f) => (f + 1) % 4);

        if (ticks >= 13) {
          ticksRef.current = 0;
          setState('hidden');
        }
      } else if (currentState === 'hidden') {
        if (ticks >= 20) {
          ticksRef.current = 0;
          setPosX(-50);
          setPosY(820);
          setState('returning');
        }
      } else if (currentState === 'returning') {
        setPosX((x) => Math.min(260, x + 6));
        setFrameIndex((f) => (f + 1) % 2);

        if (ticks >= 52) {
          ticksRef.current = 0;
          setPosX(260);
          setPosY(820);
          setState('jumping_up');
        }
      } else if (currentState === 'jumping_up') {
        // Position driven by RAF effect, only handle state transition here
        if (ticks >= 4) {
          ticksRef.current = 0;
          setPosX(290);
          setPosY(750);
          setState('landing_up');
        }
      } else if (currentState === 'landing_up') {
        if (ticks >= 2) {
          ticksRef.current = 0;
          setState('walking_back');
        }
      } else if (currentState === 'walking_back') {
        setPosX((x) => Math.min(320, x + 6));
        setFrameIndex((f) => (f + 1) % 2);

        if (ticks >= 5) {
          ticksRef.current = 0;
          setPosX(320);
          setPosY(750);
          setState('sitting_down');
        }
      } else if (currentState === 'sitting_down') {
        if (ticks >= 2) {
          ticksRef.current = 0;
          setState('sitting');
        }
      }
    }, [tick, reducedMotion, mousePosRef, scrollVelocityRef]);

  // Smooth position interpolation for jumping states (replaces stepped tick-based positions)
  useEffect(() => {
    if (reducedMotion) return;
    if (state !== 'jumping' && state !== 'jumping_up') return;

    const isJumpingDown = state === 'jumping';
    const startX = isJumpingDown ? 290 : 260;
    const endX = isJumpingDown ? 260 : 290;
    const startY = isJumpingDown ? 750 : 820;
    const endY = isJumpingDown ? 820 : 750;
    const duration = 640;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!isVisibleRef.current || isIdleRef.current) { rafRef.current = null; return; }
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const x = startX + (endX - startX) * progress;
      const yLinear = startY + (endY - startY) * progress;
      const yArc = 20 * Math.sin(Math.PI * progress);
      setPosX(x);
      setPosY(yLinear - yArc);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, reducedMotion]);

  const handleMouseEnter = () => {
    setState((s) => {
      if (s === 'sitting' || s === 'alert') {
        return 'standing';
      }
      return s;
    });
  };

  const renderedFrame = useMemo(() => {
    const catFill = 'var(--skyline-cat-fill)';
    const strokeColor = 'var(--skyline-stroke-fg)';
    const eyeColor = 'var(--skyline-cat-eyes)';

    const isFacingRight = [
      'returning',
      'jumping_up',
      'landing_up',
      'walking_back',
      'sitting_down'
    ].includes(state);

    const getElement = () => {
      switch (state) {
        case 'alert':
          return (
            <g>
              {/* Alert body - taller, tense posture */}
              <path d="M -7 0 C -7 -15, 7 -15, 7 0 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              {/* Front paws planted */}
              <path d="M -7 0 L -9 2 M -4 0 L -5 2 M 4 0 L 5 2 M 7 0 L 9 2" fill="none" stroke={strokeColor} strokeWidth="1" />
              {/* Head higher */}
              <circle cx="0" cy="-26" r="5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              {/* Perked ears */}
              <polygon points="-5,-29 -10,-39 -2,-34" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="5,-29 10,-39 2,-34" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              {/* Stiff raised tail */}
              <path d="M 5 -4 Q 14 -6 13 -18 T 16 -30" fill="none" stroke={strokeColor} strokeWidth="1.2" className={styles.catTail} style={{ transformOrigin: '5px -4px' }} />
              {/* Wide alert eyes */}
              <g className={styles.catEyes} fill={eyeColor} stroke="none" style={{ transformOrigin: '0px -26.5px' }}>
                <circle cx="-1.5" cy="-26.5" r="1.2" />
                <circle cx="1.5" cy="-26.5" r="1.2" />
              </g>
            </g>
          );
        case 'sitting':
        case 'sitting_down':
          return (
            <g>
              <path d="M -6 0 C -6 -12, 6 -12, 6 0 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <circle cx="0" cy="-22" r="5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-4,-25 -7,-32 -2,-29" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="4,-25 7,-32 2,-29" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path
                d="M 5 -4 Q 12 -7 9 -15 T 13 -25"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                className={styles.catTail}
                style={{ transformOrigin: '5px -4px' }}
              />
              <g
                className={styles.catEyes}
                fill={eyeColor}
                stroke="none"
                style={{ transformOrigin: '0px -22.5px' }}
              >
                <circle cx="-1.5" cy="-22.5" r="0.8" />
                <circle cx="1.5" cy="-22.5" r="0.8" />
              </g>
            </g>
          );
        case 'standing':
          return (
            <g>
              <path d="M -8 -3 C -8 -11, 6 -11, 6 -3 L 5 0 L -6 0 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M -5 -3 L -6 0 M -3 -3 L -4 0 M 3 -3 L 2 0 M 5 -3 L 4 0" fill="none" stroke={strokeColor} strokeWidth="1" />
              <circle cx="7" cy="-15" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="4.5,-17.5 3,-22 6.5,-20" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="9.5,-17.5 11,-22 8,-20" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M -8 -8 Q -12 -12 -8 -16 T -11 -21" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <g fill={eyeColor} stroke="none">
                <circle cx="5.5" cy="-15.5" r="0.7" />
                <circle cx="8.5" cy="-15.5" r="0.7" />
              </g>
            </g>
          );
        case 'walking':
        case 'returning':
        case 'walking_back':
          const isAlt = frameIndex % 2 === 0;
          return (
            <g>
              <path d="M -7 -4 C -7 -11, 7 -11, 7 -4 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              {isAlt ? (
                <path d="M -5 -4 L -8 -1 M -3 -4 L -2 0 M 3 -4 L 2 0 M 5 -4 L 8 -1" fill="none" stroke={strokeColor} strokeWidth="1" />
              ) : (
                <path d="M -5 -4 L -4 0 M -3 -4 L -6 -1 M 3 -4 L 5 -1 M 5 -4 L 4 0" fill="none" stroke={strokeColor} strokeWidth="1" />
              )}
              <circle cx="-9" cy="-12" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-11.5,-14.5 -13,-19 -10,-17" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-7.5,-14.5 -6,-19 -9,-17" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M 6 -8 Q 11 -7 14 -11" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <g fill={eyeColor} stroke="none">
                <circle cx="-10.5" cy="-12.5" r="0.7" />
                <circle cx="-7.5" cy="-12.5" r="0.7" />
              </g>
            </g>
          );
        case 'jumping':
        case 'jumping_up':
          return (
            <g>
              <path d="M -9 -5 C -7 -12, 5 -10, 7 -3 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M 6 -3 L 10 1 M 4 -4 L 7 0 M -8 -5 L -12 -8 M -6 -5 L -10 -7" fill="none" stroke={strokeColor} strokeWidth="1" />
              <circle cx="-10" cy="-11" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-12.5,-13 -14,-18 -11,-15.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-8.5,-13 -7,-18 -10,-15.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M 7 -6 Q 13 -4 17 -7" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <g fill={eyeColor} stroke="none">
                <circle cx="-11.5" cy="-11.5" r="0.7" />
                <circle cx="-8.5" cy="-11.5" r="0.7" />
              </g>
            </g>
          );
        case 'landing':
        case 'landing_up':
          return (
            <g>
              <path d="M -8 -2 C -8 -9, 6 -9, 6 -2 L 5 0 L -6 0 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M -5 -2 L -7 0 M -3 -2 L -4 0 M -1 -2 L -2 0 M 3 -2 L 2 0" fill="none" stroke={strokeColor} strokeWidth="1" />
              <circle cx="-7" cy="-9" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-9.5,-11.5 -11,-16 -8,-14" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-5.5,-11.5 -4,-16 -7,-14" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M 5 -4 Q 10 -2 9 -8" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <g fill={eyeColor} stroke="none">
                <circle cx="-8.5" cy="-9.5" r="0.7" />
                <circle cx="-5.5" cy="-9.5" r="0.7" />
              </g>
            </g>
          );
        case 'running':
          if (frameIndex === 0) {
            return (
              <g>
                <path d="M -8 -5 C -8 -12, 7 -12, 7 -5 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 6 -5 L 11 -1 M 4 -5 L 8 -2 M -7 -5 L -12 -1 M -5 -5 L -9 -2" fill="none" stroke={strokeColor} strokeWidth="1" />
                <circle cx="-10" cy="-13" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-12.5,-15.5 -14,-20 -11,-18" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-8.5,-15.5 -7,-20 -10,-18" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 7 -9 Q 13 -8 16 -12" fill="none" stroke={strokeColor} strokeWidth="1.2" />
                <g fill={eyeColor} stroke="none">
                  <circle cx="-11.5" cy="-13.5" r="0.7" />
                  <circle cx="-8.5" cy="-13.5" r="0.7" />
                </g>
              </g>
            );
          } else if (frameIndex === 1) {
            return (
              <g>
                <path d="M -7 -7 C -7 -14, 7 -14, 7 -7 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 4 -7 L 3 -1 M 2 -7 L 1 -2 M -4 -7 L -3 -1 M -2 -7 L -1 -2" fill="none" stroke={strokeColor} strokeWidth="1" />
                <circle cx="-9" cy="-15" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-11.5,-17.5 -13,-22.5 -10,-20" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-7.5,-17.5 -6,-22.5 -9,-20" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 6 -11 Q 12 -13 14 -9" fill="none" stroke={strokeColor} strokeWidth="1.2" />
                <g fill={eyeColor} stroke="none">
                  <circle cx="-10.5" cy="-15.5" r="0.7" />
                  <circle cx="-7.5" cy="-15.5" r="0.7" />
                </g>
              </g>
            );
          } else if (frameIndex === 2) {
            return (
              <g>
                <path d="M -6 -6 C -6 -13, 6 -13, 6 -6 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 4 -6 L 6 -3 M -4 -6 L -6 -3" fill="none" stroke={strokeColor} strokeWidth="1" />
                <circle cx="-8" cy="-14" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-10.5,-16.5 -12,-21.5 -9,-19" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-6.5,-16.5 -5,-21.5 -8,-19" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 5 -10 Q 9 -15 13 -12" fill="none" stroke={strokeColor} strokeWidth="1.2" />
                <g fill={eyeColor} stroke="none">
                  <circle cx="-9.5" cy="-14.5" r="0.7" />
                  <circle cx="-6.5" cy="-14.5" r="0.7" />
                </g>
              </g>
            );
          } else {
            return (
              <g>
                <path d="M -8 -8 C -8 -15, 8 -15, 8 -8 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 5 -8 L 8 -5 M 3 -8 L 6 -6 M -6 -8 L -9 -5 M -4 -8 L -7 -6" fill="none" stroke={strokeColor} strokeWidth="1" />
                <circle cx="-10" cy="-16" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-12.5,-18.5 -14,-23.5 -11,-21" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-8.5,-18.5 -7,-23.5 -10,-21" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 7 -12 Q 12 -15 15 -11" fill="none" stroke={strokeColor} strokeWidth="1.2" />
                <g fill={eyeColor} stroke="none">
                  <circle cx="-11.5" cy="-16.5" r="0.7" />
                  <circle cx="-8.5" cy="-16.5" r="0.7" />
                </g>
              </g>
            );
          }
        case 'hidden':
        default:
          return null;
      }
    };

    const element = getElement();
    if (!element) return null;

    if (isFacingRight) {
      return (
        <g transform="scale(-1, 1)">
          {element}
        </g>
      );
    }
    return element;
  }, [state, frameIndex]);

  if (reducedMotion) return null;

  return (
    <g
      ref={catRef}
      transform={`translate(${posX}, ${posY})`}
      onMouseEnter={handleMouseEnter}
      onClick={handleMouseEnter}
      style={{ 
        cursor: state === 'sitting' ? 'pointer' : 'default',
        pointerEvents: 'auto'
      }}
    >
      <rect x="-20" y="-35" width="40" height="40" fill="black" opacity="0" style={{ pointerEvents: 'all' }} />
      {renderedFrame}
    </g>
  );
};

export default RunningCat;
