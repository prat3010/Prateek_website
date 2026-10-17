import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Navbar from '../Navbar';
import * as ThemeContext from '@/context/ThemeContext';
import * as AuthContext from '@/context/AuthContext';
import * as LenisProvider from '@/context/LenisProvider';
import { motionValue } from 'framer-motion';

const mockLenisScrollTo = vi.fn();
const mockLenisStart = vi.fn();
let mockPathname = '/';
let latestObserverCallback: IntersectionObserverCallback | null = null;
const mockObserve = vi.fn();

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
    mockObserve.mockClear();
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
      constructor(cb: IntersectionObserverCallback) {
        latestObserverCallback = cb;
      }
      observe = mockObserve;
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
      loginWithMagicLink: vi.fn(),
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

  it('smooth scrolls to #playground when clicking Playground link on home page', () => {
    mockPathname = '/';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });

    render(<Navbar />);

    const playgroundLink = screen.getAllByRole('link', { name: /playground/i })[0];
    expect(playgroundLink.getAttribute('href')).toBe('/#playground');

    fireEvent.click(playgroundLink);

    // On home page, clicking /#playground should trigger lenis.scrollTo('#playground')
    expect(mockLenisScrollTo).toHaveBeenCalledWith('#playground', expect.any(Object));
  });

  it('highlights Services & Guarantees when scrolled to in business mode', () => {
    mockPathname = '/';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });

    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
      isNoir: false,
      isDetailsHidden: false,
      toggleDetailsHidden: vi.fn(),
      audience: 'business',
      setAudience: vi.fn(),
      prevAudience: null,
      modeTransitionSeed: 0,
      region: 'india',
      setRegion: vi.fn(),
    } as unknown as ReturnType<typeof ThemeContext.useTheme>);

    const { container } = render(<Navbar />);

    // Trigger IntersectionObserver for #resume section
    act(() => {
      latestObserverCallback?.(
        [
          {
            target: { id: 'resume' },
            isIntersecting: true,
            intersectionRect: { height: 320 } as DOMRectReadOnly,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    const activeLinks = container.querySelectorAll('[class*="active"]');
    expect(activeLinks.length).toBeGreaterThan(0);
    const activeText = Array.from(activeLinks).map((el) => el.textContent?.trim());
    expect(activeText.some((text) => text?.includes('Services & Guarantees'))).toBe(true);
  });

  it('highlights Resume when scrolled to in developer mode', () => {
    mockPathname = '/';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });

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

    const { container } = render(<Navbar />);

    // Trigger IntersectionObserver for #resume section
    act(() => {
      latestObserverCallback?.(
        [
          {
            target: { id: 'resume' },
            isIntersecting: true,
            intersectionRect: { height: 320 } as DOMRectReadOnly,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      );
    });

    const activeLinks = container.querySelectorAll('[class*="active"]');
    expect(activeLinks.length).toBeGreaterThan(0);
    const activeText = Array.from(activeLinks).map((el) => el.textContent?.trim());
    expect(activeText.some((text) => text?.includes('Resume'))).toBe(true);
  });

  it('dynamically observes sections added to the DOM asynchronously after initial mount (e.g. Suspense streaming)', async () => {
    mockPathname = '/';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });

    // Render Navbar when section elements are not yet in the DOM
    render(<Navbar />);

    // Now simulate Suspense boundary resolving by mounting a section into document.body
    const aboutSection = document.createElement('section');
    aboutSection.id = 'about';
    await act(async () => {
      document.body.appendChild(aboutSection);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // MutationObserver should detect newly attached section and register it with IntersectionObserver
    expect(mockObserve).toHaveBeenCalledWith(aboutSection);

    // Clean up DOM
    document.body.removeChild(aboutSection);
  });

  it('resets activeSection when navigating back from /terminal to /', () => {
    mockPathname = '/terminal';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/terminal' },
      writable: true,
    });

    const { rerender, container } = render(<Navbar />);

    // On /terminal, no link should have active class
    let activeNavLinks = container.querySelectorAll('a[class*="active"]');
    expect(activeNavLinks.length).toBe(0);

    // Navigate back to /
    mockPathname = '/';
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true,
    });

    rerender(<Navbar />);

    // On /, Home should be active by default
    activeNavLinks = container.querySelectorAll('a[class*="active"]');
    expect(activeNavLinks.length).toBeGreaterThan(0);
    const activeText = Array.from(activeNavLinks).map((el) => el.textContent?.trim());
    expect(activeText.some((text) => text?.includes('Home'))).toBe(true);
  });

  describe('Navbar on /rag', () => {
    beforeEach(() => {
      mockPathname = '/rag';
      Object.defineProperty(window, 'location', {
        value: { pathname: '/rag' },
        writable: true,
      });
    });

    it('renders updated RAG nav items pointing to real DOM section IDs with no dead links', () => {
      render(<Navbar />);

      // Real DOM section IDs
      const liveDemoLink = screen.getAllByRole('link', { name: /live demo/i })[0];
      expect(liveDemoLink.getAttribute('href')).toBe('/rag#sandbox-demo');

      const architectureLink = screen.getAllByRole('link', { name: /architecture/i })[0];
      expect(architectureLink.getAttribute('href')).toBe('/rag#architecture');

      const benchmarksLink = screen.getAllByRole('link', { name: /benchmarks/i })[0];
      expect(benchmarksLink.getAttribute('href')).toBe('/rag#benchmarks');

      const customizerLink = screen.getAllByRole('link', { name: /customizer/i })[0];
      expect(customizerLink.getAttribute('href')).toBe('/rag#widget-customizer');

      const pricingLink = screen.getAllByRole('link', { name: /pricing/i })[0];
      expect(pricingLink.getAttribute('href')).toBe('/rag#pricing');

      // Assert dead links are NOT present
      expect(screen.queryByRole('link', { name: /^overview$/i })).toBeNull();
      expect(screen.queryByRole('link', { name: /^features$/i })).toBeNull();
    });

    it('suppresses the DEV / BIZ Perspective toggle on /rag', () => {
      render(<Navbar />);

      expect(screen.queryByLabelText(/switch to business perspective/i)).toBeNull();
      expect(screen.queryByLabelText(/switch to developer perspective/i)).toBeNull();
      expect(screen.queryByText('DEV')).toBeNull();
      expect(screen.queryByText('BIZ')).toBeNull();
    });

    it('renders RETRIEVER AI wordmark, badge, and subtle link back to portfolio home', () => {
      render(<Navbar />);

      // Gremlin logo on /rag
      const logoLink = screen.getByLabelText(/go to rag overview/i);
      expect(logoLink.getAttribute('href')).toBe('/rag');

      // Wordmark and badge
      const wordmarkLink = screen.getByRole('link', { name: /^retriever\s*ai$/i });
      expect(wordmarkLink.getAttribute('href')).toBe('/rag');
      expect(screen.getByText('RETRIEVER')).toBeDefined();
      expect(screen.getByText('AI')).toBeDefined();

      // Back to prateeq.in link
      const backLink = screen.getAllByRole('link', { name: /back to prateeq\.in/i })[0];
      expect(backLink.getAttribute('href')).toBe('/');
    });

    it('contextualizes auth buttons for unauthenticated user: Sign In and Launch App CTA', () => {
      render(<Navbar />);

      // Primary CTA
      const launchAppLinks = screen.getAllByRole('link', { name: /launch app/i });
      expect(launchAppLinks.length).toBeGreaterThan(0);
      expect(launchAppLinks[0].getAttribute('href')).toBe('/rag/app');

      // Secondary button should be Sign In (not CLIENT LOGIN)
      const signInLinks = screen.getAllByRole('link', { name: /sign in/i });
      expect(signInLinks.length).toBeGreaterThan(0);
      expect(signInLinks[0].getAttribute('href')).toBe('/login?context=rag');
      expect(screen.queryByRole('link', { name: /client login/i })).toBeNull();
    });

    it('contextualizes auth buttons for authenticated user: Studio and Launch App CTA', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { email: 'client@example.com' } as unknown as NonNullable<ReturnType<typeof AuthContext.useAuth>['user']>,
        session: null,
        loading: false,
        loginWithGoogle: vi.fn(),
        loginWithMagicLink: vi.fn(),
        logout: vi.fn(),
        getAccessToken: vi.fn().mockResolvedValue(null),
      });

      render(<Navbar />);

      // Primary CTA
      const launchAppLinks = screen.getAllByRole('link', { name: /launch app/i });
      expect(launchAppLinks[0].getAttribute('href')).toBe('/rag/app');

      // Secondary button should be Studio (not DASHBOARD)
      const studioLinks = screen.getAllByRole('link', { name: /studio/i });
      expect(studioLinks.length).toBeGreaterThan(0);
      expect(studioLinks[0].getAttribute('href')).toBe('/rag/app');
      expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
    });

    it('smooth scrolls with adjusted offset when clicking RAG section link', () => {
      render(<Navbar />);

      const benchmarksLink = screen.getAllByRole('link', { name: /benchmarks/i })[0];
      fireEvent.click(benchmarksLink);

      // On /rag, offset should be NAVBAR_SCROLL_OFFSET - 40 (-120)
      expect(mockLenisScrollTo).toHaveBeenCalledWith('#benchmarks', expect.objectContaining({
        offset: -120,
      }));
    });

    it('contextualizes auth buttons for admin user: Admin and Launch App CTA', () => {
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
        user: { email: 'prateeqsharma@gmail.com' } as unknown as NonNullable<ReturnType<typeof AuthContext.useAuth>['user']>,
        session: null,
        loading: false,
        loginWithGoogle: vi.fn(),
        loginWithMagicLink: vi.fn(),
        logout: vi.fn(),
        getAccessToken: vi.fn().mockResolvedValue(null),
      });

      render(<Navbar />);

      const adminLinks = screen.getAllByRole('link', { name: /admin/i });
      expect(adminLinks.length).toBeGreaterThan(0);
      expect(adminLinks[0].getAttribute('href')).toBe('/admin');
    });

    it('smooth scrolls to top (0) when clicking logo on /rag', () => {
      render(<Navbar />);

      const logoLink = screen.getByLabelText(/go to rag overview/i);
      fireEvent.click(logoLink);

      expect(mockLenisScrollTo).toHaveBeenCalledWith(0, expect.any(Object));
    });

    it('initializes active section from window.location.hash on mount', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/rag', hash: '#pricing' },
        writable: true,
      });

      const { container } = render(<Navbar />);

      const activeLinks = container.querySelectorAll('[class*="active"]');
      expect(activeLinks.length).toBeGreaterThan(0);
      const activeText = Array.from(activeLinks).map((el) => el.textContent?.trim());
      expect(activeText.some((text) => text?.includes('Pricing'))).toBe(true);
    });

    it('highlights active section on /rag via IntersectionObserver', () => {
      const { container } = render(<Navbar />);

      act(() => {
        latestObserverCallback?.(
          [
            {
              target: { id: 'benchmarks' },
              isIntersecting: true,
              intersectionRect: { height: 350 } as DOMRectReadOnly,
            } as unknown as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        );
      });

      const activeLinks = container.querySelectorAll('[class*="active"]');
      expect(activeLinks.length).toBeGreaterThan(0);
      const activeText = Array.from(activeLinks).map((el) => el.textContent?.trim());
      expect(activeText.some((text) => text?.includes('Benchmarks'))).toBe(true);
    });

    it('does not falsely highlight landing page sections as active when on /rag/app', () => {
      mockPathname = '/rag/app';
      Object.defineProperty(window, 'location', {
        value: { pathname: '/rag/app' },
        writable: true,
      });

      const { container } = render(<Navbar />);

      const activeNavLinks = container.querySelectorAll(
        'a[class*="navLink"][class*="active"], a[class*="mobileNavLink"][class*="active"]'
      );
      expect(activeNavLinks.length).toBe(0);
    });

    it('highlights Benchmarks section when on /rag/benchmarks', () => {
      mockPathname = '/rag/benchmarks';
      Object.defineProperty(window, 'location', {
        value: { pathname: '/rag/benchmarks' },
        writable: true,
      });

      const { container } = render(<Navbar />);

      const activeLinks = container.querySelectorAll('[class*="active"]');
      expect(activeLinks.length).toBeGreaterThan(0);
      const activeText = Array.from(activeLinks).map((el) => el.textContent?.trim());
      expect(activeText.some((text) => text?.includes('Benchmarks'))).toBe(true);
    });

    it('handles trailing slash normalization when clicking logo on /rag/', () => {
      mockPathname = '/rag/';
      Object.defineProperty(window, 'location', {
        value: { pathname: '/rag/' },
        writable: true,
      });

      render(<Navbar />);

      const logoLink = screen.getByLabelText(/go to rag overview/i);
      fireEvent.click(logoLink);

      expect(mockLenisScrollTo).toHaveBeenCalledWith(0, expect.any(Object));
    });

    it('renders mobile back link and closes mobile menu when clicked', () => {
      const { container } = render(<Navbar />);

      // Open mobile menu
      const hamburger = screen.getByLabelText(/open menu/i);
      fireEvent.click(hamburger);

      const mobileBackLink = screen.getByRole('link', { name: /← back to prateeq\.in/i });
      expect(mobileBackLink).toBeDefined();
      expect(mobileBackLink.getAttribute('href')).toBe('/');

      // Clicking mobile back link closes the menu
      fireEvent.click(mobileBackLink);
      expect(container.querySelector('[class*="menuOpen"]')).toBeNull();
    });
  });
});
