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
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Playground', href: '#playground' },
  { label: 'Contact', href: '#contact' },
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
      setScrolled(latest > 20);
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
          const href = `#${entry.target.id}`;
          setActiveSection(href);
        }
      });
    }, observerOptions);

    navItems.forEach((item) => {
      const id = item.href.replace('#', '');
      const el = document.getElementById(id);
      if (el) observer.observe(el);
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
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(href, { duration: 1.5, offset: NAVBAR_SCROLL_OFFSET });
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
        <span className={styles.logoBurst} />
        <span className={styles.logoText}>PS</span>
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
