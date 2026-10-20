import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import HeroClient from '../HeroClient';
import * as ThemeContext from '@/context/ThemeContext';

describe('Hero Edition Badge', () => {
  const dummyTaglines = {
    standard: ['Software engineer and architect.'],
    noir: ['Building in the dark.'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders ARCHITECT EDITION and VOL. 26 // ISSUE 1 in developer mode', () => {
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      isNoir: false,
      isDetailsHidden: false,
      toggleDetailsHidden: vi.fn(),
      audience: 'developer',
      setAudience: vi.fn(),
      prevAudience: null,
      modeTransitionSeed: 0,
      region: 'global',
      setRegion: vi.fn(),
    });

    const { container } = render(<HeroClient taglines={dummyTaglines} />);
    const stamp = container.querySelector('[data-audience="developer"]');
    expect(stamp).not.toBeNull();
    expect(stamp?.textContent).toContain('VOL. 26 // ISSUE 1');
    expect(stamp?.textContent).toContain('ARCHITECT EDITION');
  });

  it('renders COMMERCIAL EDITION and DOC. REF // 2026-BRIEF in business mode', () => {
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      isNoir: false,
      isDetailsHidden: false,
      toggleDetailsHidden: vi.fn(),
      audience: 'business',
      setAudience: vi.fn(),
      prevAudience: 'developer',
      modeTransitionSeed: 1,
      region: 'global',
      setRegion: vi.fn(),
    });

    const { container } = render(<HeroClient taglines={dummyTaglines} />);
    const stamp = container.querySelector('[data-audience="business"]');
    expect(stamp).not.toBeNull();
    expect(stamp?.textContent).toContain('DOC. REF // 2026-BRIEF');
    expect(stamp?.textContent).toContain('COMMERCIAL EDITION');
  });

  it('defaults to developer mode if audience is null', () => {
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      isNoir: false,
      isDetailsHidden: false,
      toggleDetailsHidden: vi.fn(),
      audience: null,
      setAudience: vi.fn(),
      prevAudience: null,
      modeTransitionSeed: 0,
      region: 'global',
      setRegion: vi.fn(),
    });

    const { container } = render(<HeroClient taglines={dummyTaglines} />);
    const stamp = container.querySelector('[data-audience="developer"]');
    expect(stamp).not.toBeNull();
    expect(stamp?.textContent).toContain('ARCHITECT EDITION');
  });
});
