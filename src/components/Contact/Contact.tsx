'use client';

import React, { useRef, useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { useLenis } from 'lenis/react';
import { useTheme } from '@/context/ThemeContext';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import { Rocket, Copy, Check, Terminal as TerminalIcon, Mail, Clock, Globe } from 'lucide-react';
import SpeechBubble from '@/components/ui/SpeechBubble';
import ConfettiBurst, { type ConfettiBurstHandle } from '@/components/effects/ConfettiBurst';
import ScopingBriefModal from '@/components/Intake/ScopingBriefModal';
import styles from './Contact.module.css';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const CONTACT_EMAIL = '3010prateeksharma@gmail.com';

// Extend window to include grecaptcha
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

interface IntentOption {
  id: string;
  label: string;
}

const BIZ_INTENTS: IntentOption[] = [
  { id: 'web-app', label: '⚡ Custom Web Application' },
  { id: 'brand-ui', label: '🎨 Brand & UI/UX Design' },
  { id: 'maintenance', label: '🛠️ Maintenance & Care Plan' },
  { id: 'general', label: '💼 General Business Inquiry' },
];

const DEV_INTENTS: IntentOption[] = [
  { id: 'hiring', label: '💼 Full-Time / Contract Role' },
  { id: 'rag-ai', label: '🤖 AI & RAG Engineering' },
  { id: 'open-source', label: '⭐ Open Source / Collab' },
  { id: 'general', label: '💬 General Tech Chat' },
];

function Contact() {
  const confettiRef = useRef<ConfettiBurstHandle>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [recaptchaReady, setRecaptchaReady] = useState(!SITE_KEY);
  const [isScopingModalOpen, setIsScopingModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { isNoir, audience } = useTheme();
  const lenis = useLenis();

  const activeAudience = audience || 'developer';
  const isBusiness = activeAudience === 'business';

  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const activeIntent = selectedIntent ?? (isBusiness ? 'web-app' : 'hiring');

  // Inject reCAPTCHA v3 script once on mount
  useEffect(() => {
    if (!SITE_KEY || document.getElementById('recaptcha-script')) {
      setTimeout(() => setRecaptchaReady(true), 0);
      return;
    }
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.onload = () => window.grecaptcha?.ready(() => setRecaptchaReady(true));
    document.head.appendChild(script);
  }, []);

  const handleCopyEmail = useCallback(() => {
    navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    const currentIntents = isBusiness ? BIZ_INTENTS : DEV_INTENTS;
    const matched = currentIntents.find(i => i.id === activeIntent);
    const intentLabel = matched ? matched.label : activeIntent;

    const fullMessage = `[Intent: ${intentLabel}]\n\n${message}`;

    // Obtain reCAPTCHA v3 token (invisible, score-based)
    let recaptchaToken: string | undefined;
    if (SITE_KEY && window.grecaptcha) {
      try {
        recaptchaToken = await window.grecaptcha.execute(SITE_KEY, { action: 'contact_submit' });
      } catch {
        setStatus('error');
        setErrorMessage('reCAPTCHA check failed. Please refresh and try again.');
        return;
      }
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message: fullMessage, recaptchaToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        confettiRef.current?.triggerConfetti();
        form.reset();
        setSelectedIntent(null);
        lenis?.scrollTo('#contact', { duration: 1.0, offset: NAVBAR_SCROLL_OFFSET });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Something went wrong. Please try again!');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  }, [isBusiness, activeIntent, lenis]);

  const intentOptions = isBusiness ? BIZ_INTENTS : DEV_INTENTS;

  return (
    <section id="contact" className={styles.contact} aria-label="Contact">
      <ConfettiBurst ref={confettiRef} />

      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          {isBusiness ? 'START A PROJECT & GET IN TOUCH' : 'INITIATE HANDSHAKE / SEND A SIGNAL'}
        </h2>

        {/* Telemetry SLA & Availability Bar */}
        <div className={styles.telemetryBar}>
          <div className={styles.telemetryItem}>
            <Clock size={13} className={styles.telemetryIcon} />
            <span>SLA: &lt; 24 Hours</span>
          </div>
          <div className={styles.telemetryDivider}>•</div>
          <div className={styles.telemetryItem}>
            <Globe size={13} className={styles.telemetryIcon} />
            <span>IST (UTC+5:30)</span>
          </div>
          <div className={styles.telemetryDivider}>•</div>
          <button type="button" className={styles.copyEmailBtn} onClick={handleCopyEmail} title="Copy email address">
            <Mail size={13} />
            <span>{CONTACT_EMAIL}</span>
            {copiedEmail ? <Check size={12} className={styles.checkIcon} /> : <Copy size={12} />}
          </button>
        </div>

        {/* Commercial Scoping Lab Hero Banner (Business Mode) */}
        {isBusiness && (
          <div className={styles.scopingBanner}>
            <div className={styles.scopingBannerText}>
              <span className={styles.scopingBadge}>⚡ INSTANT ESTIMATE & PDF PROPOSAL</span>
              <h3>Need an Itemized Scope & Budget Estimate?</h3>
              <p>Skip the back-and-forth email wait. Configure your architecture, add-ons, and care plan in our 60-second interactive Scoping Lab.</p>
            </div>
            <button
              type="button"
              className={styles.scopingBtn}
              onClick={() => setIsScopingModalOpen(true)}
            >
              <Rocket size={16} />
              <span>LAUNCH INSTANT SCOPING LAB</span>
            </button>
          </div>
        )}

        {/* Form Container */}
        <div className={styles.formWrapper}>
          <div className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <span className={styles.headerDot + ' ' + styles.dotRed} />
              <span className={styles.headerDot + ' ' + styles.dotYellow} />
              <span className={styles.headerDot + ' ' + styles.dotGreen} />
              <span className={styles.headerTitle}>
                {isBusiness ? 'DIRECT INQUIRY DISPATCH' : 'DEV DISPATCH PORTAL'}
              </span>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label htmlFor="contact-name" className={styles.label}>
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    className={styles.input}
                    placeholder={isNoir ? 'Sam Spade' : 'Peter Parker'}
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-email" className={styles.label}>
                    Your Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    className={styles.input}
                    placeholder={isNoir ? 'spade@privateeye.com' : 'spidey@dailybugle.com'}
                  />
                </div>
              </div>

              {/* Communication Intent Selector Chips */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Communication Intent
                </label>
                <div className={styles.chipGrid}>
                  {intentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`${styles.intentChip} ${activeIntent === opt.id ? styles.intentChipActive : ''}`}
                      onClick={() => setSelectedIntent(opt.id)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-message" className={styles.label}>
                  Your Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={4}
                  className={styles.textarea}
                  placeholder={
                    isNoir
                      ? 'The stuff that dreams are made of...'
                      : 'Share your project details, timeline, or key questions...'
                  }
                />
              </div>

              {/* Action Bar */}
              <div className={styles.actionRow}>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={status === 'loading' || !recaptchaReady}
                >
                  {status === 'loading' ? 'TRANSMITTING SIGNAL...' : 'SEND SIGNAL'}
                </button>

                {/* Developer Mode Quick Links */}
                {!isBusiness && (
                  <div className={styles.devQuickLinks}>
                    <Link href="/terminal" className={styles.quickLinkBtn} title="Terminal Console">
                      <TerminalIcon size={14} />
                      <span>Console</span>
                    </Link>
                    <a
                      href="https://github.com/prat3010"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.quickLinkBtn}
                      title="GitHub Profile"
                    >
                      <GitHubIcon />
                    </a>
                    <a
                      href="https://linkedin.com/in/prateek-sharma3010"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.quickLinkBtn}
                      title="LinkedIn Profile"
                    >
                      <LinkedInIcon />
                    </a>
                  </div>
                )}
              </div>

              {status === 'success' && (
                <SpeechBubble direction="top" color="var(--pop-green)">
                  <p className={styles.successText}>Signal received! I&apos;ll get back to you within 24 hours.</p>
                </SpeechBubble>
              )}

              {status === 'error' && (
                <SpeechBubble direction="top" color="var(--pop-red)">
                  <p className={styles.errorText}>Transmission error: {errorMessage}</p>
                </SpeechBubble>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Scoping Brief Modal Integration */}
      <ScopingBriefModal
        isOpen={isScopingModalOpen}
        onClose={() => setIsScopingModalOpen(false)}
      />
    </section>
  );
}

export default React.memo(Contact);
