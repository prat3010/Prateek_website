'use client';

import React, { useRef, useState, type FormEvent } from 'react';
import { useLenis } from 'lenis/react';
import { Code2, Globe, MessageCircle, Mail, Phone } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import SpeechBubble from '@/components/ui/SpeechBubble';
import ConfettiBurst, { type ConfettiBurstHandle } from '@/components/effects/ConfettiBurst';
import styles from './Contact.module.css';

const Instagram = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const socialLinks = [
  { icon: Code2, label: 'GitHub', href: 'https://github.com/prat3010' },
  { icon: Globe, label: 'LinkedIn', href: 'https://linkedin.com/in/freshlimevodka' },
  { icon: MessageCircle, label: 'Twitter / X', href: 'https://x.com/3010prateek' },
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/freshlimevodka' },
  { icon: Mail, label: 'Email', href: 'mailto:3010prateeksharma@gmail.com' },
  { icon: Phone, label: 'Phone', href: 'tel:+919050433260' },
];

export default function Contact() {
  const confettiRef = useRef<ConfettiBurstHandle>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const { isNoir } = useTheme();
  const lenis = useLenis();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        confettiRef.current?.triggerConfetti();
        form.reset();
        lenis?.scrollTo('#contact', { duration: 1.0, offset: NAVBAR_SCROLL_OFFSET });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Something went wrong. Please try again!');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <section id="contact" className={styles.contact} aria-label="Contact">
      <ConfettiBurst ref={confettiRef} />

      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          SEND A SIGNAL!
        </h2>

        <div className={styles.grid}>
          <div className={styles.formColumn}>
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
                {status === 'loading' ? 'SENDING... ⚡' : 'SEND IT! 💥'}
              </button>

              {status === 'success' && (
                <SpeechBubble direction="top" color="var(--pop-green)">
                  <p className={styles.successText}>Message sent! 🎉 I&apos;ll get back to you soon!</p>
                </SpeechBubble>
              )}

              {status === 'error' && (
                <SpeechBubble direction="top" color="var(--pop-red)">
                  <p className={styles.errorText}>💥 {errorMessage}</p>
                </SpeechBubble>
              )}
            </form>
          </div>

          <div className={styles.socialColumn}>
            <div className={styles.socialCard}>
              <h3 className={styles.socialTitle}>Find me online</h3>
              <p className={styles.socialDesc}>
                Or reach out through any of these channels — I&apos;m always happy to connect!
              </p>
              <div className={styles.socialLinks}>
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label={link.label}
                  >
                    <link.icon size={24} />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
