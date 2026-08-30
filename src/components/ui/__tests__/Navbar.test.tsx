import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';
import * as ThemeContext from '@/context/ThemeContext';
import * as AuthContext from '@/context/AuthContext';
import * as LenisProvider from '@/context/LenisProvider';
import { motionValue } from 'framer-motion';

const mockLenisScrollTo = vi.fn();
const mockLenisStart = vi.fn();
let mockPathname = '/';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock lenis/react
vi.mock('lenis/react', () => ({
  useLenis: () => ({
    scrollTo: mockLenisScrollTo,
    start: mockLenisStart,
    stop: vi.fn(),
  }),
}));

// Mock framer-motion useReducedMotion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: () => false,
  };
});

describe('Navbar Component Navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockLenisScrollTo.mockClear();
    mockLenisStart.mockClear();
    mockPathname = '/';

    // Mock matchMedia
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

    // Mock IntersectionObserver
    global.IntersectionObserver = class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    } as unknown as typeof IntersectionObserver;

    // Mock ThemeContext
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
      isNoir: false,
      isDetailsHidden: false,
      toggleDetailsHidden: vi.fn(),
      audience: 'developer',
      setAudience: vi.fn(),
      prevAudience: null,
      modeTransitionSeed: 0,
      region: 'india',
      setRegion: vi.fn(),
    } as unknown as ReturnType<typeof ThemeContext.useTheme>);

    // Mock AuthContext
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn().mockResolvedValue(null),
    });

    // Mock LenisProvider
    vi.spyOn(LenisProvider, 'useLenisScroll').mockReturnValue({
      scrollY: motionValue(0),
      scrollProgress: motionValue(0),
      velocity: motionValue(0),
    });
  });

  it('smooth scrolls on current page (/) when clicking section links', () => {
    mockPathname = '/';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });

    render(<Navbar />);

    const homeLink = screen.getAllByRole('link', { name: /home/i })[0];
    fireEvent.click(homeLink);

    // On home page, clicking /#home prevents default and calls lenis.scrollTo
    expect(mockLenisScrollTo).toHaveBeenCalledWith('#home', expect.any(Object));
  });

  it('allows natural navigation (no preventDefault) when clicking Home from a subpage like /blog', () => {
    mockPathname = '/blog';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/blog' },
      writable: true,
    });

    render(<Navbar />);

    const homeLinks = screen.getAllByRole('link', { name: /home/i });
    const homeNavLink = homeLinks[0];

    // Clicking /#home while on /blog should NOT trigger Lenis scrollTo on the /blog page
    fireEvent.click(homeNavLink);
    expect(mockLenisScrollTo).not.toHaveBeenCalled();
  });

  it('allows natural navigation when clicking the Gremlin Logo from a subpage like /blog', () => {
    mockPathname = '/blog';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/blog' },
      writable: true,
    });

    render(<Navbar />);

    const logoLink = screen.getByLabelText(/go to home/i);
    expect(logoLink.getAttribute('href')).toBe('/#home');

    fireEvent.click(logoLink);
    expect(mockLenisScrollTo).not.toHaveBeenCalled();
  });

  it('does not highlight home sections as active when on /blog', () => {
    mockPathname = '/blog';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/blog' },
      writable: true,
    });

    const { container } = render(<Navbar />);
    const activeNavLinks = container.querySelectorAll('.active');
    expect(activeNavLinks.length).toBe(0);
  });
});
