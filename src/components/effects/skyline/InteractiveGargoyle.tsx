'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLenisScroll } from '@/context/LenisProvider';
import { useSkylineInteraction } from '../SkylineInteractionContext';
import styles from '../NoirSkyline.module.css';
import { LayerProps } from './types';

// Symmetric 6-frame wing cycle with eased spacing: 0% → 20% → 50% → 100% → 50% → 20%
const WING_FRAMES = [
  { // 0 — full up
    left: 'M -3 -12 C -24 -26, -38 -18, -44 -6 C -37 -3, -29 -8, -23 -3 C -18 1, -10 -1, -3 -10 Z',
    right: 'M 3 -12 C 24 -26, 38 -18, 44 -6 C 37 -3, 29 -8, 22 -3 C 18 1, 10 -1, 3 -10 Z',
    ribL1: 'M -3 -12 C -18 -12, -29 -8, -44 -6',
    ribL2: 'M -3 -12 C -15 -8, -21 -4, -23 -3',
    ribR1: 'M 3 -12 C 18 -12, 29 -8, 44 -6',
    ribR2: 'M 3 -12 C 15 -8, 21 -4, 22 -3',
  },
  { // 1 — 20% down (finer near apex)
    left: 'M -3 -12 C -24 -22, -38 -14, -44 -3 C -37 0, -29 -5, -23 -1 C -18 3, -10 0, -3 -10 Z',
    right: 'M 3 -12 C 24 -22, 38 -14, 44 -3 C 37 0, 29 -5, 22 -1 C 18 3, 10 0, 3 -10 Z',
    ribL1: 'M -3 -12 C -18 -10, -29 -6, -44 -3',
    ribL2: 'M -3 -12 C -15 -7, -21 -2, -23 -1',
    ribR1: 'M 3 -12 C 18 -10, 29 -6, 44 -3',
    ribR2: 'M 3 -12 C 15 -7, 21 -2, 22 -1',
  },
  { // 2 — 50% down (fastest mid-stroke)
    left: 'M -3 -12 C -24 -16, -38 -8, -44 2 C -37 4, -29 -1, -23 3 C -18 5, -10 2, -3 -10 Z',
    right: 'M 3 -12 C 24 -16, 38 -8, 44 2 C 37 4, 29 -1, 22 3 C 18 5, 10 2, 3 -10 Z',
    ribL1: 'M -3 -12 C -18 -8, -29 -2, -44 2',
    ribL2: 'M -3 -12 C -15 -5, -21 1, -23 3',
    ribR1: 'M 3 -12 C 18 -8, 29 -2, 44 2',
    ribR2: 'M 3 -12 C 15 -5, 21 1, 22 3',
  },
  { // 3 — full down
    left: 'M -3 -12 C -24 -6, -38 2, -44 10 C -37 11, -29 6, -23 9 C -18 10, -10 5, -3 -10 Z',
    right: 'M 3 -12 C 24 -6, 38 2, 44 10 C 37 11, 29 6, 23 9 C 18 10, 10 5, 3 -10 Z',
    ribL1: 'M -3 -12 C -18 -4, -29 4, -44 10',
    ribL2: 'M -3 -12 C -15 -2, -21 5, -23 9',
    ribR1: 'M 3 -12 C 18 -4, 29 4, 44 10',
    ribR2: 'M 3 -12 C 15 -2, 21 5, 22 9',
  },
  { // 4 — 50% up (ascending)
    left: 'M -3 -12 C -24 -16, -38 -8, -44 2 C -37 4, -29 -1, -23 3 C -18 5, -10 2, -3 -10 Z',
    right: 'M 3 -12 C 24 -16, 38 -8, 44 2 C 37 4, 29 -1, 22 3 C 18 5, 10 2, 3 -10 Z',
    ribL1: 'M -3 -12 C -18 -8, -29 -2, -44 2',
    ribL2: 'M -3 -12 C -15 -5, -21 1, -23 3',
    ribR1: 'M 3 -12 C 18 -8, 29 -2, 44 2',
    ribR2: 'M 3 -12 C 15 -5, 21 1, 22 3',
  },
  { // 5 — 20% up (ascending)
    left: 'M -3 -12 C -24 -22, -38 -14, -44 -3 C -37 0, -29 -5, -23 -1 C -18 3, -10 0, -3 -10 Z',
    right: 'M 3 -12 C 24 -22, 38 -14, 44 -3 C 37 0, 29 -5, 22 -1 C 18 3, 10 0, 3 -10 Z',
    ribL1: 'M -3 -12 C -18 -10, -29 -6, -44 -3',
    ribL2: 'M -3 -12 C -15 -7, -21 -2, -23 -1',
    ribR1: 'M 3 -12 C 18 -10, 29 -6, 44 -3',
    ribR2: 'M 3 -12 C 15 -7, 21 -2, 22 -1',
  },
];

