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

export interface PricingPlan {
  title: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
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
    hourlyRate: string;
    dayRate: string;
    paymentTerms: string;
    deliverables: string[];
  };
  about?: AboutData;
  pricing?: {
    developer: PricingPlan[];
    business: PricingPlan[];
  };
  lastSynced?: {
    timestamp: string;
    status: 'success' | 'failed';
    summary: string;
  };
}
