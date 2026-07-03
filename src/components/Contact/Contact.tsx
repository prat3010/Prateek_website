'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import { useLenis } from 'lenis/react';
import { useTheme, useAudience } from '@/context/ThemeContext';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import SpeechBubble from '@/components/ui/SpeechBubble';
import ConfettiBurst from '@/components/effects/ConfettiBurst';
import styles from './Contact.module.css';

function Contact() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { isNoir } = useTheme();
  const { audience } = useAudience();
  const lenis = useLenis();

  const activeAudience = audience || 'developer';
  const [selectedIntent, setSelectedIntent] = useState('general');

  // Pre-populate intent when chosen from pricing table
  useEffect(() => {
    const handleSelectPackage = (e: Event) => {
      const customEvent = e as CustomEvent<{ package: string }>;
      if (customEvent.detail && customEvent.detail.package) {
        setSelectedIntent(customEvent.detail.package);
      }
    };
    window.addEventListener('select-package', handleSelectPackage);
    return () => window.removeEventListener('select-package', handleSelectPackage);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const intent = formData.get('intent') as string;

    // Resolve human-readable package labels
    const intentLabel = activeAudience === 'business'
      ? ({
          general: 'General Freelance Inquiry',
          'landing-page': 'Landing Page Package ($400 - $700)',
          'web-application': 'Custom Web Application ($1,200 - $2,500)',
          'monthly-support': 'Monthly Support & SEO ($150/mo)',
          'custom-quote': 'Other / Custom Website Quote'
        }[intent] || intent)
      : ({
          general: 'General Collaboration / Inquiry',
          hiring: 'Hiring / Employment Opportunity',
          mentorship: 'Hourly Mentorship / Consulting ($50/hr)',
          architecture: 'Architecture Review ($250/session)',
          security: 'Codebase Security Audit ($450/audit)',
          'open-source': 'Open-Source Collaboration'
        }[intent] || intent);

    const fullMessage = `[Intent: ${intentLabel}]\n\n${message}`;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message: fullMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setShowConfetti(true);
        form.reset();
        setSelectedIntent('general');
        lenis?.scrollTo('#contact', { duration: 1.0, offset: NAVBAR_SCROLL_OFFSET });
        setTimeout(() => {
          setStatus('idle');
          setShowConfetti(false);
        }, 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Something went wrong. Please try again!');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <section id="contact" className={styles.contact} aria-label="Contact">
      {showConfetti && <ConfettiBurst autoTrigger />}

      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          SEND A SIGNAL!
        </h2>

        <div className={styles.formWrapper}>
          <form className={styles.form} onSubmit={handleSubmit}>
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

            {/* Communication Intent Dropdown */}
            <div className={styles.field}>
              <label htmlFor="contact-intent" className={styles.label}>
                Communication Intent
              </label>
              <select
                id="contact-intent"
                name="intent"
                value={selectedIntent}
                onChange={(e) => setSelectedIntent(e.target.value)}
                className={styles.select}
              >
                {activeAudience === 'business' ? (
                  <>
                    <option value="general">General Freelance Inquiry</option>
                    <option value="landing-page">Landing Page Package ($400 - $700)</option>
                    <option value="web-application">Custom Web Application ($1,200 - $2,500)</option>
                    <option value="monthly-support">Monthly Support & SEO ($150/mo)</option>
                    <option value="custom-quote">Other / Custom Website Quote</option>
                  </>
                ) : (
                  <>
                    <option value="general">General Collaboration / Inquiry</option>
                    <option value="hiring">Hiring / Employment Opportunity</option>
                    <option value="mentorship">Hourly Mentorship / Consulting ($50/hr)</option>
                    <option value="architecture">Architecture Review ($250/session)</option>
                    <option value="security">Codebase Security Audit ($450/audit)</option>
                    <option value="open-source">Open-Source Collaboration</option>
                  </>
                )}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="contact-message" className={styles.label}>
                Your Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                className={styles.textarea}
                placeholder={
                  isNoir
                    ? 'The stuff that dreams are made of...'
                    : 'With great power comes great responsibility...'
                }
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'TRANSMITTING...' : 'SEND IT!'}
            </button>

            {status === 'success' && (
              <SpeechBubble direction="top" color="var(--pop-green)">
                <p className={styles.successText}>Message sent! I&apos;ll get back to you soon!</p>
              </SpeechBubble>
            )}

            {status === 'error' && (
              <SpeechBubble direction="top" color="var(--pop-red)">
                <p className={styles.errorText}>Error: {errorMessage}</p>
              </SpeechBubble>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default React.memo(Contact);
