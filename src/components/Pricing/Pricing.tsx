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
import ScopingBriefModal from '@/components/Intake/ScopingBriefModal';
import styles from './Pricing.module.css';

interface PricingProps {
  resumeData: ResumeData | null;
}

const PRICING_SECTION_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'CONSULTING RATES', noir: 'CONSULTING RATES' },
  business:  { light: 'SERVICE PACKAGES', noir: 'SERVICE PACKAGES' },
};

function Pricing({ resumeData }: PricingProps) {
  const { isNoir, audience, region } = useTheme();
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();
  const [isScopingModalOpen, setIsScopingModalOpen] = React.useState(false);

  const activeAudience = audience || 'developer';

  // Fallback plans if not present in DB
  const fallbackPlans: PricingPlan[] = useMemo(() => {
    const isIndia = region === 'india';
    if (activeAudience === 'business') {
      return [
        {
          title: "Landing Page Engine",
          price: isIndia ? "₹25,000 - ₹45,000" : "$300 - $550",
          description: "High-converting single-page showcase for products, services, or SaaS waitlists.",
          features: [
            "Custom UI mockup & Framer Motion",
            "Responsive mobile & desktop layout",
            "Basic SEO schema & metadata",
            "Resend transactional email integration"
          ],
          cta: "landing-page"
        },
        {
          title: "Multi-Page Web App",
          price: isIndia ? "₹45,000 - ₹90,000" : "$550 - $1,100",
          description: "Multi-page corporate website or application with CMS and telemetry.",
          features: [
            "Next.js 16 App Router & TypeScript",
            "3 to 6 custom content pages",
            "Headless CMS integration",
            "Privacy-focused analytics telemetry"
          ],
          cta: "web-application"
        },
        {
          title: "SaaS MVP & App Portal",
          price: isIndia ? "₹90,000 - ₹1,50,000+" : "$1,100 - $2,000+",
          description: "Full-stack web application with Supabase authentication, database & payments.",
          features: [
            "Supabase Auth & Database setup",
            "Stripe or Razorpay payment gateway",
            "Role-gated admin portal",
            "Custom REST / Server Actions API"
          ],
          cta: "saas-mvp"
        },
        {
          title: "Enterprise AI RAG Engine",
          price: isIndia ? "₹1,50,000+" : "$1,800+",
          description: "Custom AI assistant, document ingestion pipeline, and vector search knowledge base.",
          features: [
            "Retriever RAG Core & Vector DB",
            "Hybrid Search (Dense + BM25) + Rerank",
            "Embedded chat interface with citations",
            "100% private data isolation & RLS"
          ],
          cta: "ai-knowledge-base"
        }
      ];
    }
    return [
      {
        title: "Hourly Consulting",
        price: isIndia ? "₹3,000 / hr" : "$40 / hr",
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
        price: isIndia ? "₹15,000 / session" : "$200 / session",
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
        price: isIndia ? "₹25,000 / audit" : "$350 / audit",
        description: "A practical review of secrets, access control, and common exposure points.",
        features: [
          "RLS policy review",
          "Secret exposure sweep",
          "Abuse and spam checks",
          "Remediation notes"
        ],
        cta: "security"
      },
      {
        title: "Enterprise RAG Engine & Pipeline",
        price: isIndia ? "₹1,50,000 - ₹3,00,000" : "$2,000 - $3,800",
        description: "Production-grade headless RAG infrastructure with PostgreSQL pgvector, hybrid search, RLS multi-tenancy, and self-hosted embeddings.",
        features: [
          "Multi-Tenant RLS Database Schema & Isolation",
          "Hybrid Search (HNSW Dense + GIN BM25) + RRF Reranking",
          "Local Ollama / Custom Embedding Pipeline",
          "FastAPI Async REST Gateway with SSE Streaming"
        ],
        cta: "enterprise-rag"
      }
    ];
  }, [activeAudience, region]);

  const plans = useMemo(() => {
    if (region === 'india' && resumeData?.pricing_india?.[activeAudience]) {
      return resumeData.pricing_india[activeAudience];
    }
    return resumeData?.pricing?.[activeAudience] || fallbackPlans;
  }, [resumeData, activeAudience, region, fallbackPlans]);

  const handleSelectPackage = (ctaCode: string) => {
    if (activeAudience === 'business') {
      setIsScopingModalOpen(true);
      return;
    }

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
        <div className={styles.titleContainer}>
          <Scrambler
            texts={PRICING_SECTION_TITLE_TEXTS}
            variant="section-title"
            as="h2"
            className={styles.sectionTitle}
          >
            {activeAudience === 'business' ? 'SERVICE PACKAGES' : 'CONSULTING RATES'}
          </Scrambler>
          {activeAudience === 'business' && (
            <p className={styles.sectionSubtitle}>
              Choose a fixed-scope package below for standard projects with a predictable budget.
            </p>
          )}
        </div>

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
                      <span>{isNoir ? (activeAudience === 'business' ? 'SELECT PACKAGE' : 'SELECT_PLAN') : 'Choose Package'}</span>
                    </button>
                  </div>
                </ComicPanel>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <ScopingBriefModal
        isOpen={isScopingModalOpen}
        onClose={() => setIsScopingModalOpen(false)}
        resumeData={resumeData}
      />
    </section>
  );
};

export default React.memo(Pricing);
