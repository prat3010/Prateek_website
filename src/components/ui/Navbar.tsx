'use client';

import { useState, useEffect, useCallback, useMemo, type MouseEvent } from 'react';
import { useLenis } from 'lenis/react';
import { useTheme } from '@/context/ThemeContext';
import { useLenisScroll } from '@/context/LenisProvider';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import styles from './Navbar.module.css';

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

const defaultItems: NavItem[] = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Resume', href: '/#resume' },
  { label: 'Playground', href: '/#playground' },
  { label: 'Contact', href: '/#contact' },
];

export default function Navbar({ items, className }: NavbarProps) {
  const navItems = useMemo(() => items ?? defaultItems, [items]);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(navItems[0]?.href ?? '');
  const { isNoir, toggleTheme } = useTheme();
  const { scrollY } = useLenisScroll();
  const lenis = useLenis();

  /* ---------- Scroll tracking for background color ---------- */
  useEffect(() => {
    const unsub = scrollY.on('change', (latest) => {
      const isScrolled = latest > 20;
      setScrolled((prev) => (prev === isScrolled ? prev : isScrolled));
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
  }, [navItems]);

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
      // If we are not on the homepage, let the default href navigation occur (e.g. go to /#about)
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        setMobileOpen(false);
        return;
      }

      e.preventDefault();
      const anchorId = href.substring(href.indexOf('#')); // Extracts '#about' from '/#about'
      if (lenis) {
        lenis.scrollTo(anchorId, { duration: 1.5, offset: NAVBAR_SCROLL_OFFSET });
      }
      setActiveSection(href);
      setMobileOpen(false);
    },
    [lenis],
  );

  return (
    <nav
      className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${
        mobileOpen ? styles.menuOpen : ''
      } ${className ?? ''}`}
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
                className={`${styles.navLink} ${activeSection === item.href ? styles.active : ''}`}
                onClick={(e) => handleNavClick(e, item.href)}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* ---- Theme Toggle Switch ---- */}
        <button
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label={isNoir ? 'Switch to Azure mode' : 'Switch to Noir mode'}
        >
          {isNoir ? 'AZURE' : 'NOIR'}
        </button>

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
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
