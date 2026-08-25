import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import type {
  GoalArchetype,
  BaseEngineItem,
  BrandAssetOption,
  MaintenancePlanOption,
  FeatureItem,
  QuickServiceItem,
  ResumeData,
} from '@/data/resume';
import {
  calcQuote,
  calcQuickServiceQuote,
  resolveDefaultCurrency,
  resolveFeatureDependencies,
  type Currency,
} from '@/lib/pricing';
import type { ParseIntentResponse } from '@/lib/rag-client';
import { generateQuestionnairePDF, generateQuestionnairePDFBase64 } from '@/utils/pdfGenerator';
import { useAuth } from '@/context/AuthContext';
import { signInWithGoogle } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export interface IntakePreset {
  goalId?: string;
  engineId?: string;
  serviceType?: 'full' | 'quick' | 'care';
  quickServiceId?: string;
  featureIds?: string[];
  brandId?: string;
  careId?: string;
  currency?: 'INR' | 'USD';
}

export interface IntakeFormData {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  projectGoal: string;
  businessKPI: string;
  projectStartType: 'greenfield' | 'legacy_rebuild';
  designReadiness: 'figma_ready' | 'needs_design_system' | 'needs_copywriting';
  hostingOwnership: 'client_owned' | 'needs_setup';
  taxInvoicingPreference: 'standard' | 'corporate_gst';
  targetAudience: string;
  selectedBaseEngineId: string;
  selectedFeatures: string[];
  selectedBrandAssetId: string;
  selectedMaintenanceId: string;
  timeline: string;
  additionalNotes: string;
  agreedToTerms: boolean;
}