const InteractiveGargoyle: React.FC<LayerProps> = ({ reducedMotion }) => {
  const [state, setState] = useState<
    'sitting' | 'blinking' | 'awakening' | 'leaping' | 'gliding_fg' | 'gliding_bg' | 'returning' | 'landing'
  >('sitting');
  const [posX, setPosX] = useState(1426);
  const [posY, setPosY] = useState(756);
  const [scale, setScale] = useState(1.0);
  const [opacity, setOpacity] = useState(1.0);
  const [frameIndex, setFrameIndex] = useState(0);

  const ticksRef = useRef(0);
  const stateRef = useRef(state);
  const gargoyleRef = useRef<SVGGElement>(null);
  const velocityRef = useRef(0);
  const { velocity: scrollVelocity } = useLenisScroll();

  const stateStartTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const boundingRectRef = useRef<DOMRect | null>(null);
  const { tick, isTabVisible, isIdle, geometryVersion } = useSkylineInteraction();
  const isVisibleRef = useRef(isTabVisible);
  const isIdleRef = useRef(isIdle);

  useEffect(() => {
    isVisibleRef.current = isTabVisible;
  }, [isTabVisible]);

  useEffect(() => {
    isIdleRef.current = isIdle;
  }, [isIdle]);

  useEffect(() => {
    if (reducedMotion) return;
    const unsub = scrollVelocity.on('change', (v) => {
      velocityRef.current = Math.abs(v);
    });
    return unsub;
  }, [reducedMotion, scrollVelocity]);

  useEffect(() => {
    stateRef.current = state;
    stateStartTimeRef.current = performance.now();
    boundingRectRef.current = null;
  }, [state]);

  useEffect(() => {
    boundingRectRef.current = null;
  }, [geometryVersion]);

  // Global mousemove and click detection with cached bounding box
  useEffect(() => {
    if (reducedMotion) return;

    const handleGlobalInteraction = (e: MouseEvent) => {
      if (stateRef.current !== 'sitting' && stateRef.current !== 'blinking') return;
      if (!gargoyleRef.current) return;

      if (!boundingRectRef.current) {
        boundingRectRef.current = gargoyleRef.current.getBoundingClientRect();
      }
      const rect = boundingRectRef.current;
      if (!rect) return;

      const padding = 15; // px hover boundary padding
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const isOver = 
        mouseX >= rect.left - padding &&
        mouseX <= rect.right + padding &&
        mouseY >= rect.top - padding &&
        mouseY <= rect.bottom + padding;

      if (isOver) {
        setState('awakening');
      }
    };

    window.addEventListener('mousemove', handleGlobalInteraction, { capture: true, passive: true });
    window.addEventListener('click', handleGlobalInteraction, { capture: true, passive: true });

    return () => {
      window.removeEventListener('mousemove', handleGlobalInteraction, { capture: true });
      window.removeEventListener('click', handleGlobalInteraction, { capture: true });
    };
  }, [reducedMotion]);

  // Smooth position updates using requestAnimationFrame
  useEffect(() => {
    if (reducedMotion) return;

    const isMovingState = ['leaping', 'gliding_fg', 'gliding_bg', 'returning', 'landing'].includes(state);
    if (!isMovingState) {
      requestAnimationFrame(() => {
        setPosX(1426);
        setPosY(756);
        setScale(1.0);
        setOpacity(1.0);
      });
      return;
    }

    const tick = () => {
      if (!isVisibleRef.current || isIdleRef.current) { rafRef.current = requestAnimationFrame(tick); return; }
      const currentState = stateRef.current;
      const elapsed = performance.now() - stateStartTimeRef.current;

      if (currentState === 'leaping') {
        const progress = Math.min(elapsed / 640, 1); // 8 ticks * 80ms = 640ms
        setPosX(1426 - progress * 66);
        setPosY((756 - progress * 76) - 35 * Math.sin(Math.PI * progress));
        setScale(1.0);
        setOpacity(1.0);
      } else if (currentState === 'gliding_fg') {
        const speedX = -0.25; // -20px per 80ms = -0.25px/ms
        const x = Math.max(-80, 1360 + speedX * elapsed);
        setPosX(x);
        if (x > 200) {
          setScale(1.0);
          setOpacity(1.0);
          setPosY(680 + Math.sin((1360 - x) * 0.0038) * 250);
        } else {
          const ratio = Math.max(0, Math.min(1, (x - (-80)) / (200 - (-80))));
          setScale(0.35 + ratio * 0.65);
          setOpacity(0.55 + ratio * 0.45);
          setPosY(420 + ratio * (400 - 420));
        }
      } else if (currentState === 'gliding_bg') {
        const speedX = 0.125; // 10px per 80ms = 0.125px/ms
        const x = Math.min(2000, -80 + speedX * elapsed);
        setPosX(x);
        setPosY(420 + Math.sin((elapsed / 80) * 0.15) * 15);
        setScale(0.35);
        setOpacity(0.55);
      } else if (currentState === 'returning') {
        const speedX = -0.25; // -20px per 80ms = -0.25px/ms
        const x = Math.max(1488, 2000 + speedX * elapsed);
        setPosX(x);
        const ratio = Math.max(0, Math.min(1, (x - 1488) / (2000 - 1488)));
        setScale(1.0 - ratio * 0.65);
        setOpacity(1.0 - ratio * 0.45);
        setPosY(710 - ratio * (710 - 420));
      } else if (currentState === 'landing') {
        const progress = Math.min(elapsed / 480, 1); // 6 ticks * 80ms = 480ms
        setPosX(1488 - progress * 62);
        setPosY(710 - progress * (710 - 756));
        setScale(1.0);
        setOpacity(1.0);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [state, reducedMotion]);

  // Shared tick drives state machine (single 80ms interval from SkylineInteractionContext)
  useEffect(() => {
    if (reducedMotion) return;
    const currentState = stateRef.current;
    ticksRef.current++;
    const ticks = ticksRef.current;

    const isFlying = ['leaping', 'gliding_fg', 'gliding_bg', 'returning', 'landing'].includes(currentState);
    if (isFlying) {
      setFrameIndex((f) => (f + 1) % 6);
    } else {
      setFrameIndex(0);
    }

    if (currentState === 'sitting') {
      // High scroll velocity awakens the gargoyle
      if (velocityRef.current > 200) {
        ticksRef.current = 0;
        setState('awakening');
      } else if (ticks >= 80) { // every 6.4 seconds, blink eyes
        ticksRef.current = 0;
        setState('blinking');
      }
    } else if (currentState === 'blinking') {
      // Can be startled mid-blink by fast scroll
      if (velocityRef.current > 200) {
        ticksRef.current = 0;
        setState('awakening');
      } else if (ticks >= 6) { // blink duration
        ticksRef.current = 0;
        setState('sitting');
      }
    } else if (currentState === 'awakening') {
      if (ticks >= 6) {
        ticksRef.current = 0;
        setState('leaping');
      }
    } else if (currentState === 'leaping') {
      if (ticks >= 8) {
        ticksRef.current = 0;
        setState('gliding_fg');
      }
    } else if (currentState === 'gliding_fg') {
      if (ticks >= 72) {
        ticksRef.current = 0;
        setState('gliding_bg');
      }
    } else if (currentState === 'gliding_bg') {
      if (ticks >= 208) {
        ticksRef.current = 0;
        setState('returning');
      }
    } else if (currentState === 'returning') {
      if (ticks >= 26) {
        ticksRef.current = 0;
        setState('landing');
      }
    } else if (currentState === 'landing') {
      if (ticks >= 6) {
        ticksRef.current = 0;
        setState('sitting');
      }
    }
  }, [tick, reducedMotion]);

  // ── Pigeon on the same pedestal ──
  const [pigeonOffsetX, setPigeonOffsetX] = useState(0);
  const [pigeonAlert, setPigeonAlert] = useState(false);

  useEffect(() => {
    let timer1: NodeJS.Timeout | null = null;
    let timer2: NodeJS.Timeout | null = null;

    if (state === 'awakening' || state === 'leaping') {
      timer1 = setTimeout(() => setPigeonAlert(true), 0);
    } else if (['gliding_fg', 'gliding_bg', 'returning', 'landing'].includes(state)) {
      timer1 = setTimeout(() => {
        setPigeonAlert(false);
        setPigeonOffsetX(15);
      }, 0);
    } else if (state === 'sitting' || state === 'blinking') {
      timer1 = setTimeout(() => setPigeonOffsetX(0), 0);
      timer2 = setTimeout(() => setPigeonAlert(false), 800);
    }

    return () => {
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
    };
  }, [state]);

  const handleMouseEnter = () => {
    setState((s) => {
      if (s === 'sitting' || s === 'blinking') {
        return 'awakening';
      }
      return s;
    });
  };

  const renderFrame = () => {
    const gargoyleFill = 'var(--skyline-gargoyle-fill)';
    const strokeColor = 'var(--skyline-stroke-fg)';
    const eyeColor = 'var(--skyline-gargoyle-eyes)';

    // Distant background scale down and color blend
    const isDistant = state === 'gliding_bg' || (state === 'gliding_fg' && scale < 0.6) || (state === 'returning' && scale < 0.6);
    const fillValue = isDistant ? 'var(--skyline-stroke-mid)' : gargoyleFill;
    const strokeValue = isDistant ? 'var(--skyline-stroke-bg)' : strokeColor;

    const isFacingRight = state === 'gliding_bg';

    const getElement = () => {
      switch (state) {
        case 'sitting':
        case 'blinking':
          return (
            <g>
              {/* Pedestal */}
              <path d="M -10 0 L 10 0 L 8 3 L -8 3 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* S-curve tail rising prominently to the side with spade tip */}
              <path d="M 5 -4 C 16 -1, 14 -12, 18 -18" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 18 -18 L 14 -19 L 17 -15 Z" fill={fillValue} stroke={strokeValue} strokeWidth="0.8" />

              {/* Arching bat wings pointing down and out */}
              <path d="M -4 -11 C -8 -17, -18 -17, -22 -4 C -18 -1, -12 -3, -5 -4 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 4 -11 C 8 -17, 18 -17, 22 -4 C 18 -1, 12 -3, 5 -4 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Wings Inner Rib Lines */}
              <path d="M -4 -11 C -10 -9, -18 -6, -22 -4" fill="none" stroke={strokeValue} strokeWidth="0.8" />
              <path d="M 4 -11 C 10 -9, 18 -6, 22 -4" fill="none" stroke={strokeValue} strokeWidth="0.8" />
              
              {/* Crouched Body & low hunched chest */}
              <path d="M -6 0 C -9 -5, -8 -13, 0 -14 C 8 -13, 9 -5, 6 0 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Knees pulled up wide */}
              <path d="M -6 0 C -14 -2, -13 -8, -5 -6" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 6 0 C 14 -2, 13 -8, 5 -6" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Muscle lines/shoulders */}
              <path d="M -4 -8 C -7 -9, -7 -14, -3 -12" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 4 -8 C 7 -9, 7 -14, 3 -12" fill="none" stroke={strokeValue} strokeWidth="1" />

              {/* Legs details */}
              <path d="M -5 -1 Q -8 -4 -4 -2" fill="none" stroke={strokeValue} strokeWidth="1.2" />
              <path d="M 5 -1 Q 8 -4 4 -2" fill="none" stroke={strokeValue} strokeWidth="1.2" />

              {/* Claws clutching pedestal outer corners */}
              <path d="M -8 0 L -11 3 L -9 4 L -7 2" fill="none" stroke={strokeValue} strokeWidth="1.2" />
              <path d="M 8 0 L 11 3 L 9 4 L 7 2" fill="none" stroke={strokeValue} strokeWidth="1.2" />

              {/* Head nestled between shoulders (squat) */}
              <path d="M -4 -13 C -6 -18, -4 -20, 0 -21 C 4 -20, 6 -18, 4 -13 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Snout/fangs details */}
              <path d="M -1.8 -15 L 0 -13.5 L 1.8 -15" fill="none" stroke={strokeValue} strokeWidth="0.8" />

              {/* Pointed ears sticking out */}
              <path d="M -2.5 -18 L -6 -22 L -4 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 2.5 -18 L 6 -22 L 4 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Coiled ram horns wrapping around ears */}
              <path d="M -1.5 -19 C -5 -21, -8 -17, -6 -14 C -5 -13, -3 -15, -1.8 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 1.5 -19 C 5 -21, 8 -17, 6 -14 C 5 -13, 3 -15, 1.8 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Eyes */}
              <g
                className={state === 'blinking' ? styles.gargoyleEyes : ''}
                fill={eyeColor}
                stroke="none"
              >
                <circle cx="-1.5" cy="-16.5" r="0.7" />
                <circle cx="1.5" cy="-16.5" r="0.7" />
              </g>
            </g>
          );
        case 'awakening':
          return (
            <g>
              {/* Pedestal */}
              <path d="M -10 0 L 10 0 L 8 3 L -8 3 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* S-curve tail rising prominently to the side with spade tip */}
              <path d="M 5 -4 C 16 -1, 14 -12, 18 -18" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 18 -18 L 14 -19 L 17 -15 Z" fill={fillValue} stroke={strokeValue} strokeWidth="0.8" />

              {/* Wings unfolding high */}
              <path d="M -4 -15 C -25 -18, -25 -2, -10 2 C -10 -4, -6 -10, -4 -15 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 4 -15 C 25 -18, 25 -2, 10 2 C 10 -4, 6 -10, 4 -15 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M -4 -15 C -15 -10, -17 -3, -10 2" fill="none" stroke={strokeValue} strokeWidth="0.8" />
              <path d="M 4 -15 C 15 -10, 17 -3, 10 2" fill="none" stroke={strokeValue} strokeWidth="0.8" />
              
              {/* Crouched Body & low hunched chest */}
              <path d="M -6 0 C -9 -5, -8 -13, 0 -14 C 8 -13, 9 -5, 6 0 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Knees pulled up wide */}
              <path d="M -6 0 C -14 -2, -13 -8, -5 -6" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 6 0 C 14 -2, 13 -8, 5 -6" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Muscle lines/shoulders */}
              <path d="M -4 -8 C -7 -9, -7 -14, -3 -12" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 4 -8 C 7 -9, 7 -14, 3 -12" fill="none" stroke={strokeValue} strokeWidth="1" />

              {/* Legs details */}
              <path d="M -5 -1 Q -8 -4 -4 -2" fill="none" stroke={strokeValue} strokeWidth="1.2" />
              <path d="M 5 -1 Q 8 -4 4 -2" fill="none" stroke={strokeValue} strokeWidth="1.2" />

              {/* Claws clutching pedestal outer corners */}
              <path d="M -8 0 L -11 3 L -9 4 L -7 2" fill="none" stroke={strokeValue} strokeWidth="1.2" />
              <path d="M 8 0 L 11 3 L 9 4 L 7 2" fill="none" stroke={strokeValue} strokeWidth="1.2" />

              {/* Head nestled between shoulders (squat) */}
              <path d="M -4 -13 C -6 -18, -4 -20, 0 -21 C 4 -20, 6 -18, 4 -13 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Snout/fangs details */}
              <path d="M -1.8 -15 L 0 -13.5 L 1.8 -15" fill="none" stroke={strokeValue} strokeWidth="0.8" />

              {/* Pointed ears sticking out */}
              <path d="M -2.5 -18 L -6 -22 L -4 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 2.5 -18 L 6 -22 L 4 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Coiled ram horns wrapping around ears */}
              <path d="M -1.5 -19 C -5 -21, -8 -17, -6 -14 C -5 -13, -3 -15, -1.8 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 1.5 -19 C 5 -21, 8 -17, 6 -14 C 5 -13, 3 -15, 1.8 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Glowing Eyes */}
              <g className={styles.gargoyleEyesAwake} stroke="none">
                <circle cx="-1.5" cy="-16.5" r="0.9" />
                <circle cx="1.5" cy="-16.5" r="0.9" />
              </g>
            </g>
          );
        case 'leaping':
        case 'gliding_fg':
        case 'gliding_bg':
        case 'returning':
        case 'landing': {
          const frame = frameIndex;

          const leftWing = WING_FRAMES[frame].left;
          const rightWing = WING_FRAMES[frame].right;
          const ribLeft1 = WING_FRAMES[frame].ribL1;
          const ribLeft2 = WING_FRAMES[frame].ribL2;
          const ribRight1 = WING_FRAMES[frame].ribR1;
          const ribRight2 = WING_FRAMES[frame].ribR2;

          return (
            <g>
              <path d={leftWing} fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d={rightWing} fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              <path d={ribLeft1} fill="none" stroke={strokeValue} strokeWidth="0.8" />
              <path d={ribLeft2} fill="none" stroke={strokeValue} strokeWidth="0.8" />
              <path d={ribRight1} fill="none" stroke={strokeValue} strokeWidth="0.8" />
              <path d={ribRight2} fill="none" stroke={strokeValue} strokeWidth="0.8" />

              {/* Stretched gliding body */}
              <path d="M -16 -4 C -14 -12, 12 -12, 14 -4 C 10 -2, -12 -2, -16 -4 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Head facing forward / profile snout */}
              <g transform="translate(-16, -6)">
                <path d="M 0 2 C -4 -2, -5 -9, 0 -8 C 5 -7, 6 -1, 0 2 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                <path d="M -2.5 -5 L -5 -11 L -1 -8 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                <path d="M 2.5 -5 L 5 -11 L 1 -8 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                
                {/* Glowing Profile Eye */}
                {!isDistant && (
                  <g className={styles.gargoyleEyesAwake} stroke="none">
                    <circle cx="-1.5" cy="-2.5" r="0.9" />
                  </g>
                )}
              </g>

              {/* Legs tucked in back */}
              <path d="M 10 -4 C 14 -3, 15 2, 11 3" fill="none" stroke={strokeValue} strokeWidth="1" />
              
              {/* Tail trailing behind with spade */}
              <path d="M 14 -6 Q 24 -12, 28 -7" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 28 -7 L 25 -4 L 31 -6 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
            </g>
          );
        }
        default:
          return null;
      }
    };

    const element = getElement();
    if (!element) return null;

    let transformStr = `scale(${scale})`;
    if (isFacingRight) {
      transformStr += ' scale(-1, 1)';
    }

    return (
      <g transform={transformStr}>
        {element}
      </g>
    );
  };

  if (reducedMotion) return null;

  return (
    <>
      <g
        ref={gargoyleRef}
        transform={`translate(${posX}, ${posY})`}
        onMouseEnter={handleMouseEnter}
        onClick={handleMouseEnter}
        style={{
          cursor: (state === 'sitting' || state === 'blinking') ? 'pointer' : 'default',
          pointerEvents: 'auto',
          opacity
        }}
      >
        <rect x="-35" y="-35" width="70" height="45" fill="black" opacity="0" style={{ pointerEvents: 'all' }} />
        {renderFrame()}
      </g>

      {/* Pigeon on the same pedestal */}
      <g transform={`translate(${1440 + pigeonOffsetX}, 759)`}>
        <g transform="scale(1.5)">
          <g className={pigeonAlert ? styles.pigeonHeadBob : styles.pigeonBob}>
            <ellipse cx="0" cy="-3" rx="3" ry="2.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
            <circle cx="3" cy="-5.5" r="1.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.6" />
            <path d="M 4 -5.5 L 5.5 -5 L 4 -4.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
            <path d="M -3 -2 L -5 -1 L -3 -0.5" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
            <line x1="-1" y1="0" x2="-1.5" y2="1.5" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
            <line x1="1" y1="0" x2="1.5" y2="1.5" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
            {pigeonAlert ? (
              <path d="M -1 -2 C -6 -8, -3 -1, 0 -2 C 3 -1, 6 -8, 1 -2" fill="var(--skyline-pigeon-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.4" />
            ) : null}
          </g>
        </g>
      </g>
    </>
  );
};

export default InteractiveGargoyle;
