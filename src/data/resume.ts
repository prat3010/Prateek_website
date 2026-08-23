export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: {
    general: string;
    fullstack?: string;
    ai?: string;
    creative?: string;
  }[];
  tags: string[];
}

export interface Education {
  school: string;
  degree: string;
  period: string;
  location: string;
}

export interface AboutData {
  developer: {
    light: string;
    noir: string;
    facts: string[];
    factsNoir: string[];
  };
  business: {
    light: string;
    noir: string;
    facts: string[];
    factsNoir: string[];
  };
}

export interface MiddlemanAgreementConfig {
  partnerName: string;
  partnerEmail?: string;
  effectiveDate: string;
  developerName: string;
  developerEmail: string;
  tier1Commission: string;
  tier2Commission: string;
  tier3Commission: string;
  recurringCommission: string;
  agreedElectronically?: string;
  disbursementRules: string[];
  confidentialityRules: string[];
  sections?: {
    key: string;
    heading: string;
    lines: string[];
  }[];
}

export interface BaseEngineItem {
  id: string;
  title: string;
  tier: string;
  priceINR: number;
  priceUSD: number;
  laymanDescription: string;
  techSpecs: string;
  /** Goal ID whose bundled price should replace the raw engine price in the Resume tier grid. */
  bundledPriceGoalId?: string;
  /** If true, this engine is hidden from the Full Project engine selector (used for Quick Service infrastructure). */
  hideFromFullProject?: boolean;
}

export interface FeatureItem {
  id: string;
  label: string;
  priceINR: number;
  priceUSD: number;
  laymanDescription: string;
  techSpecs: string;
  /** Feature ids that must be selected whenever this module is selected. */
  dependsOn?: string[];
  /** If true, auto-include this feature when project start type is 'legacy_rebuild'. */
  autoIncludeOnLegacy?: boolean;
  /** Maintenance plan ID to auto-recommend when this feature is selected. */
  recommendedMaintenanceId?: string;
}

export interface GoalArchetype {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  recommendedEngineId: string;
  compulsoryFeatureLabels: string[];
  /** Primary business outcome auto-derived for this archetype when generating scoping proposals. */
  primaryOutcome?: string;
  /** If true, skip Step 3 (Brand Assets) for this archetype — used for standalone widgets/services. */
  skipBrandAssets?: boolean;
}

export interface BrandAssetOption {
  id: string;
  label: string;
  priceINR: number;
  priceUSD: number;
  description: string;
  /** Design readiness value mapped from this brand tier (e.g. 'concept_only', 'wireframes_ready', 'figma_ready'). */
  designReadiness?: string;
}

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
  /** Response-time SLA commitment (e.g. "within 2 business days"). */
  responseTime?: string;
  /** Included monthly developer hours allocation. */
  includedHours?: string;
  /** Overage, rollover, and third-party billing rules. */
  overageRules?: string;
}

/** Quick service offered as a standalone micro-engagement (Step 0 → Quick flow). */
export interface QuickServiceItem {
  id: string;
  label: string;
  laymanDescription: string;
  techSpecs: string;
  priceINR: number;
  priceUSD: number;
  turnaround: string;
  category: string;
}

export interface IntakeConfig {
  title: string;
  subtitle: string;
  categories: string[];
  featureOptions: string[];
  timelineOptions: string[];
  assetOptions: string[];
  termsAndConditions: string[];
  middlemanAgreement?: MiddlemanAgreementConfig;
  engines?: BaseEngineItem[];
  features?: FeatureItem[];
  goals?: GoalArchetype[];
  brandAssets?: BrandAssetOption[];
  maintenancePlans?: MaintenancePlanOption[];
  quickServices?: QuickServiceItem[];
}

export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  twitter?: string;
  instagram?: string;
  summary: {
    general: string;
    fullstack: string;
    ai: string;
    creative: string;
  };
  experience: WorkExperience[];
  education: Education[];
  quotation?: {
    scopeModel?: string;
    deliverySprint?: string;
    warrantyModel?: string;
    hourlyRate?: string;
    dayRate?: string;
    paymentTerms: string;
    deliverables: string[];
  };
  quotation_india?: {
    scopeModel?: string;
    deliverySprint?: string;
    warrantyModel?: string;
    hourlyRate?: string;
    dayRate?: string;
    paymentTerms: string;
    deliverables: string[];
  };
  about?: AboutData;
  intake?: IntakeConfig;
  lastSynced?: {
    timestamp: string;
    status: 'success' | 'failed';
    summary: string;
  };
}
