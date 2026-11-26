import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Cpu, Layers, ShieldCheck, Zap } from 'lucide-react';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { formatMoney, packageTotalForArchetype } from '@/lib/pricing';
import type {
  BaseEngineItem,
  FeatureItem,
  GoalArchetype,
  QuickServiceItem,
} from '@/data/resume';
import styles from './services.module.css';

export const metadata: Metadata = {
  title: 'AI Engineering, Custom RAG & Next.js SaaS Services | Prateeq Sharma',
  description:
    'Hire a Forward Deployed AI Engineer for fixed-scope Next.js SaaS MVPs, private pgvector RAG knowledge systems, Voice AI bots, and 2–7 day technical sprints with transparent INR & USD pricing.',
  keywords: [
    'Hire AI Engineer',
    'Custom RAG Development Services',
    'Next.js SaaS MVP Agency Alternative',
    'Fixed-Scope Web App Development',
    'Private AI Knowledge Base pgvector',
    'Voice AI Agent Integration',
    'Technical SEO & Core Web Vitals Audit',
    'Prateeq Sharma',
  ],
  alternates: {
    canonical: '/services',
  },
  openGraph: {
    title: 'AI Engineering, Custom RAG & Next.js SaaS Services | Prateeq Sharma',
    description:
      'Transparent fixed-scope engineering packages: Next.js SaaS MVPs, custom RAG knowledge bases, Voice AI bots, and 2–7 day technical sprints.',
    url: 'https://prateeq.in/services',
    siteName: 'Prateeq Sharma Portfolio',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Engineering, Custom RAG & Next.js SaaS Services | Prateeq Sharma',
    description:
      'Fixed-scope Next.js SaaS MVPs, private pgvector RAG systems, and quick technical sprints with instant INR/USD quoting.',
  },
};

const FAQ_ITEMS = [
  {
    q: 'How much does a custom Next.js SaaS MVP or AI RAG platform cost?',
    a: 'Core Landing Page builds start at ₹30,000 ($400 USD), Multi-Page web apps at ₹55,000 ($750 USD), Full-Stack SaaS MVP foundations at ₹1,75,000 ($2,400 USD), and fixed-price quick sprints (such as an embedded AI chatbot widget or Core Web Vitals overhaul) start at ₹15,000 ($200 USD). Configure exact modules in the Project Scoping Lab for an instant itemized quote.',
  },
  {
    q: 'How do payments, milestones, and IP ownership work?',
    a: 'All custom engineering engagements run on a 50/50 milestone escrow split (50% upfront deposit to initiate architecture and sprint delivery, 50% upon completion prior to production cutover). Upon final settlement, 100% of the custom codebase, design tokens, and database schemas transfer irrevocably to you.',
  },
  {
    q: 'Why build RAG on PostgreSQL + pgvector instead of Pinecone or LangChain wrappers?',
    a: 'Consolidating vectors alongside relational business data in PostgreSQL + pgvector enables strict database-level Row-Level Security (RLS) multi-tenancy, zero extra vector DB SaaS fees, local $0 embeddings via Ollama, and hybrid HNSW + BM25 retrieval.',
  },
  {
    q: 'Can I start with a small sprint or audit before committing to a full SaaS build?',
    a: 'Yes. You can book a 60-minute AI Strategy & Architecture Audit (₹20,000 / $300 USD) or any 2–7 day Quick Service Sprint (AI Chatbot Widget, Payment Gateway, Technical SEO Audit, Core Web Vitals) directly through the Scoping Lab.',
  },
];

