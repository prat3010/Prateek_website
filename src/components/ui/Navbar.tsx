'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  { label: 'Contact', href: '#contact' },
];

export default function Navbar({ items, className }: NavbarProps) {
  const navItems = items ?? defaultItems;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(navItems[0]?.href ?? '');

  /* ---------- Scroll tracking ---------- */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Determine active section
      const scrollPos = window.scrollY + 120;
      for (let i = navItems.length - 1; i >= 0; i--) {
        const id = navItems[i].href.replace('#', '');
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(navItems[i].href);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navItems]);

  /* ---------- Lock body scroll when mobile menu open ---------- */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  /* ---------- Smooth scroll handler ---------- */
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      const id = href.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setActiveSection(href);
      setMobileOpen(false);
    },
    [],
  );

  return (
    <nav
      className={`${styles.navbar} ${scrolled ? styles.scrolled : ''} ${className ?? ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* ---- Logo ---- */}
      <a
        href="#home"
        className={styles.logo}
        onClick={(e) => handleNavClick(e, '#home')}
        aria-label="Prateek Sharma — go to home"
      >
        <span className={styles.logoBurst} />
        <span className={styles.logoText}>PS</span>
      </a>

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
