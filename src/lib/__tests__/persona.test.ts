import { describe, it, expect, beforeEach } from 'vitest';
import {
  classifyVisitorLocally,
  getSessionTelemetry,
  saveSessionTelemetry,
  isBannerDismissed,
  dismissBanner,
  type VisitorTelemetry,
} from '../persona';

describe('Visitor Persona Classifier & Telemetry (Milestone 85)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.clear();
    }
  });

  it('classifies high commercial intent as commercial_buyer', () => {
    const t: VisitorTelemetry = {
      commercialIntentRatio: 0.8,
      credibilityIntentRatio: 0.1,
      productIntentRatio: 0.05,
      contentIntentRatio: 0.05,
      dwellTimeSeconds: 120,
      interactionDepthScore: 0.7,
    };
    const reco = classifyVisitorLocally(t);
    expect(reco.personaCategory).toBe('commercial_buyer');
    expect(reco.ctaHref).toBe('/scoping');
    expect(reco.badgeLabel).toContain('Enterprise Client');
  });

  it('classifies high credibility intent as talent_recruiter', () => {
    const t: VisitorTelemetry = {
      commercialIntentRatio: 0.05,
      credibilityIntentRatio: 0.85,
      productIntentRatio: 0.05,
      contentIntentRatio: 0.05,
      dwellTimeSeconds: 90,
      interactionDepthScore: 0.5,
    };
    const reco = classifyVisitorLocally(t);
    expect(reco.personaCategory).toBe('talent_recruiter');
    expect(reco.isPdfDownload).toBe(true);
    expect(reco.badgeLabel).toContain('Technical Recruiter');
  });

  it('classifies high product/sandbox intent as technical_evaluator', () => {
    const t: VisitorTelemetry = {
      commercialIntentRatio: 0.1,
      credibilityIntentRatio: 0.1,
      productIntentRatio: 0.75,
      contentIntentRatio: 0.05,
      dwellTimeSeconds: 200,
      interactionDepthScore: 0.8,
    };
    const reco = classifyVisitorLocally(t);
    expect(reco.personaCategory).toBe('technical_evaluator');
    expect(reco.ctaHref).toBe('/rag');
    expect(reco.badgeLabel).toContain('AI Platform Evaluator');
  });

  it('classifies high content/reading intent as community_peer', () => {
    const t: VisitorTelemetry = {
      commercialIntentRatio: 0.05,
      credibilityIntentRatio: 0.05,
      productIntentRatio: 0.1,
      contentIntentRatio: 0.8,
      dwellTimeSeconds: 60,
      interactionDepthScore: 0.3,
    };
    const reco = classifyVisitorLocally(t);
    expect(reco.personaCategory).toBe('community_peer');
    expect(reco.ctaHref).toBe('/terminal');
    expect(reco.badgeLabel).toContain('Peer Developer');
  });

  it('handles telemetry storage roundtrip safely', () => {
    const t: VisitorTelemetry = {
      commercialIntentRatio: 0.3,
      credibilityIntentRatio: 0.3,
      productIntentRatio: 0.2,
      contentIntentRatio: 0.2,
      dwellTimeSeconds: 45,
      interactionDepthScore: 0.5,
    };
    saveSessionTelemetry(t);
    const read = getSessionTelemetry();
    expect(read.dwellTimeSeconds).toBe(45);
    expect(read.commercialIntentRatio).toBe(0.3);
  });

  it('persists dismissal state in session storage', () => {
    expect(isBannerDismissed()).toBe(false);
    dismissBanner();
    expect(isBannerDismissed()).toBe(true);
  });
});
