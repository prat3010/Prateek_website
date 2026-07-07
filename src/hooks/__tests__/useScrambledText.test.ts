import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrambledText } from '../useScrambledText';

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    return setTimeout(() => cb(performance.now()), 16) as unknown as number;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => clearTimeout(id));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useScrambledText', () => {
  it('initializes chars from targetText', () => {
    const { result } = renderHook(() =>
      useScrambledText({
        sourceText: 'AAA',
        targetText: 'BBB',
        duration: 100,
        staggerPerChar: 0,
        triggerSeed: 1,
      })
    );
    expect(result.current.chars).toHaveLength(3);
    expect(result.current.chars.map(c => c.char).join('')).toBe('BBB');
  });

  it('handles source longer than target', () => {
    const { result } = renderHook(() =>
      useScrambledText({
        sourceText: 'AAAA',
        targetText: 'BB',
        duration: 100,
        staggerPerChar: 0,
        triggerSeed: 1,
      })
    );
    expect(result.current.chars.length).toBeGreaterThanOrEqual(2);
  });

  it('handles target longer than source', () => {
    const { result } = renderHook(() =>
      useScrambledText({
        sourceText: 'AA',
        targetText: 'BBBB',
        duration: 100,
        staggerPerChar: 0,
        triggerSeed: 1,
      })
    );
    expect(result.current.chars.length).toBe(4);
  });

  it('calls onDone when animation completes', async () => {
    const onDone = vi.fn();
    renderHook(() =>
      useScrambledText({
        sourceText: 'A',
        targetText: 'B',
        duration: 50,
        staggerPerChar: 0,
        triggerSeed: 1,
        onDone,
      })
    );

    act(() => vi.advanceTimersByTime(100));
    expect(onDone).toHaveBeenCalled();
  });

  it('does nothing when triggerSeed is 0', () => {
    const { result } = renderHook(() =>
      useScrambledText({
        sourceText: 'AAA',
        targetText: 'BBB',
        duration: 100,
        staggerPerChar: 0,
        triggerSeed: 0,
      })
    );
    expect(result.current.chars).toHaveLength(3);
    expect(result.current.chars[0].char).toBe('B');
  });

  it('handles empty strings', () => {
    const { result } = renderHook(() =>
      useScrambledText({
        sourceText: '',
        targetText: '',
        duration: 100,
        staggerPerChar: 0,
        triggerSeed: 1,
      })
    );
    expect(result.current.chars).toHaveLength(0);
  });

  it('same source and target keeps target chars', () => {
    const { result } = renderHook(() =>
      useScrambledText({
        sourceText: 'HELLO',
        targetText: 'HELLO',
        duration: 100,
        staggerPerChar: 0,
        triggerSeed: 1,
      })
    );
    expect(result.current.chars.map(c => c.char).join('')).toBe('HELLO');
  });
});
