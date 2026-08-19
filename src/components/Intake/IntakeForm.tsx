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
  Info,
  Sparkles,
  Check,
  Rocket
} from 'lucide-react';
import { generateQuestionnairePDF, generateQuestionnairePDFBase64, type QuestionnaireData } from '@/utils/pdfGenerator';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  calcQuote,
  calcQuickServiceQuote,
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
  ResumeData,
  QuickServiceItem
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
  serviceType?: 'full' | 'quick' | 'care';
  quickServiceId?: string;
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
export const QUICK_SERVICES: QuickServiceItem[] = questionnaireDefaults.quickServices || [];
export const BUSINESS_KPIS: string[] = questionnaireDefaults.businessKPIs || [];

export const GOAL_CATEGORIES: { id: 'all' | 'websites' | 'saas' | 'ai_widgets'; label: string; ids: string[] }[] = [
  { id: 'all', label: 'All Archetypes', ids: [] },
  { id: 'websites', label: 'Websites & Stores', ids: ['landing_page', 'business_multipage', 'ecommerce', 'booking_appointments'] },
  { id: 'saas', label: 'SaaS & Apps', ids: ['saas_app', 'lms_portal', 'crm_admin'] },
  { id: 'ai_widgets', label: 'AI & Custom Tools', ids: ['ai_rag_app', 'standalone_chatbot', 'custom'] },
];

export const FEATURE_CATEGORIES = [
  {
    id: 'security_infra',
    title: '🔐 Security, Auth & Core Infrastructure',
    description: 'User access control, administration center, and data migration pipelines',
    featureIds: ['auth', 'admin', 'migration'],
  },
  {
    id: 'commerce_billing',
    title: '💳 Commerce, Booking & Monetization',
    description: 'Payment gateway integration, online scheduling, shopping cart, and course portals',
    featureIds: ['payments', 'booking', 'commerce', 'lms'],
  },
  {
    id: 'ai_automation',
    title: '🤖 AI Knowledge Base & Workflows',
    description: 'Vector search (RAG), automated emails, CRM lead tracking, and webhooks',
    featureIds: ['ai_rag', 'email', 'crm', 'integrations'],
  },
  {
    id: 'experience_scale',
    title: '🚀 Content Management & Mobile Experience',
    description: 'Headless blog CMS, installable PWA app, multilingual i18n, and video streaming',
    featureIds: ['cms', 'pwa', 'i18n', 'video'],
  },
];

export const QUICK_CATEGORIES: { id: 'all' | 'ai' | 'integration' | 'performance'; label: string; categories: string[] }[] = [
  { id: 'all', label: 'All Services', categories: [] },
  { id: 'ai', label: '🤖 AI & Email', categories: ['ai', 'email'] },
  { id: 'integration', label: '🔗 Integrations & APIs', categories: ['integration'] },
  { id: 'performance', label: '⚡ Performance & SEO', categories: ['performance'] },
];

