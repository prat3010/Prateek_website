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

export interface IntakeConfig {
  title: string;
  subtitle: string;
  categories: string[];
  featureOptions: string[];
  budgetTiers: string[];
  timelineOptions: string[];
  assetOptions: string[];
  termsAndConditions: string[];
  middlemanAgreement?: MiddlemanAgreementConfig;
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
