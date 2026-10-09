import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AlphaPager from '../AlphaPager';
import * as ThemeContext from '@/context/ThemeContext';

const mockLenisScrollTo = vi.fn();

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lenis/react', () => ({
  useLenis: () => ({
    scrollTo: mockLenisScrollTo,
  }),
}));

vi.mock('@/lib/terminalAudio', () => ({
  playPagerChirp: vi.fn(),
}));

vi.mock('@/components/ui/useSystemTelemetry', () => ({
  useSystemTelemetry: () => ({
    stats: { fps: 60, bundleSize: 184, domNodes: 120, uptime: '00:05:00' },
    webVitals: { lcp: 0, fid: 0, cls: 0, hasInteraction: false },
  }),
}));

// Mock fetch for /api/pager
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ messages: [] }),
  })
);

describe('AlphaPager Component', () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockLenisScrollTo.mockClear();

    // Default desktop window mock
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
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

    // Mock ThemeContext
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      isNoir: false,
      audience: 'developer',
      region: 'india',
      isDetailsHidden: false,
      toggleTheme: vi.fn(),
      toggleDetailsHidden: vi.fn(),
      setAudience: vi.fn(),
      setRegion: vi.fn(),
      prevAudience: null,
      modeTransitionSeed: 0,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('renders expanded pager device on desktop viewports', () => {
    render(<AlphaPager />);

    expect(screen.getByRole('region', { name: /Vintage Alphanumeric Pager & Section Radar/i })).toBeDefined();
    expect(screen.getByText('PRATEEQ')).toBeDefined();
    expect(screen.getByText('ALPHAPAGE-90')).toBeDefined();
    expect(screen.getByRole('button', { name: /Next channel/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Previous channel/i })).toBeDefined();
  });

  it('allows docking expanded pager to compact clip on desktop', () => {
    render(<AlphaPager />);

    const dockBtn = screen.getByRole('button', { name: /^Dock pager$/i });
    expect(dockBtn).toBeDefined();

    act(() => {
      fireEvent.click(dockBtn);
    });

    expect(screen.getByRole('region', { name: /Vintage Pager Pocket Clip/i })).toBeDefined();
  });

  it('renders in compact belt-clip mode on mobile viewports', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(<AlphaPager />);

    expect(screen.getByRole('region', { name: /Vintage Pager Pocket Clip/i })).toBeDefined();
    expect(screen.getByText(/CH 01/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Expand Alphanumeric Pager/i })).toBeDefined();
  });

  it('expands from compact clip to full pager on mobile when tapped', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });

    render(<AlphaPager />);

    const expandBtn = screen.getByRole('button', { name: /Expand Alphanumeric Pager/i });
    act(() => {
      fireEvent.click(expandBtn);
    });

    expect(screen.getByRole('region', { name: /Vintage Alphanumeric Pager & Section Radar/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Dock pager$/i })).toBeDefined();
  });

  it('cycles messages when PREV and NEXT buttons are clicked', () => {
    render(<AlphaPager />);

    const nextBtn = screen.getByRole('button', { name: /Next channel/i });

    // Initial is channel 01
    expect(screen.getByText(/CH 01\/08/i)).toBeDefined();

    act(() => {
      fireEvent.click(nextBtn);
    });

    // Advanced to channel 02
    expect(screen.getByText(/CH 02\/08/i)).toBeDefined();

    const prevBtn = screen.getByRole('button', { name: /Previous channel/i });
    act(() => {
      fireEvent.click(prevBtn);
    });

    // Cycled back to channel 01
    expect(screen.getByText(/CH 01\/08/i)).toBeDefined();
  });

  it('scrolls to section via lenis when LCD screen is clicked and docks on mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 390,
    });

    render(<AlphaPager />);

    // First expand it on mobile
    const expandBtn = screen.getByRole('button', { name: /Expand Alphanumeric Pager/i });
    act(() => {
      fireEvent.click(expandBtn);
    });

    // Advance to alert mode by clicking next
    const nextBtn = screen.getByRole('button', { name: /Next channel/i });
    act(() => {
      fireEvent.click(nextBtn);
    });

    const lcdScreen = screen.getByRole('button', { name: /Jump to/i });
    act(() => {
      fireEvent.click(lcdScreen);
    });

    expect(mockLenisScrollTo).toHaveBeenCalledWith('#about', expect.any(Object));
    // Docks back to compact mode on mobile
    expect(screen.getByRole('region', { name: /Vintage Pager Pocket Clip/i })).toBeDefined();
  });
});
