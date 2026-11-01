import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepTechnicalScope } from '../StepTechnicalScope';
import type { BaseEngineItem, FeatureItem, GoalArchetype } from '@/data/resume';

const mockEngine: BaseEngineItem = {
  id: 'saas',
  title: 'Full-Stack SaaS Core',
  tier: 'Growth Tier',
  priceINR: 120000,
  priceUSD: 1500,
  laymanDescription: 'SaaS foundation engine',
  techSpecs: 'Next.js 16, Supabase',
};

const mockArchetype: GoalArchetype = {
  id: 'saas_app',
  label: '🚀 B2B SaaS Application',
  shortLabel: 'SaaS App',
  description: 'Multi-tenant SaaS',
  primaryOutcome: 'Subscription MRR',
  recommendedEngineId: 'saas',
  compulsoryFeatureLabels: ['User Authentication & RBAC'],
};

const mockFeatures: FeatureItem[] = [
  { id: 'auth', label: 'User Authentication & RBAC', priceINR: 20000, priceUSD: 250, laymanDescription: 'Auth', techSpecs: 'NextAuth' },
  { id: 'admin', label: 'Custom Operations Admin Center', priceINR: 30000, priceUSD: 400, laymanDescription: 'Admin', techSpecs: 'Admin UI' },
  { id: 'payments', label: 'Global Payments & Subscriptions', priceINR: 25000, priceUSD: 300, laymanDescription: 'Payments', techSpecs: 'Stripe' },
  { id: 'email', label: 'Transactional Email Engine', priceINR: 15000, priceUSD: 200, laymanDescription: 'Email', techSpecs: 'Resend' },
  { id: 'cms', label: 'Headless CMS Integration', priceINR: 20000, priceUSD: 250, laymanDescription: 'CMS', techSpecs: 'Contentful' },
  { id: 'integrations', label: 'Third-Party Webhook Integrations', priceINR: 20000, priceUSD: 250, laymanDescription: 'Webhooks', techSpecs: 'Webhooks' },
  { id: 'ai_rag', label: 'AI Knowledge Base / RAG', priceINR: 40000, priceUSD: 500, laymanDescription: 'RAG', techSpecs: 'pgvector' },
  { id: 'ai_agents', label: 'Autonomous AI Workflows', priceINR: 45000, priceUSD: 600, laymanDescription: 'Agents', techSpecs: 'Workflows' },
  { id: 'ai_voice_agent', label: 'Conversational Voice AI Agent', priceINR: 50000, priceUSD: 650, laymanDescription: 'Voice', techSpecs: 'LiveKit' },
];

