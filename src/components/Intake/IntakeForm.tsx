'use client';

import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Building2,
  SlidersHorizontal,
  Palette,
  ShieldCheck,
  Layers,
  X
} from 'lucide-react';
import { generateQuestionnairePDF } from '@/utils/pdfGenerator';
import type { ResumeData } from '@/data/resume';
import styles from './IntakeForm.module.css';

interface IntakeFormProps {
  resumeData?: ResumeData | null;
}

export interface BaseEngineItem {
  id: string;
  title: string;
  tier: string;
  priceINR: number;
  priceUSD: number;
  laymanDescription: string;
  techSpecs: string;
}

export const BASE_ENGINES: BaseEngineItem[] = [
  { 
    id: 'landing', 
    title: 'Landing Page Core Engine', 
    tier: 'Tier 1', 
    priceINR: 25000, 
    priceUSD: 300, 
    laymanDescription: 'A single, ultra-fast, high-converting webpage built to capture leads, showcase your brand, and turn visitors into clients.',
    techSpecs: 'Next.js 16 App Router, Responsive Motion UI, Tailwind/CSS Modules, ReCAPTCHA v3, Telemetry, SEO Schema'
  },
  { 
    id: 'multipage', 
    title: 'Multi-Page Web App Core Engine', 
    tier: 'Tier 2', 
    priceINR: 45000, 
    priceUSD: 550, 
    laymanDescription: 'A complete multi-page business website (Home, About, Services, Case Studies, Contact) with smooth page transitions and consistent branding.',
    techSpecs: 'Multi-page routing (3–6 pages), Framer Motion Page Transitions, Shared Layout Shell, Dynamic Routes'
  },
  { 
    id: 'saas', 
    title: 'Full-Stack SaaS MVP Core Engine', 
    tier: 'Tier 3', 
    priceINR: 75000, 
    priceUSD: 950, 
    laymanDescription: 'A production software foundation connected to a cloud database for web apps where users create accounts, manage data, and run software workflows.',
    techSpecs: 'Full Web App Shell, Supabase PostgreSQL Architecture, Server Caching (unstable_cache), Production Vercel Wiring'
  }
];

export interface FeatureItem {
  id: string;
  label: string;
  priceINR: number;
  priceUSD: number;
  laymanDescription: string;
  techSpecs: string;
}

export const FEATURE_MODULES: FeatureItem[] = [
  { 
    id: 'auth', 
    label: 'User Auth & Client Portal (Google/Magic Link)', 
    priceINR: 20000, 
    priceUSD: 240, 
    laymanDescription: 'Allows your customers to securely sign in using Google or Email links and access their private personal dashboard.',
    techSpecs: 'Google OAuth 2.0, Passwordless Magic Links, Supabase Row-Level Security (RLS), Encrypted Session Tokens'
  },
  { 
    id: 'payments', 
    label: 'Payment Gateway Integration (Stripe/Razorpay)', 
    priceINR: 25000, 
    priceUSD: 300, 
    laymanDescription: 'Enables your website to collect payments via Credit Cards, Apple Pay, UPI, or subscriptions with automatic digital invoicing.',
    techSpecs: 'Stripe & Razorpay Webhook Listeners, 1-Click Checkout, Recurring Billing, PCI DSS Compliance setup'
  },
  { 
    id: 'cms', 
    label: 'Headless Blog & CMS Content Management', 
    priceINR: 18000, 
    priceUSD: 220, 
    laymanDescription: 'Gives you an easy backend manager to publish blog posts, news, or case studies anytime without touching code, boosting your Google ranking.',
    techSpecs: 'Markdown Parser, Supabase DB Content Tables, On-Demand Cache Revalidation (/api/revalidate), OpenGraph SEO'
  },
  { 
    id: 'ai_rag', 
    label: 'Private AI Knowledge Base / Vector Search (RAG)', 
    priceINR: 35000, 
    priceUSD: 420, 
    laymanDescription: 'An intelligent AI assistant trained exclusively on your business documents, FAQs, and PDFs that answers customer questions 24/7 with source citations.',
    techSpecs: 'pgvector Vector Embeddings, Document Chunking Pipeline, Semantic Search, Presigned Citation Downloads, Feedback Telemetry'
  },
  { 
    id: 'admin', 
    label: 'Admin Dashboard & Role Access Control (RBAC)', 
    priceINR: 30000, 
    priceUSD: 360, 
    laymanDescription: 'A private internal command center for you and your team to view real-time traffic, manage customer data, and assign staff permissions.',
    techSpecs: 'Single-Pass SQL RPC Aggregations (get_analytics_summary), Visitor Analytics Charts, Content Forms, Admin Security Guards'
  },
  { 
    id: 'email', 
    label: 'Automated Email Workflows (Resend Transactional)', 
    priceINR: 12000, 
    priceUSD: 140, 
    laymanDescription: 'Sends instant, professionally branded email receipts, welcome sequences, or contact notifications directly to your clients whenever they take action.',
    techSpecs: 'Resend Transactional API, Custom HTML Templates, SMTP Fallbacks, Delivery Failure Telemetry'
  }
];

