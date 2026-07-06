'use client';

import React, { useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
import { useLenis } from 'lenis/react';
import type { ResumeData, PricingPlan } from '@/data/resume';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import ComicPanel from '@/components/ui/ComicPanel';
import { Check } from 'lucide-react';
import styles from './Pricing.module.css';

interface PricingProps {
  resumeData: ResumeData | null;
}

const PRICING_SECTION_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'CONSULTING RATES', noir: 'CONSULTING RATES' },
  business:  { light: 'SERVICE PACKAGES', noir: 'SERVICE PACKAGES' },
};

function Pricing({ resumeData }: PricingProps) {
  const { isNoir, audience } = useTheme();
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();

  const activeAudience = audience || 'developer';

  // Fallback plans if not present in DB
  const fallbackPlans: PricingPlan[] = useMemo(() => {
    if (activeAudience === 'business') {
      return [
        {
          title: "Landing Page Package",
          price: "$400 - $700",
          description: "A focused single-page website with a clear message, responsive layout, and contact flow.",
          features: [
            "Custom UI mockup",
            "Responsive layout and spacing",
            "Basic SEO metadata",
            "Resend contact email integration"
          ],
          cta: "landing-page"
        },
        {
          title: "Custom Web Application",
          price: "$1,200 - $2,500",
          description: "A multi-page application with Supabase-backed data, admin tools, and project-specific workflows.",
          features: [
            "Next.js App Router & TypeScript",
            "Supabase data layer setup",
            "Admin or analytics views",
            "Custom forms or billing flow"
          ],
          cta: "web-application"
        },
        {
          title: "Monthly Support & SEO",
          price: "$150 / mo",
          description: "Ongoing maintenance, content updates, and periodic performance checks.",
          features: [
            "Included development hours",
            "Performance and usability checks",
            "Monthly page-visit review",
            "Security and package updates"
          ],
          cta: "monthly-support"
        }
      ];
    }
    return [
      {
        title: "Hourly Consulting",
        price: "$50 / hr",
        description: "One-on-one development, debugging, and architecture support.",
        features: [
          "React 19 / Next.js 16 debugging",
          "Development workflow review",
          "Supabase / PostgreSQL setup",
          "Code review and refactoring sessions"
        ],
        cta: "mentorship"
      },
      {
        title: "Architecture Review",
        price: "$250 / session",
        description: "A technical review of structure, data flow, and caching behavior.",
        features: [
          "Database query review",
          "Caching and rendering review",
          "Performance notes and priorities",
          "Follow-up call to discuss findings"
        ],
        cta: "architecture"
      },
      {
        title: "Codebase Security Audit",
        price: "$450 / audit",
        description: "A practical review of secrets, access control, and common exposure points.",
        features: [
          "RLS policy review",
          "Secret exposure sweep",
          "Abuse and spam checks",
          "Remediation notes"
        ],
        cta: "security"
      }
    ];
  }, [activeAudience]);

  const plans = resumeData?.pricing?.[activeAudience] || fallbackPlans;

  const handleSelectPackage = (ctaCode: string) => {
    // Dispatch custom event to pre-populate form
    const selectEvent = new CustomEvent('select-package', { detail: { package: ctaCode } });
    window.dispatchEvent(selectEvent);

    // Scroll to contact form
    if (lenis) {
      lenis.scrollTo('#contact', { duration: prefersReducedMotion ? 0 : 1.5, offset: NAVBAR_SCROLL_OFFSET });
    } else {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="pricing" className={styles.pricingSection} aria-label="Pricing Packages">
      <div className={styles.container}>
        <Scrambler
          texts={PRICING_SECTION_TITLE_TEXTS}
          variant="section-title"
          as="h2"
          className={styles.sectionTitle}
        >
          {activeAudience === 'business' ? 'SERVICE PACKAGES' : 'CONSULTING RATES'}
        </Scrambler>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeAudience}
            className={styles.grid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {plans.map((plan, index) => (
              <div key={plan.title} className={styles.cardContainer}>
                <ComicPanel tilt={index % 2 === 0 ? 0.8 : -0.8} className={styles.pricingCard} staticDots>
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{plan.title}</h3>
                    <div className={styles.priceContainer}>
                      <span className={styles.priceValue}>{plan.price}</span>
                    </div>
                    <p className={styles.cardDesc}>{plan.description}</p>
                    
                    <ul className={styles.featuresList}>
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className={styles.featureItem}>
                          <Check size={16} className={styles.checkIcon} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelectPackage(plan.cta)}
                      className={styles.actionBtn}
                    >
                      <span>{isNoir ? 'SELECT_PLAN' : 'Choose Package'}</span>
                    </button>
                  </div>
                </ComicPanel>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default React.memo(Pricing);
