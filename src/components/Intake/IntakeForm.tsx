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
  ShieldCheck
} from 'lucide-react';
import { generateQuestionnairePDF } from '@/utils/pdfGenerator';
import type { ResumeData } from '@/data/resume';
import styles from './IntakeForm.module.css';

interface IntakeFormProps {
  resumeData?: ResumeData | null;
}

export interface FeatureItem {
  id: string;
  label: string;
  priceINR: number;
  priceUSD: number;
  description: string;
}

export const FEATURE_MODULES: FeatureItem[] = [
  { id: 'auth', label: 'User Auth & Client Portal (Google/Magic Link)', priceINR: 20000, priceUSD: 240, description: 'Google OAuth, Magic Link, Supabase RLS, Profile Dashboard' },
  { id: 'payments', label: 'Payment Gateway Integration (Stripe/Razorpay)', priceINR: 25000, priceUSD: 300, description: 'Webhook Listeners, 1-Click Checkout, Subscriptions, PCI Compliance' },
  { id: 'cms', label: 'Headless Blog & CMS Content Management', priceINR: 18000, priceUSD: 220, description: 'Markdown parser, Supabase DB tables, On-Demand Cache Revalidation' },
  { id: 'ai_rag', label: 'Private AI Knowledge Base / Vector Search (RAG)', priceINR: 35000, priceUSD: 420, description: 'Vector Embeddings (pgvector), Chunking Pipeline, Citation Downloads' },
  { id: 'admin', label: 'Admin Dashboard & Role Access Control (RBAC)', priceINR: 30000, priceUSD: 360, description: 'Single-Pass SQL RPC, Visitor Analytics Charts, Admin Security Guards' },
  { id: 'email', label: 'Automated Email Workflows (Resend Transactional)', priceINR: 12000, priceUSD: 140, description: 'Custom HTML Templates, Transactional Delivery, SMTP/API setup' }
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
    includes: ['Hosting support & SSL management', 'Daily automated database backups', 'Dependency & security patching', 'Minor bug fixes & uptime monitoring']
  },
  {
    id: 'standard',
    name: 'Standard Care Plan',
    priceINR: 6500,
    priceUSD: 80,
    period: '/ month',
    badge: '💡 Recommended for Auth/Payments/CMS',
    includes: ['Everything in Basic Care', 'Monthly text & media content updates', '2–4 hours of dedicated dev time/month', 'Performance & page speed tuning']
  },
  {
    id: 'premium',
    name: 'Premium AI & Dev SLA Care Plan',
    priceINR: 15000,
    priceUSD: 180,
    period: '/ month',
    badge: '💡 Recommended for AI Chatbot & RAG Engines',
    includes: ['Priority 24-hour SLA response', 'AI Vector DB & LLM latency monitoring', 'Dedicated feature development hours', 'Analytics & SEO health reports']
  },
  {
    id: 'self',
    name: 'Self-Managed (Complimentary 30-Day Warranty)',
    priceINR: 0,
    priceUSD: 0,
    period: '',
    badge: '30-Day Warranty Included',
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

  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    projectGoal: 'Lead Generation & Direct Sales',
    targetAudience: '',
    selectedFeatures: [FEATURE_MODULES[0].label, FEATURE_MODULES[1].label],
    selectedBrandAssetId: BRAND_ASSET_OPTIONS[0].id,
    selectedMaintenanceId: 'standard', // Dynamic override or auto-selected
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

  // Smart Engine Calculation
  const engineCalculation = useMemo(() => {
    const hasAI = formData.selectedFeatures.some(f => f.includes('RAG') || f.includes('AI'));
    const hasComplex = formData.selectedFeatures.some(f => f.includes('Auth') || f.includes('Payment') || f.includes('CMS') || f.includes('Admin'));

    if (hasAI) {
      return { title: 'Full-Stack SaaS MVP Core Engine', priceINR: 75000, priceUSD: 950, tier: 'Tier 3' };
    }
    if (hasComplex) {
      return { title: 'Multi-Page Web App Core Engine', priceINR: 45000, priceUSD: 550, tier: 'Tier 2' };
    }
    return { title: 'Landing Page Core Engine', priceINR: 25000, priceUSD: 300, tier: 'Tier 1' };
  }, [formData.selectedFeatures]);

  // Smart Maintenance Auto-Selection
  const autoMaintenancePlanId = useMemo(() => {
    const hasAI = formData.selectedFeatures.some(f => f.includes('RAG') || f.includes('AI'));
    const hasComplex = formData.selectedFeatures.some(f => f.includes('Auth') || f.includes('Payment') || f.includes('CMS'));

    if (hasAI) return 'premium';
    if (hasComplex) return 'standard';
    return 'basic';
  }, [formData.selectedFeatures]);

  // Total Build Cost Calculation
  const totalCost = useMemo(() => {
    const base = engineCalculation;
    
    // Add-on Features
    let featuresINR = 0;
    let featuresUSD = 0;
    FEATURE_MODULES.forEach(m => {
      if (formData.selectedFeatures.includes(m.label)) {
        featuresINR += m.priceINR;
        featuresUSD += m.priceUSD;
      }
    });

    // Brand Asset Add-on
    const brandOpt = BRAND_ASSET_OPTIONS.find(b => b.id === formData.selectedBrandAssetId) || BRAND_ASSET_OPTIONS[0];

    const totalINR = base.priceINR + featuresINR + brandOpt.priceINR;
    const totalUSD = base.priceUSD + featuresUSD + brandOpt.priceUSD;

    return { totalINR, totalUSD, brandOpt };
  }, [engineCalculation, formData.selectedFeatures, formData.selectedBrandAssetId]);

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
      projectCategory: engineCalculation.title,
      features: formData.selectedFeatures,
      assetsStatus: totalCost.brandOpt.label,
      inspirationLinks: formData.inspirationLinks,
      timeline: formData.timeline,
      budgetRange: `${engineCalculation.tier}: ₹${totalCost.totalINR.toLocaleString()} ($${totalCost.totalUSD.toLocaleString()})`,
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
          subject: `[SCOPING INTAKE] ${formData.companyName} (${engineCalculation.tier})`,
          message: `
Client: ${formData.companyName} (${formData.contactEmail}, Phone: ${formData.contactPhone})
Goal: ${formData.projectGoal}
Audience: ${formData.targetAudience}

Engine: ${engineCalculation.title} (${engineCalculation.tier})
Features: ${formData.selectedFeatures.join(', ')}
Brand Readiness: ${totalCost.brandOpt.label}
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
    <section className={styles.intakeSection} id="scoping-form">
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

                  <div className={styles.field}>
                    <label className={styles.label}>Select Architecture Modules (Check All That Apply)</label>
                    <div className={styles.checkboxGrid}>
                      {FEATURE_MODULES.map(m => {
                        const isChecked = formData.selectedFeatures.includes(m.label);
                        return (
                          <label key={m.id} className={styles.checkboxCard} style={{ borderLeft: isChecked ? '3px solid #0284c7' : 'none' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleFeatureToggle(m.label)}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700 }}>{m.label}</span>
                                <span className={styles.priceBadge}>{`+₹${m.priceINR.toLocaleString()}`}</span>
                              </div>
                              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>{m.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sticky Calculator Preview inside step 2 */}
                  <div className={styles.stickyBar}>
                    <div className={styles.stickyLeft}>
                      <span className={styles.stickyTitle}>⚡ Live Calculated Base Engine</span>
                      <span className={styles.stickyBreakdown}>{`${engineCalculation.title} (${engineCalculation.tier})`}</span>
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
                                <span className={styles.priceBadge}>{b.priceINR > 0 ? `+₹${b.priceINR.toLocaleString()}` : 'Included'}</span>
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
                      <span style={{ fontWeight: 700, color: '#38bdf8' }}>{`${engineCalculation.title} (₹${engineCalculation.priceINR.toLocaleString()})`}</span>
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
                        return (
                          <div
                            key={p.id}
                            className={`${styles.careCard} ${isSelected ? styles.careCardSelected : ''}`}
                            onClick={() => setFormData({ ...formData, selectedMaintenanceId: p.id })}
                          >
                            {isAutoRecommended && (
                              <div className={styles.careCardBadge}>{p.badge}</div>
                            )}
                            <div className={styles.careCardTitle}>{p.name}</div>
                            <div className={styles.careCardPrice}>
                              {p.priceINR > 0 ? `₹${p.priceINR.toLocaleString()}${p.period} ($${p.priceUSD}/mo)` : 'Included (30-Day Warranty)'}
                            </div>
                            <ul className={styles.careCardList}>
                              {p.includes.map((inc, iIdx) => (
                                <li key={iIdx}>{inc}</li>
                              ))}
                            </ul>
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
