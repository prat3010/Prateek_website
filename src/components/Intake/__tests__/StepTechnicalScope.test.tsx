import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

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

  it('hides hideFromFullProject engines from the base engine override list', () => {
    const hiddenEngine: BaseEngineItem = {
      id: 'ai_strategy_audit',
      title: 'AI Strategy & Architecture Audit',
      tier: 'Sprint Tier',
      priceINR: 20000,
      priceUSD: 300,
      laymanDescription: 'Audit sprint',
      techSpecs: 'Audit specs',
      hideFromFullProject: true,
    };

    render(
      <StepTechnicalScope
        engines={[mockEngine, hiddenEngine]}
        features={mockFeatures}
        currentArchetype={mockArchetype}
        selectedEngine={mockEngine}
        formData={{
          selectedBaseEngineId: 'saas',
          selectedFeatures: ['auth'],
          projectStartType: 'greenfield',
        }}
        showEngineOverride={true}
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

    expect(screen.getAllByText(/Full-Stack SaaS Core/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/AI Strategy & Architecture Audit/i)).toBeNull();
  });

  it('supports roving arrow/Home/End focus across base engine override radio cards', () => {
    const secondEngine: BaseEngineItem = {
      id: 'multipage',
      title: 'Multi-Page Business Engine',
      tier: 'Standard Tier',
      priceINR: 55000,
      priceUSD: 700,
      laymanDescription: 'Multi-page site',
      techSpecs: 'Next.js 16',
    };

    render(
      <StepTechnicalScope
        engines={[mockEngine, secondEngine]}
        features={mockFeatures}
        currentArchetype={mockArchetype}
        selectedEngine={mockEngine}
        formData={{
          selectedBaseEngineId: 'saas',
          selectedFeatures: ['auth'],
          projectStartType: 'greenfield',
        }}
        showEngineOverride={true}
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

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(2);
    radios[0].focus();
    expect(document.activeElement).toBe(radios[0]);

    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[1]);

    fireEvent.keyDown(radios[1], { key: 'Home' });
    expect(document.activeElement).toBe(radios[0]);

    fireEvent.keyDown(radios[0], { key: 'End' });
    expect(document.activeElement).toBe(radios[1]);
  });

  it('renders technical spec popover as an accessible dialog and returns focus to trigger on close', () => {
    const rafOriginal = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      cb(0);
      return 0;
    };

    function Harness() {
      const [activeId, setActiveId] = React.useState<string | null>(null);
      const [anchor, setAnchor] = React.useState<{ x: number; y: number } | null>(null);
      return (
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
          activePopoverId={activeId}
          setActivePopoverId={setActiveId}
          popoverAnchor={anchor}
          setPopoverAnchor={setAnchor}
          lockedHintId={null}
          currency="INR"
          priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
          onEngineSelect={vi.fn()}
          onFeatureToggle={vi.fn()}
          onApplySmartPreset={vi.fn()}
          togglePopover={(_e, id) => {
            setActiveId(id);
            setAnchor({ x: 50, y: 100 });
          }}
          dependsOnMap={{}}
        />
      );
    }

    try {
      render(<Harness />);
      const infoBtn = screen.getByRole('button', {
        name: /View Technical Engineering Specs for User Authentication & RBAC/i,
      });
      infoBtn.focus();
      fireEvent.click(infoBtn);

      const dialog = screen.getByRole('dialog', {
        name: /User Authentication & RBAC Technical Specifications/i,
      });
      expect(dialog).toBeDefined();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(
        screen.queryByRole('dialog', { name: /User Authentication & RBAC Technical Specifications/i })
      ).toBeNull();
      expect(document.activeElement).toBe(infoBtn);
    } finally {
      window.requestAnimationFrame = rafOriginal;
    }
  });
});