export function useIntakeFormState(
  resumeData: ResumeData | null,
  initialPreset: IntakePreset | null,
  user: User | null,
  isNoir: boolean
) {
  const { getAccessToken } = useAuth();
  const intakeConfig = resumeData?.intake;

  const goals = useMemo(() => {
    return intakeConfig?.goals?.length ? intakeConfig.goals : [];
  }, [intakeConfig]);

  const engines = useMemo(() => {
    return intakeConfig?.engines?.length ? intakeConfig.engines : [];
  }, [intakeConfig]);

  const features = useMemo(() => {
    return intakeConfig?.features?.length ? intakeConfig.features : [];
  }, [intakeConfig]);

  const brandAssets = useMemo(() => {
    return intakeConfig?.brandAssets?.length ? intakeConfig.brandAssets : [];
  }, [intakeConfig]);

  const maintenancePlans = useMemo(() => {
    return intakeConfig?.maintenancePlans?.length ? intakeConfig.maintenancePlans : [];
  }, [intakeConfig]);

  const quickServices = useMemo(() => {
    return intakeConfig?.quickServices?.length ? intakeConfig.quickServices : [];
  }, [intakeConfig]);

  const initialGoal = useMemo(() => {
    if (initialPreset?.goalId) {
      return goals.find((g: GoalArchetype) => g.id === initialPreset.goalId) || null;
    }
    return null;
  }, [initialPreset, goals]);

  const initialEngine = useMemo(() => {
    if (initialPreset?.engineId) {
      return engines.find((e: BaseEngineItem) => e.id === initialPreset.engineId) || null;
    }
    return null;
  }, [initialPreset, engines]);

  const initialArchetype = useMemo(() => initialGoal || goals[0] || {
    id: 'business_multipage',
    label: 'Multi-Page Business Website',
    description: 'Corporate platform with CMS and analytics.',
    recommendedEngineId: 'engine_multipage',
    compulsoryFeatureLabels: ['Admin CMS Center'],
    primaryOutcome: 'Increase inbound conversion',
  }, [initialGoal, goals]);

  const initialEngineObj = initialEngine || engines.find((e: BaseEngineItem) => e.id === initialArchetype.recommendedEngineId) || engines[0];

  /** Resolve a feature label to its ID. */
  const labelToId = useCallback((label: string) => {
    return features.find((f: FeatureItem) => f.label === label)?.id;
  }, [features]);

  /** Resolve compulsory labels → IDs, merge with any deep-link preset IDs. */
  const initialFeatureIds = useMemo(() => {
    const compulsoryIds = initialArchetype.compulsoryFeatureLabels
      .map((label: string) => features.find((f: FeatureItem) => f.label === label)?.id)
      .filter(Boolean) as string[];

    if (initialPreset?.featureIds && initialPreset.featureIds.length > 0) {
      const merged = new Set([...initialPreset.featureIds, ...compulsoryIds]);
      return Array.from(merged);
    }
    return compulsoryIds;
  }, [initialPreset, features, initialArchetype]);

  const [currentStep, setCurrentStep] = useState(() => (initialPreset?.serviceType === 'care' ? 4 : 1));
  const [serviceType, setServiceType] = useState<'full' | 'quick' | 'care' | null>(() =>
    initialPreset?.serviceType === 'care' ? 'full' : initialPreset?.serviceType || null
  );
  const [currency, setCurrency] = useState<Currency>(() => initialPreset?.currency || resolveDefaultCurrency(null));
  const [selectedQuickServices, setSelectedQuickServices] = useState<string[]>(() =>
    initialPreset?.quickServiceId ? [initialPreset.quickServiceId] : []
  );
  const [quickStep, setQuickStep] = useState(initialPreset?.quickServiceId ? 2 : 1);
  const [quickFormData, setQuickFormData] = useState({ companyName: '', siteUrl: '', additionalNotes: '', agreedToTerms: false });
  const [selectedGoalCategory, setSelectedGoalCategory] = useState<'all' | 'websites' | 'saas' | 'ai_widgets'>('all');
  const [selectedQuickCategory, setSelectedQuickCategory] = useState<'all' | 'ai' | 'integration' | 'performance'>('all');
  const [showEngineOverride, setShowEngineOverride] = useState(false);
  const [showMobileFormula, setShowMobileFormula] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<{ x: number; y: number } | null>(null);
  const [lockedHintId, setLockedHintId] = useState<string | null>(null);
  const [recaptchaUnavailable, setRecaptchaUnavailable] = useState(false);

  const [sessionSeed] = useState(() => Math.random().toString(36).slice(2, 8));

  const [formData, setFormData] = useState<IntakeFormData>(() => ({
    companyName: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    projectGoal: initialArchetype.label,
    businessKPI: initialArchetype.primaryOutcome || initialArchetype.description,
    projectStartType: 'greenfield',
    designReadiness: 'figma_ready',
    hostingOwnership: 'client_owned',
    taxInvoicingPreference: 'standard',
    targetAudience: '',
    selectedBaseEngineId: initialEngineObj.id,
    selectedFeatures: initialFeatureIds,
    selectedBrandAssetId: initialPreset?.brandId || brandAssets[0]?.id || 'ready',
    selectedMaintenanceId: initialPreset?.careId || maintenancePlans[0]?.id || 'growth',
    timeline: 'Standard (3–4 weeks)',
    additionalNotes: '',
    agreedToTerms: false,
  }));

  const triggerLockedHint = useCallback((id: string) => {
    setLockedHintId(id);
    setTimeout(() => {
      setLockedHintId((prev) => (prev === id ? null : prev));
    }, 2800);
  }, []);

  // Auto-close popovers on window scroll (Issue 4.2)
  useEffect(() => {
    if (!activePopoverId) return;
    const handleScroll = () => {
      setActivePopoverId(null);
      setPopoverAnchor(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activePopoverId]);

  const currentArchetype = useMemo(() => {
    return goals.find((g: GoalArchetype) => g.label === formData.projectGoal || g.id === formData.projectGoal) || initialArchetype;
  }, [goals, formData.projectGoal, initialArchetype]);

  const selectedEngine = useMemo(() => {
    return engines.find((e: BaseEngineItem) => e.id === formData.selectedBaseEngineId) || initialEngineObj;
  }, [engines, formData.selectedBaseEngineId, initialEngineObj]);

  const shouldSkipBrandStep = useMemo(() => {
    return currentArchetype?.skipBrandAssets ?? false;
  }, [currentArchetype]);

  const autoMaintenancePlanId = useMemo(() => {
    if (selectedEngine.id === 'engine_saas' || selectedEngine.id === 'engine_ai_saas') return 'scale';
    if (selectedEngine.id === 'engine_multipage' || selectedEngine.id === 'engine_ecommerce') return 'growth';
    return 'essential';
  }, [selectedEngine]);

  const activeMaintenancePlan = useMemo(() => {
    const targetId = formData.selectedMaintenanceId || autoMaintenancePlanId;
    return maintenancePlans.find((p: MaintenancePlanOption) => p.id === targetId) || maintenancePlans[1];
  }, [formData.selectedMaintenanceId, autoMaintenancePlanId, maintenancePlans]);

  const totalCost = useMemo(() => {
    const brandOpt = brandAssets.find((b: BrandAssetOption) => b.id === formData.selectedBrandAssetId) || brandAssets[0] || { label: 'Included', priceINR: 0, priceUSD: 0 };
    const featureObjs = features.filter((f: FeatureItem) => formData.selectedFeatures.includes(f.id));
    const featureIds = featureObjs.map((f: FeatureItem) => f.id);

    const quote = calcQuote(
      engines,
      features,
      brandAssets,
      maintenancePlans,
      {
        engineId: selectedEngine.id,
        featureIds,
        brandAssetId: formData.selectedBrandAssetId,
        maintenancePlanId: formData.selectedMaintenanceId || autoMaintenancePlanId,
      },
      currency
    );

    return {
      ...quote,
      featuresINR: quote.featuresPriceINR,
      featuresUSD: quote.featuresPriceUSD,
      brandOpt: {
        label: quote.brandAsset?.label || brandOpt?.label || 'Included',
        priceINR: quote.brandPriceINR,
        priceUSD: quote.brandPriceUSD,
      },
    };
  }, [engines, features, brandAssets, maintenancePlans, selectedEngine.id, formData.selectedFeatures, formData.selectedBrandAssetId, formData.selectedMaintenanceId, autoMaintenancePlanId, currency]);

  const quickQuote = useMemo(() => {
    return calcQuickServiceQuote(quickServices, selectedQuickServices, currency);
  }, [quickServices, selectedQuickServices, currency]);

  const generatedScopeCode = useMemo(() => {
    let hash = 0;
    const key = `${sessionSeed}-${formData.companyName}-${formData.projectGoal}-${formData.selectedBaseEngineId}-${formData.selectedFeatures.join(',')}`;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash) % 90000 + 10000;
    return `SCOPE-${positiveHash}`;
  }, [sessionSeed, formData.companyName, formData.projectGoal, formData.selectedBaseEngineId, formData.selectedFeatures]);

  const buildQuestionnaireData = useCallback(() => {
    return {
      companyName: formData.companyName || 'My Custom Project',
      projectGoal: formData.projectGoal,
      selectedBaseEngineId: formData.selectedBaseEngineId,
      baseEngineTitle: selectedEngine.title,
      baseEnginePriceINR: selectedEngine.priceINR,
      baseEnginePriceUSD: selectedEngine.priceUSD,
      selectedFeatures: features
        .filter((f: FeatureItem) => formData.selectedFeatures.includes(f.id))
        .map((f: FeatureItem) => f.label),
      brandAssetOption: totalCost.brandOpt.label,
      brandAssetPriceINR: totalCost.brandOpt.priceINR,
      brandAssetPriceUSD: totalCost.brandOpt.priceUSD,
      maintenancePlan: activeMaintenancePlan.name,
      maintenancePriceINR: activeMaintenancePlan.priceINR,
      maintenancePriceUSD: activeMaintenancePlan.priceUSD,
      totalCostINR: totalCost.totalINR,
      totalCostUSD: totalCost.totalUSD,
      timeline: formData.timeline,
      additionalNotes: [
        formData.contactEmail ? `[Contact Email: ${formData.contactEmail}]` : '',
        formData.contactPhone ? `[Contact Phone: ${formData.contactPhone}]` : '',
        formData.targetAudience ? `[Target Audience: ${formData.targetAudience}]` : '',
        formData.businessKPI ? `[Target KPI: ${formData.businessKPI}]` : '',
        formData.projectStartType === 'legacy_rebuild' ? '[Context: Legacy Rebuild]' : '',
        formData.hostingOwnership === 'needs_setup' ? '[Cloud Setup Requested]' : '',
        formData.taxInvoicingPreference === 'corporate_gst' ? '[GST/Corporate Invoicing Required]' : '',
        formData.additionalNotes,
      ].filter(Boolean).join(' | '),
    };
  }, [formData, selectedEngine, totalCost, activeMaintenancePlan, features]);

  const handleDownloadPDF = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      await generateQuestionnairePDF(resumeData, buildQuestionnaireData(), isNoir, currency);
      try {
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
      } catch {}
      toast.success('Commercial Proposal Generated!', {
        description: 'Your custom scoping brief PDF is ready and downloading.',
      });
    } catch (pdfErr) {
      console.warn('PDF generation warning:', pdfErr);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  }, [resumeData, buildQuestionnaireData, isNoir, currency]);

  const buildQuickServiceData = useCallback(() => {
    const selectedServiceObjs = quickServices.filter((s: QuickServiceItem) => selectedQuickServices.includes(s.id));
    const serviceLabels = selectedServiceObjs.map((s: QuickServiceItem) => s.label);
    const quote = calcQuickServiceQuote(quickServices, selectedQuickServices, currency);
    return {
      companyName: quickFormData.companyName.trim() || 'Quick Service Order',
      projectGoal: 'Quick Service Integration',
      selectedBaseEngineId: 'quick_service',
      baseEngineTitle: `Quick Service: ${serviceLabels.join(', ') || 'Custom Tasks'}`,
      baseEnginePriceINR: 0,
      baseEnginePriceUSD: 0,
      selectedFeatures: serviceLabels,
      brandAssetOption: 'Not Applicable (Existing Site)',
      brandAssetPriceINR: 0,
      brandAssetPriceUSD: 0,
      maintenancePlan: 'Self-Managed (30-Day Warranty)',
      maintenancePriceINR: 0,
      maintenancePriceUSD: 0,
      totalCostINR: quote.totalINR,
      totalCostUSD: quote.totalUSD,
      timeline: selectedServiceObjs[0]?.turnaround || '3–7 days',
      additionalNotes: [
        quickFormData.siteUrl ? `[Site URL: ${quickFormData.siteUrl}]` : '',
        quickFormData.additionalNotes,
      ].filter(Boolean).join(' | '),
    };
  }, [quickServices, selectedQuickServices, quickFormData, currency]);

  const handleDownloadQuickPDF = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      await generateQuestionnairePDF(resumeData, buildQuickServiceData(), isNoir, currency);
      try {
        confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
      } catch {}
      toast.success('Commercial Proposal Generated!', {
        description: 'Your quick service proposal PDF is ready and downloading.',
      });
    } catch (pdfErr) {
      console.warn('Quick PDF generation warning:', pdfErr);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  }, [resumeData, buildQuickServiceData, isNoir, currency]);

  const handleCopyShareableUrl = useCallback(() => {
    if (typeof window === 'undefined') return;
    const selectedGoalObj = goals.find((g: GoalArchetype) => g.label === formData.projectGoal || g.id === formData.projectGoal);

    const params = new URLSearchParams();
    params.set('type', serviceType || 'full');
    if (formData.selectedBaseEngineId) params.set('engine', formData.selectedBaseEngineId);
    if (selectedGoalObj) params.set('goal', selectedGoalObj.id);
    if (formData.selectedFeatures.length > 0) params.set('features', formData.selectedFeatures.join(','));
    if (formData.selectedBrandAssetId) params.set('brand', formData.selectedBrandAssetId);
    if (formData.selectedMaintenanceId) params.set('care', formData.selectedMaintenanceId);
    params.set('currency', currency);

    const shareableUrl = `${window.location.origin}/scoping?${params.toString()}`;
    navigator.clipboard.writeText(shareableUrl);
    toast.success('Shareable Custom Quote URL copied!', {
      description: 'Anyone with this link can view and load your exact configuration.',
    });
  }, [goals, formData, serviceType, currency]);

  const togglePopover = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activePopoverId === id) {
      setActivePopoverId(null);
      setPopoverAnchor(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setActivePopoverId(id);
      setPopoverAnchor({ x: rect.left, y: rect.bottom + 6 });
    }
  }, [activePopoverId]);

  const handleGoalChange = useCallback((newGoalLabel: string) => {
    const archetype = goals.find((g: GoalArchetype) => g.label === newGoalLabel || g.id === newGoalLabel) || goals[0];
    const newEngineId = archetype.recommendedEngineId;
    const autoOutcome = archetype.primaryOutcome || archetype.description;

    const formerCompulsoryIds = new Set(
      currentArchetype.compulsoryFeatureLabels
        .map((label: string) => labelToId(label))
        .filter(Boolean) as string[]
    );
    const newCompulsoryIds = new Set(
      archetype.compulsoryFeatureLabels
        .map((label: string) => labelToId(label))
        .filter(Boolean) as string[]
    );
    const toRemove = Array.from(formerCompulsoryIds).filter((id) => !newCompulsoryIds.has(id));

    setFormData((prev: IntakeFormData) => {
      const cleanedIds = prev.selectedFeatures.filter((id) => !toRemove.includes(id));
      const mergedIds = new Set([...cleanedIds, ...Array.from(newCompulsoryIds)]);
      const extraIds = resolveFeatureDependencies(Array.from(mergedIds), features);
      extraIds.forEach((id: string) => mergedIds.add(id));

      return {
        ...prev,
        projectGoal: newGoalLabel,
        businessKPI: autoOutcome,
        selectedBaseEngineId: newEngineId,
        selectedFeatures: Array.from(mergedIds),
        selectedBrandAssetId: archetype.skipBrandAssets ? brandAssets[0]?.id || 'ready' : prev.selectedBrandAssetId,
      };
    });
  }, [goals, currentArchetype, features, brandAssets, labelToId]);

  const applyBlueprint = useCallback((blueprint: ParseIntentResponse) => {
    const matchedGoal = goals.find((g: GoalArchetype) => g.id === blueprint.archetypeId) ||
                        goals.find((g: GoalArchetype) => g.label === blueprint.archetypeId) ||
                        goals[0];

    if (matchedGoal) {
      const websites = ['landing_page', 'business_multipage', 'ecommerce', 'booking_appointments'];
      const saas = ['saas_app', 'lms_portal', 'crm_admin'];
      const aiWidgets = ['ai_rag_app', 'autonomous_agents', 'voice_ai_agent_app', 'vision_ocr_saas', 'standalone_voice_bot', 'standalone_chatbot', 'ai_strategy_consulting', 'custom'];

      if (websites.includes(matchedGoal.id)) setSelectedGoalCategory('websites');
      else if (saas.includes(matchedGoal.id)) setSelectedGoalCategory('saas');
      else if (aiWidgets.includes(matchedGoal.id)) setSelectedGoalCategory('ai_widgets');
      else setSelectedGoalCategory('all');
    }

    const resolvedFeatureIds = resolveFeatureDependencies(blueprint.featureIds, features);
    const autoOutcome = matchedGoal?.primaryOutcome || matchedGoal?.description || '';

    setFormData((prev: IntakeFormData) => ({
      ...prev,
      projectGoal: matchedGoal?.label || prev.projectGoal,
      businessKPI: autoOutcome || prev.businessKPI,
      selectedBaseEngineId: blueprint.baseEngineId || prev.selectedBaseEngineId,
      selectedFeatures: resolvedFeatureIds,
      selectedBrandAssetId: blueprint.brandAssetId || prev.selectedBrandAssetId,
      selectedMaintenanceId: blueprint.maintenancePlanId || prev.selectedMaintenanceId,
      timeline: blueprint.suggestedTimeline || prev.timeline,
    }));
  }, [goals, features]);

  const handleSubmitOnline = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreedToTerms) {
      setErrorMsg('Please accept the standard commercial terms before submitting.');
      return;
    }

    if (!formData.targetAudience || formData.targetAudience.trim().length < 2) {
      setErrorMsg('Please specify a target audience persona or industry in Step 1 before submitting.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user && formData.contactEmail && !emailRegex.test(formData.contactEmail.trim())) {
      setErrorMsg('Please enter a valid contact email address (e.g., founder@company.com).');
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
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
        selectedFeatures: features
          .filter((f: FeatureItem) => formData.selectedFeatures.includes(f.id))
          .map((f: FeatureItem) => f.label),
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

      try {
        await fetch('/api/client/intake-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scopePayload),
        });
      } catch (draftErr) {
        console.warn('Intake draft API warning:', draftErr);
      }

      let recaptchaToken: string | undefined;
      if (SITE_KEY && typeof window !== 'undefined' && window.grecaptcha && !recaptchaUnavailable) {
        try {
          recaptchaToken = await new Promise<string>((resolve) => {
            window.grecaptcha!.ready(() => {
              window.grecaptcha!.execute(SITE_KEY, { action: 'submit_scope' })
                .then((token) => resolve(token))
                .catch(() => resolve(''));
            });
          });
        } catch (rcErr) {
          console.warn('reCAPTCHA execution warning:', rcErr);
        }
      }

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
          email: user?.email || formData.contactEmail || 'lead@unauthenticated.client',
          message: `[Interactive Scoping Brief Created — ${generatedScopeCode}]`,
          recaptchaToken,
          attachmentBase64: pdfBase64,
          attachmentFileName: `${generatedScopeCode}-Scoping-Brief.pdf`,
        }),
      }).catch((err) => console.warn('Background contact notify warning:', err));

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
          toast.warning('Scope saved locally but cloud sync failed. It will be retried when you visit the dashboard.');
        }
      }

      if (typeof window !== 'undefined') {
        try { localStorage.removeItem('prateeq_scoping_draft'); } catch {}
      }

      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      } catch {}
      toast.success('Scope Saved!', {
        description: 'Preparing your client workspace environment...',
      });

      setSubmitted(true);

      setTimeout(() => {
        if (user?.email) {
          window.location.href = '/dashboard?imported=true';
        } else {
          signInWithGoogle('/dashboard?imported=true');
        }
      }, 5000);
    } catch (err: unknown) {
      console.error('Intake form submission error:', err);
      setErrorMsg('Something went wrong during submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [formData, user, generatedScopeCode, selectedEngine, totalCost, activeMaintenancePlan, currency, recaptchaUnavailable, resumeData, buildQuestionnaireData, isNoir, getAccessToken, features]);

  const handleQuickSubmit = useCallback(async () => {
    if (!quickFormData.agreedToTerms || selectedQuickServices.length === 0) return;
    setSubmitting(true);
    try {
      const quote = calcQuickServiceQuote(quickServices, selectedQuickServices, currency);
      const selectedServiceObjs = quickServices.filter((s: QuickServiceItem) => selectedQuickServices.includes(s.id));
      const serviceLabels = selectedServiceObjs.map((s: QuickServiceItem) => s.label);

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

      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
      } catch {}
      toast.success('Quick Service Scope Saved!', {
        description: 'Preparing your client workspace environment...',
      });

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
          toast.warning('Scope saved locally but cloud sync failed. It will be retried when you visit the dashboard.');
        }
        window.location.href = '/dashboard?imported=true';
        return;
      }

      await signInWithGoogle('/dashboard?imported=true');
    } catch (err: unknown) {
      console.error('Quick service submit error:', err);
      setErrorMsg('Something went wrong during submission. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [quickFormData, selectedQuickServices, quickServices, currency, generatedScopeCode, user, getAccessToken]);

  return {
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
    setSubmitted,
    submitting,
    generatingPdf,
    errorMsg,
    setErrorMsg,
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
    activeMaintenancePlan,
    totalCost,
    quickQuote,
    generatedScopeCode,
    buildQuestionnaireData,
    buildQuickServiceData,
    handleDownloadPDF,
    handleDownloadQuickPDF,
    handleCopyShareableUrl,
    togglePopover,
    handleGoalChange,
    applyBlueprint,
    handleSubmitOnline,
    handleQuickSubmit,
  };
}
