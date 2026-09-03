/**
 * Zero-Cookie Session Telemetry & Visitor Persona Intelligence (Milestone 85).
 * 100% GDPR-compliant in-memory / sessionStorage behavioral clustering.
 */

export type PersonaCategory = 'commercial_buyer' | 'technical_evaluator' | 'talent_recruiter' | 'community_peer';

export interface VisitorTelemetry {
  commercialIntentRatio: number;
  credibilityIntentRatio: number;
  productIntentRatio: number;
  contentIntentRatio: number;
  dwellTimeSeconds: number;
  interactionDepthScore: number;
}

export interface PersonaRecommendation {
  personaCategory: PersonaCategory;
  confidenceScore: number;
  recommendedAction: string;
  badgeLabel: string;
  headline: string;
  ctaText: string;
  ctaHref: string;
  isPdfDownload?: boolean;
  isFallback?: boolean;
}

const STORAGE_KEY_TELEMETRY = 'prateeq_session_telemetry_v1';
const STORAGE_KEY_DISMISSED = 'prateeq_persona_banner_dismissed_v1';

/**
 * Local deterministic heuristic classifier ensuring 100% offline availability
 * matching the KMeans cluster centers in Retriever Cognitive Core.
 */
export function classifyVisitorLocally(t: VisitorTelemetry): PersonaRecommendation {
  const comm = t.commercialIntentRatio;
  const cred = t.credibilityIntentRatio;
  const prod = t.productIntentRatio;
  const cont = t.contentIntentRatio;

  if (cred >= comm && cred >= prod && cred >= cont && cred >= 0.25) {
    return {
      personaCategory: 'talent_recruiter',
      confidenceScore: Math.min(0.95, 0.70 + cred * 0.25),
      recommendedAction: 'Elevate 1-Page Systems Architect Resume PDF export',
      badgeLabel: 'Technical Recruiter Signal',
      headline: 'Reviewing systems experience & competencies?',
      ctaText: 'Download 1-Page Resume (PDF)',
      ctaHref: '/api/resume/download',
      isPdfDownload: true,
      isFallback: true,
    };
  }

  if (comm >= cred && comm >= prod && comm >= cont && comm >= 0.25) {
    return {
      personaCategory: 'commercial_buyer',
      confidenceScore: Math.min(0.95, 0.70 + comm * 0.25),
      recommendedAction: 'Present Interactive Scoping Lab & instant quote',
      badgeLabel: 'Enterprise Client Signal',
      headline: 'Planning a high-scale platform or AI project?',
      ctaText: 'Launch Scoping Lab & SOW',
      ctaHref: '/scoping',
      isFallback: true,
    };
  }

  if (prod >= comm && prod >= cred && prod >= cont && prod >= 0.25) {
    return {
      personaCategory: 'technical_evaluator',
      confidenceScore: Math.min(0.95, 0.70 + prod * 0.25),
      recommendedAction: 'Highlight live Retriever RAG sandbox & 7-day trial',
      badgeLabel: 'AI Platform Evaluator',
      headline: 'Evaluating cognitive RAG & vector memory architecture?',
      ctaText: 'Test Live RAG Sandbox',
      ctaHref: '/rag',
      isFallback: true,
    };
  }

  // Default to community peer / developer
  return {
    personaCategory: 'community_peer',
    confidenceScore: Math.min(0.90, 0.65 + cont * 0.20),
    recommendedAction: 'Surface open-source architecture & interactive terminal',
    badgeLabel: 'Peer Developer Signal',
    headline: 'Exploring systems code & architecture specs?',
    ctaText: 'Open Interactive Terminal',
    ctaHref: '/terminal',
    isFallback: true,
  };
}

/**
 * Retrieve current session telemetry from sessionStorage safely.
 */
export function getSessionTelemetry(): VisitorTelemetry {
  if (typeof window === 'undefined') {
    return {
      commercialIntentRatio: 0,
      credibilityIntentRatio: 0,
      productIntentRatio: 0,
      contentIntentRatio: 0,
      dwellTimeSeconds: 0,
      interactionDepthScore: 0,
    };
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY_TELEMETRY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse errors
  }

  return {
    commercialIntentRatio: 0.1,
    credibilityIntentRatio: 0.2,
    productIntentRatio: 0.4,
    contentIntentRatio: 0.3,
    dwellTimeSeconds: 5,
    interactionDepthScore: 0.1,
  };
}

/**
 * Save updated session telemetry to sessionStorage.
 */
export function saveSessionTelemetry(telemetry: VisitorTelemetry): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY_TELEMETRY, JSON.stringify(telemetry));
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Check if the visitor dismissed the persona adaptive banner in this session.
 */
export function isBannerDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY_DISMISSED) === 'true';
  } catch {
    return false;
  }
}

/**
 * Persist dismissal flag in sessionStorage.
 */
export function dismissBanner(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY_DISMISSED, 'true');
  } catch {
    // Ignore storage write errors
  }
}
