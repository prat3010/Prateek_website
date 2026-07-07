import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTypewriter } from '../useTypewriter';

describe('useTypewriter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with empty displayText', () => {
    const { result } = renderHook(() => useTypewriter({ text: 'Hello' }));
    expect(result.current.displayText).toBe('');
  });

  it('starts typing after delay', () => {
    const { result } = renderHook(() => useTypewriter({ text: 'Hi', delay: 100, speed: 50 }));

    act(() => vi.advanceTimersByTime(100));
    expect(result.current.isTyping).toBe(true);

    act(() => vi.advanceTimersByTime(50));
    expect(result.current.displayText).toBe('H');
  });

  it('types all characters at specified speed', () => {
    const { result } = renderHook(() => useTypewriter({ text: 'AB', delay: 0, speed: 50 }));

    act(() => vi.advanceTimersByTime(0));
    act(() => vi.advanceTimersByTime(50));
    expect(result.current.displayText).toBe('A');

    act(() => vi.advanceTimersByTime(50));
    expect(result.current.displayText).toBe('AB');
  });

  it('sets isDone after typing completes and timeout fires', () => {
    const { result } = renderHook(() => useTypewriter({ text: 'X', delay: 0, speed: 50 }));

    act(() => vi.advanceTimersByTime(0));
    act(() => vi.advanceTimersByTime(50));
    expect(result.current.isDone).toBe(false);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.isDone).toBe(true);
  });

  it('resets displayText when text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter({ text, delay: 0, speed: 50 }),
      { initialProps: { text: 'Hello' } }
    );

    act(() => vi.advanceTimersByTime(0));
    act(() => vi.advanceTimersByTime(100));

    rerender({ text: 'World' });
    expect(result.current.displayText).toBe('');
  });

  it('does not type when text is empty', () => {
    const { result } = renderHook(() => useTypewriter({ text: '', delay: 0, speed: 50 }));
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.displayText).toBe('');
    expect(result.current.isTyping).toBe(false);
  });

  it('returns isTyping true during typing', () => {
    const { result } = renderHook(() => useTypewriter({ text: 'Hi', delay: 0, speed: 100 }));

    act(() => vi.advanceTimersByTime(0));
    expect(result.current.isTyping).toBe(true);
  });
});