describe('StepTechnicalScope Component', () => {
  it('renders base engine and 1-click smart presets', () => {
    const onApplyPreset = vi.fn();

    render(
      <StepTechnicalScope
        engines={[mockEngine]}
        features={mockFeatures}
        currentArchetype={mockArchetype}
        selectedEngine={mockEngine}
        formData={{
          selectedBaseEngineId: 'saas',
          selectedFeatures: ['auth', 'admin'],
          projectStartType: 'greenfield',
        }}
        showEngineOverride={false}
        setShowEngineOverride={vi.fn()}
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        lockedHintId={null}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        onEngineSelect={vi.fn()}
        onFeatureToggle={vi.fn()}
        onApplySmartPreset={onApplyPreset}
        togglePopover={vi.fn()}
        dependsOnMap={{}}
      />
    );

    expect(screen.getByText(/Base Platform Foundation Engine/i)).toBeDefined();
    expect(screen.getByText(/1-Click Scope Presets:/i)).toBeDefined();

    const essentialBtn = screen.getByRole('button', { name: /Essential MVP/i });
    const growthBtn = screen.getByRole('button', { name: /Growth Bundle/i });
    const aiBtn = screen.getByRole('button', { name: /Full AI Powerhouse/i });

    expect(essentialBtn).toBeDefined();
    expect(growthBtn).toBeDefined();
    expect(aiBtn).toBeDefined();

    // With only auth and admin selected, only Essential MVP is active
    expect(essentialBtn.className).toContain('smartPresetBtnActive');
    expect(growthBtn.className).not.toContain('smartPresetBtnActive');
    expect(aiBtn.className).not.toContain('smartPresetBtnActive');
  });

  it('enforces mutual exclusivity: Growth Bundle active does NOT activate Essential MVP', () => {
    render(
      <StepTechnicalScope
        engines={[mockEngine]}
        features={mockFeatures}
        currentArchetype={mockArchetype}
        selectedEngine={mockEngine}
        formData={{
          selectedBaseEngineId: 'saas',
          selectedFeatures: ['auth', 'admin', 'payments', 'email', 'cms', 'integrations'],
          projectStartType: 'greenfield',
        }}
        showEngineOverride={false}
        setShowEngineOverride={vi.fn()}
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        lockedHintId={null}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        onEngineSelect={vi.fn()}
        onFeatureToggle={vi.fn()}
        onApplySmartPreset={vi.fn()}
        togglePopover={vi.fn()}
        dependsOnMap={{}}
      />
    );

    const essentialBtn = screen.getByRole('button', { name: /Essential MVP/i });
    const growthBtn = screen.getByRole('button', { name: /Growth Bundle/i });
    const aiBtn = screen.getByRole('button', { name: /Full AI Powerhouse/i });

    // Growth Bundle is active, Essential MVP must NOT be active
    expect(growthBtn.className).toContain('smartPresetBtnActive');
    expect(essentialBtn.className).not.toContain('smartPresetBtnActive');
    expect(aiBtn.className).not.toContain('smartPresetBtnActive');
  });

  it('enforces mutual exclusivity: Full AI Powerhouse active does NOT activate Essential or Growth', () => {
    render(
      <StepTechnicalScope
        engines={[mockEngine]}
        features={mockFeatures}
        currentArchetype={mockArchetype}
        selectedEngine={mockEngine}
        formData={{
          selectedBaseEngineId: 'saas',
          selectedFeatures: ['auth', 'admin', 'ai_rag', 'ai_agents', 'ai_voice_agent', 'integrations'],
          projectStartType: 'greenfield',
        }}
        showEngineOverride={false}
        setShowEngineOverride={vi.fn()}
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        lockedHintId={null}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        onEngineSelect={vi.fn()}
        onFeatureToggle={vi.fn()}
        onApplySmartPreset={vi.fn()}
        togglePopover={vi.fn()}
        dependsOnMap={{}}
      />
    );

    const essentialBtn = screen.getByRole('button', { name: /Essential MVP/i });
    const growthBtn = screen.getByRole('button', { name: /Growth Bundle/i });
    const aiBtn = screen.getByRole('button', { name: /Full AI Powerhouse/i });

    expect(aiBtn.className).toContain('smartPresetBtnActive');
    expect(essentialBtn.className).not.toContain('smartPresetBtnActive');
    expect(growthBtn.className).not.toContain('smartPresetBtnActive');
  });

  it('renders Scope Copilot consultation banner and handles click', () => {
    const onOpenCopilot = vi.fn();

    render(
      <StepTechnicalScope
        engines={[mockEngine]}
        features={mockFeatures}
        currentArchetype={mockArchetype}
        selectedEngine={mockEngine}
        formData={{
          selectedBaseEngineId: 'saas',
          selectedFeatures: ['auth'],
          projectStartType: 'greenfield',
        }}
        showEngineOverride={false}
        setShowEngineOverride={vi.fn()}
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        lockedHintId={null}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        onEngineSelect={vi.fn()}
        onFeatureToggle={vi.fn()}
        onApplySmartPreset={vi.fn()}
        togglePopover={vi.fn()}
        dependsOnMap={{}}
        onOpenCopilot={onOpenCopilot}
      />
    );

    const bannerBtn = screen.getByRole('button', { name: /Consult Scope Copilot/i });
    expect(bannerBtn).toBeDefined();

    fireEvent.click(bannerBtn);
    expect(onOpenCopilot).toHaveBeenCalledTimes(1);
  });
});
