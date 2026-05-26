'use client';

import React, { useRef, useState, type FormEvent } from 'react';
import { Code2, Globe, MessageCircle, Mail, Phone } from 'lucide-react';
import ActionWord from '@/components/ui/ActionWord';
import SpeechBubble from '@/components/ui/SpeechBubble';
import ScrollReveal from '@/components/effects/ScrollReveal';
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
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    confettiRef.current?.triggerConfetti();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section id="contact" className={styles.contact} aria-label="Contact">
      <ConfettiBurst ref={confettiRef} />

      {/* Decorative speed lines */}
      <div className={styles.speedLines} aria-hidden="true" />

      <div className={styles.container}>
        <ScrollReveal>
          <h2 className={styles.sectionTitle}>
            SEND A SIGNAL!
            <span className={styles.titleAction}>
              <ActionWord word="SEND!" color="var(--pop-orange)" size="lg" />
            </span>
          </h2>
        </ScrollReveal>

        <div className={styles.grid}>
          {/* Form */}
          <ScrollReveal delay={100} className={styles.formColumn}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="contact-name" className={styles.label}>
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  className={styles.input}
                  placeholder="Peter Parker"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-email" className={styles.label}>
                  Your Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  className={styles.input}
                  placeholder="spidey@dailybugle.com"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="contact-message" className={styles.label}>
                  Your Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  className={styles.textarea}
                  placeholder="With great power comes great responsibility..."
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                SEND IT! 💥
              </button>

              {submitted && (
                <SpeechBubble direction="top" color="var(--pop-green)">
                  <p className={styles.successText}>Message sent! 🎉 I&apos;ll get back to you soon!</p>
                </SpeechBubble>
              )}
            </form>
          </ScrollReveal>

          {/* Social Links */}
          <ScrollReveal delay={200} className={styles.socialColumn}>
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
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
