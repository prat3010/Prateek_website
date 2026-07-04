'use client';

import React, { useMemo } from 'react';
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

  const activeAudience = audience || 'developer';

  // Fallback plans if not present in DB
  const fallbackPlans: PricingPlan[] = useMemo(() => {
    if (activeAudience === 'business') {
      return [
        {
          title: "Landing Page Package",
          price: "$400 - $700",
          description: "A high-conversion single page website with premium visual assets and modern animations.",
          features: [
            "Custom UI design mockup",
            "Vibrant aesthetics & responsive layout",
            "SEO meta tags & fast loading speeds",
            "Resend contact email integration"
          ],
          cta: "landing-page"
        },
        {
          title: "Custom Web Application",
          price: "$1,200 - $2,500",
          description: "A robust multi-page application with full database integration, admin dashboard, and secure user auth.",
          features: [
            "Next.js App Router & TypeScript build",
            "Supabase backend database setup",
            "Client-accessible analytics portal",
            "Custom billing or forms flow"
          ],
          cta: "web-application"
        },
        {
          title: "Monthly Support & SEO",
          price: "$150 / mo",
          description: "Ongoing technical support, SEO audits, speed optimizations, and monthly analytics review.",
          features: [
            "2 hours of development time included",
            "Core Web Vitals monitoring & tuning",
            "Monthly page-visit reporting",
            "Security patches and package updates"
          ],
          cta: "monthly-support"
        }
      ];
    }
    return [
      {
        title: "Hourly Consulting",
        price: "$50 / hr",
        description: "General 1-on-1 development, debugging, and systems engineering support.",
        features: [
          "React 19 / Next.js 16 debugging",
          "AI development workflow optimization",
          "Supabase / PostgreSQL setup",
          "Code review and refactoring sessions"
        ],
        cta: "mentorship"
      },
      {
        title: "Architecture Review",
        price: "$250 / session",
        description: "Deep technical audit of project structure, database schemas, and caching layers.",
        features: [
          "Database query analysis & index optimization",
          "Page visit & server action profiling",
          "Detailed performance report",
          "30-min call to discuss recommendations"
        ],
        cta: "architecture"
      },
      {
        title: "Codebase Security Audit",
        price: "$450 / audit",
        description: "Comprehensive security and privacy vulnerability assessment of system architecture.",
        features: [
          "Row-level security (RLS) policies verification",
          "API keys & server secret exposures sweep",
          "Bot/crawler spam protection check",
          "Remediation guidelines and code fixes"
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
      lenis.scrollTo('#contact', { duration: 1.5, offset: NAVBAR_SCROLL_OFFSET });
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

        <div className={styles.grid}>
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
        </div>
      </div>
    </section>
  );
};

export default React.memo(Pricing);
