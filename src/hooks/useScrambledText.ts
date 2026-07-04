'use client';

import { useState, useEffect, useRef } from 'react';

const SCRAMBLE_POOL =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()£€¥+={}[]<>/~`';

const LEET_MAP: Record<string, string[]> = {
  A: ['4', '@'],
  B: ['8'],
  E: ['3', '£'],
  G: ['9', '&'],
  H: ['#'],
  I: ['1', '!', '|'],
  L: ['7', '|'],
  O: ['0', '()'],
  S: ['5', '$'],
  T: ['7', '+'],
  Z: ['2'],
};

function getLeet(char: string): string | null {
  const upper = char.toUpperCase();
  const variants = LEET_MAP[upper];
  if (!variants) return null;
  return variants[Math.floor(Math.random() * variants.length)];
}

function getRandomChar(): string {
  return SCRAMBLE_POOL[Math.floor(Math.random() * SCRAMBLE_POOL.length)];
}

function getScrambleChar(
  sourceChar: string,
  targetChar: string,
  progress: number,
): string {
  if (progress <= 0) return sourceChar;
  if (progress >= 1) return targetChar;

  const r = Math.random();

  /* Phase 1 (0–45%): corrupt source with leet / glitch */
  if (progress < 0.45) {
    const p = progress / 0.45;
    const sourceBias = 0.5 - p * 0.35;
    const leetBias = 0.05 + p * 0.35;

    if (r < sourceBias) return sourceChar;
    if (r < sourceBias + leetBias) return getLeet(sourceChar) ?? getRandomChar();
    if (r < sourceBias + leetBias + 0.15) return getRandomChar();
    return targetChar;
  }

  /* Phase 2 (45–80%): target bleeds in */
  if (progress < 0.8) {
    const p = (progress - 0.45) / 0.35;
    const targetBias = 0.2 + p * 0.45;
    const leetBias = 0.15 - p * 0.08;

    if (r < targetBias) return targetChar;
    if (r < targetBias + leetBias) return getLeet(targetChar) ?? targetChar;
    if (r < targetBias + leetBias + 0.1)
      return getLeet(sourceChar) ?? getRandomChar();
    return getRandomChar();
  }

  /* Phase 3 (80–100%): settle into target */
  const p = (progress - 0.8) / 0.2;
  if (r < 0.75 + p * 0.22) return targetChar;
  if (r < 0.88) return getLeet(targetChar) ?? targetChar;
  return getRandomChar();
}

export interface ScrambledCharData {
  char: string;
  opacity: number;
  key: number;
}

export interface UseScrambledTextOptions {
  sourceText: string;
  targetText: string;
  duration: number;
  staggerPerChar: number;
  triggerSeed: number;
  onDone?: () => void;
}

function maxLen(a: string, b: string): number {
  return Math.max(a.length, b.length);
}

export function useScrambledText({
  sourceText,
  targetText,
  duration,
  staggerPerChar,
  triggerSeed,
  onDone,
}: UseScrambledTextOptions) {
  const [chars, setChars] = useState<ScrambledCharData[]>(() =>
    buildChars(targetText),
  );
  const rafRef = useRef<number | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (triggerSeed === 0) return;

    const len = maxLen(sourceText, targetText);
    const totalDuration = duration + staggerPerChar * len;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const result: ScrambledCharData[] = [];

      for (let i = 0; i < len; i++) {
        const charStartMs = i * staggerPerChar;
        const charDuration = Math.max(50, duration - charStartMs);
        const charElapsed = elapsed - charStartMs;
        const localProgress = Math.max(
          0,
          Math.min(charElapsed / charDuration, 1),
        );

        const hasSource = i < sourceText.length;
        const hasTarget = i < targetText.length;

        if (hasSource && hasTarget && sourceText[i] === targetText[i]) {
          result.push({ char: targetText[i], opacity: 1, key: i });
        } else if (hasSource && hasTarget) {
          const char =
            localProgress >= 1
              ? targetText[i]
              : getScrambleChar(sourceText[i], targetText[i], localProgress);
          result.push({ char, opacity: 1, key: i });
        } else if (hasSource && !hasTarget) {
          result.push({
            char: localProgress < 0.5 ? sourceText[i] : getRandomChar(),
            opacity: Math.max(0, 1 - localProgress),
            key: i,
          });
        } else if (!hasSource && hasTarget) {
          result.push({
            char: localProgress > 0.5 ? targetText[i] : getRandomChar(),
            opacity: localProgress,
            key: i,
          });
        } else {
          result.push({ char: ' ', opacity: 0, key: i });
        }
      }

      setChars(result);

      if (elapsed < totalDuration) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setChars(buildChars(targetText));
        /* Notify completion inside rAF callback to avoid sync setState in effect */
        rafRef.current = requestAnimationFrame(() => onDoneRef.current?.());
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    /* Values captured by closure — intentionally stable per trigger */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSeed]);

  return { chars };
}

function buildChars(text: string): ScrambledCharData[] {
  return text.split('').map((char, i) => ({ char, opacity: 1, key: i }));
}
