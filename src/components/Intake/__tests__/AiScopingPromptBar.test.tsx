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
    expect(screen.getByText(/Chat with Scoping AI/i)).toBeDefined();
    expect(screen.queryByText(/Powered by Retriever/i)).toBeNull();
  });

  it('renders quick blueprint pills and populates prompt on click', () => {
    const onApply = vi.fn();
    render(<AiScopingPromptBar onApplyBlueprint={onApply} currency="USD" isNoir={false} />);

    const ragPill = screen.getByText(/Real Estate RAG Portal/i);
    expect(ragPill).toBeDefined();

    fireEvent.click(ragPill);
    const input = screen.getByPlaceholderText(/Describe your project in plain English/i) as HTMLInputElement;
    expect(input.value).toContain('real estate portal with private AI knowledge base');
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
});