export interface BrandAssetOption {
  id: string;
  label: string;
  priceINR: number;
  priceUSD: number;
  description: string;
}

export const BRAND_ASSET_OPTIONS: BrandAssetOption[] = [
  { id: 'ready', label: 'All Brand Assets Ready (Logo SVG & Copywriting)', priceINR: 0, priceUSD: 0, description: 'Client supplies vector logo, color kit, and text content.' },
  { id: 'copy', label: 'Need Technical Copywriting & Section Formatting', priceINR: 10000, priceUSD: 120, description: 'Professional tech copywriting, tagline crafting, and bullet formatting.' },
  { id: 'scratch', label: 'Starting from Scratch (Full Brand Kit & Copy)', priceINR: 18000, priceUSD: 220, description: 'Vector logo design, color palette, typography pairing, and copywriting.' }
];

export interface MaintenancePlanOption {
  id: string;
  name: string;
  priceINR: number;
  priceUSD: number;
  period: string;
  badge: string;
  laymanDescription: string;
  techSpecs: string;
  includes: string[];
}

export const MAINTENANCE_PLANS: MaintenancePlanOption[] = [
  {
    id: 'basic',
    name: 'Basic Care Plan',
    priceINR: 2500,
    priceUSD: 30,
    period: '/ month',
    badge: '💡 Recommended for Landing Pages',
    laymanDescription: 'Keeps your server healthy, creates daily automated database backups, installs security patches, and ensures your site stays online 24/7.',
    techSpecs: 'Vercel/Supabase Uptime Monitoring, Daily PostgreSQL Backups, SSL Renewals, Security Dependency Updates',
    includes: ['Hosting support & SSL management', 'Daily automated database backups', 'Dependency & security patching', 'Minor bug fixes & uptime monitoring']
  },
  {
    id: 'standard',
    name: 'Standard Care Plan',
    priceINR: 6500,
    priceUSD: 80,
    period: '/ month',
    badge: '💡 Recommended for Auth/Payments/CMS',
    laymanDescription: 'Includes everything in Basic plus up to 4 hours of monthly developer support to edit text, swap images, update pages, or tweak designs whenever you need.',
    techSpecs: 'Everything in Basic + 2-4 Hours Monthly Dev Allocation, Core Web Vitals Performance Tuning, Content Schema Updates',
    includes: ['Everything in Basic Care', 'Monthly text & media content updates', '2–4 hours of dedicated dev time/month', 'Performance & page speed tuning']
  },
  {
    id: 'premium',
    name: 'Premium AI & Dev SLA Care Plan',
    priceINR: 15000,
    priceUSD: 180,
    period: '/ month',
    badge: '💡 Recommended for AI Chatbot & RAG Engines',
    laymanDescription: 'For critical business apps and AI engines. Includes a guaranteed 24-hour emergency response time, AI model accuracy tuning, SEO reports, and dedicated dev hours.',
    techSpecs: '24-Hour Priority SLA, AI Vector Index Tuning & Latency Monitoring, SEO Analytics Reports, Dedicated Feature Engineering',
    includes: ['Priority 24-hour SLA response', 'AI Vector DB & LLM latency monitoring', 'Dedicated feature development hours', 'Analytics & SEO health reports']
  },
  {
    id: 'self',
    name: 'Self-Managed (Complimentary 30-Day Warranty)',
    priceINR: 0,
    priceUSD: 0,
    period: '',
    badge: '30-Day Warranty Included',
    laymanDescription: 'Includes 30 days of complimentary technical support post-launch. Client manages cloud hosting and database updates afterwards.',
    techSpecs: '30-Day Post-Launch Bug Warranty, Developer Handover Documentation',
    includes: ['30 days complimentary post-launch support', 'Client manages cloud hosting & patches afterwards']
  }
];

