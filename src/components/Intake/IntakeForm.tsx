'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  Lock
} from 'lucide-react';
import { generateQuestionnairePDF, generateQuestionnairePDFBase64 } from '@/utils/pdfGenerator';
import { useTheme } from '@/context/ThemeContext';
import {
  calcQuote,
  ESTIMATE_DISCLAIMER,
  formatMoney,
  formatPricePair,
  resolveDefaultCurrency,
  resolveFeatureDependencies,
  type Currency,
} from '@/lib/pricing';
import Portal from '@/components/ui/Portal';
import type {
  BaseEngineItem,
  BrandAssetOption,
  FeatureItem,
  GoalArchetype,
  MaintenancePlanOption,
  ResumeData
} from '@/data/resume';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import styles from './IntakeForm.module.css';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

// Extend window to include grecaptcha
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export interface IntakePreset {
  goalId?: string;
  engineId?: string;
}

interface IntakeFormProps {
  resumeData?: ResumeData | null;
  initialPreset?: IntakePreset | null;
}

export type {
  BaseEngineItem,
  BrandAssetOption,
  FeatureItem,
  GoalArchetype,
  MaintenancePlanOption,
};

export const BASE_ENGINES: BaseEngineItem[] = questionnaireDefaults.engines;
export const FEATURE_MODULES: FeatureItem[] = questionnaireDefaults.features;
export const GOAL_ARCHETYPES: GoalArchetype[] = questionnaireDefaults.goals;
export const BRAND_ASSET_OPTIONS: BrandAssetOption[] = questionnaireDefaults.brandAssets;
export const MAINTENANCE_PLANS: MaintenancePlanOption[] = questionnaireDefaults.maintenancePlans;

