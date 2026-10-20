import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiScopingPromptBar } from '../AiScopingPromptBar';

describe('AiScopingPromptBar Component', () => {
  it('renders prompt input, action buttons, and quick blueprints without initial fake telemetry', () => {
    const onApply = vi.fn();
    render(<AiScopingPromptBar onApplyBlueprint={onApply} currency="INR" isNoir={false} />);

    expect(screen.getByPlaceholderText(/Describe your project in plain English/i)).toBeDefined();
    expect(screen.getByText(/Analyze Scope/i)).toBeDefined();
    expect(screen.getByText(/Drop RFP \/ PRD/i)).toBeDefined();
    expect(screen.queryByText(/Powered by Retriever/i)).toBeNull();
  });

  it('renders quick blueprint pills and populates prompt on click', async () => {
    const onApply = vi.fn();
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          success: true,
          archetypeId: 'ai_rag_app',
          baseEngineId: 'saas',
          featureIds: [],
          confidenceScore: 0.9,
          summaryRationale: 'OK',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    try {
      render(<AiScopingPromptBar onApplyBlueprint={onApply} currency="USD" isNoir={false} />);

      const ragPill = screen.getByText(/Real Estate RAG Portal/i);
      expect(ragPill).toBeDefined();

      fireEvent.click(ragPill);
      await screen.findByTestId('scoping-match-card');
      const input = screen.getByPlaceholderText(/Describe your project in plain English/i) as HTMLInputElement;
      expect(input.value).toContain('real estate portal with private AI knowledge base');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('displays real telemetry after successful backend analysis', async () => {
    const mockBlueprint = {
      success: true,
      archetypeId: 'ai_rag_app',
      baseEngineId: 'saas',
      featureIds: ['ai_rag'],
      brandAssetId: 'none',
      maintenancePlanId: 'essential',
      suggestedTimeline: '3 to 4 Weeks',
      confidenceScore: 0.95,
      summaryRationale: 'Matched knowledge base',
      retrieverEngineRecommended: true,
      telemetry: {
        latencyMs: 142,
        semanticCacheHit: true,
        tenantId: 'prateeq_scoping',
        modelUsed: 'meta-llama/llama-3.3-70b-instruct',
        fallbackMode: false,
      },
      unrecognizedRequirements: [],
    };

    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify(mockBlueprint), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    try {
      const onApply = vi.fn();
      render(<AiScopingPromptBar onApplyBlueprint={onApply} currency="USD" isNoir={false} />);

      const input = screen.getByPlaceholderText(/Describe your project in plain English/i);
      fireEvent.change(input, { target: { value: 'Build knowledge base' } });

      const analyzeBtn = screen.getByRole('button', { name: /Analyze Intent/i });
      fireEvent.click(analyzeBtn);

      const telemetryBadge = await screen.findByText(/Powered by Retriever \(meta-llama\/llama-3\.3-70b-instruct\)/i);
      expect(telemetryBadge).toBeDefined();
      expect(screen.getByText(/Latency: 142ms/i)).toBeDefined();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('renders blueprint match card and triggers onNavigateStep(2) on click', async () => {
    const mockBlueprint = {
      success: true,
      archetypeId: 'ai_rag_app',
      baseEngineId: 'saas',
      featureIds: ['ai_rag', 'auth', 'admin'],
      brandAssetId: 'none',
      maintenancePlanId: 'essential',
      suggestedTimeline: '3 to 4 Weeks',
      confidenceScore: 0.96,
      summaryRationale: 'Matched AI knowledge base and client portal',
      retrieverEngineRecommended: true,
      telemetry: {
        latencyMs: 85,
        semanticCacheHit: true,
        tenantId: 'prateeq_scoping',
        modelUsed: 'meta-llama/llama-3.3-70b-instruct',
        fallbackMode: false,
      },
      unrecognizedRequirements: [],
    };

    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify(mockBlueprint), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    try {
      const onApply = vi.fn();
      const onNavigate = vi.fn();
      render(
        <AiScopingPromptBar
          onApplyBlueprint={onApply}
          currency="USD"
          isNoir={false}
          onNavigateStep={onNavigate}
        />
      );

      const input = screen.getByPlaceholderText(/Describe your project in plain English/i);
      fireEvent.change(input, { target: { value: 'Build knowledge base' } });

      const analyzeBtn = screen.getByRole('button', { name: /Analyze Intent/i });
      fireEvent.click(analyzeBtn);

      const matchCard = await screen.findByTestId('scoping-match-card');
      expect(matchCard).toBeDefined();
      expect(screen.getByText(/Blueprint Matched \(96% Confidence\)/i)).toBeDefined();
      expect(screen.getByText(/AI Knowledge Base \/ RAG Copilot/i)).toBeDefined();
      expect(screen.getByText(/Full-Stack SaaS Core Engine/i)).toBeDefined();
      expect(screen.getByText(/3 Modules Selected/i)).toBeDefined();
      expect(screen.getByText(/Matched AI knowledge base and client portal/i)).toBeDefined();

      const step2Btn = screen.getByRole('button', { name: /Review Architecture Blueprint in Step 2/i });
      expect(step2Btn).toBeDefined();
      fireEvent.click(step2Btn);
      expect(onNavigate).toHaveBeenCalledWith(2);
    } finally {
      global.fetch = originalFetch;
    }
  });
});

