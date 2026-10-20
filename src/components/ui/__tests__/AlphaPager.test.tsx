import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AlphaPager from '../AlphaPager';
import * as ThemeContext from '@/context/ThemeContext';
import { playPagerChirp } from '@/lib/terminalAudio';

let mockReducedMotion = false;
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => mockReducedMotion,
  };
});

const mockLenisScrollTo = vi.fn();
const mockLenisStop = vi.fn();
const mockLenisStart = vi.fn();
interface LenisMockPayload {
  scroll: number;
  velocity: number;
  scrollTo?: (target: string | number, options?: object) => void;
  stop?: () => void;
  start?: () => void;
}

let lastLenisCallback: ((lenis: LenisMockPayload) => void) | null = null;

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('lenis/react', () => ({
  useLenis: (callback?: (lenis: LenisMockPayload) => void) => {
    if (callback) lastLenisCallback = callback;
    return {
      scrollTo: mockLenisScrollTo,
      stop: mockLenisStop,
      start: mockLenisStart,
      scroll: 0,
      velocity: 0,
    };
  },
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

  it('renders viewportBounds container ensuring drag constraint bounds stay within viewport', () => {
    const { container } = render(<AlphaPager />);
    const viewportBounds = container.querySelector('[class*="viewportBounds"]');
    expect(viewportBounds).not.toBeNull();
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

  it('coordinates pager-expanded document class on mobile viewports', () => {
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

    const { unmount } = render(<AlphaPager />);

    expect(document.documentElement.classList.contains('pager-expanded')).toBe(false);

    const expandBtn = screen.getByRole('button', { name: /Expand Alphanumeric Pager/i });
    act(() => {
      fireEvent.click(expandBtn);
    });

    expect(document.documentElement.classList.contains('pager-expanded')).toBe(true);

    const dockBtn = screen.getByRole('button', { name: /^Dock pager$/i });
    act(() => {
      fireEvent.click(dockBtn);
    });

    expect(document.documentElement.classList.contains('pager-expanded')).toBe(false);

    // Expand again then test unmount cleanup
    const reExpandBtn = screen.getByRole('button', { name: /Expand Alphanumeric Pager/i });
    act(() => {
      fireEvent.click(reExpandBtn);
    });
    expect(document.documentElement.classList.contains('pager-expanded')).toBe(true);

    unmount();
    expect(document.documentElement.classList.contains('pager-expanded')).toBe(false);
  });

  it('renders data-lenis-prevent attribute on pager and dock wrapper to prevent scroll hijacking', () => {
    const { container } = render(<AlphaPager />);
    const pagerDevice = screen.getByRole('region', { name: /Vintage Alphanumeric Pager & Section Radar/i });
    expect(pagerDevice.hasAttribute('data-lenis-prevent')).toBe(true);

    const bannerWrapper = container.querySelector('[class*="bannerWrapper"]');
    expect(bannerWrapper?.hasAttribute('data-lenis-prevent')).toBe(true);
  });

  it('cycles channels when rolling mouse wheel over the pager device', () => {
    const dateSpy = vi.spyOn(Date, 'now');
    dateSpy.mockReturnValue(1000);

    render(<AlphaPager />);
    const pagerDevice = screen.getByRole('region', { name: /Vintage Alphanumeric Pager & Section Radar/i });

    // Initial is channel 01
    expect(screen.getByText(/CH 01\/08/i)).toBeDefined();

    // Wheel down -> advance channel
    act(() => {
      fireEvent.wheel(pagerDevice, { deltaY: 50 });
    });
    expect(screen.getByText(/CH 02\/08/i)).toBeDefined();

    // Wait past debounce threshold then wheel up -> previous channel
    dateSpy.mockReturnValue(1300);
    act(() => {
      fireEvent.wheel(pagerDevice, { deltaY: -50 });
    });
    expect(screen.getByText(/CH 01\/08/i)).toBeDefined();
    dateSpy.mockRestore();
  });

  it('updates active section when Lenis scroll callback triggers', () => {
    // Set up dummy DOM section targets
    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    Object.defineProperty(aboutSection, 'offsetTop', { value: 600 });
    Object.defineProperty(aboutSection, 'offsetHeight', { value: 800 });
    aboutSection.getBoundingClientRect = () => ({
      top: 600,
      bottom: 1400,
      left: 0,
      right: 1200,
      width: 1200,
      height: 800,
      x: 0,
      y: 600,
      toJSON: () => {},
    });
    document.body.appendChild(aboutSection);

    render(<AlphaPager />);

    // Trigger Lenis scroll frame targeting the about section
    expect(lastLenisCallback).not.toBeNull();
    act(() => {
      lastLenisCallback!({ scroll: 500, velocity: 1.0 });
    });

    expect(screen.getByText(/CH 02\/08/i)).toBeDefined();
    document.body.removeChild(aboutSection);
  });

  it('suppresses audio chirp during high-velocity fling and locks audio cleanly once velocity settles', () => {
    const chirpMock = vi.mocked(playPagerChirp);
    chirpMock.mockClear();

    const aboutSection = document.createElement('div');
    aboutSection.id = 'about';
    Object.defineProperty(aboutSection, 'offsetTop', { value: 600 });
    Object.defineProperty(aboutSection, 'offsetHeight', { value: 800 });
    document.body.appendChild(aboutSection);

    render(<AlphaPager />);

    // Fast fling frame entering about section: velocity = 25 (> 6)
    act(() => {
      lastLenisCallback!({ scroll: 500, velocity: 25.0 });
    });

    // Pager displays CH 02 (about)
    expect(screen.getByText(/CH 02\/08/i)).toBeDefined();
    // Chirp was suppressed during fling
    expect(chirpMock).not.toHaveBeenCalled();

    // Scroll settles: velocity drops to 1.0 (< 6)
    act(() => {
      lastLenisCallback!({ scroll: 500, velocity: 1.0 });
    });

    // Audio chirp locks cleanly once velocity settles
    expect(chirpMock).toHaveBeenCalledTimes(1);
    document.body.removeChild(aboutSection);
  });

  it('dynamically measures sections that mount asynchronously after initial render', () => {
    render(<AlphaPager />);

    // Initially only home exists. Now simulate Suspense streaming in deployments section
    const deploymentsSection = document.createElement('div');
    deploymentsSection.id = 'deployments';
    Object.defineProperty(deploymentsSection, 'offsetTop', { value: 2000 });
    Object.defineProperty(deploymentsSection, 'offsetHeight', { value: 900 });
    deploymentsSection.getBoundingClientRect = () => ({
      top: 2000,
      bottom: 2900,
      left: 0,
      right: 1200,
      width: 1200,
      height: 900,
      x: 0,
      y: 2000,
      toJSON: () => {},
    });
    document.body.appendChild(deploymentsSection);

    // Scroll to deployments section (focusY = 1800 + 768 * 0.35 = 2068.8, within 2000-2900)
    act(() => {
      lastLenisCallback!({ scroll: 1800, velocity: 2.0 });
    });

    // Successfully locks onto channel 4 (deployments)
    expect(screen.getByText(/CH 04\/08/i)).toBeDefined();
    document.body.removeChild(deploymentsSection);
  });

  it('locks to contact section when scrolled to bottom of document', () => {
    // Mock scrollHeight and innerHeight
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });

    render(<AlphaPager />);

    // Scroll to within 60px of the bottom (5000 - 1000 - 50 = 3950)
    act(() => {
      lastLenisCallback!({ scroll: 3960, velocity: 0 });
    });

    // Channel 8 is contact
    expect(screen.getByText(/CH 08\/08/i)).toBeDefined();
  });

  it('resumes Lenis smooth scroll on unmount to prevent permanent scroll freeze', () => {
    mockLenisStart.mockClear();
    const { unmount } = render(<AlphaPager />);
    unmount();
    expect(mockLenisStart).toHaveBeenCalled();
  });

  it('uses duration 0 on LCD click when prefersReducedMotion is enabled', () => {
    mockReducedMotion = true;
    render(<AlphaPager />);

    // Advance to alert mode by clicking next
    const nextBtn = screen.getByRole('button', { name: /Next channel/i });
    act(() => {
      fireEvent.click(nextBtn);
    });

    const lcdScreen = screen.getByRole('button', { name: /Jump to/i });
    act(() => {
      fireEvent.click(lcdScreen);
    });

    expect(mockLenisScrollTo).toHaveBeenCalledWith('#about', expect.objectContaining({ duration: 0 }));
    mockReducedMotion = false;
  });

  it('renders designated drag handles with Drag Handle tooltips on clip bar and side grips', () => {
    const { container } = render(<AlphaPager />);
    const clipBar = container.querySelector('[class*="clipBar"]');
    const sideGrip = container.querySelector('[class*="sideGrip"]');

    expect(clipBar).not.toBeNull();
    expect(clipBar?.getAttribute('title')).toBe('Drag Handle');
    expect(sideGrip).not.toBeNull();
    expect(sideGrip?.getAttribute('title')).toBe('Drag Handle');
  });

  it('starts drag gesture when pointer down occurs on clipBar or casing', () => {
    const { container } = render(<AlphaPager />);
    const clipBar = container.querySelector('[class*="clipBar"]');
    expect(clipBar).not.toBeNull();

    act(() => {
      fireEvent.pointerDown(clipBar!, { clientX: 100, clientY: 100 });
    });

    const pagerDevice = screen.getByRole('region', { name: /Vintage Alphanumeric Pager & Section Radar/i });
    expect(pagerDevice).toBeDefined();
  });

  it('renders buttonCluster with interactive controls allowing rapid hover and click events without errors', () => {
    const { container } = render(<AlphaPager />);
    const cluster = container.querySelector('[class*="buttonCluster"]');
    expect(cluster).not.toBeNull();

    const prevBtn = screen.getByRole('button', { name: /Previous channel/i });
    const nextBtn = screen.getByRole('button', { name: /Next channel/i });
    const clearBtn = screen.getByRole('button', { name: /Silence alert/i });

    // Simulate fast hover sweep across buttons
    act(() => {
      fireEvent.mouseEnter(prevBtn);
      fireEvent.mouseLeave(prevBtn);
      fireEvent.mouseEnter(nextBtn);
      fireEvent.mouseLeave(nextBtn);
      fireEvent.mouseEnter(clearBtn);
      fireEvent.mouseLeave(clearBtn);
    });

    // Verify channel cycling still operates smoothly
    act(() => {
      fireEvent.click(nextBtn);
    });
    expect(screen.getByText(/CH 02\/08/i)).toBeDefined();
  });
});