export default function ServicesPage() {
  const engines = questionnaireDefaults.engines as BaseEngineItem[];
  const features = questionnaireDefaults.features as FeatureItem[];
  const goals = (questionnaireDefaults.goals as GoalArchetype[]).filter((g) => g.id !== 'custom');
  const quickServices = questionnaireDefaults.quickServices as QuickServiceItem[];

  const coreEngines = engines.filter((e) => !e.hideFromFullProject || e.id === 'ai_strategy_audit');

  const servicesJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': 'https://prateeq.in/services#service',
        name: 'Prateeq Studio — Forward Deployed AI & Full-Stack Engineering',
        url: 'https://prateeq.in/services',
        image: 'https://prateeq.in/services/opengraph-image',
        description:
          'Direct technical partnership delivering fixed-scope Next.js SaaS MVPs, custom pgvector RAG systems, Voice AI agents, and performance/SEO sprints.',
        provider: {
          '@type': 'Person',
          name: 'Prateeq Sharma',
          url: 'https://prateeq.in',
        },
        areaServed: 'Worldwide',
        priceRange: '$$',
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Engineering Packages & Quick Sprints',
          itemListElement: [
            ...coreEngines.map((engine) => ({
              '@type': 'Offer',
              name: engine.title,
              description: engine.laymanDescription,
              price: String(engine.priceUSD),
              priceCurrency: 'USD',
              url:
                engine.id === 'ai_strategy_audit'
                  ? 'https://prateeq.in/scoping?goal=ai_strategy_consulting'
                  : `https://prateeq.in/scoping?engine=${engine.id}`,
            })),
            ...quickServices.slice(0, 6).map((qs) => ({
              '@type': 'Offer',
              name: qs.label.replace(/^[^\w]+/, '').trim(),
              description: qs.laymanDescription,
              price: String(qs.priceUSD),
              priceCurrency: 'USD',
              url: `https://prateeq.in/scoping?type=quick&service=${qs.id}`,
            })),
          ],
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prateeq.in' },
          { '@type': 'ListItem', position: 2, name: 'Services & Pricing', item: 'https://prateeq.in/services' },
        ],
      },
    ],
  };

  return (
    <div className={styles.wrapper}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.topNav}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Return to Portfolio</span>
            </Link>
            <div className={styles.statusPill}>
              <span>DIRECT TECHNICAL PARTNERSHIP • INR &amp; USD</span>
            </div>
          </div>

          <h1 className={styles.title}>
            Fixed-Scope AI, RAG &amp; Next.js Engineering Services
          </h1>
          <p className={styles.subtitle}>
            Ship production SaaS MVPs, hallucination-resistant pgvector RAG knowledge systems, and
            high-converting web platforms directly with a Forward Deployed Engineer — zero agency
            retainers, transparent pricing, and 100% IP ownership.
          </p>

          <div className={styles.heroActions}>
            <Link href="/scoping" className="comic-btn comic-btn-blue">
              Launch Instant Quote &amp; Scoping Lab <ArrowRight size={16} />
            </Link>
            <Link href="/rag" className="comic-btn comic-btn-outline">
              Test Live Retriever AI Engine
            </Link>
            <Link href="/#contact" className="comic-btn comic-btn-outline">
              Book Direct Intro
            </Link>
          </div>
        </header>

        {/* 1. Core Architecture Engines */}
        <section className={styles.section} aria-labelledby="core-engines-heading">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>01 // Core Build Foundations</div>
            <h2 id="core-engines-heading" className={styles.sectionTitle}>
              Base Architecture Engines
            </h2>
            <p className={styles.sectionLead}>
              Start from a battle-tested Next.js 16 + Supabase foundation or book an AI architecture
              audit before writing a single line of code.
            </p>
          </div>

          <div className={styles.cardGrid}>
            {coreEngines.map((engine) => (
              <article key={engine.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.tierRow}>
                    <span className={styles.tierBadge}>{engine.tier}</span>
                    <span className={styles.priceTag}>
                      {formatMoney(engine.priceUSD, 'USD')} / {formatMoney(engine.priceINR, 'INR')}
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{engine.title}</h3>
                  <p className={styles.cardDesc}>{engine.laymanDescription}</p>
                  <div className={styles.techSpecs}>{engine.techSpecs}</div>
                </div>
                <Link
                  href={
                    engine.id === 'ai_strategy_audit'
                      ? '/scoping?goal=ai_strategy_consulting'
                      : `/scoping?engine=${engine.id}`
                  }
                  className={styles.cardLink}
                >
                  <span>Configure in Scoping Lab</span>
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* 2. Turnkey Solution Blueprints */}
        <section className={styles.section} aria-labelledby="solutions-heading">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>02 // End-to-End Solution Blueprints</div>
            <h2 id="solutions-heading" className={styles.sectionTitle}>
              AI Platforms, SaaS &amp; Commerce Solutions
            </h2>
            <p className={styles.sectionLead}>
              Pre-architected commercial bundles with automated dependency resolution. Click any
              blueprint to pre-load its modules and export an itemized PDF Statement of Work.
            </p>
          </div>

          <div className={styles.cardGrid}>
            {goals.map((goal) => {
              const totalUSD = packageTotalForArchetype(goal, engines, features, 'USD');
              const totalINR = packageTotalForArchetype(goal, engines, features, 'INR');
              return (
                <article key={goal.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <div className={styles.tierRow}>
                      <span className={styles.tierBadge}>{goal.shortLabel}</span>
                      <span className={styles.priceTag}>
                        {formatMoney(totalUSD, 'USD')} / {formatMoney(totalINR, 'INR')}
                      </span>
                    </div>
                    <h3 className={styles.cardTitle}>{goal.label}</h3>
                    <p className={styles.cardDesc}>{goal.description}</p>
                    {goal.compulsoryFeatureLabels.length > 0 && (
                      <div className={styles.techSpecs}>
                        Includes: {goal.compulsoryFeatureLabels.join(' • ')}
                      </div>
                    )}
                  </div>
                  <Link href={`/scoping?goal=${goal.id}`} className={styles.cardLink}>
                    <span>Open Blueprint Quote</span>
                    <ArrowRight size={14} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        {/* 3. Fixed-Price Quick Sprints */}
        <section className={styles.section} aria-labelledby="quick-sprints-heading">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>03 // 2–7 Day Focused Deliverables</div>
            <h2 id="quick-sprints-heading" className={styles.sectionTitle}>
              Fixed-Price Quick Sprints &amp; Integrations
            </h2>
            <p className={styles.sectionLead}>
              Already have a live site or product? Plug in an AI chatbot widget, Voice AI phone
              assistant, Razorpay/Stripe checkout, Core Web Vitals boost, or Technical SEO overhaul.
            </p>
          </div>

          <div className={styles.cardGrid}>
            {quickServices.map((qs) => (
              <article key={qs.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.tierRow}>
                    <span className={styles.tierBadge}>{qs.turnaround}</span>
                    <span className={styles.priceTag}>
                      {formatMoney(qs.priceUSD, 'USD')} / {formatMoney(qs.priceINR, 'INR')}
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{qs.label}</h3>
                  <p className={styles.cardDesc}>{qs.laymanDescription}</p>
                  <div className={styles.techSpecs}>{qs.techSpecs}</div>
                </div>
                <Link href={`/scoping?type=quick&service=${qs.id}`} className={styles.cardLink}>
                  <span>Scope This Sprint</span>
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* 4. Commercial Guarantees */}
        <section className={styles.section} aria-labelledby="guarantees-heading">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>04 // Commercial Governance</div>
            <h2 id="guarantees-heading" className={styles.sectionTitle}>
              Why Clients Choose Direct Engineering Over Agencies
            </h2>
          </div>

          <div className={styles.guaranteesGrid}>
            <div className={styles.guaranteeCard}>
              <ShieldCheck size={20} style={{ color: 'var(--pop-blue)', marginBottom: '0.5rem' }} />
              <h3 className={styles.guaranteeTitle}>100% IP Ownership</h3>
              <p className={styles.guaranteeText}>
                Full codebase, design tokens, and PostgreSQL schemas transfer irrevocably to you upon
                final milestone settlement.
              </p>
            </div>
            <div className={styles.guaranteeCard}>
              <Layers size={20} style={{ color: 'var(--pop-red)', marginBottom: '0.5rem' }} />
              <h3 className={styles.guaranteeTitle}>50 / 50 Milestone Split</h3>
              <p className={styles.guaranteeText}>
                50% deposit starts sprint engineering; 50% final balance is settled only upon
                completion prior to production cutover.
              </p>
            </div>
            <div className={styles.guaranteeCard}>
              <Cpu size={20} style={{ color: 'var(--pop-green)', marginBottom: '0.5rem' }} />
              <h3 className={styles.guaranteeTitle}>Zero Lock-In Architecture</h3>
              <p className={styles.guaranteeText}>
                You retain direct ownership of Vercel, Supabase, and model API keys (OpenAI, Gemini,
                Anthropic, or local Ollama).
              </p>
            </div>
            <div className={styles.guaranteeCard}>
              <Zap size={20} style={{ color: 'var(--pop-yellow)', marginBottom: '0.5rem' }} />
              <h3 className={styles.guaranteeTitle}>30-Day Bug Warranty</h3>
              <p className={styles.guaranteeText}>
                Every launch includes 30 days of complimentary post-launch technical support, with
                optional monthly SLA care plans.
              </p>
            </div>
          </div>
        </section>

        {/* 5. FAQ */}
        <section className={styles.section} aria-labelledby="faq-heading">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionEyebrow}>05 // Frequently Asked Questions</div>
            <h2 id="faq-heading" className={styles.sectionTitle}>
              Engagement, Pricing &amp; Architecture FAQ
            </h2>
          </div>

          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className={styles.faqItem}>
                <h3 className={styles.faqQuestion}>{item.q}</h3>
                <p className={styles.faqAnswer}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Bottom CTA */}
        <section className={styles.ctaBanner} aria-label="Get an Instant Quote">
          <h2 className={styles.ctaBannerTitle}>
            Ready to Scope Your Build Without Endless Discovery Calls?
          </h2>
          <p className={styles.ctaBannerDesc}>
            Configure your exact technical requirements in the Project Scoping Lab and download a
            ready-to-review PDF brief in under two minutes — or explore our production RAG SaaS.
          </p>
          <div className={styles.heroActions}>
            <Link href="/scoping" className="comic-btn comic-btn-blue">
              <CheckCircle2 size={16} />
              <span>Build Instant Quote in Scoping Lab</span>
            </Link>
            <Link href="/rag" className="comic-btn comic-btn-outline">
              Explore Retriever AI SaaS
            </Link>
            <Link href="/blog" className="comic-btn comic-btn-outline">
              Read Architecture Case Studies
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