export default function IntakeForm({ resumeData, initialPreset = null }: IntakeFormProps) {
  const { isNoir, region } = useTheme();
  const [currency, setCurrency] = useState<Currency>(() => resolveDefaultCurrency(region));
  const intakeConfig = resumeData?.intake;

  const engines = useMemo(() => {
    return intakeConfig?.engines?.length ? intakeConfig.engines : BASE_ENGINES;
  }, [intakeConfig]);

  const features = useMemo(() => {
    return intakeConfig?.features?.length ? intakeConfig.features : FEATURE_MODULES;
  }, [intakeConfig]);

  const goals = useMemo(() => {
    return intakeConfig?.goals?.length ? intakeConfig.goals : GOAL_ARCHETYPES;
  }, [intakeConfig]);

  const brandAssets = useMemo(() => {
    return intakeConfig?.brandAssets?.length ? intakeConfig.brandAssets : BRAND_ASSET_OPTIONS;
  }, [intakeConfig]);

  const maintenancePlans = useMemo(() => {
    return intakeConfig?.maintenancePlans?.length ? intakeConfig.maintenancePlans : MAINTENANCE_PLANS;
  }, [intakeConfig]);
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

  const { user, loginWithGoogle, getAccessToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [serviceType, setServiceType] = useState<'full' | 'quick' | 'care' | null>(() => initialPreset?.serviceType || null);
  const [selectedQuickServices, setSelectedQuickServices] = useState<string[]>(() => 
    initialPreset?.quickServiceId ? [initialPreset.quickServiceId] : []
  );
  const [quickStep, setQuickStep] = useState(initialPreset?.quickServiceId ? 2 : 1);
  const [quickFormData, setQuickFormData] = useState({ companyName: '', siteUrl: '', additionalNotes: '', agreedToTerms: false });
  const [selectedGoalCategory, setSelectedGoalCategory] = useState<'all' | 'websites' | 'saas' | 'ai_widgets'>('all');
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<'all' | 'ai' | 'integration' | 'performance'>('all');
  const [showEngineOverride, setShowEngineOverride] = useState(false);
  const [showMobileFormula, setShowMobileFormula] = useState(false);

  const quickServices = useMemo(() => {
    return intakeConfig?.quickServices?.length ? intakeConfig.quickServices : QUICK_SERVICES;
  }, [intakeConfig]);

  const businessKPIs = useMemo(() => {
    return intakeConfig?.businessKPIs?.length ? intakeConfig.businessKPIs : BUSINESS_KPIS;
  }, [intakeConfig]);

  const [submitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [lockedHintId, setLockedHintId] = useState<string | null>(null);

  const triggerLockedHint = (id: string) => {
    setLockedHintId(id);
    setTimeout(() => {
      setLockedHintId(prev => (prev === id ? null : prev));
    }, 2800);
  };
  const [, setRecaptchaReady] = useState(!SITE_KEY);
  const [recaptchaUnavailable, setRecaptchaUnavailable] = useState(false);

  const [generatedScopeCode] = useState(() => `SCOPE-${Math.floor(10000 + Math.random() * 90000)}`);

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

interface IntakeFormData {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  projectGoal: string;
  businessKPI: string;
  projectStartType: string;
  targetAudience: string;
  selectedBaseEngineId: string;
  selectedFeatures: string[];
  selectedBrandAssetId: string;
  designReadiness: string;
  selectedMaintenanceId: string;
  hostingOwnership: string;
  taxInvoicingPreference: string;
  inspirationLinks: string;
  timeline: string;
  additionalNotes: string;
  agreedToTerms: boolean;
}

  const hasDeepLink = Boolean(initialPreset?.goalId || initialPreset?.engineId);

  const [formData, setFormData] = useState<IntakeFormData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedDraft = localStorage.getItem('prateeq_scoping_draft');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          return {
            companyName: parsed.companyName || '',
            contactEmail: parsed.contactEmail || '',
            contactPhone: parsed.contactPhone || '',
            projectGoal: (hasDeepLink ? initialArchetype.label : parsed.projectGoal) || initialArchetype.label,
            businessKPI: parsed.businessKPI || '🚀 Increase Lead & Customer Conversion Rate',
            projectStartType: parsed.projectStartType || 'greenfield',
            targetAudience: parsed.targetAudience || '',
            selectedBaseEngineId: (hasDeepLink ? initialArchetype.recommendedEngineId : parsed.selectedBaseEngineId) || initialArchetype.recommendedEngineId,
            selectedFeatures: hasDeepLink ? initialSelectedFeatures : (Array.isArray(parsed.selectedFeatures) ? (parsed.selectedFeatures as string[]) : initialSelectedFeatures),
            selectedBrandAssetId: parsed.selectedBrandAssetId || (brandAssets[0]?.id || ''),
            designReadiness: parsed.designReadiness || 'figma_ready',
            selectedMaintenanceId: parsed.selectedMaintenanceId || '',
            hostingOwnership: parsed.hostingOwnership || 'client_owned',
            taxInvoicingPreference: parsed.taxInvoicingPreference || 'standard',
            inspirationLinks: parsed.inspirationLinks || '',
            timeline: parsed.timeline || (timelineOptions[1] || timelineOptions[0]),
            additionalNotes: parsed.additionalNotes || '',
            agreedToTerms: Boolean(parsed.agreedToTerms),
          };
        }
      } catch {}
    }

    return {
      companyName: '',
      contactEmail: '',
      contactPhone: '',
      projectGoal: initialArchetype.label,
      businessKPI: '🚀 Increase Lead & Customer Conversion Rate',
      projectStartType: 'greenfield',
      targetAudience: '',
      selectedBaseEngineId: initialArchetype.recommendedEngineId,
      selectedFeatures: initialSelectedFeatures,
      selectedBrandAssetId: brandAssets[0]?.id || '',
      designReadiness: 'figma_ready',
      selectedMaintenanceId: '',
      hostingOwnership: 'client_owned',
      taxInvoicingPreference: 'standard',
      inspirationLinks: '',
      timeline: timelineOptions[1] || timelineOptions[0],
      additionalNotes: '',
      agreedToTerms: false
    };
  });

  // Auto-save scoping questionnaire progress to local storage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('prateeq_scoping_draft', JSON.stringify(formData));
    } catch {}
  }, [formData]);

  const currentArchetype = useMemo(() => {
    return goals.find(g => g.label === formData.projectGoal) || goals[0];
  }, [formData.projectGoal, goals]);

  const shouldSkipBrandStep = Boolean(currentArchetype?.skipBrandAssets);

  const labelOfFeature = (id: string) => features.find(f => f.id === id)?.label;

  // Single-currency rendering of an INR/USD price pair, honoring the active toggle.
  const priceInCurrency = (inr: number, usd: number) => formatMoney(currency === 'INR' ? inr : usd, currency);

  const handleGoalChange = (newGoalLabel: string) => {
    const archetype = goals.find((g) => g.label === newGoalLabel) || goals[0];
    const newEngineId = archetype.recommendedEngineId;

    // Remove compulsory features from former archetype that are not compulsory in new archetype
    const formerCompulsory = new Set(currentArchetype.compulsoryFeatureLabels);
    const newCompulsory = new Set(archetype.compulsoryFeatureLabels);
    const toRemove = Array.from(formerCompulsory).filter(label => !newCompulsory.has(label));

    setFormData((prev: IntakeFormData) => {
      const cleanedFeatures = prev.selectedFeatures.filter(f => !toRemove.includes(f));
      const mergedLabels = new Set([...cleanedFeatures, ...archetype.compulsoryFeatureLabels]);
      const baseIds = features.filter((f: FeatureItem) => mergedLabels.has(f.label)).map((f: FeatureItem) => f.id);
      const extraIds = resolveFeatureDependencies(baseIds, features);
      extraIds.forEach((id: string) => {
        const label = labelOfFeature(id);
        if (label) mergedLabels.add(label);
      });

      return {
        ...prev,
        projectGoal: newGoalLabel,
        selectedBaseEngineId: newEngineId,
        selectedFeatures: Array.from(mergedLabels),
        selectedBrandAssetId: archetype.skipBrandAssets ? (brandAssets[0]?.id || 'ready') : prev.selectedBrandAssetId,
      };
    });
  };

  const handleScopeStartTypeChange = (newType: string) => {
    const migrationFeature = features.find(f => f.autoIncludeOnLegacy);
    const migrationLabel = migrationFeature?.label;
    setFormData((prev: IntakeFormData) => {
      let updatedFeatures = [...prev.selectedFeatures];
      if (newType === 'legacy_rebuild' && migrationLabel) {
        if (!updatedFeatures.includes(migrationLabel)) {
          updatedFeatures.push(migrationLabel);
        }
      } else if (newType === 'greenfield' && migrationLabel) {
        updatedFeatures = updatedFeatures.filter((f) => f !== migrationLabel);
      }
      return {
        ...prev,
        projectStartType: newType,
        selectedFeatures: Array.from(new Set(updatedFeatures)),
      };
    });
  };

  const handleFeatureToggle = (label: string) => {
    const feature = features.find((f: FeatureItem) => f.label === label);
    if (!feature) return;

    // If feature is compulsory for current goal archetype or legacy rebuild, prevent toggling off
    if (
      currentArchetype.compulsoryFeatureLabels.includes(label) ||
      (formData.projectStartType === 'legacy_rebuild' && feature.autoIncludeOnLegacy)
    ) {
      triggerLockedHint(feature.id);
      return;
    }

    setFormData((prev: IntakeFormData) => {
      const exists = prev.selectedFeatures.includes(label);

      if (exists) {
        // Block removing a module that another selected module depends on
        const remaining = prev.selectedFeatures.filter((f: string) => f !== label);
        const remainingIds = features.filter((f: FeatureItem) => remaining.includes(f.label)).map((f: FeatureItem) => f.id);
        const requiredIds = new Set(resolveFeatureDependencies(remainingIds, features));
        if (requiredIds.has(feature.id)) {
          triggerLockedHint(feature.id);
          return prev;
        }
        return { ...prev, selectedFeatures: remaining };
      }

      // When enabling, auto-add any transitive dependencies
      const updated = [...prev.selectedFeatures, label];
      const ids = features.filter((f: FeatureItem) => updated.includes(f.label)).map((f: FeatureItem) => f.id);
      const extraLabels = resolveFeatureDependencies(ids, features)
        .map((id: string) => labelOfFeature(id))
        .filter((l: string | undefined): l is string => Boolean(l));
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

  // Smart Maintenance Auto-Selection (config-driven)
  const autoMaintenancePlanId = useMemo(() => {
    const selectedFeatureObjs = features.filter(f => formData.selectedFeatures.includes(f.label));
    // Find highest-priority recommendedMaintenanceId among selected features
    const planPriority: Record<string, number> = { premium: 3, standard: 2, basic: 1 };
    let bestPlan = 'basic';
    for (const f of selectedFeatureObjs) {
      if (f.recommendedMaintenanceId && (planPriority[f.recommendedMaintenanceId] || 0) > (planPriority[bestPlan] || 0)) {
        bestPlan = f.recommendedMaintenanceId;
      }
    }
    return bestPlan;
  }, [formData.selectedFeatures, features]);

  // Quote computed from the centralized pricing module (pure additive)
  const totalCost = useMemo(() => {
    const effectiveBrandAssetId = shouldSkipBrandStep ? (brandAssets[0]?.id || 'ready') : formData.selectedBrandAssetId;
    const brandOpt = brandAssets.find(b => b.id === effectiveBrandAssetId) || brandAssets[0];
    const activeFeatureIds = features
      .filter(f => {
        const isCompulsory = currentArchetype.compulsoryFeatureLabels.includes(f.label);
        const isLegacyRequired = formData.projectStartType === 'legacy_rebuild' && f.autoIncludeOnLegacy;
        return isCompulsory || isLegacyRequired || formData.selectedFeatures.includes(f.label);
      })
      .map(f => f.id);

    const quote = calcQuote(
      engines,
      features,
      brandAssets,
      maintenancePlans,
      {
        engineId: selectedEngine.id,
        featureIds: activeFeatureIds,
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
  }, [selectedEngine, engines, features, brandAssets, maintenancePlans, formData.selectedFeatures, formData.selectedBrandAssetId, formData.selectedMaintenanceId, autoMaintenancePlanId, currency, currentArchetype.compulsoryFeatureLabels, formData.projectStartType, shouldSkipBrandStep]);

  const activeMaintenancePlan = useMemo(() => {
    const targetId = formData.selectedMaintenanceId || autoMaintenancePlanId;
    return maintenancePlans.find(p => p.id === targetId) || maintenancePlans[1];
  }, [formData.selectedMaintenanceId, autoMaintenancePlanId, maintenancePlans]);

  const quickQuote = useMemo(() => {
    return calcQuickServiceQuote(quickServices, selectedQuickServices, currency);
  }, [quickServices, selectedQuickServices, currency]);

  const buildQuestionnaireData = (): QuestionnaireData => ({
    companyName: formData.companyName,
    contactEmail: formData.contactEmail,
    contactPhone: formData.contactPhone,
    projectGoal: formData.projectGoal,
    businessKPI: formData.businessKPI,
    projectStartType: formData.projectStartType === 'legacy_rebuild' ? 'Legacy Refactor / Rebuild' : 'Greenfield Build (From Scratch)',
    designReadiness: formData.designReadiness === 'concept_only'
      ? 'Concept Only (Needs Design System)'
      : formData.designReadiness === 'wireframes_ready'
      ? 'Wireframes / Sketches Ready'
      : 'Figma / Specs Ready',
    hostingOwnership: formData.hostingOwnership === 'needs_setup' ? 'Setup Support Required' : 'Client-Owned Accounts',
    taxInvoicingPreference: formData.taxInvoicingPreference === 'corporate_gst' ? 'GST / Corporate Invoice Required' : 'Standard Digital Receipt',
    targetAudience: formData.targetAudience,
    projectCategory: selectedEngine.title,
    features: formData.selectedFeatures,
    assetsStatus: `${totalCost.brandOpt.label} (${formData.designReadiness === 'concept_only' ? 'Concept Only' : formData.designReadiness === 'wireframes_ready' ? 'Wireframes' : 'Figma Ready'})`,
    inspirationLinks: formData.inspirationLinks,
    timeline: formData.timeline,
    budgetRange: `Estimated ${selectedEngine.tier}: ${formatPricePair(totalCost.totalINR, totalCost.totalUSD, currency)}`,
    maintenancePlan: activeMaintenancePlan.name,
    maintenanceCostINR: activeMaintenancePlan.priceINR,
    maintenanceCostUSD: activeMaintenancePlan.priceUSD,
    totalBuildCostINR: totalCost.totalINR,
    totalBuildCostUSD: totalCost.totalUSD,
    additionalNotes: [
      formData.projectStartType === 'legacy_rebuild' ? '[Context: Legacy Rebuild]' : '',
      formData.hostingOwnership === 'needs_setup' ? '[Cloud Setup Requested]' : '',
      formData.taxInvoicingPreference === 'corporate_gst' ? '[GST/Corporate Invoicing Required]' : '',
      formData.additionalNotes
    ].filter(Boolean).join(' | ')
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
    if (!formData.agreedToTerms) {
      setErrorMsg('Please accept the standard commercial terms before submitting.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      // 1. Package current scoping selections into a persistent draft payload
      const scopePayload = {
        scopeCode: generatedScopeCode,
        companyName: formData.companyName,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        projectGoal: formData.projectGoal,
        businessKPI: formData.businessKPI,
        projectStartType: formData.projectStartType === 'legacy_rebuild' ? 'Legacy Refactor' : 'Greenfield',
        designReadiness: formData.designReadiness,
        hostingOwnership: formData.hostingOwnership,
        taxInvoicingPreference: formData.taxInvoicingPreference,
        targetAudience: formData.targetAudience,
        baseEngineTitle: selectedEngine.title,
        selectedFeatures: formData.selectedFeatures,
        brandAssetOption: totalCost.brandOpt.label,
        maintenancePlan: activeMaintenancePlan.name,
        totalCostINR: totalCost.totalINR,
        totalCostUSD: totalCost.totalUSD,
        currency,
        timeline: formData.timeline,
      };

      if (typeof window !== 'undefined') {
        try { localStorage.setItem('prateeq_pending_scope', JSON.stringify(scopePayload)); } catch {}
        document.cookie = `prateeq_pending_scope=${encodeURIComponent(JSON.stringify(scopePayload))}; path=/; max-age=86400; SameSite=Lax;`;
      }

      // Persist unauthenticated lead draft to Supabase server-side (awaited to guarantee DB write before redirect)
      try {
        await fetch('/api/client/intake-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scopePayload),
        });
      } catch (draftErr) {
        console.warn('Intake draft API warning:', draftErr);
      }

      // 2. Dispatch background email notification to Resend
      const pdfBase64 = await generateQuestionnairePDFBase64(
        resumeData,
        buildQuestionnaireData(),
        isNoir,
        currency
      ).then((res) => res.base64).catch(() => undefined);

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.companyName || user?.user_metadata?.full_name || 'Client',
          email: user?.email || formData.contactEmail || 'client@example.com',
          message: `[Interactive Scoping Brief Created — ${generatedScopeCode}]`,
          attachmentBase64: pdfBase64,
          attachmentFileName: `${generatedScopeCode}-Scoping-Brief.pdf`,
        }),
      }).catch((err) => console.warn('Background contact notify warning:', err));

      // 3. If user is authenticated, save scope & navigate to dashboard
      if (user?.email) {
        try {
          const accessToken = await getAccessToken();
          await fetch('/api/client/save-scope', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              clientEmail: user.email,
              ...scopePayload,
            }),
          });
        } catch (saveErr) {
          console.warn('Save scope API warning:', saveErr);
        }
        if (typeof window !== 'undefined') {
          try { localStorage.removeItem('prateeq_scoping_draft'); } catch {}
        }
        window.location.href = '/dashboard?imported=true';
        return;
      }

      if (typeof window !== 'undefined') {
        try { localStorage.removeItem('prateeq_scoping_draft'); } catch {}
      }
      // 4. If unauthenticated, trigger Google OAuth sign-in with redirect target to /dashboard
      await loginWithGoogle('/dashboard?imported=true');
    } catch (err: unknown) {
      console.error('Intake form submission error:', err);
      window.location.href = '/dashboard?imported=true';
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickSubmit = async () => {
    if (!quickFormData.agreedToTerms || selectedQuickServices.length === 0) return;
    setSubmitting(true);
    try {
      const quote = calcQuickServiceQuote(quickServices, selectedQuickServices, currency);
      const selectedServiceObjs = quickServices.filter(s => selectedQuickServices.includes(s.id));
      const serviceLabels = selectedServiceObjs.map(s => s.label);

      const quickScopePayload = {
        scopeCode: generatedScopeCode,
        companyName: quickFormData.companyName.trim() || 'Quick Service Order',
        clientPhone: '',
        baseEngineTitle: `Quick Service: ${serviceLabels.join(', ')}`,
        selectedFeatures: serviceLabels,
        brandAssetOption: 'Not Applicable (Existing Site)',
        maintenancePlan: 'Self-Managed (30-Day Warranty)',
        totalCostINR: quote.totalINR,
        totalCostUSD: quote.totalUSD,
        currency,
        timeline: selectedServiceObjs[0]?.turnaround || '3–7 days',
        businessKPI: '⚡ Quick Service Integration',
        paymentStructure: '50/50',
      };

      if (typeof window !== 'undefined') {
        try { localStorage.setItem('prateeq_pending_scope', JSON.stringify(quickScopePayload)); } catch {}
        document.cookie = `prateeq_pending_scope=${encodeURIComponent(JSON.stringify(quickScopePayload))}; path=/; max-age=86400; SameSite=Lax;`;
      }

      try {
        await fetch('/api/client/intake-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quickScopePayload),
        });
      } catch (draftErr) {
        console.warn('Quick service intake draft API warning:', draftErr);
      }

      if (user?.email) {
        try {
          const accessToken = await getAccessToken();
          await fetch('/api/client/save-scope', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              clientEmail: user.email,
              ...quickScopePayload,
            }),
          });
        } catch (saveErr) {
          console.warn('Quick service save scope API warning:', saveErr);
        }
        window.location.href = '/dashboard?imported=true';
        return;
      }

      await loginWithGoogle('/dashboard?imported=true');
    } catch (err: unknown) {
      console.error('Quick service submit error:', err);
      window.location.href = '/dashboard?imported=true';
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
          {serviceType === null ? (
            /* Step 0: Service Type Gate */
            <div className={styles.formStep}>
              <div className={styles.groupTitle}>
                <Layers size={18} />
                <span>WHAT DO YOU NEED?</span>
              </div>
              <p className={styles.fieldHint}>Select the type of engagement to customize your scoping experience.</p>
              <div className={styles.checkboxGrid} role="radiogroup" aria-label="Service Type">
                <label
                  className={`${styles.checkboxCard} ${styles.step0Card}`}
                  onClick={() => setServiceType('full')}
                  style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', padding: '20px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Rocket size={22} />
                    <span style={{ fontWeight: 800, fontSize: '15px' }}>🏗️ Full Project Build</span>
                  </div>
                  <p style={{ fontSize: '13px', opacity: 0.75, margin: 0 }}>New website, web app, or SaaS platform from scratch with full scoping wizard.</p>
                </label>
                <label
                  className={`${styles.checkboxCard} ${styles.step0Card}`}
                  onClick={() => setServiceType('quick')}
                  style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', padding: '20px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Sparkles size={22} />
                    <span style={{ fontWeight: 800, fontSize: '15px' }}>🔧 Quick Service</span>
                  </div>
                  <p style={{ fontSize: '13px', opacity: 0.75, margin: 0 }}>Add a feature to your existing site — chatbot, SEO, speed fix, payments, and more.</p>
                </label>
              </div>
            </div>
          ) : serviceType === 'quick' ? (
            /* Quick Service Flow */
            <>
              <div className={styles.progressContainer}>
                <div className={styles.progressBarTrack} aria-hidden="true">
                  <div className={styles.progressBarFill} style={{ width: `${(quickStep / 2) * 100}%` }} />
                </div>
                <div className={styles.stepIndicator}>
                  <button type="button" onClick={() => setQuickStep(1)} className={`${styles.stepItem} ${quickStep === 1 ? styles.stepItemActive : ''} ${quickStep > 1 ? styles.stepItemDone : ''}`}>
                    <div className={`${styles.stepBadge} ${quickStep === 1 ? styles.stepBadgeActive : ''} ${quickStep > 1 ? styles.stepBadgeDone : ''}`}>
                      {quickStep > 1 ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                    </div>
                    <span className={`${styles.stepLabel} ${quickStep === 1 ? styles.stepLabelActive : ''}`}>Services</span>
                  </button>
                  <button type="button" onClick={() => quickStep > 1 && setQuickStep(2)} className={`${styles.stepItem} ${quickStep === 2 ? styles.stepItemActive : ''}`}>
                    <div className={`${styles.stepBadge} ${quickStep === 2 ? styles.stepBadgeActive : ''}`}>
                      <Building2 size={16} />
                    </div>
                    <span className={`${styles.stepLabel} ${quickStep === 2 ? styles.stepLabelActive : ''}`}>Details</span>
                  </button>
                </div>
              </div>
              
              {quickStep === 1 ? (
                <div className={styles.formStep}>
                  <div className={styles.groupTitle}>
                    <Sparkles size={18} />
                    <span>SELECT QUICK SERVICES</span>
                    <button type="button" className={styles.backToStep0} onClick={() => { setServiceType(null); setSelectedQuickServices([]); setQuickStep(1); }} style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
                      ← Change service type
                    </button>
                  </div>
                  <p className={styles.fieldHint}>Pick one or more services. Each includes a 30-day post-delivery warranty.</p>

                  {/* Quick Service Category Filter Tabs */}
                  <div className={styles.categoryTabs} role="tablist" aria-label="Quick Service Categories">
                    {QUICK_CATEGORIES.map(cat => {
                      const isSelected = selectedQuickCategory === cat.id;
                      const count = cat.id === 'all'
                        ? quickServices.length
                        : quickServices.filter(s => cat.categories.includes(s.category || '')).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          role="tab"
                          aria-selected={isSelected}
                          className={`${styles.categoryTabBtn} ${isSelected ? styles.categoryTabBtnActive : ''}`}
                          onClick={() => setSelectedQuickCategory(cat.id)}
                        >
                          <span>{cat.label}</span>
                          <span className={styles.categoryTabBadge}>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.checkboxGrid} role="group" aria-label="Quick Services">
                    {(selectedQuickCategory === 'all'
                      ? quickServices
                      : quickServices.filter(s => {
                          const cat = QUICK_CATEGORIES.find(c => c.id === selectedQuickCategory);
                          return cat?.categories.includes(s.category || '');
                        })
                    ).map(svc => {
                      const isSelected = selectedQuickServices.includes(svc.id);
                      return (
                        <label
                          key={svc.id}
                          className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''}`}
                          onClick={() => {
                            setSelectedQuickServices(prev =>
                              prev.includes(svc.id) ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                            );
                          }}
                          style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', padding: '14px 16px' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '13px' }}>{svc.label}</span>
                            <span className={styles.itemPrice} style={{ fontSize: '11px', fontWeight: 700 }}>
                              {formatPricePair(svc.priceINR, svc.priceUSD, currency)}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', opacity: 0.65, margin: '6px 0 4px 0' }}>{svc.laymanDescription}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', opacity: 0.5 }}>⏱ {svc.turnaround}</span>
                            <button
                              type="button"
                              className={styles.infoBtn}
                              onClick={(e) => togglePopover(e, `qs-${svc.id}`)}
                              aria-label={`Details for ${svc.label}`}
                            >
                              <Info size={14} />
                            </button>
                          </div>
                          {isSelected && <div className={styles.checkMark}><Check size={14} /></div>}
                        </label>
                      );
                    })}
                  </div>
                  {/* Quick Service total */}
                  {selectedQuickServices.length > 0 && (
                    <div className={styles.quoteSummaryCompact} style={{ marginTop: '16px' }}>
                      <span style={{ fontWeight: 700 }}>{selectedQuickServices.length} service{selectedQuickServices.length > 1 ? 's' : ''} selected</span>
                      <span style={{ fontWeight: 800, fontSize: '16px' }}>
                        {formatPricePair(quickQuote.totalINR, quickQuote.totalUSD, currency)}
                      </span>
                    </div>
                  )}
                  <div className={styles.navigationRow}>
                    <button
                      type="button"
                      disabled={selectedQuickServices.length === 0}
                      onClick={() => setQuickStep(2)}
                      className={`${styles.btn} ${styles.btnPrimary} ${selectedQuickServices.length === 0 ? styles.btnDisabled : ''}`}
                    >
                      <span>NEXT: YOUR DETAILS</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.formStep}>
                  <div className={styles.groupTitle}>
                    <Building2 size={18} />
                    <span>YOUR DETAILS & QUOTE</span>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Company / Brand Name</label>
                    <input type="text" className={styles.input} placeholder="Your company or brand name" value={quickFormData.companyName} onChange={e => setQuickFormData(prev => ({ ...prev, companyName: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Existing Website URL</label>
                    <input type="url" className={styles.input} placeholder="https://your-existing-site.com" value={quickFormData.siteUrl} onChange={e => setQuickFormData(prev => ({ ...prev, siteUrl: e.target.value }))} />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Additional Notes</label>
                    <textarea className={styles.textarea} rows={3} placeholder="Any specifics about what you need..." value={quickFormData.additionalNotes} onChange={e => setQuickFormData(prev => ({ ...prev, additionalNotes: e.target.value }))} />
                  </div>
                  {/* Quick Service Quote Summary */}
                  <div className={styles.quoteSummary}>
                    <h4 className={styles.quoteTitle}>Quick Service Quote</h4>
                    {quickServices.filter(s => selectedQuickServices.includes(s.id)).map(svc => (
                      <div key={svc.id} className={styles.quoteRow}>
                        <span>{svc.label}</span>
                        <span className={styles.itemPrice}>{formatPricePair(svc.priceINR, svc.priceUSD, currency)}</span>
                      </div>
                    ))}
                    <div className={`${styles.quoteRow} ${styles.quoteRowTotal}`}>
                      <strong>TOTAL</strong>
                      <strong className={styles.totalPrice}>
                        {formatPricePair(quickQuote.totalINR, quickQuote.totalUSD, currency)}
                      </strong>
                    </div>
                    <p style={{ fontSize: '12px', opacity: 0.55, marginTop: '8px' }}>Includes 30-day post-delivery warranty. {ESTIMATE_DISCLAIMER}</p>
                  </div>
                  {/* Terms */}
                  <div className={styles.field}>
                    <label className={styles.termsCheckbox}>
                      <input type="checkbox" checked={quickFormData.agreedToTerms} onChange={e => setQuickFormData(prev => ({ ...prev, agreedToTerms: e.target.checked }))} />
                      <span>I agree to the fixed-scope commercial terms, 50/50 milestone payments, and 30-day warranty.</span>
                    </label>
                  </div>
                  <div className={styles.navigationRow}>
                    <button type="button" onClick={() => setQuickStep(1)} className={`${styles.btn} ${styles.btnSecondary}`}>
                      <ArrowLeft size={16} />
                      <span>BACK</span>
                    </button>
                    <div className={styles.submitWrapper}>
                      <button
                        type="button"
                        disabled={!quickFormData.agreedToTerms || submitting}
                        onClick={handleQuickSubmit}
                        className={`${styles.btn} ${styles.btnPrimary} ${!quickFormData.agreedToTerms || submitting ? styles.btnDisabled : ''}`}
                      >
                        {submitting ? 'PROCESSING...' : '🚀 SAVE SCOPE & CONTINUE IN DASHBOARD'}
                        <Send size={16} />
                      </button>
                      <p className={styles.ctaSubtext}>
                        🔒 Instant setup via Google OAuth — your quick service order will be saved to your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Full Project Flow (existing wizard) */
            <>
              <div className={styles.progressContainer}>
            <div className={styles.progressBarTrack} aria-hidden="true">
              <div
                className={styles.progressBarFill}
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
            <div className={styles.stepIndicator}>
              {steps.map(s => {
                const Icon = s.icon;
                const isSkipped = s.num === 3 && shouldSkipBrandStep;
                const isActive = currentStep === s.num;
                const isDone = currentStep > s.num || (currentStep === 4 && s.num === 3 && shouldSkipBrandStep);
                return (
                  <button
                    key={s.num}
                    type="button"
                    disabled={isSkipped}
                    onClick={() => {
                      if (isSkipped) return;
                      setCurrentStep(s.num);
                    }}
                    className={`${styles.stepItem} ${isActive ? styles.stepItemActive : ''} ${isDone ? styles.stepItemDone : ''} ${isSkipped ? styles.stepItemSkipped : ''}`}
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
            <div className={styles.mobileStepSubhead}>
              <span>STEP {currentStep} OF 4</span>
              <strong>{steps[currentStep - 1].title}{shouldSkipBrandStep && currentStep !== 3 ? ' (Brand N/A)' : ''}</strong>
            </div>
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
              {/* STEP 1: PROJECT GOAL & TARGET AUDIENCE */}
              {currentStep === 1 && (
                <div className={styles.formStep}>
                  <div className={styles.groupTitle}>
                    <Building2 size={18} />
                    <span>STEP 1: PROJECT GOAL &amp; TARGET AUDIENCE</span>
                    <button type="button" className={styles.backToStep0} onClick={() => { setServiceType(null); setSelectedQuickServices([]); setQuickStep(1); }} style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>
                      ← Change service type
                    </button>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>
                      <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Select Primary Project Archetype *
                    </label>
                    <p className={styles.fieldHelpText}>
                      Selecting a core archetype automatically configures your baseline engine and essential feature modules.
                    </p>

                    {/* Category Filter Tabs */}
                    <div className={styles.categoryTabs} role="tablist" aria-label="Goal Archetype Categories">
                      {GOAL_CATEGORIES.map(cat => {
                        const isSelected = selectedGoalCategory === cat.id;
                        const count = cat.id === 'all' ? goals.length : goals.filter(g => cat.ids.includes(g.id)).length;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            role="tab"
                            aria-selected={isSelected}
                            className={`${styles.categoryTabBtn} ${isSelected ? styles.categoryTabBtnActive : ''}`}
                            onClick={() => setSelectedGoalCategory(cat.id)}
                          >
                            <span>{cat.label}</span>
                            <span className={styles.categoryTabBadge}>{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className={styles.archetypeGrid} role="radiogroup" aria-label="Primary Project Archetype">
                      {(selectedGoalCategory === 'all'
                        ? goals
                        : goals.filter(g => {
                            const cat = GOAL_CATEGORIES.find(c => c.id === selectedGoalCategory);
                            return cat?.ids.includes(g.id);
                          })
                      ).map(g => {
                        const isSelected = formData.projectGoal === g.label;
                        const recommendedEngine = engines.find(e => e.id === g.recommendedEngineId);
                        return (
                          <div
                            key={g.id}
                            tabIndex={0}
                            role="radio"
                            aria-checked={isSelected}
                            className={`${styles.archetypeCard} ${isSelected ? styles.archetypeCardSelected : ''}`}
                            onClick={() => handleGoalChange(g.label)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleGoalChange(g.label);
                              }
                            }}
                          >
                            <div className={styles.archetypeHeader}>
                              <span className={styles.archetypeLabel}>{g.label}</span>
                              {isSelected && (
                                <span className={styles.selectedBadge}>
                                  <Check size={12} /> SELECTED
                                </span>
                              )}
                            </div>
                            <p className={styles.archetypeDesc}>{g.description}</p>
                            <div className={styles.archetypeFooter}>
                              <span className={styles.engineTag}>
                                {`Engine: ${recommendedEngine?.title ? recommendedEngine.title.replace(' Engine', '').replace(' Core', '') : 'Base'}`}
                              </span>
                              <span className={styles.featureCountTag}>
                                {`${g.compulsoryFeatureLabels.length} Core Module${g.compulsoryFeatureLabels.length > 1 ? 's' : ''}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Primary Business Goal &amp; Key Success Metric</label>
                    <select
                      className={styles.select}
                      value={formData.businessKPI}
                      onChange={e => setFormData({ ...formData, businessKPI: e.target.value })}
                    >
                      {businessKPIs.map(kpi => (
                        <option key={kpi} value={kpi}>{kpi}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Project Scope Starting Point</label>
                    <div className={styles.chipGrid} role="radiogroup" aria-label="Project Scope Starting Point">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={formData.projectStartType === 'greenfield'}
                        className={`${styles.chipCard} ${formData.projectStartType === 'greenfield' ? styles.chipCardActive : ''}`}
                        onClick={() => handleScopeStartTypeChange('greenfield')}
                      >
                        🌱 Greenfield Build (From Scratch)
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={formData.projectStartType === 'legacy_rebuild'}
                        className={`${styles.chipCard} ${formData.projectStartType === 'legacy_rebuild' ? styles.chipCardActive : ''}`}
                        onClick={() => handleScopeStartTypeChange('legacy_rebuild')}
                      >
                        🔧 Legacy Refactor / Rebuild
                      </button>
                    </div>
                  </div>

                  <div className={styles.fieldGrid}>
                    <div className={styles.field}>
                      <label className={styles.label}>Project / Company Name (Optional)</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g., Acme SaaS Engine / Stealth Startup"
                        value={formData.companyName}
                        onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      />
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Target Audience Persona &amp; Industry</label>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="e.g., B2B Tech Founders, Healthcare SMBs, E-Commerce Buyers"
                        value={formData.targetAudience}
                        onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                      />
                    </div>
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
                  <div className={styles.field} style={{ marginBottom: '20px' }}>
                    <label className={styles.label}>
                      <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} />
                      Base Platform Foundation Engine
                    </label>
                    <p className={styles.fieldHelpText}>
                      Auto-assigned based on your Step 1 archetype target. Expand to override with a custom foundation.
                    </p>

                    {!showEngineOverride ? (
                      <div className={styles.engineSummaryCard}>
                        <div className={styles.engineSummaryLeft}>
                          <div className={styles.engineSummaryHeader}>
                            <span className={styles.engineSummaryTitle}>{selectedEngine.title}</span>
                            <span className={styles.engineTierTag}>{selectedEngine.tier}</span>
                          </div>
                          <p className={styles.engineSummaryDesc}>{selectedEngine.laymanDescription}</p>
                        </div>
                        <div className={styles.engineSummaryRight}>
                          <span className={styles.priceBadge}>{formatPricePair(selectedEngine.priceINR, selectedEngine.priceUSD, currency)}</span>
                          <button
                            type="button"
                            className={styles.engineOverrideBtn}
                            onClick={() => setShowEngineOverride(true)}
                            title="Click to select a different base platform engine"
                          >
                            <span>⚙️ Change Base Engine</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.engineOverrideBox}>
                        <div className={styles.engineOverrideHeader}>
                          <span className={styles.engineOverrideNotice}>SELECT PLATFORM FOUNDATION OVERRIDE</span>
                          <button
                            type="button"
                            className={styles.engineCollapseBtn}
                            onClick={() => setShowEngineOverride(false)}
                          >
                            Done Editing
                          </button>
                        </div>
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
                                        aria-label="View Technical Engineering Specs"
                                      >
                                        <Info size={12} />
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
                    )}
                  </div>

                  {/* Grouped Feature Checkboxes */}
                  <div className={styles.field}>
                    <label className={styles.label}>Select Architecture Add-on Modules (Pure Additive Pricing)</label>

                    {FEATURE_CATEGORIES.map(cat => {
                      const categoryFeatures = features.filter(f => cat.featureIds.includes(f.id));
                      if (categoryFeatures.length === 0) return null;
                      return (
                        <div key={cat.id} className={styles.featureCategoryBlock}>
                          <div className={styles.featureCategoryHeader}>
                            <h4 className={styles.featureCategoryTitle}>{cat.title}</h4>
                            <p className={styles.featureCategoryDesc}>{cat.description}</p>
                          </div>
                          <div className={styles.checkboxGrid}>
                            {categoryFeatures.map(m => {
                              const isCompulsory = currentArchetype.compulsoryFeatureLabels.includes(m.label);
                              const isLegacyRequired = formData.projectStartType === 'legacy_rebuild' && m.autoIncludeOnLegacy;
                              const isChecked = isCompulsory || isLegacyRequired || formData.selectedFeatures.includes(m.label);
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
                              const isLocked = isCompulsory || isRequiredDependency || isLegacyRequired;
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
                                        ) : isLegacyRequired ? (
                                          <span className={styles.lockedBadge} title="Required component for Legacy Refactor scope">
                                            🔒 REQUIRED FOR LEGACY REBUILD
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
                                          aria-label="View Technical Engineering Specs"
                                        >
                                          <Info size={12} />
                                        </button>
                                      </div>
                                      <span className={styles.priceBadge}>{`+${priceInCurrency(m.priceINR, m.priceUSD)}`}</span>
                                    </div>
                                    <p style={{ margin: '3px 0 0 0', fontSize: '11px', opacity: 0.7, lineHeight: 1.4 }}>{m.laymanDescription}</p>

                                    {lockedHintId === m.id && (
                                      <div className={styles.lockedNotice}>
                                        {isCompulsory
                                          ? `Required baseline module for ${currentArchetype.shortLabel}`
                                          : isLegacyRequired
                                          ? 'Required component for Legacy Refactor scope (switch to Greenfield in Step 1 to remove)'
                                          : dependencyTitle || 'Required dependency for another active module'}
                                      </div>
                                    )}

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
                      );
                    })}

                    {/* Fallback group for any dynamic features from Supabase not in standard categories */}
                    {(() => {
                      const knownIds = new Set(FEATURE_CATEGORIES.flatMap(c => c.featureIds));
                      const uncategorizedFeatures = features.filter(f => !knownIds.has(f.id));
                      if (uncategorizedFeatures.length === 0) return null;
                      return (
                        <div className={styles.featureCategoryBlock}>
                          <div className={styles.featureCategoryHeader}>
                            <h4 className={styles.featureCategoryTitle}>✨ Additional Architecture Modules</h4>
                          </div>
                          <div className={styles.checkboxGrid}>
                            {uncategorizedFeatures.map(m => {
                              const isCompulsory = currentArchetype.compulsoryFeatureLabels.includes(m.label);
                              const isLegacyRequired = formData.projectStartType === 'legacy_rebuild' && m.autoIncludeOnLegacy;
                              const isChecked = isCompulsory || isLegacyRequired || formData.selectedFeatures.includes(m.label);
                              const isLocked = isCompulsory || isLegacyRequired;
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
                                      <span style={{ fontWeight: 700 }}>{m.label}</span>
                                      <span className={styles.priceBadge}>{`+${priceInCurrency(m.priceINR, m.priceUSD)}`}</span>
                                    </div>
                                    <p style={{ margin: '3px 0 0 0', fontSize: '11px', opacity: 0.7, lineHeight: 1.4 }}>{m.laymanDescription}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
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
                    <label className={styles.label}>Design System &amp; Content Readiness Tier</label>
                    <p className={styles.fieldHint}>Select your current design and brand collateral status. This determines whether design system assets or copywriting support is added to your baseline build.</p>
                    <div className={styles.checkboxGrid} role="radiogroup" aria-label="Design & Content Readiness">
                      {brandAssets.map((b) => {
                        const isSelected = formData.selectedBrandAssetId === b.id;
                        const mappedDesignReadiness = b.designReadiness || 'figma_ready';

                        return (
                          <label
                            key={b.id}
                            className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''}`}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                selectedBrandAssetId: b.id,
                                designReadiness: mappedDesignReadiness,
                              })
                            }
                            style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', padding: '14px 16px' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '13px' }}>{b.label}</span>
                              <span className={styles.itemPrice} style={{ fontSize: '11px', fontWeight: 700 }}>
                                {b.priceINR > 0 ? `+${formatPricePair(b.priceINR, b.priceUSD, currency)}` : 'Included in Base Engine'}
                              </span>
                            </div>
                            <p style={{ margin: '6px 0 0 0', fontSize: '11px', opacity: 0.8, lineHeight: 1.45 }}>{b.description}</p>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }} aria-live="polite" aria-atomic="true">
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
                                    aria-label="View Technical SLA Specs"
                                  >
                                    <Info size={12} />
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

                  <div className={styles.fieldGrid} style={{ marginTop: '12px' }}>
                    <div className={styles.field}>
                      <label className={styles.label}>Cloud Infrastructure Ownership</label>
                      <div className={styles.chipGrid} role="radiogroup" aria-label="Cloud Infrastructure Ownership">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={formData.hostingOwnership === 'client_owned'}
                          className={`${styles.chipCard} ${formData.hostingOwnership === 'client_owned' ? styles.chipCardActive : ''}`}
                          onClick={() => setFormData({ ...formData, hostingOwnership: 'client_owned' })}
                        >
                          🌐 Client-Owned Accounts
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={formData.hostingOwnership === 'needs_setup'}
                          className={`${styles.chipCard} ${formData.hostingOwnership === 'needs_setup' ? styles.chipCardActive : ''}`}
                          onClick={() => setFormData({ ...formData, hostingOwnership: 'needs_setup' })}
                        >
                          🛠️ Setup Support Required
                        </button>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label}>Tax &amp; Procurement Invoicing</label>
                      <div className={styles.chipGrid} role="radiogroup" aria-label="Tax Invoicing Preference">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={formData.taxInvoicingPreference === 'standard'}
                          className={`${styles.chipCard} ${formData.taxInvoicingPreference === 'standard' ? styles.chipCardActive : ''}`}
                          onClick={() => setFormData({ ...formData, taxInvoicingPreference: 'standard' })}
                        >
                          📄 Standard Digital Receipt
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={formData.taxInvoicingPreference === 'corporate_gst'}
                          className={`${styles.chipCard} ${formData.taxInvoicingPreference === 'corporate_gst' ? styles.chipCardActive : ''}`}
                          onClick={() => setFormData({ ...formData, taxInvoicingPreference: 'corporate_gst' })}
                        >
                          🏢 GST / Corporate Invoice Required
                        </button>
                      </div>
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

              {/* Live Persistent Arithmetic Bar */}
              <div className={styles.stickyBar} style={{ marginTop: '1.5rem' }}>
                <div className={styles.stickyLeft}>
                  <div className={styles.stickyTitleRow}>
                    <span className={styles.stickyTitle}>⚡ Live Pure Additive Arithmetic Formula</span>
                    <button
                      type="button"
                      className={styles.mobileFormulaToggle}
                      onClick={() => setShowMobileFormula(prev => !prev)}
                    >
                      {showMobileFormula ? 'Hide Formula' : 'Show Formula'}
                    </button>
                  </div>
                  <span className={`${styles.stickyBreakdown} ${showMobileFormula ? styles.stickyBreakdownMobileShow : ''}`}>
                    {`Base (${selectedEngine.title}: ${priceInCurrency(selectedEngine.priceINR, selectedEngine.priceUSD)})` +
                     ` + Add-ons (${priceInCurrency(totalCost.featuresINR, totalCost.featuresUSD)})` +
                     (totalCost.brandPriceINR > 0 ? ` + Brand Collateral (${priceInCurrency(totalCost.brandPriceINR, totalCost.brandPriceUSD)})` : '')}
                  </span>
                </div>
                <div className={styles.stickyTotal}>
                  {`Estimated Total: ${formatPricePair(totalCost.totalINR, totalCost.totalUSD, currency)}`}
                </div>
              </div>

              {/* Actions Footer */}
              <div className={styles.actions}>
                <div className={styles.leftActions}>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    title="Open Canva-grade PDF proposal preview"
                  >
                    <Download size={16} />
                    <span>OPEN PROPOSAL PDF</span>
                  </button>

                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (currentStep === 4 && shouldSkipBrandStep) {
                          setCurrentStep(2);
                        } else {
                          setCurrentStep(prev => prev - 1);
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
                          setCurrentStep(prev => prev + 1);
                        }
                      }}
                      className={`${styles.btn} ${styles.btnPrimary}`}
                    >
                      <span>NEXT STEP</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={submitting || !formData.agreedToTerms}
                        className={`${styles.btn} ${styles.btnPrimary} ${!formData.agreedToTerms ? styles.btnDisabled : ''}`}
                        title={!formData.agreedToTerms ? 'Accept commercial terms to submit' : 'Save scope & continue in client dashboard'}
                      >
                        {submitting ? 'SAVING SCOPE...' : '🚀 SAVE SCOPE & CONTINUE IN DASHBOARD'}
                        <Send size={16} />
                      </button>
                      <p className={styles.ctaSubtext}>
                        🔒 Instant setup via Google OAuth — your custom scope will be saved directly to your client dashboard.
                      </p>
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
                            window.grecaptcha.ready(() => setRecaptchaReady(true));
                          } else if (typeof document !== 'undefined' && SITE_KEY) {
                            const existing = document.getElementById('recaptcha-script');
                            if (existing) existing.remove();
                            const script = document.createElement('script');
                            script.id = 'recaptcha-script';
                            script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
                            script.async = true;
                            script.onerror = () => setRecaptchaUnavailable(true);
                            document.head.appendChild(script);
                          }
                        }}
                      >
                        ⚡ Retry reCAPTCHA Setup
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </>
      )}
    </div>
      </div>
    </section>
  );
}
