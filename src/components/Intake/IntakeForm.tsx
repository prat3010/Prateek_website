'use client';

import React, { useRef, useEffect } from 'react';
import {
  Building2,
  SlidersHorizontal,
  Palette,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Download,
  Rocket,
  Send,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import type {
  GoalArchetype,
  BrandAssetOption,
  MaintenancePlanOption,
  FeatureItem,
  QuickServiceItem,
  ResumeData,
} from '@/data/resume';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import {
  formatPricePair,
  resolveFeatureDependencies,
} from '@/lib/pricing';
import { signInWithGoogle } from '@/lib/auth';
import { useLenis } from 'lenis/react';

import { useIntakeFormState, type IntakePreset, type IntakeFormData } from './useIntakeFormState';
import { ServiceTypeGate } from './ServiceTypeGate';
import { StepGoalArchetype } from './StepGoalArchetype';
import { StepTechnicalScope } from './StepTechnicalScope';
import { StepBrandKit } from './StepBrandKit';
import { StepCommercials } from './StepCommercials';
import { QuickServiceFlow } from './QuickServiceFlow';
import { StickyPriceBar } from './StickyPriceBar';

import styles from './IntakeForm.module.css';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export type { IntakePreset, IntakeFormData };

export const GOAL_ARCHETYPES: GoalArchetype[] = questionnaireDefaults.goals;
export const BRAND_ASSET_OPTIONS: BrandAssetOption[] = questionnaireDefaults.brandAssets;
export const MAINTENANCE_PLANS: MaintenancePlanOption[] = questionnaireDefaults.maintenancePlans;
export const QUICK_SERVICES: QuickServiceItem[] = questionnaireDefaults.quickServices || [];

export const GOAL_CATEGORIES: { id: 'all' | 'websites' | 'saas' | 'ai_widgets'; label: string; ids: string[] }[] = [
  { id: 'all', label: 'All Archetypes', ids: [] },
  { id: 'websites', label: 'Websites & Stores', ids: ['landing_page', 'business_multipage', 'ecommerce', 'booking_appointments'] },
  { id: 'saas', label: 'SaaS & Apps', ids: ['saas_app', 'lms_portal', 'crm_admin'] },
  { id: 'ai_widgets', label: 'AI & Custom Tools', ids: ['ai_rag_app', 'autonomous_agents', 'voice_ai_agent_app', 'vision_ocr_saas', 'standalone_voice_bot', 'standalone_chatbot', 'ai_strategy_consulting', 'custom'] },
];

export const FEATURE_CATEGORIES = [
  {
    id: 'security_infra',
    title: 'Security, Auth & Core Infrastructure',
    description: 'User access control, administration center, and data migration pipelines',
    featureIds: ['auth', 'admin', 'migration'],
  },
  {
    id: 'commerce_billing',
    title: 'Commerce, Booking & Monetization',
    description: 'Payment gateway integration, online scheduling, shopping cart, and course portals',
    featureIds: ['payments', 'booking', 'commerce', 'lms'],
  },
  {
    id: 'ai_automation',
    title: 'AI Knowledge Base & Workflows',
    description: 'Vector search (RAG), autonomous AI agents, voice AI, vision OCR, automated emails, CRM tracking, and webhooks',
    featureIds: ['ai_rag', 'ai_agents', 'ai_voice_agent', 'ai_vision_ocr', 'email', 'crm', 'integrations'],
  },
  {
    id: 'engagement_cx',
    title: 'Engagement, Search & Custom Analytics',
    description: 'Instant site search, customer review feeds, multi-language localization, dynamic blogs, and custom analytics',
    featureIds: ['search', 'reviews', 'multilingual', 'blog', 'analytics'],
  },
];

export const QUICK_CATEGORIES: { id: string; label: string; categories: readonly string[] }[] = [
  { id: 'all', label: 'All Services', categories: [] },
  { id: 'ai', label: 'AI & Chatbots', categories: ['AI & Intelligence'] },
  { id: 'integration', label: 'Integrations & Payments', categories: ['Integrations & Payments'] },
  { id: 'performance', label: 'Speed & SEO', categories: ['Optimization & Growth', 'Security & Infrastructure'] },
];

export interface IntakeFormProps {
  resumeData: ResumeData | null;
  initialPreset?: IntakePreset | null;
}

export default function IntakeForm({ resumeData, initialPreset = null }: IntakeFormProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isNoir = theme === 'noir';
  const lenis = useLenis();
  const containerRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLDivElement>(null);
  const formTitleId = 'scoping-form-title';

  const state = useIntakeFormState(resumeData, initialPreset, user, isNoir);

  const {
    goals,
    engines,
    features,
    brandAssets,
    maintenancePlans,
    quickServices,
    currentStep,
    setCurrentStep,
    serviceType,
    setServiceType,
    currency,
    setCurrency,
    selectedQuickServices,
    setSelectedQuickServices,
    quickStep,
    setQuickStep,
    quickFormData,
    setQuickFormData,
    selectedGoalCategory,
    setSelectedGoalCategory,
    selectedQuickCategory,
    setSelectedQuickCategory,
    showEngineOverride,
    setShowEngineOverride,
    showMobileFormula,
    setShowMobileFormula,
    submitted,
    submitting,
    generatingPdf,
    errorMsg,
    activePopoverId,
    setActivePopoverId,
    popoverAnchor,
    setPopoverAnchor,
    lockedHintId,
    triggerLockedHint,
    recaptchaUnavailable,
    setRecaptchaUnavailable,
    formData,
    setFormData,
    currentArchetype,
    selectedEngine,
    shouldSkipBrandStep,
    autoMaintenancePlanId,
    totalCost,
    quickQuote,
    generatedScopeCode,
    handleDownloadPDF,
    handleDownloadQuickPDF,
    handleCopyShareableUrl,
    togglePopover,
    handleGoalChange,
    applyBlueprint,
    handleSubmitOnline,
    handleQuickSubmit,
  } = state;

  useEffect(() => {
    if (containerRef.current && currentStep > 1) {
      if (lenis) {
        lenis.scrollTo(containerRef.current, { offset: -90, duration: 0.8 });
      } else {
        const top = containerRef.current.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      setTimeout(() => {
        stepHeadingRef.current?.focus({ preventScroll: true });
      }, 100);
    }
  }, [currentStep, lenis]);

  const dependsOnMap = React.useMemo(() => {
    const map: Record<string, { id: string; label: string }[]> = {};
    features.forEach((f: FeatureItem) => {
      if (f.dependsOn && f.dependsOn.length > 0) {
        f.dependsOn.forEach((prereqId: string) => {
          if (!map[prereqId]) map[prereqId] = [];
          if (!map[prereqId].some((item) => item.id === f.id)) {
            map[prereqId].push({ id: f.id, label: f.label });
          }
        });
      }
    });
    return map;
  }, [features]);

  const priceInCurrency = (inr: number, usd: number) =>
    formatPricePair(inr, usd, currency);

  const handleFeatureToggle = React.useCallback((featureId: string) => {
    const targetFeature = features.find((f: FeatureItem) => f.id === featureId);
    if (!targetFeature) return;

    const isCompulsory = currentArchetype.compulsoryFeatureLabels.includes(targetFeature.label);
    const isLegacyRequired =
      formData.projectStartType === 'legacy_rebuild' && targetFeature.autoIncludeOnLegacy;

    const otherSelectedIds = formData.selectedFeatures.filter((id: string) => id !== featureId);
    const requiredPrereqIds = new Set(resolveFeatureDependencies(otherSelectedIds, features));

    if (requiredPrereqIds.has(featureId)) {
      triggerLockedHint(featureId);
      return;
    }

    if (isCompulsory || isLegacyRequired) {
      triggerLockedHint(featureId);
      return;
    }

    setFormData((prev) => {
      const exists = prev.selectedFeatures.includes(featureId);
      let updatedIds: string[];
      if (exists) {
        updatedIds = prev.selectedFeatures.filter((id: string) => id !== featureId);
      } else {
        updatedIds = [...prev.selectedFeatures, featureId];
      }

      const allRequiredIds = resolveFeatureDependencies(updatedIds, features);
      const mergedSet = new Set(updatedIds);
      allRequiredIds.forEach((reqId: string) => mergedSet.add(reqId));

      return {
        ...prev,
        selectedFeatures: Array.from(mergedSet),
      };
    });
  }, [currentArchetype, formData.projectStartType, formData.selectedFeatures, features, setFormData, triggerLockedHint]);

  const handleScopeStartTypeChange = (type: 'greenfield' | 'legacy_rebuild') => {
    setFormData((prev) => {
      let updatedFeatures = [...prev.selectedFeatures];
      if (type === 'legacy_rebuild') {
        const legacyIds = features
          .filter((f: FeatureItem) => f.autoIncludeOnLegacy)
          .map((f: FeatureItem) => f.id);
        const merged = new Set([...updatedFeatures, ...legacyIds]);
        updatedFeatures = Array.from(merged);
      }
      return {
        ...prev,
        projectStartType: type,
        selectedFeatures: updatedFeatures,
      };
    });
  };

  const applySmartPreset = (presetType: 'essential' | 'growth' | 'ai') => {
    let presetIds: string[] = [];
    if (presetType === 'essential') {
      presetIds = ['auth', 'admin'];
    } else if (presetType === 'growth') {
      presetIds = ['auth', 'admin', 'payments', 'email', 'analytics', 'search'];
    } else if (presetType === 'ai') {
      presetIds = ['auth', 'admin', 'ai_rag', 'ai_agents', 'ai_voice_agent', 'integrations'];
    }

    const compulsoryIds = currentArchetype.compulsoryFeatureLabels
      .map((label: string) => features.find((f: FeatureItem) => f.label === label)?.id)
      .filter(Boolean) as string[];

    const mergedIds = new Set([
      ...presetIds,
      ...compulsoryIds,
    ]);

    if (formData.projectStartType === 'legacy_rebuild') {
      features
        .filter((f: FeatureItem) => f.autoIncludeOnLegacy)
        .forEach((f: FeatureItem) => mergedIds.add(f.id));
    }

    const extraIds = resolveFeatureDependencies(Array.from(mergedIds), features);
    extraIds.forEach((id: string) => mergedIds.add(id));

    setFormData((prev) => ({
      ...prev,
      selectedFeatures: Array.from(mergedIds),
    }));
  };

  const steps = [
    { num: 1, title: 'Identity', icon: Building2 },
    { num: 2, title: 'Technical Scope', icon: SlidersHorizontal },
    { num: 3, title: 'Brand Kit', icon: Palette },
    { num: 4, title: 'Commercials & SLA', icon: ShieldCheck },
  ];

  const timelineOptions = resumeData?.intake?.timelineOptions || [
    'Fast-Track MVP (2–3 weeks)',
    'Standard (3–4 weeks)',
    'Enterprise Scale (6–8 weeks)',
  ];

  const termsList = resumeData?.intake?.termsAndConditions || [
    '• 50% upfront deposit to initiate development; 50% upon final UAT approval prior to source code handoff & cloud deployment.',
    '• 30-day post-handover warranty for bug fixes included on all deliverables.',
    '• All intellectual property, source code, and design tokens transfer 100% to client upon final milestone payment.',
  ];

  // Reset form data cleanly when changing service type (Issue 4.8)
  const resetServiceType = () => {
    setSelectedQuickServices([]);
    setServiceType(null);
  };

  return (
    <section
      className={styles.intakeSection}
      id="scoping-form"
      ref={containerRef}
      onClick={() => {
        setActivePopoverId(null);
        setPopoverAnchor(null);
      }}
    >
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h3 id={formTitleId} className={styles.title}>Interactive Scoping &amp; Commercial Engine</h3>
            <p className={styles.subtitle}>
              Configure your web architecture, itemized modules, brand assets, and maintenance care plan for an instant quotation.
            </p>
            <div className={styles.currencyToggle} role="group" aria-label="Currency Preference">
              <button
                type="button"
                aria-pressed={currency === 'INR'}
                className={`${styles.currencyBtn} ${currency === 'INR' ? styles.currencyActive : ''}`}
                onClick={() => setCurrency('INR')}
                title="Show all prices in Indian Rupees"
              >
                ₹ INR Rates
              </button>
              <button
                type="button"
                aria-pressed={currency === 'USD'}
                className={`${styles.currencyBtn} ${currency === 'USD' ? styles.currencyActive : ''}`}
                onClick={() => setCurrency('USD')}
                title="Show all prices in US Dollars"
              >
                $ USD Rates
              </button>
            </div>
          </div>

          {submitted ? (
            <div className={styles.submittedCard}>
              <div className={styles.submittedIcon}>
                <CheckCircle2 size={44} />
              </div>
              <h3 className={styles.submittedTitle}>Scope Saved Successfully!</h3>
              <p className={styles.submittedText}>
                Your custom scoping architecture <strong>{generatedScopeCode}</strong> has been created and prepared for setup.
              </p>
              <div className={styles.submittedActions}>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={generatingPdf}
                  className={`${styles.btn} ${styles.btnSecondary} ${generatingPdf ? styles.btnDisabled : ''}`}
                >
                  <Download size={16} />
                  <span>{generatingPdf ? 'GENERATING PDF...' : 'DOWNLOAD PROPOSAL PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (user?.email) {
                      window.location.href = '/dashboard?imported=true';
                    } else {
                      signInWithGoogle('/dashboard?imported=true');
                    }
                  }}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  <span>CONTINUE TO DASHBOARD</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : serviceType === null ? (
            <ServiceTypeGate onSelectType={(type) => setServiceType(type)} />
          ) : serviceType === 'quick' ? (
            <QuickServiceFlow
              quickServices={quickServices}
              selectedQuickServices={selectedQuickServices}
              setSelectedQuickServices={setSelectedQuickServices}
              quickStep={quickStep}
              setQuickStep={setQuickStep}
              quickFormData={quickFormData}
              setQuickFormData={setQuickFormData}
              selectedQuickCategory={selectedQuickCategory}
              setSelectedQuickCategory={setSelectedQuickCategory}
              quickQuote={quickQuote}
              currency={currency}
              user={user}
              submitting={submitting}
              generatingPdf={generatingPdf}
              errorMsg={errorMsg}
              activePopoverId={activePopoverId}
              setActivePopoverId={setActivePopoverId}
              popoverAnchor={popoverAnchor}
              setPopoverAnchor={setPopoverAnchor}
              onResetServiceType={resetServiceType}
              onQuickSubmit={handleQuickSubmit}
              onDownloadPDF={handleDownloadQuickPDF}
              togglePopover={togglePopover}
            />
          ) : (
            <>
              {/* Stepper Navigation */}
              <div className={styles.progressContainer}>
                <div className={styles.progressBarTrack} aria-hidden="true">
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${(currentStep / 4) * 100}%` }}
                  />
                </div>
                <div className={styles.stepIndicator} role="tablist" aria-label="Scoping Wizard Steps">
                  {steps.map((s) => {
                    const Icon = s.icon;
                    const isActive = currentStep === s.num;
                    const isDone = currentStep > s.num || (currentStep === 4 && s.num === 3 && shouldSkipBrandStep);
                    const isSkipped = s.num === 3 && shouldSkipBrandStep;
                    return (
                      <button
                        key={s.num}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Step ${s.num}: ${s.title}`}
                        className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ''} ${isDone ? styles.stepItemDone : ''} ${isSkipped ? styles.stepItemSkipped : ''}`}
                        onClick={() => !isSkipped && setCurrentStep(s.num)}
                        disabled={isSkipped}
                        title={isSkipped ? 'Brand Kit skipped (Standalone / Widget scope)' : `Go to Step ${s.num}: ${s.title}`}
                      >
                        <div className={`${styles.stepBadge} ${isActive ? styles.stepBadgeActive : ''} ${isDone ? styles.stepBadgeDone : ''} ${isSkipped ? styles.stepBadgeSkipped : ''}`}>
                          {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                        </div>
                        <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
                          {isSkipped ? 'Brand (N/A)' : s.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.mobileStepSubhead} aria-live="polite">
                  <span>STEP {currentStep} OF 4</span>
                  <strong>{steps[currentStep - 1].title}{shouldSkipBrandStep && currentStep !== 3 ? ' (Brand N/A)' : ''}</strong>
                </div>
                <div className="sr-only" aria-live="polite" aria-atomic="true">
                  Step {currentStep} of 4: {steps[currentStep - 1].title}
                </div>
              </div>

              <form onSubmit={handleSubmitOnline} aria-labelledby={formTitleId}>
                {currentStep === 1 && (
                  <StepGoalArchetype
                    goals={goals}
                    engines={engines}
                    features={features}
                    formData={formData}
                    selectedGoalCategory={selectedGoalCategory}
                    setSelectedGoalCategory={setSelectedGoalCategory}
                    currency={currency}
                    user={user}
                    onGoalChange={handleGoalChange}
                    onScopeStartTypeChange={handleScopeStartTypeChange}
                    onResetServiceType={resetServiceType}
                    onChangeField={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
                    onApplyBlueprint={applyBlueprint}
                    isNoir={isNoir}
                    stepHeadingRef={stepHeadingRef}
                  />
                )}

                {currentStep === 2 && (
                  <StepTechnicalScope
                    engines={engines}
                    features={features}
                    currentArchetype={currentArchetype}
                    selectedEngine={selectedEngine}
                    formData={formData}
                    showEngineOverride={showEngineOverride}
                    setShowEngineOverride={setShowEngineOverride}
                    activePopoverId={activePopoverId}
                    setActivePopoverId={setActivePopoverId}
                    popoverAnchor={popoverAnchor}
                    setPopoverAnchor={setPopoverAnchor}
                    lockedHintId={lockedHintId}
                    currency={currency}
                    priceInCurrency={priceInCurrency}
                    onEngineSelect={(engineId) => setFormData((prev) => ({ ...prev, selectedBaseEngineId: engineId }))}
                    onFeatureToggle={handleFeatureToggle}
                    onApplySmartPreset={applySmartPreset}
                    togglePopover={togglePopover}
                    dependsOnMap={dependsOnMap}
                    stepHeadingRef={stepHeadingRef}
                  />
                )}

                {currentStep === 3 && (
                  <StepBrandKit
                    brandAssets={brandAssets}
                    selectedBrandAssetId={formData.selectedBrandAssetId}
                    currency={currency}
                    onSelectBrandAsset={(b) =>
                      setFormData((prev) => ({
                        ...prev,
                        selectedBrandAssetId: b.id,
                        designReadiness: (b.designReadiness as 'figma_ready' | 'needs_design_system' | 'needs_copywriting') || 'figma_ready',
                      }))
                    }
                    stepHeadingRef={stepHeadingRef}
                  />
                )}

                {currentStep === 4 && (
                  <StepCommercials
                    selectedEngine={selectedEngine}
                    totalCost={totalCost}
                    maintenancePlans={maintenancePlans}
                    formData={formData}
                    autoMaintenancePlanId={autoMaintenancePlanId}
                    activePopoverId={activePopoverId}
                    setActivePopoverId={setActivePopoverId}
                    popoverAnchor={popoverAnchor}
                    setPopoverAnchor={setPopoverAnchor}
                    currency={currency}
                    priceInCurrency={priceInCurrency}
                    timelineOptions={timelineOptions}
                    termsList={termsList}
                    togglePopover={togglePopover}
                    onChangeField={(field, val) => setFormData((prev) => ({ ...prev, [field]: val }))}
                    agreedToTermsError={!formData.agreedToTerms}
                    stepHeadingRef={stepHeadingRef}
                  />
                )}

                {errorMsg && (
                  <p id="form-error" role="alert" aria-live="assertive" className={styles.formError}>
                    {errorMsg}
                  </p>
                )}

                <StickyPriceBar
                  selectedEngine={selectedEngine}
                  totalCost={totalCost}
                  currency={currency}
                  priceInCurrency={priceInCurrency}
                  showMobileFormula={showMobileFormula}
                  setShowMobileFormula={setShowMobileFormula}
                />

                {/* Actions Footer */}
                <div className={styles.actions}>
                  <div className={styles.leftActions}>
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={generatingPdf}
                      className={`${styles.btn} ${styles.btnSecondary} ${generatingPdf ? styles.btnDisabled : ''}`}
                      title="Open Canva-grade PDF proposal preview"
                    >
                      <Download size={16} />
                      <span>{generatingPdf ? 'GENERATING PDF...' : 'OPEN PROPOSAL PDF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyShareableUrl}
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      title="Copy shareable deep link to this custom quote"
                    >
                      <Sparkles size={16} />
                      <span>COPY SHAREABLE LINK</span>
                    </button>

                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentStep === 4 && shouldSkipBrandStep) {
                            setCurrentStep(2);
                          } else {
                            setCurrentStep((prev) => prev - 1);
                          }
                        }}
                        className={`${styles.btn} ${styles.btnSecondary}`}
                      >
                        <ArrowLeft size={16} />
                        <span>PREVIOUS</span>
                      </button>
                    )}
                  </div>

                  <div className={styles.submitWrapper}>
                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (currentStep === 2 && shouldSkipBrandStep) {
                            setCurrentStep(4);
                          } else {
                            setCurrentStep((prev) => prev + 1);
                          }
                        }}
                        className={`${styles.btn} ${styles.btnPrimary}`}
                      >
                        <span>NEXT STEP</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <>
                        {!user && (
                          <button
                            type="button"
                            onClick={() => signInWithGoogle()}
                            className={`${styles.btn} ${styles.googleFastPassBtn}`}
                            title="Fast-pass: Sign in with Google to automatically save your scope to your client dashboard"
                          >
                            <Rocket size={16} />
                            <span>1-CLICK GOOGLE FAST-PASS</span>
                          </button>
                        )}
                        <button
                          type="submit"
                          disabled={submitting || !formData.agreedToTerms}
                          className={`${styles.btn} ${styles.btnPrimary} ${!formData.agreedToTerms ? styles.btnDisabled : ''}`}
                          title={!formData.agreedToTerms ? 'Accept commercial terms to submit' : 'Save scope & continue in client dashboard'}
                          aria-describedby={errorMsg ? 'form-error' : undefined}
                        >
                          <span>{submitting ? 'SAVING SCOPE...' : 'SAVE SCOPE & CONTINUE IN DASHBOARD'}</span>
                          <Send size={16} />
                        </button>
                        <p className={styles.ctaSubtext}>
                          <ShieldCheck size={12} className={styles.inlineIcon} />
                          Your active scope configuration is automatically preserved and saved to your workspace upon Google sign-in.
                        </p>
                        <div className={styles.socialProofBox}>
                          <em>&ldquo;Prateeq delivered our SaaS MVP in 3 weeks. The scoping brief was spot-on.&rdquo;</em> &mdash; <strong>B2B SaaS Founder</strong>
                        </div>
                      </>
                    )}
                    {recaptchaUnavailable && (
                      <div className={styles.recaptchaNoticeBox}>
                        <p className={styles.recaptchaWarning}>
                          reCAPTCHA could not be initialized on this origin — this usually means a
                          browser extension is blocking it, or this origin is not registered in the
                          Google reCAPTCHA admin console.
                        </p>
                        <button
                          type="button"
                          className={styles.recaptchaRetryBtn}
                          onClick={() => {
                            setRecaptchaUnavailable(false);
                            if (typeof window !== 'undefined' && window.grecaptcha && SITE_KEY) {
                              window.grecaptcha.ready(() => {});
                            }
                          }}
                        >
                          Retry initializing reCAPTCHA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