export default function IntakeForm({ resumeData }: IntakeFormProps) {
  const intakeConfig = resumeData?.intake;

  const timelineOptions = intakeConfig?.timelineOptions || [
    'Express Delivery Sprint (7–10 Days - Rush Fee Applies)',
    'Standard Turnaround (2–4 Weeks)',
    'Flexible Timeline'
  ];

  const termsList = intakeConfig?.termsAndConditions || [
    "1. Payment Milestone Structure: 50% Upfront Deposit required to initiate design mockups & architecture setup. 30% Milestone Payment upon design approval & core build. 20% Final Payment prior to domain mapping & production deployment.",
    "2. Scope Creep Policy: Features requested after signing that are not listed in Section 2 will be quoted separately under a Phase 2 add-on contract.",
    "3. Revision Policy: Includes up to 2 rounds of comprehensive design/layout revisions.",
    "4. Client Dependencies: Timeline countdown begins ONLY after receiving all required client assets.",
    "5. Intellectual Property: 100% IP and code ownership transfer to Client upon receipt of final payment.",
    "6. Infrastructure & Hosting: Hosting, Database, and API costs are billed directly to client-owned accounts.",
    "7. Post-Launch Warranty: Includes 30 days of complimentary technical support & bug fixes post-launch."
  ];

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    projectGoal: 'Lead Generation & Direct Sales',
    targetAudience: '',
    selectedBaseEngineId: BASE_ENGINES[0].id,
    selectedFeatures: [FEATURE_MODULES[0].label],
    selectedBrandAssetId: BRAND_ASSET_OPTIONS[0].id,
    selectedMaintenanceId: '',
    inspirationLinks: '',
    timeline: timelineOptions[1] || timelineOptions[0],
    additionalNotes: ''
  });

  const handleFeatureToggle = (label: string) => {
    setFormData(prev => {
      const exists = prev.selectedFeatures.includes(label);
      const updated = exists 
        ? prev.selectedFeatures.filter(f => f !== label)
        : [...prev.selectedFeatures, label];
      return { ...prev, selectedFeatures: updated };
    });
  };

  const togglePopover = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActivePopoverId(prev => (prev === id ? null : id));
  };

  const selectedEngine = useMemo(() => {
    return BASE_ENGINES.find(e => e.id === formData.selectedBaseEngineId) || BASE_ENGINES[0];
  }, [formData.selectedBaseEngineId]);

  // Smart Maintenance Auto-Selection
  const autoMaintenancePlanId = useMemo(() => {
    const hasAI = formData.selectedFeatures.some(f => f.includes('RAG') || f.includes('AI'));
    const hasComplex = formData.selectedFeatures.some(f => f.includes('Auth') || f.includes('Payment') || f.includes('CMS'));

    if (hasAI) return 'premium';
    if (hasComplex) return 'standard';
    return 'basic';
  }, [formData.selectedFeatures]);

  // Pure Additive Cost Calculation
  const totalCost = useMemo(() => {
    const baseINR = selectedEngine.priceINR;
    const baseUSD = selectedEngine.priceUSD;

    let featuresINR = 0;
    let featuresUSD = 0;
    const itemizedList: string[] = [];

    FEATURE_MODULES.forEach(m => {
      if (formData.selectedFeatures.includes(m.label)) {
        featuresINR += m.priceINR;
        featuresUSD += m.priceUSD;
        itemizedList.push(`${m.label} (+₹${m.priceINR.toLocaleString()})`);
      }
    });

    const brandOpt = BRAND_ASSET_OPTIONS.find(b => b.id === formData.selectedBrandAssetId) || BRAND_ASSET_OPTIONS[0];

    const totalINR = baseINR + featuresINR + brandOpt.priceINR;
    const totalUSD = baseUSD + featuresUSD + brandOpt.priceUSD;

    return { totalINR, totalUSD, baseINR, baseUSD, featuresINR, featuresUSD, brandOpt, itemizedList };
  }, [selectedEngine, formData.selectedFeatures, formData.selectedBrandAssetId]);

  const activeMaintenancePlan = useMemo(() => {
    const targetId = formData.selectedMaintenanceId || autoMaintenancePlanId;
    return MAINTENANCE_PLANS.find(p => p.id === targetId) || MAINTENANCE_PLANS[1];
  }, [formData.selectedMaintenanceId, autoMaintenancePlanId]);

  const handleDownloadPDF = () => {
    generateQuestionnairePDF(resumeData, {
      companyName: formData.companyName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      projectGoal: formData.projectGoal,
      targetAudience: formData.targetAudience,
      projectCategory: selectedEngine.title,
      features: formData.selectedFeatures,
      assetsStatus: totalCost.brandOpt.label,
      inspirationLinks: formData.inspirationLinks,
      timeline: formData.timeline,
      budgetRange: `${selectedEngine.tier}: ₹${totalCost.totalINR.toLocaleString()} ($${totalCost.totalUSD.toLocaleString()})`,
      maintenancePlan: activeMaintenancePlan.name,
      maintenanceCostINR: activeMaintenancePlan.priceINR,
      maintenanceCostUSD: activeMaintenancePlan.priceUSD,
      totalBuildCostINR: totalCost.totalINR,
      totalBuildCostUSD: totalCost.totalUSD,
      additionalNotes: formData.additionalNotes
    });
  };

  const handleSubmitOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.contactEmail.trim()) {
      setErrorMsg('Please enter your Company Name and Email.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          email: formData.contactEmail,
          subject: `[SCOPING INTAKE] ${formData.companyName} (${selectedEngine.tier})`,
          message: `
Client: ${formData.companyName} (${formData.contactEmail}, Phone: ${formData.contactPhone})
Goal: ${formData.projectGoal}
Audience: ${formData.targetAudience}

Base Engine: ${selectedEngine.title} (₹${selectedEngine.priceINR.toLocaleString()})
Checked Add-ons: ${formData.selectedFeatures.join(', ')} (₹${totalCost.featuresINR.toLocaleString()})
Brand Readiness: ${totalCost.brandOpt.label} (₹${totalCost.brandOpt.priceINR.toLocaleString()})
Maintenance Plan: ${activeMaintenancePlan.name} (₹${activeMaintenancePlan.priceINR}/mo)

Total Build Investment: ₹${totalCost.totalINR.toLocaleString()} / $${totalCost.totalUSD.toLocaleString()}
Timeline: ${formData.timeline}
Notes: ${formData.additionalNotes}
          `.trim()
        })
      });

      if (!res.ok) throw new Error('Failed to submit intake scoping brief.');

      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Identity', icon: Building2 },
    { num: 2, title: 'Technical Scope', icon: SlidersHorizontal },
    { num: 3, title: 'Brand Kit', icon: Palette },
    { num: 4, title: 'Commercials & SLA', icon: ShieldCheck },
  ];

  return (
    <section className={styles.intakeSection} id="scoping-form" onClick={() => setActivePopoverId(null)}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h3 className={styles.title}>Interactive Scoping & Commercial Engine</h3>
            <p className={styles.subtitle}>
              Configure your web architecture, itemized modules, brand assets, and maintenance care plan for an instant quotation.
            </p>
          </div>

          {/* STEP INDICATOR */}
          <div className={styles.stepIndicator}>
            {steps.map(s => {
              const Icon = s.icon;
              const isActive = currentStep === s.num;
              const isDone = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={styles.stepItem}
                >
                  <div className={`${styles.stepBadge} ${isActive ? styles.stepBadgeActive : ''} ${isDone ? styles.stepBadgeDone : ''}`}>
                    {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>

          {submitted ? (
            <div className={styles.successCard}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={36} />
              </div>
              <h4>Scoping Brief Received!</h4>
              <p style={{ color: '#475569', fontSize: '14px', margin: '8px 0 16px 0' }}>
                Thank you, <strong>{formData.companyName}</strong>. Your itemized quote proposal has been generated. You can also download your formal PDF brief below.
              </p>
              <button
                type="button"
                onClick={handleDownloadPDF}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                <Download size={16} />
                <span>OPEN CANVA-GRADE PDF BRIEF</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitOnline}>
              {/* STEP 1: CLIENT & BUSINESS IDENTITY */}
              {currentStep === 1 && (
                <div className={styles.formStep}>
                  <div className={styles.groupTitle}>
                    <Building2 size={18} />
                    <span>STEP 1: CLIENT & BUSINESS IDENTITY</span>
                  </div>

                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Company / Client Name *</label>
                      <input
                        type="text"
                        required
                        className={styles.input}
                        placeholder="e.g., Acme Solutions / John Doe"
                        value={formData.companyName}
                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Contact Email *</label>
                      <input
                        type="email"
                        required
                        className={styles.input}
                        placeholder="john@example.com"
                        value={formData.contactEmail}
                        onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Phone / WhatsApp (Optional)</label>
                      <input
                        type="tel"
                        className={styles.input}
                        placeholder="+1 (555) 019-2834"
                        value={formData.contactPhone}
                        onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Primary Business Goal</label>
                      <select
                        className={styles.select}
                        value={formData.projectGoal}
                        onChange={e => setFormData({ ...formData, projectGoal: e.target.value })}
                      >
                        <option value="Lead Generation & Direct Sales">Lead Generation & Direct Sales</option>
                        <option value="Brand Showcase & Credibility">Brand Showcase & Credibility</option>
                        <option value="Custom Web App / Internal Tool">Custom Web App / Internal Admin Tool</option>
                        <option value="Private AI Knowledge Base & Assistant">Private AI Assistant / Knowledge Base</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Target Audience Persona</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g., Tech Founders, SMB Owners, B2B Clients"
                      value={formData.targetAudience}
                      onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: TECHNICAL SCOPE & FEATURE MATRIX */}
              {currentStep === 2 && (
                <div className={styles.formStep}>
                  <div className={styles.groupTitle}>
                    <SlidersHorizontal size={18} />
                    <span>STEP 2: TECHNICAL ARCHITECTURE & FEATURE MATRIX</span>
                  </div>

                  {/* Base Engine Selector */}
                  <div className={styles.field} style={{ marginBottom: '16px' }}>
                    <label className={styles.label}>
                      <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Select Base Platform Foundation Engine
                    </label>
                    <div className={styles.checkboxGrid}>
                      {BASE_ENGINES.map(e => {
                        const isSelected = formData.selectedBaseEngineId === e.id;
                        const isPopoverOpen = activePopoverId === e.id;
                        return (
                          <div
                            key={e.id}
                            className={`${styles.checkboxCard}`}
                            onClick={() => setFormData({ ...formData, selectedBaseEngineId: e.id })}
                            style={{ cursor: 'pointer', position: 'relative', borderLeft: isSelected ? '3px solid #0284c7' : 'none', background: isSelected ? '#f0f9ff' : '#ffffff' }}
                          >
                            <input
                              type="radio"
                              name="baseEngine"
                              checked={isSelected}
                              onChange={() => setFormData({ ...formData, selectedBaseEngineId: e.id })}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{`${e.title} (${e.tier})`}</span>
                                  <button
                                    type="button"
                                    onClick={(ev) => togglePopover(ev, e.id)}
                                    className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                                    title="Click to view Technical Engineering Specs"
                                  >
                                    ℹ
                                  </button>
                                </div>
                                <span className={styles.priceBadge}>{`₹${e.priceINR.toLocaleString()} ($${e.priceUSD})`}</span>
                              </div>
                              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>{e.laymanDescription}</p>

                              {isPopoverOpen && (
                                <div className={styles.popoverBox} onClick={ev => ev.stopPropagation()}>
                                  <div className={styles.popoverHeader}>
                                    <span>🛠️ TECHNICAL ARCHITECTURE SPECS</span>
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setActivePopoverId(null)} />
                                  </div>
                                  <p className={styles.popoverTechText}>{e.techSpecs}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feature Checkboxes */}
                  <div className={styles.field}>
                    <label className={styles.label}>Select Architecture Add-on Modules (Pure Additive Pricing)</label>
                    <div className={styles.checkboxGrid}>
                      {FEATURE_MODULES.map(m => {
                        const isChecked = formData.selectedFeatures.includes(m.label);
                        const isPopoverOpen = activePopoverId === m.id;
                        return (
                          <label key={m.id} className={styles.checkboxCard} style={{ position: 'relative', borderLeft: isChecked ? '3px solid #0284c7' : 'none' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleFeatureToggle(m.label)}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{m.label}</span>
                                  <button
                                    type="button"
                                    onClick={(ev) => togglePopover(ev, m.id)}
                                    className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                                    title="Click to view Technical Engineering Specs"
                                  >
                                    ℹ
                                  </button>
                                </div>
                                <span className={styles.priceBadge}>{`+₹${m.priceINR.toLocaleString()}`}</span>
                              </div>
                              <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>{m.laymanDescription}</p>

                              {isPopoverOpen && (
                                <div className={styles.popoverBox} onClick={ev => ev.stopPropagation()}>
                                  <div className={styles.popoverHeader}>
                                    <span>🛠️ TECHNICAL ARCHITECTURE SPECS</span>
                                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => setActivePopoverId(null)} />
                                  </div>
                                  <p className={styles.popoverTechText}>{m.techSpecs}</p>
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live Transparent Arithmetic Bar */}
                  <div className={styles.stickyBar}>
                    <div className={styles.stickyLeft}>
                      <span className={styles.stickyTitle}>⚡ Live Pure Additive Arithmetic Formula</span>
                      <span className={styles.stickyBreakdown}>
                        {`Base (${selectedEngine.title}: ₹${selectedEngine.priceINR.toLocaleString()}) + Add-ons (₹${totalCost.featuresINR.toLocaleString()})`}
                      </span>
                    </div>
                    <div className={styles.stickyTotal}>
                      {`Estimated Total: ₹${totalCost.totalINR.toLocaleString()} ($${totalCost.totalUSD.toLocaleString()})`}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: BRAND ASSETS & DESIGN ADD-ONS */}
              {currentStep === 3 && (
                <div className={styles.formStep}>
                  <div className={styles.groupTitle}>
                    <Palette size={18} />
                    <span>STEP 3: BRAND ASSETS & CONTENT READINESS</span>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Brand Readiness & Copywriting Add-on</label>
                    <div className={styles.checkboxGrid}>
                      {BRAND_ASSET_OPTIONS.map(b => {
                        const isSelected = formData.selectedBrandAssetId === b.id;
                        return (
                          <label
                            key={b.id}
                            className={styles.checkboxCard}
                            onClick={() => setFormData({ ...formData, selectedBrandAssetId: b.id })}
                            style={{ cursor: 'pointer', borderLeft: isSelected ? '3px solid #0284c7' : 'none', background: isSelected ? '#f0f9ff' : '#ffffff' }}
                          >
                            <input
                              type="radio"
                              name="brandAsset"
                              checked={isSelected}
                              onChange={() => setFormData({ ...formData, selectedBrandAssetId: b.id })}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700 }}>{b.label}</span>
                                <span className={styles.priceBadge}>{b.priceINR > 0 ? `+₹${b.priceINR.toLocaleString()}` : 'Included (+₹0)'}</span>
                              </div>
                              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>{b.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Inspiration Links (Competitors / Websites You Love)</label>
                    <textarea
                      rows={3}
                      className={styles.textarea}
                      placeholder="Paste 2 or 3 links here (e.g. stripe.com, vercel.com)..."
                      value={formData.inspirationLinks}
                      onChange={e => setFormData({ ...formData, inspirationLinks: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: COMMERCIAL SUMMARY, MAINTENANCE & SIGN-OFF */}
              {currentStep === 4 && (
                <div className={styles.formStep}>
                  <div className={styles.groupTitle}>
                    <ShieldCheck size={18} />
                    <span>STEP 4: COMMERCIAL PROPOSAL & MAINTENANCE CARE PLAN</span>
                  </div>

                  {/* Summary Box */}
                  <div style={{ background: '#0f172a', borderRadius: '8px', padding: '14px 18px', color: '#ffffff', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: '#94a3b8' }}>SELECTED BASE ENGINE</span>
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>{`${selectedEngine.title} (₹${selectedEngine.priceINR.toLocaleString()})`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: '#94a3b8' }}>SELECTED ADD-ON MODULES</span>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{`+₹${totalCost.featuresINR.toLocaleString()} (${formData.selectedFeatures.length} Modules)`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: '#94a3b8' }}>BRAND KIT ADD-ON</span>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{totalCost.brandOpt.priceINR > 0 ? `+₹${totalCost.brandOpt.priceINR.toLocaleString()}` : 'Included (+₹0)'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>TOTAL BUILD INVESTMENT</span>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>{`₹${totalCost.totalINR.toLocaleString()} ($${totalCost.totalUSD.toLocaleString()})`}</span>
                    </div>
                  </div>

                  {/* Maintenance Selector */}
                  <div className={styles.field}>
                    <label className={styles.label}>Select Monthly Maintenance & SLA Care Plan</label>
                    <div className={styles.careGrid}>
                      {MAINTENANCE_PLANS.map(p => {
                        const isSelected = (formData.selectedMaintenanceId || autoMaintenancePlanId) === p.id;
                        const isAutoRecommended = autoMaintenancePlanId === p.id;
                        const isPopoverOpen = activePopoverId === p.id;
                        return (
                          <div
                            key={p.id}
                            className={`${styles.careCard} ${isSelected ? styles.careCardSelected : ''}`}
                            onClick={() => setFormData({ ...formData, selectedMaintenanceId: p.id })}
                            style={{ position: 'relative' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                {isAutoRecommended && (
                                  <div className={styles.careCardBadge}>{p.badge}</div>
                                )}
                                <div className={styles.careCardTitle}>
                                  {p.name}
                                  <button
                                    type="button"
                                    onClick={(ev) => togglePopover(ev, p.id)}
                                    className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                                    title="Click to view Technical SLA Specs"
                                  >
                                    ℹ
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className={styles.careCardPrice}>
                              {p.priceINR > 0 ? `₹${p.priceINR.toLocaleString()}${p.period} ($${p.priceUSD}/mo)` : 'Included (30-Day Warranty)'}
                            </div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>{p.laymanDescription}</p>

                            <ul className={styles.careCardList}>
                              {p.includes.map((inc, iIdx) => (
                                <li key={iIdx}>{inc}</li>
                              ))}
                            </ul>

                            {isPopoverOpen && (
                              <div className={styles.popoverBox} onClick={ev => ev.stopPropagation()}>
                                <div className={styles.popoverHeader}>
                                  <span>🛠️ TECHNICAL SLA SPECS</span>
                                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => setActivePopoverId(null)} />
                                </div>
                                <p className={styles.popoverTechText}>{p.techSpecs}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Target Launch Timeline</label>
                      <select
                        className={styles.select}
                        value={formData.timeline}
                        onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                      >
                        {timelineOptions.map(tl => (
                          <option key={tl} value={tl}>{tl}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Additional Scope Notes (Optional)</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Special constraints, legacy data to migrate..."
                        value={formData.additionalNotes}
                        onChange={e => setFormData({ ...formData, additionalNotes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Standard Commercial Terms (T&Cs) Summary</label>
                    <div style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #2B2B36',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: '1.5'
                    }}>
                      {termsList.map((t, idx) => (
                        <p key={idx} style={{ marginBottom: '6px' }}>{t}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '12px' }}>{errorMsg}</p>
              )}

              {/* Actions Footer */}
              <div className={styles.actions}>
                <div className={styles.leftActions}>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    title="Open Canva-grade PDF proposal preview in new tab"
                  >
                    <Download size={16} />
                    <span>OPEN PROPOSAL PDF</span>
                  </button>

                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className={`${styles.btn} ${styles.btnSecondary}`}
                    >
                      <ArrowLeft size={16} />
                      <span>PREVIOUS</span>
                    </button>
                  )}
                </div>

                <div>
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className={`${styles.btn} ${styles.btnPrimary}`}
                    >
                      <span>NEXT STEP</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`${styles.btn} ${styles.btnPrimary}`}
                    >
                      {submitting ? 'SUBMITTING...' : 'SUBMIT SCOPING BRIEF'}
                      <Send size={16} />
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
