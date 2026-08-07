'use client';

import { useState, useEffect, useCallback, useMemo, useRef, type MouseEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useLenis } from 'lenis/react';
import { useReducedMotion } from 'framer-motion';
import { Sun, Moon, Code2, Briefcase } from 'lucide-react';
import { useTheme, type Audience } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLenisScroll } from '@/context/LenisProvider';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
import SegmentedToggle, { type SegmentedOption } from '@/components/ui/SegmentedToggle';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import styles from './Navbar.module.css';

const NAV_LABEL_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'Resume',    noir: 'Resume' },
  business:  { light: 'Services & Guarantees', noir: 'Services & Guarantees' },
};

export interface NavItem {
  label: string;
  href: string;
}

export interface NavbarProps {
  /** Custom nav items. Defaults to the standard portfolio sections. */
  items?: NavItem[];
  /** Additional CSS class */
  className?: string;
}

export default function Navbar({ items, className }: NavbarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme, audience, setAudience } = useTheme();
  const { user } = useAuth();

  const handleAudienceChange = useCallback((value: string) => {
    setAudience(value as Audience);
  }, [setAudience]);

  const handleThemeChange = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  const audienceOptions = useMemo(() => [
    { value: 'developer', label: 'DEV', icon: <Code2 size={14} strokeWidth={2.5} /> },
    { value: 'business', label: 'BIZ', icon: <Briefcase size={14} strokeWidth={2.5} /> },
  ] as [SegmentedOption, SegmentedOption], []);

  const themeOptions = useMemo(() => [
    { value: 'light', label: 'AZURE', icon: <Sun size={14} strokeWidth={2.5} /> },
    { value: 'noir', label: 'NOIR', icon: <Moon size={14} strokeWidth={2.5} /> },
  ] as [SegmentedOption, SegmentedOption], []);

  const navItems = useMemo(() => {
    if (items) return items;
    if (pathname?.startsWith('/rag')) {
      return [
        { label: 'Overview', href: '/rag#home' },
        { label: 'Features', href: '/rag#features' },
        { label: 'Pricing', href: '/rag#pricing' },
        { label: 'Live Demo', href: '/rag#demo' },
      ];
    }
    return [
      { label: 'Home', href: '/#home' },
      { label: 'About', href: '/#about' },
      { label: 'Capabilities', href: '/#capabilities' },
      { label: 'Projects', href: '/#projects' },
      { label: audience === 'business' ? 'Services & Guarantees' : 'Resume', href: '/#resume' },
      { label: 'Playground', href: '/#playground' },
      { label: 'Contact', href: '/#contact' },
    ];
  }, [items, pathname, audience]);

  const [scrolled, setScrolled] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  const effectiveActiveSection = useMemo(() => {
    if (activeSection) return activeSection;
    if (items && items.length > 0) return items[0].href;
    if (pathname?.startsWith('/rag')) return '/rag#home';
    return '/#home';
  }, [activeSection, items, pathname]);

  const { scrollY } = useLenisScroll();
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();

  /* ---------- Scroll direction / scrolled threshold listener ---------- */
  useEffect(() => {
    let lastY = 0;
    const unsub = scrollY.on('change', (y) => {
      setScrolled(y > 50);
      const diff = Math.abs(y - lastY);
      if (diff > 2) {
        setIsScrolling(true);
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 800);
      }
      lastY = y;
    });
    return unsub;
  }, [scrollY]);

  /* ---------- Intersection Observer for Section Tracking ---------- */
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -30% 0px',
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const matchingItem = navItems.find((item) => item.href.endsWith(`#${entry.target.id}`));
          if (matchingItem) {
            setActiveSection(matchingItem.href);
          }
        }
      });
    }, observerOptions);

    navItems.forEach((item) => {
      const hashIndex = item.href.indexOf('#');
      if (hashIndex !== -1) {
        const id = item.href.substring(hashIndex + 1);
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [navItems, pathname]);

  /* ---------- Close mobile menu on desktop resize ---------- */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------- Lock body scroll when mobile menu open ---------- */
  useEffect(() => {
    if (!lenis) return;
    if (mobileOpen) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [mobileOpen, lenis]);

  /* ---------- Smooth scroll handler ---------- */
  const handleNavClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (typeof window === 'undefined') return;

      const hashIndex = href.indexOf('#');
      const targetPath = hashIndex !== -1 ? href.substring(0, hashIndex) : href;
      const anchorId = hashIndex !== -1 ? href.substring(hashIndex) : '';
      
      const currentPath = window.location.pathname;
      const isCurrentPage =
        targetPath === '' ||
        targetPath === '/' ||
        targetPath === currentPath ||
        (targetPath === '/rag' && currentPath === '/rag');

      if (isCurrentPage && anchorId) {
        e.preventDefault();
        if (lenis) {
          lenis.start();
          lenis.scrollTo(anchorId, { duration: prefersReducedMotion ? 0 : 1.2, offset: NAVBAR_SCROLL_OFFSET });
        } else {
          const el = document.querySelector(anchorId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
        setActiveSection(href);
        setMobileOpen(false);
        return;
      }

      setMobileOpen(false);
    },
    [lenis, prefersReducedMotion],
  );

  return (
    <nav
      className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${
        isScrolling ? styles.scrollActive : ''
      } ${mobileOpen ? styles.menuOpen : ''} ${className ?? ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ---- Logo ---- */}
      <a
        href="#home"
        className={styles.logo}
        onClick={(e) => handleNavClick(e, '#home')}
        aria-label="Prateeq Sharma — go to home"
      >
        <svg
          className={styles.logoSvg}
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="38" className={styles.logoBg} />
          <path d="M 26,45 L 32,50 L 26,55" fill="none" className={styles.logoTerminalPrompt} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="35" y1="55" x2="43" y2="55" className={styles.logoTerminalCursor} strokeWidth="3.5" strokeLinecap="round" />
          <line x1="15" y1="72" x2="85" y2="72" className={styles.logoLine} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 32,72 C 32,46 68,46 68,72" className={styles.logoGremlinBody} strokeWidth="3.5" />
          <path d="M 32,48 L 12,38 Q 24,53 36,55" className={styles.logoGremlinEarLeft} strokeWidth="3" strokeLinejoin="round" />
          <path d="M 68,48 L 88,38 Q 76,53 64,55" className={styles.logoGremlinEarRight} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="43" cy="58" r="6.5" className={styles.logoEye} />
          <circle cx="45" cy="55.5" r="2.5" className={styles.logoPupil} />
          <circle cx="57" cy="58" r="6.5" className={styles.logoEye} />
          <circle cx="59" cy="55.5" r="2.5" className={styles.logoPupil} />
          <ellipse cx="37" cy="63" rx="3.5" ry="2" className={styles.logoBlush} />
          <ellipse cx="63" cy="63" rx="3.5" ry="2" className={styles.logoBlush} />
        </svg>
      </a>

      {/* ---- Right Side Controls Group ---- */}
      <div className={styles.rightGroup}>
        {/* ---- Desktop links ---- */}
        <ul className={styles.navLinks}>
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`${styles.navLink} ${effectiveActiveSection === item.href ? styles.active : ''}`}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.href === '/#resume' ? (
                  <Scrambler texts={NAV_LABEL_TEXTS} variant="nav-label" as="span">
                    {item.label}
                  </Scrambler>
                ) : (
                  item.label
                )}
              </a>
            </li>
          ))}
        </ul>

        {/* ---- RAG Context Action Button ---- */}
        {pathname?.startsWith('/rag') && (
          <a
            href="/rag/app"
            className="comic-btn comic-btn-blue"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            🚀 Launch App
          </a>
        )}

        {/* ---- Communication Identity Toggle ---- */}
        {audience && (
          <SegmentedToggle
            options={audienceOptions}
            activeValue={audience}
            onChange={handleAudienceChange}
            className={styles.audienceSegmented}
            ariaLabel={audience === 'developer' ? 'Switch to Business perspective' : 'Switch to Developer perspective'}
          />
        )}

        {/* ---- Theme Toggle Switch ---- */}
        <SegmentedToggle
          options={themeOptions}
          activeValue={theme}
          onChange={handleThemeChange}
          className={styles.themeSegmented}
          ariaLabel={theme === 'light' ? 'Switch to Noir mode' : 'Switch to Azure mode'}
        />

        {/* ---- Client Dashboard Link ---- */}
        <a
          href="/dashboard"
          className="comic-btn comic-btn-outline"
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
        >
          {user ? '👤 DASHBOARD' : 'CLIENT LOGIN'}
        </a>

        {/* ---- Hamburger ---- */}
        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.open : ''}`}
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </div>

      {/* ---- Mobile overlay ---- */}
      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.open : ''}`}
        aria-hidden={!mobileOpen}
      >
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`${styles.mobileNavLink} ${activeSection === item.href ? styles.active : ''}`}
            onClick={(e) => handleNavClick(e, item.href)}
          >
            {item.href === '/#resume' ? (
              <Scrambler texts={NAV_LABEL_TEXTS} variant="nav-label" as="span">
                {item.label}
              </Scrambler>
            ) : (
              item.label
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
