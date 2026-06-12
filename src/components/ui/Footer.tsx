'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, BarChart2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import styles from './Footer.module.css';

export interface SocialLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface FooterProps {
  /** Override default social links */
  socials?: SocialLink[];
  /** Additional CSS class */
  className?: string;
}

/* ---- Default SVG icons (inline, no external deps) ---- */

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
  </svg>
);

const defaultSocials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/prat3010', icon: <GitHubIcon /> },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/freshlimevodka', icon: <LinkedInIcon /> },
  { label: 'Twitter', href: 'https://x.com/3010prateek', icon: <TwitterIcon /> },
  { label: 'Instagram', href: 'https://instagram.com/freshlimevodka', icon: <InstagramIcon /> },
  { label: 'Email', href: 'mailto:3010prateeksharma@gmail.com', icon: <EmailIcon /> },
  { label: 'Phone', href: 'tel:+919050433260', icon: <PhoneIcon /> },
];

const navItems = [
  { label: 'Home', href: '/#home' },
  { label: 'About', href: '/#about' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Projects', href: '/#projects' },
  { label: 'Resume', href: '/#resume' },
  { label: 'Playground', href: '/#playground' },
  { label: 'Contact', href: '/#contact' },
  { label: 'Blog', href: '/blog' },
];

export default function Footer({ socials, className }: FooterProps) {
  const socialLinks = socials ?? defaultSocials;
  const [year] = useState(() => new Date().getFullYear());
  const { theme } = useTheme();
  const [timeString, setTimeString] = useState('');

  // Live system clock logic for Noir theme (safely executed on client-side only)
  useEffect(() => {
    if (theme !== 'noir') return;
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [theme]);

  return (
    <footer className={`${styles.footer} ${className ?? ''}`}>
      
      {/* ────────────────────────────────────────────────────────────
         COMIC BOOK / AZURE THEME VIEW (RENDERED SIDE-BY-SIDE IN DOM)
         ──────────────────────────────────────────────────────────── */}
      <div className={styles.comicView}>
        {/* Decorative corner accents */}
        <span className={`${styles.cornerDecoration} ${styles.topLeft}`} aria-hidden="true">
          POW!
        </span>
        <span className={`${styles.cornerDecoration} ${styles.topRight}`} aria-hidden="true">
          ZAP!
        </span>
        <span className={`${styles.cornerDecoration} ${styles.bottomLeft}`} aria-hidden="true">
          WHAM!
        </span>
        <span className={`${styles.cornerDecoration} ${styles.bottomRight}`} aria-hidden="true">
          BAM!
        </span>

        <div className={styles.container}>
          <div className={styles.panelsGrid}>
            
            {/* PANEL 1: MISSION */}
            <div className={`${styles.panel} ${styles.missionPanel}`} role="region" aria-label="Mission Statement">
              <div className={styles.comicPanel}>
                <h3 className={styles.comicPanelTitle}>THE MISSION!</h3>
                <div className={styles.comicPanelBody}>
                  <p className={styles.comicText}>
                    Designing premium web experiences with a punch of color and vector precision. Stand out, make it pop!
                  </p>
                  <p className={styles.comicMadeWith}>
                    Made with <span className={styles.heart}><Heart size={14} style={{ display: 'inline', verticalAlign: 'middle', fill: 'var(--pop-red)', stroke: 'var(--pop-black)' }} /></span> and <span className={styles.pow}>POW!</span> by Prateeq Sharma
                  </p>
                </div>
              </div>
            </div>

            {/* PANEL 2: NAVIGATION */}
            <div className={`${styles.panel} ${styles.navPanel}`} role="navigation" aria-label="Footer navigation">
              <div className={styles.comicPanel}>
                <h3 className={styles.comicPanelTitle}>NAVIGATE!</h3>
                <div className={styles.comicPanelBody}>
                  <div className={styles.comicNavLinks}>
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} className={styles.comicNavLink}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 3: CONNECT */}
            <div className={`${styles.panel} ${styles.connectPanel}`} role="region" aria-label="Social connections">
              <div className={styles.comicPanel}>
                <h3 className={styles.comicPanelTitle}>CONNECT!</h3>
                <div className={styles.comicPanelBody}>
                  <div className={styles.comicSocials}>
                    {socialLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className={styles.comicSocialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                      >
                        <span className={styles.halftoneBg} />
                        <span className={styles.socialIcon}>{link.icon}</span>
                        <span className={styles.socialTooltip}>{link.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom strip */}
          <div className={styles.bottomBar}>
            <p className={styles.copyright}>
              © {year} Prateeq Sharma. All rights reserved.
            </p>
            <Link href="/admin/analytics" className={styles.analyticsLink}>
              <BarChart2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Site Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────
         CYBER-NOIR / CYBERPUNK THEME VIEW (RENDERED SIDE-BY-SIDE IN DOM)
         ──────────────────────────────────────────────────────────── */}
      <div className={styles.noirView}>
        {/* CRT scanlines effect */}
        <div className={styles.crtOverlay} aria-hidden="true" />

        {/* Decorative corner accents */}
        <span className={`${styles.cornerDecoration} ${styles.topLeft}`} aria-hidden="true">
          GRIT
        </span>
        <span className={`${styles.cornerDecoration} ${styles.topRight}`} aria-hidden="true">
          SHADOW
        </span>
        <span className={`${styles.cornerDecoration} ${styles.bottomLeft}`} aria-hidden="true">
          DUSK
        </span>
        <span className={`${styles.cornerDecoration} ${styles.bottomRight}`} aria-hidden="true">
          CASE
        </span>

        <div className={styles.container}>
          <div className={styles.panelsGrid}>
            
            {/* PANEL 1: TERMINAL MISSION */}
            <div className={`${styles.panel} ${styles.missionPanel}`} role="region" aria-label="Mission Statement">
              <div className={styles.terminalWindow}>
                <div className={styles.terminalHeader}>
                  <span className={`${styles.terminalDot} ${styles.dotRed}`} />
                  <span className={`${styles.terminalDot} ${styles.dotYellow}`} />
                  <span className={`${styles.terminalDot} ${styles.dotGreen}`} />
                  <span className={styles.terminalTitle}>mission.txt</span>
                </div>
                <div className={styles.terminalBody}>
                  <div className={styles.terminalLine}>
                    <span className={styles.terminalPrompt}>prateek@system:~ $</span> cat mission.txt
                  </div>
                  <div className={`${styles.terminalOutput} ${styles.textStdout}`}>
                    [STATUS: ACTIVE]
                    <br />
                    [GOAL: CREATING GORGEOUS & HIGH-PERFORMANCE WEB EXPERIENCES WITH VECTOR PRECISION.]
                  </div>
                  <div className={styles.terminalOutput}>
                    Made with <span className={styles.noirHeart}><Heart size={14} style={{ display: 'inline', verticalAlign: 'middle', fill: '#8E8EAF', stroke: '#5A5A72' }} /></span> and <span className={styles.noirGrit}>GRIT</span> by Prateeq Sharma
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 2: TERMINAL NAVIGATION */}
            <div className={`${styles.panel} ${styles.navPanel}`} role="navigation" aria-label="Footer navigation">
              <div className={styles.terminalWindow}>
                <div className={styles.terminalHeader}>
                  <span className={`${styles.terminalDot} ${styles.dotRed}`} />
                  <span className={`${styles.terminalDot} ${styles.dotYellow}`} />
                  <span className={`${styles.terminalDot} ${styles.dotGreen}`} />
                  <span className={styles.terminalTitle}>navigation</span>
                </div>
                <div className={styles.terminalBody}>
                  <div className={styles.terminalLine}>
                    <span className={styles.terminalPrompt}>prateek@system:~ $</span> ls -R /nav
                  </div>
                  <div className={styles.asciiTree}>
                    <span className={styles.treeRoot}>/navigation</span>
                    {navItems.map((item, index) => {
                      const isLast = index === navItems.length - 1;
                      return (
                        <div key={item.href} className={styles.treeItem}>
                          <span className={styles.treePipe}>{isLast ? '└── ' : '├── '}</span>
                          <Link href={item.href} className={styles.treeLink}>
                            {item.label.toLowerCase()}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 3: TERMINAL CONNECT */}
            <div className={`${styles.panel} ${styles.connectPanel}`} role="region" aria-label="Social connections">
              <div className={styles.terminalWindow}>
                <div className={styles.terminalHeader}>
                  <span className={`${styles.terminalDot} ${styles.dotRed}`} />
                  <span className={`${styles.terminalDot} ${styles.dotYellow}`} />
                  <span className={`${styles.terminalDot} ${styles.dotGreen}`} />
                  <span className={styles.terminalTitle}>connect.sh</span>
                </div>
                <div className={styles.terminalBody}>
                  <div className={styles.terminalLine}>
                    <span className={styles.terminalPrompt}>prateek@system:~ $</span> ./connect.sh
                  </div>
                  <div className={styles.terminalSocials}>
                    {socialLinks.map((link) => {
                      let protocol = 'link://';
                      const lower = link.label.toLowerCase();
                      if (lower === 'github') protocol = 'git://';
                      else if (lower === 'linkedin') protocol = 'lnk://';
                      else if (lower === 'twitter') protocol = 'x://';
                      else if (lower === 'instagram') protocol = 'ig://';
                      else if (lower === 'email') protocol = 'mail://';
                      else if (lower === 'phone') protocol = 'tel://';

                      let displayVal = link.href
                        .replace('https://github.com/', '')
                        .replace('https://linkedin.com/in/', '')
                        .replace('https://x.com/', '')
                        .replace('https://instagram.com/', '')
                        .replace('mailto:', '')
                        .replace('tel:', '');

                      if (displayVal.length > 20) {
                        displayVal = displayVal.substring(0, 17) + '...';
                      }

                      return (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.terminalSocialLink}
                        >
                          <span className={styles.protocolPrefix}>{protocol}</span>
                          <span className={styles.protocolValue}>{displayVal}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 4: TERMINAL TELEMETRY */}
            <div className={`${styles.panel} ${styles.statsPanel}`} role="region" aria-label="System telemetry">
              <div className={styles.terminalWindow}>
                <div className={styles.terminalHeader}>
                  <span className={`${styles.terminalDot} ${styles.dotRed}`} />
                  <span className={`${styles.terminalDot} ${styles.dotYellow}`} />
                  <span className={`${styles.terminalDot} ${styles.dotGreen}`} />
                  <span className={styles.terminalTitle}>telemetry.log</span>
                </div>
                <div className={styles.terminalBody}>
                  <div className={styles.terminalLine}>
                    <span className={styles.terminalPrompt}>prateek@system:~ $</span> monitor --live
                  </div>
                  <div className={styles.diagnosticsLog}>
                    <div className={styles.logRow}>
                      <span className={styles.logLabel}>SYSTEM:</span>
                      <span className={`${styles.logValue} ${styles.greenGlow}`}>ONLINE</span>
                    </div>
                    <div className={styles.logRow}>
                      <span className={styles.logLabel}>LOCAL TIME:</span>
                      <span className={`${styles.logValue} ${styles.cyanGlow}`}>{timeString || 'FETCHING...'}</span>
                    </div>
                    <div className={styles.logRow}>
                      <span className={styles.logLabel}>LOCATION:</span>
                      <span className={styles.logValue}>DELHI, IND</span>
                    </div>
                    <div className={styles.logRow}>
                      <span className={styles.logLabel}>SESSION:</span>
                      <span className={`${styles.logValue} ${styles.pinkGlow}`}>PORTFOLIO_v2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom strip */}
          <div className={styles.bottomBar}>
            <p className={styles.copyright}>
              © {year} Prateeq Sharma. All rights reserved.
            </p>
            <Link href="/admin/analytics" className={styles.analyticsLink}>
              <BarChart2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Site Analytics
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
