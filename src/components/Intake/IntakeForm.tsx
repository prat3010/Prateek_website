'use client';

import React, { useState } from 'react';
import { 
  Download, 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Building2,
  SlidersHorizontal,
  Palette,
  Clock
} from 'lucide-react';
import { generateQuestionnairePDF } from '@/utils/pdfGenerator';
import type { ResumeData } from '@/data/resume';
import styles from './IntakeForm.module.css';

interface IntakeFormProps {
  resumeData?: ResumeData | null;
}

export default function IntakeForm({ resumeData }: IntakeFormProps) {
  const intakeConfig = resumeData?.intake;

  const categoryOptions = intakeConfig?.categories || [
    'Tier 1: High-Converting Landing Page (Single Page)',
    'Tier 2: Custom Multi-Page Website (3–6 Pages)',
    'Tier 3: Full-Stack Web Application + Admin Dashboard',
    'Tier 4: Private AI Assistant / RAG Integration'
  ];

  const featureOptions = intakeConfig?.featureOptions || [
    'Contact Form / Lead Capture (ReCAPTCHA Protected)',
    'Payment Gateway (Stripe/Razorpay)',
    'User Auth & Client Portal (Google/Magic Link)',
    'Headless Blog / CMS Content Management',
    'Private AI Knowledge Base / Vector Search (RAG)',
    'Admin Dashboard & Role Access Control',
    'Automated Email Workflows (Resend Transactional)',
    'Privacy-Compliant Analytics & Visitor Telemetry'
  ];

  const budgetTierOptions = intakeConfig?.budgetTiers || [
    'Tier 1: ₹25,000 – ₹45,000 ($300 – $550)',
    'Tier 2: ₹45,000 – ₹90,000 ($550 – $1,100)',
    'Tier 3: ₹90,000 – ₹1.5L+ ($1,100 – $2,000+)',
    'Custom / Enterprise Infrastructure Scope'
  ];

  const timelineOptions = intakeConfig?.timelineOptions || [
    'Express Delivery Sprint (7–10 Days - Rush Fee Applies)',
    'Standard Turnaround (2–4 Weeks)',
    'Flexible Timeline'
  ];

  const assetOptions = intakeConfig?.assetOptions || [
    'All Brand Assets Ready (Logo SVG, Copywriting, Media)',
    'Logo & Colors Ready (Need Copywriting & Formatting)',
    'Starting from Scratch (Need Logo & Brand Kit)'
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
    projectCategory: categoryOptions[0],
    features: [featureOptions[0], featureOptions[1]],
    assetsStatus: assetOptions[0],
    inspirationLinks: '',
    timeline: timelineOptions[1] || timelineOptions[0],
    budgetRange: budgetTierOptions[1] || budgetTierOptions[0],
    additionalNotes: ''
  });

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => {
      const exists = prev.features.includes(feature);
      const updated = exists 
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature];
      return { ...prev, features: updated };
    });
  };

  const handleDownloadPDF = () => {
    generateQuestionnairePDF(resumeData, {
      companyName: formData.companyName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      projectGoal: formData.projectGoal,
      targetAudience: formData.targetAudience,
      projectCategory: formData.projectCategory,
      features: formData.features,
      assetsStatus: formData.assetsStatus,
      inspirationLinks: formData.inspirationLinks,
      timeline: formData.timeline,
      budgetRange: formData.budgetRange,
      additionalNotes: formData.additionalNotes
    });
  };

  const handleSubmitOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactEmail) {
      setErrorMsg('Please provide a contact email address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const messageBody = `
=== CLIENT DISCOVERY & SCOPING BRIEF ===
Company/Client Name: ${formData.companyName || 'N/A'}
Contact Email: ${formData.contactEmail}
Phone: ${formData.contactPhone || 'N/A'}
Primary Goal: ${formData.projectGoal}
Target Audience: ${formData.targetAudience || 'N/A'}
Project Category: ${formData.projectCategory}
Selected Features: ${formData.features.join(', ')}
Brand Assets Status: ${formData.assetsStatus}
Inspiration Links: ${formData.inspirationLinks || 'N/A'}
Target Timeline: ${formData.timeline}
Target Budget Tier: ${formData.budgetRange}
Additional Notes: ${formData.additionalNotes || 'None'}
      `;

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName || 'Client Brief Lead',
          email: formData.contactEmail,
          message: messageBody
        })
      });

      if (!res.ok) {
        throw new Error('Failed to send inquiry.');
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="intake" className={styles.intakeSection} aria-label="Client Discovery & Scoping Brief">
      <div className={styles.container}>
        
        <div className={styles.header}>
          <h2 className={styles.title}>PROJECT SCOPING & INTAKE</h2>
          <p className={styles.subtitle}>
            Fill out this brief or download the printable PDF version for your team/client. Receive a fixed-price proposal within 24 hours.
          </p>
        </div>

        <div className={styles.card}>
          {!submitted ? (
            <>
              {/* Step Bar */}
              <div className={styles.stepIndicator}>
                {[
                  { num: 1, label: 'Identity', icon: <Building2 size={16} /> },
                  { num: 2, label: 'Scope', icon: <SlidersHorizontal size={16} /> },
                  { num: 3, label: 'Design', icon: <Palette size={16} /> },
                  { num: 4, label: 'Budget', icon: <Clock size={16} /> }
                ].map(step => (
                  <button
                    key={step.num}
                    onClick={() => setCurrentStep(step.num)}
                    className={`${styles.stepItem} ${currentStep === step.num ? styles.active : ''} ${currentStep > step.num ? styles.completed : ''}`}
                    type="button"
                  >
                    <div className={styles.stepBadge}>
                      {currentStep > step.num ? <CheckCircle2 size={16} /> : step.num}
                    </div>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmitOnline}>
                {/* STEP 1: CLIENT METADATA & INVESTMENT TIER */}
                {currentStep === 1 && (
                  <div className={styles.formStep}>
                    <div className={styles.groupTitle}>
                      <Building2 size={18} />
                      <span>STEP 1: CLIENT METADATA & INVESTMENT TIER</span>
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
                        <label className={styles.label}>Select Target Commercial Tier *</label>
                        <select
                          className={styles.select}
                          value={formData.budgetRange}
                          onChange={e => setFormData({ ...formData, budgetRange: e.target.value })}
                        >
                          {budgetTierOptions.map(bt => (
                            <option key={bt} value={bt}>{bt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>Primary Business Goal</label>
                        <select
                          className={styles.select}
                          value={formData.projectGoal}
                          onChange={e => setFormData({ ...formData, projectGoal: e.target.value })}
                        >
                          <option value="Lead Generation & Sales">Lead Generation & Direct Sales</option>
                          <option value="Brand Showcase & Credibility">Brand Showcase & Credibility</option>
                          <option value="Custom Web App / Internal Admin Tool">Custom Web App / Internal Tool</option>
                          <option value="Private AI Knowledge Base & Assistant">Private AI Assistant / Knowledge Base</option>
                        </select>
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
                  </div>
                )}

                {/* STEP 2: TECHNICAL SCOPE & FEATURE CHECKLIST */}
                {currentStep === 2 && (
                  <div className={styles.formStep}>
                    <div className={styles.groupTitle}>
                      <SlidersHorizontal size={18} />
                      <span>STEP 2: TECHNICAL ARCHITECTURE & FEATURE MATRIX</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Target Scope Category</label>
                      <select
                        className={styles.select}
                        value={formData.projectCategory}
                        onChange={e => setFormData({ ...formData, projectCategory: e.target.value })}
                      >
                        {categoryOptions.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Required Key Features (Check All That Apply)</label>
                      <div className={styles.checkboxGrid}>
                        {featureOptions.map(feat => (
                          <label key={feat} className={styles.checkboxCard}>
                            <input
                              type="checkbox"
                              checked={formData.features.includes(feat)}
                              onChange={() => handleFeatureToggle(feat)}
                            />
                            <span>{feat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: BRAND ASSETS & VISUAL INSPICRATION */}
                {currentStep === 3 && (
                  <div className={styles.formStep}>
                    <div className={styles.groupTitle}>
                      <Palette size={18} />
                      <span>STEP 3: BRAND ASSETS & VISUAL INSPIRATION</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Brand Assets Status</label>
                      <select
                        className={styles.select}
                        value={formData.assetsStatus}
                        onChange={e => setFormData({ ...formData, assetsStatus: e.target.value })}
                      >
                        {assetOptions.map(ast => (
                          <option key={ast} value={ast}>{ast}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Inspiration Links (Competitors / Websites You Love)</label>
                      <textarea
                        rows={3}
                        className={styles.textarea}
                        placeholder="Paste 2 or 3 links here (e.g. stripe.com, Vercel.com)..."
                        value={formData.inspirationLinks}
                        onChange={e => setFormData({ ...formData, inspirationLinks: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: TIMELINE, TERMS & SIGN-OFF */}
                {currentStep === 4 && (
                  <div className={styles.formStep}>
                    <div className={styles.groupTitle}>
                      <Clock size={18} />
                      <span>STEP 4: TIMELINE, TERMS & SIGN-OFF</span>
                    </div>

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
                      <label className={styles.label}>Standard Commercial Terms (T&Cs) Summary</label>
                      <div style={{
                        background: '#FFFFFF',
                        border: '1.5px solid #2B2B36',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        maxHeight: '130px',
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

                    <div className={styles.field}>
                      <label className={styles.label}>Additional Scope Notes (Optional)</label>
                      <textarea
                        rows={3}
                        className={styles.textarea}
                        placeholder="Any specific technical constraints, legacy data to migrate, or special requests..."
                        value={formData.additionalNotes}
                        onChange={e => setFormData({ ...formData, additionalNotes: e.target.value })}
                      />
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
                      title="Download clean printable A4 brief for client/offline use"
                    >
                      <Download size={16} />
                      <span>DOWNLOAD BRIEF PDF</span>
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
                        {submitting ? 'SENDING BRIEF...' : 'SUBMIT ONLINE BRIEF'}
                        <Send size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </>
          ) : (
            <div className={styles.successCard}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={36} />
              </div>
              <h3 className={styles.title}>BRIEF SUBMITTED SUCCESSFULLY!</h3>
              <p className={styles.subtitle}>
                Thank you! Your project requirements have been transmitted. I will analyze your brief and respond with a formal fixed-price proposal within 24 hours.
              </p>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className={`${styles.btn} ${styles.btnSecondary}`}
                >
                  <Download size={16} />
                  <span>DOWNLOAD A4 COPY</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setCurrentStep(1);
                  }}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  <span>SUBMIT ANOTHER BRIEF</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
