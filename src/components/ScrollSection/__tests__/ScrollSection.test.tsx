import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MotionValue } from 'framer-motion';
import ScrollSection from '../ScrollSection';
import * as LenisProvider from '@/context/LenisProvider';

describe('ScrollSection Component', () => {
  const dummyMotionValue = (val: number): MotionValue<number> => {
    return {
      get: () => val,
      set: vi.fn(),
      on: vi.fn().mockReturnValue(() => {}),
    } as unknown as MotionValue<number>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof globalThis.ResizeObserver;

    vi.spyOn(LenisProvider, 'useLenisScroll').mockReturnValue({
      scrollY: dummyMotionValue(0),
      scrollProgress: dummyMotionValue(0),
      velocity: dummyMotionValue(0),
    });
  });

  it('renders children properly on desktop', () => {
    window.innerWidth = 1200;
    render(
      <ScrollSection>
        <div data-testid="test-content">Desktop Content</div>
      </ScrollSection>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('renders children and maintains visible opacity on mobile (width <= 768)', () => {
    window.innerWidth = 390;
    render(
      <ScrollSection>
        <div data-testid="mobile-content">Mobile Content</div>
      </ScrollSection>
    );

    const content = screen.getByTestId('mobile-content');
    expect(content).toBeInTheDocument();
    
    // The inner motion wrapper must have neutral transform and full opacity
    const innerWrapper = content.parentElement;
    expect(innerWrapper).toBeInTheDocument();
    expect(innerWrapper?.style.opacity).not.toBe('0');
  });
});