export default function IntakeForm({ resumeData, initialPreset = null }: IntakeFormProps) {
  const { isNoir, region } = useTheme();
  const [currency, setCurrency] = useState<Currency>(() => resolveDefaultCurrency(region));
  const intakeConfig = resumeData?.intake;

  const engines = useMemo(
    () => (intakeConfig?.engines?.length ? intakeConfig.engines : BASE_ENGINES),
    [intakeConfig]
  );
  const features = useMemo(
    () => (intakeConfig?.features?.length ? intakeConfig.features : FEATURE_MODULES),
    [intakeConfig]
  );
  const goals = useMemo(
    () => (intakeConfig?.goals?.length ? intakeConfig.goals : GOAL_ARCHETYPES),
    [intakeConfig]
  );
  const brandAssets = useMemo(
    () => (intakeConfig?.brandAssets?.length ? intakeConfig.brandAssets : BRAND_ASSET_OPTIONS),
    [intakeConfig]
  );
  const maintenancePlans = useMemo(
    () =>
      intakeConfig?.maintenancePlans?.length ? intakeConfig.maintenancePlans : MAINTENANCE_PLANS,
    [intakeConfig]
  );
  const timelineOptions = intakeConfig?.timelineOptions || [
    'Express Delivery Sprint (7–10 Days - Rush Fee Applies)',
    'Standard Turnaround (2–4 Weeks)',
    'Flexible Timeline'
  ];

  const termsList = intakeConfig?.termsAndConditions || [
    "1. Payment Milestone Structure: 50% Upfront Deposit required to initiate development & architecture setup. 50% Final Balance prior to domain mapping & production handover.",
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
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [recaptchaReady, setRecaptchaReady] = useState(!SITE_KEY);
  const [recaptchaUnavailable, setRecaptchaUnavailable] = useState(false);

  // Resolve deep-link preset (engine or goal archetype) to the wizard's initial selections
  const initialArchetype = useMemo(() => {
    if (initialPreset?.goalId) {
      return goals.find(g => g.id === initialPreset.goalId) || goals[0];
    }
    if (initialPreset?.engineId) {
      return goals.find(g => g.recommendedEngineId === initialPreset.engineId) || goals[0];
    }
    return goals[0];
  }, [initialPreset, goals]);

  // Compulsory goal features plus any transitive dependsOn modules, so a deep-linked
  // archetype (e.g. booking → auth) starts with a complete, consistent selection.
  const initialSelectedFeatures = useMemo(() => {
    const labels = new Set<string>(initialArchetype.compulsoryFeatureLabels);
    const baseIds = features.filter(f => labels.has(f.label)).map(f => f.id);
    resolveFeatureDependencies(baseIds, features).forEach(id => {
      const label = features.find(f => f.id === id)?.label;
      if (label) labels.add(label);
    });
    return Array.from(labels);
  }, [initialArchetype, features]);

  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    projectGoal: initialArchetype.label,
    targetAudience: '',
    selectedBaseEngineId: initialArchetype.recommendedEngineId,
    selectedFeatures: initialSelectedFeatures,
    selectedBrandAssetId: brandAssets[0]?.id || '',
    selectedMaintenanceId: '',
    inspirationLinks: '',
    timeline: timelineOptions[1] || timelineOptions[0],
    additionalNotes: '',
    agreedToTerms: false
  });

  const isFormValid = useMemo(() => {
    const hasCompany = formData.companyName.trim().length > 0;
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim());
    return hasCompany && hasEmail && formData.agreedToTerms;
  }, [formData.companyName, formData.contactEmail, formData.agreedToTerms]);

  const currentArchetype = useMemo(() => {
    return goals.find(g => g.label === formData.projectGoal) || goals[0];
  }, [formData.projectGoal, goals]);

  const labelOfFeature = (id: string) => features.find(f => f.id === id)?.label;

  // Single-currency rendering of an INR/USD price pair, honoring the active toggle.
  const priceInCurrency = (inr: number, usd: number) => formatMoney(currency === 'INR' ? inr : usd, currency);

  const handleGoalChange = (newGoalLabel: string) => {
    const archetype = goals.find(g => g.label === newGoalLabel) || goals[0];
    const newEngineId = archetype.recommendedEngineId;

    // Auto-merge compulsory features plus any dependencies they require
    const mergedLabels = new Set([...formData.selectedFeatures, ...archetype.compulsoryFeatureLabels]);
    const baseIds = features.filter(f => mergedLabels.has(f.label)).map(f => f.id);
    const extraIds = resolveFeatureDependencies(baseIds, features);
    extraIds.forEach(id => {
      const label = labelOfFeature(id);
      if (label) mergedLabels.add(label);
    });

    setFormData(prev => ({
      ...prev,
      projectGoal: newGoalLabel,
      selectedBaseEngineId: newEngineId,
      selectedFeatures: Array.from(mergedLabels)
    }));
  };

  const handleFeatureToggle = (label: string) => {
    // If feature is compulsory for current goal archetype, prevent toggling off
    if (currentArchetype.compulsoryFeatureLabels.includes(label)) return;

    setFormData(prev => {
      const exists = prev.selectedFeatures.includes(label);
      const feature = features.find(f => f.label === label);

      if (exists) {
        // Block removing a module that another selected module depends on
        const remaining = prev.selectedFeatures.filter(f => f !== label);
        const remainingIds = features.filter(f => remaining.includes(f.label)).map(f => f.id);
        const requiredIds = new Set(resolveFeatureDependencies(remainingIds, features));
        if (feature && requiredIds.has(feature.id)) return prev;
        return { ...prev, selectedFeatures: remaining };
      }

      // When enabling, auto-add any transitive dependencies
      const updated = [...prev.selectedFeatures, label];
      const ids = features.filter(f => updated.includes(f.label)).map(f => f.id);
      const extraLabels = resolveFeatureDependencies(ids, features)
        .map(id => labelOfFeature(id))
        .filter((l): l is string => Boolean(l));
      return {
        ...prev,
        selectedFeatures: Array.from(new Set([...updated, ...extraLabels]))
      };
    });
  };

  const togglePopover = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activePopoverId === id) {
      setActivePopoverId(null);
      setPopoverAnchor(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setActivePopoverId(id);
      setPopoverAnchor({ x: rect.left, y: rect.bottom + 6 });
    }
  };

  const selectedEngine = useMemo(() => {
    return engines.find(e => e.id === formData.selectedBaseEngineId) || engines[0];
  }, [formData.selectedBaseEngineId, engines]);

  // Smart Maintenance Auto-Selection
  const autoMaintenancePlanId = useMemo(() => {
    const hasAI = formData.selectedFeatures.some(f => f.includes('RAG') || f.includes('AI'));
    const hasComplex = formData.selectedFeatures.some(f => f.includes('Auth') || f.includes('Payment') || f.includes('CMS'));

    if (hasAI) return 'premium';
    if (hasComplex) return 'standard';
    return 'basic';
  }, [formData.selectedFeatures]);

  // Quote computed from the centralized pricing module (pure additive)
  const totalCost = useMemo(() => {
    const brandOpt = brandAssets.find(b => b.id === formData.selectedBrandAssetId) || brandAssets[0];
    const quote = calcQuote(
      engines,
      features,
      brandAssets,
      maintenancePlans,
      {
        engineId: selectedEngine.id,
        featureIds: features.filter(f => formData.selectedFeatures.includes(f.label)).map(f => f.id),
        brandAssetId: brandOpt.id,
        maintenancePlanId: formData.selectedMaintenanceId || autoMaintenancePlanId,
      },
      currency,
    );
    return {
      ...quote,
      brandOpt,
      baseINR: quote.enginePriceINR,
      baseUSD: quote.enginePriceUSD,
      featuresINR: quote.featuresPriceINR,
      featuresUSD: quote.featuresPriceUSD,
      itemizedList: quote.itemized.map(i => `${i.label} (+${formatMoney(currency === 'INR' ? i.priceINR : i.priceUSD, currency)})`),
    };
  }, [selectedEngine, engines, features, brandAssets, maintenancePlans, formData.selectedFeatures, formData.selectedBrandAssetId, formData.selectedMaintenanceId, autoMaintenancePlanId, currency]);

  const activeMaintenancePlan = useMemo(() => {
    const targetId = formData.selectedMaintenanceId || autoMaintenancePlanId;
    return maintenancePlans.find(p => p.id === targetId) || maintenancePlans[1];
  }, [formData.selectedMaintenanceId, autoMaintenancePlanId, maintenancePlans]);

  const buildQuestionnaireData = () => ({
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
    budgetRange: `Estimated ${selectedEngine.tier}: ${formatPricePair(totalCost.totalINR, totalCost.totalUSD, currency)}`,
    maintenancePlan: activeMaintenancePlan.name,
    maintenanceCostINR: activeMaintenancePlan.priceINR,
    maintenanceCostUSD: activeMaintenancePlan.priceUSD,
    totalBuildCostINR: totalCost.totalINR,
    totalBuildCostUSD: totalCost.totalUSD,
    additionalNotes: formData.additionalNotes
  });

  const handleDownloadPDF = () => {
    generateQuestionnairePDF(resumeData, buildQuestionnaireData(), isNoir, currency);
  };

  // Load Google reCAPTCHA v3 script dynamically if configured
  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    const onReady = () => {
      if (!cancelled) setRecaptchaReady(true);
    };

    const checkGrecaptcha = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(onReady);
        return true;
      }
      return false;
    };

    if (!document.getElementById('recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
      script.async = true;
      script.onerror = () => {
        if (!cancelled) setRecaptchaUnavailable(true);
      };
      document.head.appendChild(script);
    }

    // reCAPTCHA may already be loaded (Contact form) or not yet initialized at
    // onload, so poll for it. Unlock the submit button after a timeout so the
    // form is never permanently dead; the server still enforces verification.
    if (checkGrecaptcha()) return undefined;
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (cancelled) return;
      if (checkGrecaptcha()) {
        window.clearInterval(timer);
      } else if (Date.now() - startedAt > 6000) {
        window.clearInterval(timer);
        if (!cancelled) setRecaptchaUnavailable(true);
        onReady();
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const handleSubmitOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.contactEmail.trim()) {
      setErrorMsg('Please enter your Company Name and Email in Step 1.');
      return;
    }
    if (!formData.agreedToTerms) {
      setErrorMsg('Please accept the standard commercial terms before submitting.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      // Obtain reCAPTCHA v3 token (invisible, score-based)
      let recaptchaToken: string | undefined;
      if (SITE_KEY && window.grecaptcha) {
        try {
          recaptchaToken = await window.grecaptcha.execute(SITE_KEY, { action: 'intake_submit' });
        } catch (recaptchaErr) {
          console.warn('reCAPTCHA execution error:', recaptchaErr);
        }
      }

      // Render the branded proposal PDF for the email attachment (best-effort)
      let pdfAttachment: { content: string; filename: string } | null = null;
      try {
        const { fileName, base64 } = await generateQuestionnairePDFBase64(resumeData, buildQuestionnaireData(), isNoir, currency);
        pdfAttachment = { content: base64, filename: fileName };
      } catch (pdfErr) {
        console.warn('Failed to generate PDF attachment:', pdfErr);
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName,
          email: formData.contactEmail,
          recaptchaToken,
          pdfAttachment,
          subject: `[SCOPING INTAKE] ${formData.companyName} (${selectedEngine.tier})`,
          message: `
Client: ${formData.companyName} (${formData.contactEmail}, Phone: ${formData.contactPhone})
Goal: ${formData.projectGoal}
Audience: ${formData.targetAudience}

Base Engine: ${selectedEngine.title} (${priceInCurrency(selectedEngine.priceINR, selectedEngine.priceUSD)})
Checked Add-ons: ${formData.selectedFeatures.join(', ')} (${priceInCurrency(totalCost.featuresINR, totalCost.featuresUSD)})
Brand Readiness: ${totalCost.brandOpt.label} (${priceInCurrency(totalCost.brandOpt.priceINR, totalCost.brandOpt.priceUSD)})
Maintenance Plan: ${activeMaintenancePlan.name} (${priceInCurrency(activeMaintenancePlan.priceINR, activeMaintenancePlan.priceUSD)}/month)

Total Build Investment: ${formatPricePair(totalCost.totalINR, totalCost.totalUSD, currency)}
Timeline: ${formData.timeline}
Notes: ${formData.additionalNotes}
          `.trim(),
          intakeDetails: {
            contactPhone: formData.contactPhone,
            projectGoal: formData.projectGoal,
            targetAudience: formData.targetAudience,
            baseEngineId: selectedEngine.id,
            baseEngineTitle: selectedEngine.title,
            selectedFeatures: formData.selectedFeatures,
            brandAssetOption: totalCost.brandOpt.label,
            maintenancePlan: activeMaintenancePlan.name,
            totalCostINR: totalCost.totalINR,
            totalCostUSD: totalCost.totalUSD,
            timeline: formData.timeline,
            inspirationLinks: formData.inspirationLinks,
            additionalNotes: formData.additionalNotes
          }
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || 'Failed to submit intake scoping brief.');
      }

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
    <section className={styles.intakeSection} id="scoping-form" onClick={() => { setActivePopoverId(null); setPopoverAnchor(null); }}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h3 className={styles.title}>Interactive Scoping & Commercial Engine</h3>
            <p className={styles.subtitle}>
              Configure your web architecture, itemized modules, brand assets, and maintenance care plan for an instant quotation.
            </p>
            <div className={styles.currencyToggle}>
              <button
                type="button"
                className={`${styles.currencyBtn} ${currency === 'INR' ? styles.currencyActive : ''}`}
                onClick={() => setCurrency('INR')}
                title="Show all prices in Indian Rupees"
              >
                ₹ INR Rates
              </button>
              <button
                type="button"
                className={`${styles.currencyBtn} ${currency === 'USD' ? styles.currencyActive : ''}`}
                onClick={() => setCurrency('USD')}
                title="Show all prices in US Dollars"
              >
                $ USD Rates
              </button>
            </div>
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
              <p style={{ opacity: 0.7, fontSize: '14px', margin: '8px 0 16px 0' }}>
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
                      <label className={styles.label}>Primary Business Goal *</label>
                      <select
                        className={styles.select}
                        value={formData.projectGoal}
                        onChange={e => handleGoalChange(e.target.value)}
                      >
                        {goals.map(g => (
                          <option key={g.id} value={g.label}>
                            {g.label} — {g.description}
                          </option>
                        ))}
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
                      {engines.map(e => {
                        const isSelected = formData.selectedBaseEngineId === e.id;
                        const isPopoverOpen = activePopoverId === e.id;
                        return (
                          <div
                            key={e.id}
                            className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''}`}
                            onClick={() => setFormData({ ...formData, selectedBaseEngineId: e.id })}
                            style={{ cursor: 'pointer' }}
                          >
                            <input
                              type="radio"
                              name="baseEngine"
                              checked={isSelected}
                              onChange={() => setFormData({ ...formData, selectedBaseEngineId: e.id })}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                   <span style={{ fontWeight: 700 }}>{`${e.title} (${e.tier})`}</span>
                                  <button
                                    type="button"
                                    onClick={(ev) => togglePopover(ev, e.id)}
                                    className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                                    title="Click to view Technical Engineering Specs"
                                  >
                                    ℹ
                                  </button>
                                </div>
                                <span className={styles.priceBadge}>{formatPricePair(e.priceINR, e.priceUSD, currency)}</span>
                              </div>
                              <p style={{ margin: '3px 0 0 0', fontSize: '11px', opacity: 0.7, lineHeight: 1.4 }}>{e.laymanDescription}</p>

                              {isPopoverOpen && popoverAnchor && (
                                <Portal>
                                  <>
                                    <div className={styles.popoverOverlay} onClick={() => { setActivePopoverId(null); setPopoverAnchor(null); }} />
                                    <div
                                      className={styles.popoverPortal}
                                      style={{ left: popoverAnchor.x, top: popoverAnchor.y }}
                                      onClick={ev => ev.stopPropagation()}
                                    >
                                      <div className={styles.popoverBox} style={{ position: 'static', left: 'auto', right: 'auto' }}>
                                        <div className={styles.popoverHeader}>
                                          <span>🛠️ TECHNICAL ARCHITECTURE SPECS</span>
                                          <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setActivePopoverId(null); setPopoverAnchor(null); }} />
                                        </div>
                                        <p className={styles.popoverTechText}>{e.techSpecs}</p>
                                      </div>
                                    </div>
                                  </>
                                </Portal>
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
                      {features.map(m => {
                        const isCompulsory = currentArchetype.compulsoryFeatureLabels.includes(m.label);
                        const isChecked = isCompulsory || formData.selectedFeatures.includes(m.label);
                        const otherSelectedIds = features
                          .filter(f => formData.selectedFeatures.includes(f.label) && f.id !== m.id)
                          .map(f => f.id);
                        const isRequiredDependency = new Set(resolveFeatureDependencies(otherSelectedIds, features)).has(m.id);
                        const dependencyTitle = isRequiredDependency
                          ? (() => {
                              const dependents = features
                                .filter((f) => f.id !== m.id && f.dependsOn?.includes(m.id))
                                .map((f) => f.label)
                                .filter(
                                  (label) =>
                                    formData.selectedFeatures.includes(label) ||
                                    currentArchetype.compulsoryFeatureLabels.includes(label),
                                );
                              return dependents.length
                                ? `Required by selected module${dependents.length > 1 ? 's' : ''}: ${dependents.join(', ')}`
                                : 'This module is required by another selected module';
                            })()
                          : '';
                        const isLocked = isCompulsory || isRequiredDependency;
                        const isPopoverOpen = activePopoverId === m.id;
                        return (
                          <label
                            key={m.id}
                            className={`${styles.checkboxCard} ${isLocked ? styles.lockedCard : ''} ${isChecked ? styles.checkboxCardSelected : ''}`}
                            style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isLocked}
                              onChange={() => handleFeatureToggle(m.label)}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                  <span style={{ fontWeight: 700 }}>{m.label}</span>
                                  {isCompulsory ? (
                                    <span className={styles.lockedBadge} title={`Required component for ${currentArchetype.shortLabel}`}>
                                      🔒 REQUIRED
                                    </span>
                                  ) : isRequiredDependency ? (
                                    <span className={styles.lockedBadge} title={dependencyTitle}>
                                      🔗 REQUIRED BY SELECTED MODULE
                                    </span>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={(ev) => togglePopover(ev, m.id)}
                                    className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                                    title="Click to view Technical Engineering Specs"
                                  >
                                    ℹ
                                  </button>
                                </div>
                                <span className={styles.priceBadge}>{`+${priceInCurrency(m.priceINR, m.priceUSD)}`}</span>
                              </div>
                              <p style={{ margin: '3px 0 0 0', fontSize: '11px', opacity: 0.7, lineHeight: 1.4 }}>{m.laymanDescription}</p>

                              {isPopoverOpen && popoverAnchor && (
                                <Portal>
                                  <>
                                    <div className={styles.popoverOverlay} onClick={() => { setActivePopoverId(null); setPopoverAnchor(null); }} />
                                    <div
                                      className={styles.popoverPortal}
                                      style={{ left: popoverAnchor.x, top: popoverAnchor.y }}
                                      onClick={ev => ev.stopPropagation()}
                                    >
                                      <div className={styles.popoverBox} style={{ position: 'static', left: 'auto', right: 'auto' }}>
                                        <div className={styles.popoverHeader}>
                                          <span>🛠️ TECHNICAL ARCHITECTURE SPECS</span>
                                          <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setActivePopoverId(null); setPopoverAnchor(null); }} />
                                        </div>
                                        <p className={styles.popoverTechText}>{m.techSpecs}</p>
                                      </div>
                                    </div>
                                  </>
                                </Portal>
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
                        {`Base (${selectedEngine.title}: ${priceInCurrency(selectedEngine.priceINR, selectedEngine.priceUSD)}) + Add-ons (${priceInCurrency(totalCost.featuresINR, totalCost.featuresUSD)})`}
                      </span>
                    </div>
                    <div className={styles.stickyTotal}>
                      {`Estimated Total: ${formatPricePair(totalCost.totalINR, totalCost.totalUSD, currency)}`}
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
                      {brandAssets.map(b => {
                        const isSelected = formData.selectedBrandAssetId === b.id;
                        return (
                          <label
                            key={b.id}
                            className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''}`}
                            onClick={() => setFormData({ ...formData, selectedBrandAssetId: b.id })}
                            style={{ cursor: 'pointer' }}
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
                                <span className={styles.priceBadge}>{b.priceINR > 0 ? `+${priceInCurrency(b.priceINR, b.priceUSD)}` : 'Included'}</span>
                              </div>
                              <p style={{ margin: '2px 0 0 0', fontSize: '11px', opacity: 0.7 }}>{b.description}</p>
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
                  <div style={{ background: 'var(--intake-summary-bg)', borderRadius: '8px', padding: '14px 18px', color: 'var(--intake-summary-text)', marginBottom: '16px', border: '1px solid var(--intake-summary-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--intake-summary-border)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--intake-summary-label)' }}>SELECTED BASE ENGINE</span>
                      <span style={{ fontWeight: 700, color: 'var(--intake-summary-accent)' }}>{`${selectedEngine.title} (${priceInCurrency(selectedEngine.priceINR, selectedEngine.priceUSD)})`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--intake-summary-border)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--intake-summary-label)' }}>SELECTED ADD-ON MODULES</span>
                      <span style={{ fontWeight: 700, color: 'var(--intake-summary-value)' }}>{`+${priceInCurrency(totalCost.featuresINR, totalCost.featuresUSD)} (${formData.selectedFeatures.length} Modules incl. required deps)`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--intake-summary-border)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '12px', color: 'var(--intake-summary-label)' }}>BRAND KIT ADD-ON</span>
                      <span style={{ fontWeight: 700, color: 'var(--intake-summary-value)' }}>{totalCost.brandOpt.priceINR > 0 ? `+${priceInCurrency(totalCost.brandOpt.priceINR, totalCost.brandOpt.priceUSD)}` : 'Included'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '13px', fontWeight: 800, color: 'var(--intake-summary-text)' }}>TOTAL BUILD INVESTMENT (ESTIMATE)</span>
                      <span style={{ fontFamily: 'var(--font-code)', fontSize: '18px', fontWeight: 800, color: 'var(--intake-summary-accent)' }}>{formatPricePair(totalCost.totalINR, totalCost.totalUSD, currency)}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '11px', opacity: 0.72, lineHeight: 1.55, margin: '0 0 16px 0', color: 'var(--intake-summary-text)' }}>
                    {ESTIMATE_DISCLAIMER}
                  </p>

                  {/* Maintenance Selector */}
                  <div className={styles.field}>
                    <label className={styles.label}>Select Monthly Maintenance & SLA Care Plan</label>
                    <div className={styles.careGrid}>
                      {maintenancePlans.map(p => {
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
                              {p.priceINR > 0
                                ? `${priceInCurrency(p.priceINR, p.priceUSD)}${p.period}`
                                : 'Included (30-Day Warranty)'}
                            </div>
                            <p style={{ margin: '0 0 8px 0', fontSize: '11px', opacity: 0.7, lineHeight: 1.4 }}>{p.laymanDescription}</p>

                            <ul className={styles.careCardList}>
                              {p.includes.map((inc, iIdx) => (
                                <li key={iIdx}>{inc}</li>
                              ))}
                            </ul>

                            {isPopoverOpen && popoverAnchor && (
                              <Portal>
                                <>
                                  <div className={styles.popoverOverlay} onClick={() => { setActivePopoverId(null); setPopoverAnchor(null); }} />
                                  <div
                                    className={styles.popoverPortal}
                                    style={{ left: popoverAnchor.x, top: popoverAnchor.y }}
                                    onClick={ev => ev.stopPropagation()}
                                  >
                                    <div className={styles.popoverBox} style={{ position: 'static', left: 'auto', right: 'auto' }}>
                                      <div className={styles.popoverHeader}>
                                        <span>🛠️ TECHNICAL SLA SPECS</span>
                                        <X size={12} style={{ cursor: 'pointer' }} onClick={() => { setActivePopoverId(null); setPopoverAnchor(null); }} />
                                      </div>
                                      <p className={styles.popoverTechText}>{p.techSpecs}</p>
                                    </div>
                                  </div>
                                </>
                              </Portal>
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
                    <div className={styles.termsContentBox}>
                      {termsList.map((t, idx) => (
                        <p key={idx}>{t}</p>
                      ))}
                    </div>
                  </div>

                  {/* Mandated Pre-submission Agreement Checkbox */}
                  <div className={styles.termsCheckboxBox}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkboxInput}
                        checked={formData.agreedToTerms}
                        onChange={(e) => setFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
                      />
                      <span>
                        <strong>I agree to the Standard Commercial Terms</strong> (50% upfront deposit to initiate development, 50% upon final delivery prior to source code transfer & deployment handoff).
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {errorMsg && (
                <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '12px' }}>{errorMsg}</p>
              )}

              {/* Actions Footer */}
              <div className={styles.actions}>
                <div className={styles.leftActions}>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={!isFormValid}
                    className={`${styles.btn} ${styles.btnSecondary} ${!isFormValid ? styles.btnDisabled : ''}`}
                    title={
                      isFormValid
                        ? 'Open Canva-grade PDF proposal preview'
                        : 'Please fill in your Company Name, Email, and accept Commercial Terms in Step 4 to unlock Proposal PDF'
                    }
                  >
                    {isFormValid ? <Download size={16} /> : <Lock size={16} />}
                    <span>{isFormValid ? 'OPEN PROPOSAL PDF' : '🔒 OPEN PROPOSAL PDF'}</span>
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
                      disabled={submitting || !formData.agreedToTerms || !recaptchaReady}
                      className={`${styles.btn} ${styles.btnPrimary} ${(!formData.agreedToTerms || !recaptchaReady) ? styles.btnDisabled : ''}`}
                      title={!formData.agreedToTerms ? 'Accept commercial terms to submit' : 'Submit scoping brief'}
                    >
                      {submitting ? 'SUBMITTING...' : 'SUBMIT SCOPING BRIEF'}
                      <Send size={16} />
                    </button>
                  )}
                  {recaptchaUnavailable && (
                    <p className={styles.recaptchaWarning}>
                      reCAPTCHA could not be initialized on this origin — this usually means a
                      browser extension is blocking it, or this origin is not registered in the
                      Google reCAPTCHA admin console.
                    </p>
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
