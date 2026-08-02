'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  Building2,
  SlidersHorizontal,
  Palette,
  Clock
} from 'lucide-react';
import { generateQuestionnairePDF } from '@/utils/pdfGenerator';
import styles from './IntakeForm.module.css';

export default function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    projectGoal: 'Lead Generation & Sales',
    targetAudience: '',
    projectCategory: 'Full Custom Website (3–6 Pages)',
    features: ['Contact Form / Lead Capture', 'Responsive Design'],
    assetsStatus: 'Logo & Colors Ready (Need Copywriting)',
    inspirationLinks: '',
    timeline: 'Standard (2–4 weeks)',
    budgetRange: 'Tier 2: ₹45,000 – ₹90,000 ($550 – $1,100)',
    additionalNotes: ''
  });

  const featureOptions = [
    'Contact Form / Lead Capture',
    'Payment Gateway (Stripe/Razorpay)',
    'User Auth & Client Portal',
    'Blog / CMS Content Management',
    'Custom Private AI Chatbot / RAG',
    'Admin Dashboard & Analytics',
    'SEO & Performance Tuning',
    'Resend Automated Emails'
  ];

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
    generateQuestionnairePDF({
      companyName: formData.companyName,
      contactEmail: formData.contactEmail,
      projectGoal: formData.projectGoal,
      projectCategory: formData.projectCategory,
      features: formData.features,
      assetsStatus: formData.assetsStatus,
      inspirationLinks: formData.inspirationLinks,
      timeline: formData.timeline,
      budgetRange: formData.budgetRange
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
                {/* STEP 1: BUSINESS IDENTITY */}
                {currentStep === 1 && (
                  <div className={styles.formStep}>
                    <div className={styles.groupTitle}>
                      <Building2 size={18} />
                      <span>STEP 1: BUSINESS IDENTITY & GOALS</span>
                    </div>

                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>Company / Brand Name</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g. Nexus Tech Solutions"
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
                          placeholder="client@company.com"
                          value={formData.contactEmail}
                          onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>Phone / WhatsApp (Optional)</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="+91 98765 43210"
                          value={formData.contactPhone}
                          onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>Primary Project Goal</label>
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
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Target Audience Summary</label>
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

                {/* STEP 2: SCOPE & FEATURES */}
                {currentStep === 2 && (
                  <div className={styles.formStep}>
                    <div className={styles.groupTitle}>
                      <SlidersHorizontal size={18} />
                      <span>STEP 2: PROJECT CATEGORY & FEATURES</span>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Project Category</label>
                      <select
                        className={styles.select}
                        value={formData.projectCategory}
                        onChange={e => setFormData({ ...formData, projectCategory: e.target.value })}
                      >
                        <option value="High-Converting Landing Page (Single Page)">High-Converting Landing Page (Single Page)</option>
                        <option value="Full Custom Website (3–6 Pages)">Full Custom Website (3–6 Pages)</option>
                        <option value="Full-Stack Web App + Admin Dashboard">Full-Stack Web App + Admin Dashboard</option>
                        <option value="Private AI Assistant / RAG Integration">Private AI Assistant / RAG Integration</option>
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Required Key Features</label>
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

                {/* STEP 3: DESIGN & ASSETS */}
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
                        <option value="All Assets Ready (Logo, Copywriting, Images)">All Assets Ready (Logo, Copywriting, Images)</option>
                        <option value="Logo & Colors Ready (Need Copywriting)">Logo & Colors Ready (Need Copywriting help)</option>
                        <option value="Starting from Scratch (Need Branding & Copy)">Starting from Scratch (Need Branding & Copy)</option>
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

                {/* STEP 4: TIMELINE & BUDGET */}
                {currentStep === 4 && (
                  <div className={styles.formStep}>
                    <div className={styles.groupTitle}>
                      <Clock size={18} />
                      <span>STEP 4: TIMELINE & BUDGET TIER</span>
                    </div>

                    <div className={styles.fieldGrid}>
                      <div className={styles.field}>
                        <label className={styles.label}>Target Launch Timeline</label>
                        <select
                          className={styles.select}
                          value={formData.timeline}
                          onChange={e => setFormData({ ...formData, timeline: e.target.value })}
                        >
                          <option value="Urgent (7–10 days turnaround)">Urgent (7–10 days turnaround)</option>
                          <option value="Standard (2–4 weeks)">Standard (2–4 weeks)</option>
                          <option value="Flexible Timeline">Flexible Timeline</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label}>Investment Budget Tier</label>
                        <select
                          className={styles.select}
                          value={formData.budgetRange}
                          onChange={e => setFormData({ ...formData, budgetRange: e.target.value })}
                        >
                          <option value="Tier 1: ₹25,000 – ₹45,000 ($300 – $550)">Tier 1: ₹25,000 – ₹45,000 ($300 – $550)</option>
                          <option value="Tier 2: ₹45,000 – ₹90,000 ($550 – $1,100)">Tier 2: ₹45,000 – ₹90,000 ($550 – $1,100)</option>
                          <option value="Tier 3: ₹90,000 – ₹1.5L+ ($1,100 – $2,000+)">Tier 3: ₹90,000 – ₹1.5L+ ($1,100 – $2,000+)</option>
                          <option value="Custom / Enterprise Scope">Custom / Enterprise Scope</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Additional Project Notes (Optional)</label>
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
