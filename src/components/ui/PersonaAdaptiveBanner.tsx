'use client';

import React, { useEffect, useState, useRef, useTransition } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import Link from 'next/link';
import Portal from '@/components/ui/Portal';
import {
  classifyVisitorLocally,
  dismissBanner,
  isBannerDismissed,
  type PersonaRecommendation,
  type VisitorTelemetry,
} from '@/lib/persona';
import styles from './PersonaAdaptiveBanner.module.css';

export default function PersonaAdaptiveBanner() {
  const [recommendation, setRecommendation] = useState<PersonaRecommendation | null>(null);
  const [visible, setVisible] = useState(false);
  const [, startTransition] = useTransition();

  const dwellRef = useRef<{
    commercial: number;
    credibility: number;
    product: number;
    content: number;
    total: number;
  }>({
    commercial: 0,
    credibility: 0,
    product: 0,
    content: 0,
    total: 0,
  });

  const activeSectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isBannerDismissed()) return;

    // Observe active sections
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            activeSectionRef.current = entry.target.id;
          }
        }
      },
      { threshold: [0.3] }
    );

    const sectionIds = ['resume', 'scoping', 'rag', 'projects', 'playground', 'about', 'terminal', 'blog'];
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // 1-second cadence telemetry accumulator
    const interval = setInterval(() => {
      const active = activeSectionRef.current;
      dwellRef.current.total += 1;

      if (active === 'scoping') {
        dwellRef.current.commercial += 1;
      } else if (active === 'resume' || active === 'about') {
        dwellRef.current.credibility += 1;
      } else if (active === 'rag' || active === 'terminal' || active === 'projects') {
        dwellRef.current.product += 1;
      } else {
        dwellRef.current.content += 1;
      }

      // After 7 seconds of active browsing, trigger persona evaluation if not already shown
      if (dwellRef.current.total >= 7 && !visible && !isBannerDismissed()) {
        const tot = Math.max(1, dwellRef.current.total);
        const telemetry: VisitorTelemetry = {
          commercialIntentRatio: Math.min(1, dwellRef.current.commercial / tot),
          credibilityIntentRatio: Math.min(1, dwellRef.current.credibility / tot),
          productIntentRatio: Math.min(1, dwellRef.current.product / tot),
          contentIntentRatio: Math.min(1, dwellRef.current.content / tot),
          dwellTimeSeconds: tot,
          interactionDepthScore: 0.6,
        };

        // Instant local baseline
        const initialReco = classifyVisitorLocally(telemetry);
        startTransition(() => {
          setRecommendation(initialReco);
          setVisible(true);
        });

        // Background call to Retriever ML service
        fetch('/api/ml/classify-visitor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telemetry),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data: PersonaRecommendation | null) => {
            if (data) {
              startTransition(() => {
                setRecommendation(data);
              });
            }
          })
          .catch(() => {});
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [visible]);

  const handleDismiss = () => {
    setVisible(false);
    dismissBanner();
  };

  if (!visible || !recommendation) return null;

  return (
    <Portal>
      <div className={styles.bannerWrapper}>
        <AnimatePresence>
          {visible && (
            <m.div
              className={styles.bannerCard}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.topRow}>
                <span className={styles.badge}>
                  <span className={styles.pulseDot} />
                  {recommendation.badgeLabel}
                </span>
                <button
                  type="button"
                  className={styles.dismissBtn}
                  onClick={handleDismiss}
                  aria-label="Dismiss suggestion"
                >
                  ×
                </button>
              </div>

              <p className={styles.headline}>{recommendation.headline}</p>

              {recommendation.isPdfDownload ? (
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.actionBtn}
                  onClick={handleDismiss}
                >
                  {recommendation.ctaText}
                </a>
              ) : (
                <Link
                  href={recommendation.ctaHref}
                  className={styles.actionBtn}
                  onClick={handleDismiss}
                >
                  {recommendation.ctaText}
                </Link>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </Portal>
  );
}
