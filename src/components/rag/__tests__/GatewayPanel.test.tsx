import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GatewayPanel } from '../GatewayPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type {
  GatewayModelInfo,
  GatewayProbeResult,
  TenantGatewayRoutesResponse,
  VirtualTenantBudget,
} from '@/lib/rag-types';

describe('GatewayPanel Component', () => {
  const mockGetGatewayModels = vi.fn();
  const mockProbeGateway = vi.fn();
  const mockGetTenantGatewayRoutes = vi.fn();
  const mockUpdateTenantGatewayRoutes = vi.fn();
  const mockGetTenantGatewayBudget = vi.fn();

  const mockClient = {
    getGatewayModels: mockGetGatewayModels,
    probeGateway: mockProbeGateway,
    getTenantGatewayRoutes: mockGetTenantGatewayRoutes,
    updateTenantGatewayRoutes: mockUpdateTenantGatewayRoutes,
    getTenantGatewayBudget: mockGetTenantGatewayBudget,
  } as unknown as RetrieverClient;

  const sampleModels: GatewayModelInfo[] = [
    {
      model_id: 'gemini-2.5-flash',
      provider: 'gemini',
      name: 'Google Gemini 2.5 Flash',
      input_cost_per_1k: 0.075,
      output_cost_per_1k: 0.30,
      capabilities: ['chat', 'vision', 'tools'],
      is_local: false,
      health_status: 'healthy',
      description: 'Fast multimodal baseline.',
    },
    {
      model_id: 'openai/gpt-4o-mini',
      provider: 'openai',
      name: 'OpenAI GPT-4o Mini',
      input_cost_per_1k: 0.15,
      output_cost_per_1k: 0.60,
      capabilities: ['chat', 'tools'],
      is_local: false,
      health_status: 'healthy',
      description: 'Cost-efficient secondary fallback.',
    },
  ];

  const sampleRoutes: TenantGatewayRoutesResponse = {
    tenant_id: 'tenant_test_123',
    gateway_settings: {
      primary_model: 'gemini-2.5-flash',
      fallback_models: ['openai/gpt-4o-mini', 'ollama/qwen2.5:14b'],
      latency_sla_ms: 3500,
      cooldown_seconds: 45,
      retry_attempts: 2,
    },
    budget_settings: {
      daily_cost_budget: 10,
      monthly_cost_budget: 100,
      hard_limit_action: 'downgrade_free_model',
      free_fallback_model: 'ollama/qwen2.5:14b',
      currency: 'USD',
    },
  };

  const sampleBudget: VirtualTenantBudget = {
    daily_budget: 10,
    monthly_budget: 100,
    hard_limit_action: 'downgrade_free_model',
    free_fallback_model: 'ollama/qwen2.5:14b',
    currency: 'USD',
    current_daily_spend: 2.50,
    current_monthly_spend: 25.00,
    is_budget_exceeded: false,
    cost_by_model: {
      'gemini-2.5-flash': 20.00,
      'openai/gpt-4o-mini': 5.00,
    },
  };

  const sampleProbes: GatewayProbeResult[] = [
    {
      provider: 'gemini',
      target_model: 'gemini-2.5-flash',
      reachable: true,
      latency_ms: 124,
    },
    {
      provider: 'openai',
      target_model: 'gpt-4o-mini',
      reachable: true,
      latency_ms: 210,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with title and main sections', async () => {
    mockGetGatewayModels.mockResolvedValueOnce(sampleModels);
    mockGetTenantGatewayRoutes.mockResolvedValueOnce(sampleRoutes);
    mockGetTenantGatewayBudget.mockResolvedValueOnce(sampleBudget);

    render(<GatewayPanel client={mockClient} />);

    expect(screen.getByText(/Enterprise LLM Gateway & Smart Router/i)).toBeDefined();
    expect(screen.getByText(/Dynamic Fallback Cascade/i)).toBeDefined();
    expect(screen.getByText(/Virtual Spending Caps & Guardrails/i)).toBeDefined();
    expect(screen.getByText(/Monthly Spend Cap/i)).toBeDefined();
  });

  it('returns null when hidden is true', () => {
    const { container } = render(<GatewayPanel client={mockClient} hidden={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays models, budget metrics, and model attribution breakdown', async () => {
    mockGetGatewayModels.mockResolvedValueOnce(sampleModels);
    mockGetTenantGatewayRoutes.mockResolvedValueOnce(sampleRoutes);
    mockGetTenantGatewayBudget.mockResolvedValueOnce(sampleBudget);

    render(<GatewayPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText(/Google Gemini 2.5 Flash/i)).toBeDefined();
      expect(screen.getByText(/OpenAI GPT-4o Mini/i)).toBeDefined();
      expect(screen.getByText(/\$25\.00/i)).toBeDefined();
      expect(screen.getByText(/\/ \$100\.00/i)).toBeDefined();
    });

    // Check cost breakdown attribution
    expect(screen.getByText(/Current Month Spend Attribution:/i)).toBeDefined();
    expect(screen.getByText(/\$20\.0000/i)).toBeDefined();
  });

  it('triggers latency probe when probe button is clicked', async () => {
    mockGetGatewayModels.mockResolvedValueOnce(sampleModels);
    mockGetTenantGatewayRoutes.mockResolvedValueOnce(sampleRoutes);
    mockGetTenantGatewayBudget.mockResolvedValueOnce(sampleBudget);
    mockProbeGateway.mockResolvedValueOnce(sampleProbes);

    render(<GatewayPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText(/Ping Upstream Providers/i)).toBeDefined();
    });

    const probeBtn = screen.getByRole('button', { name: /Ping Upstream Providers/i });
    fireEvent.click(probeBtn);

    await waitFor(() => {
      expect(mockProbeGateway).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/124ms/i)).toBeDefined();
      expect(screen.getByText(/210ms/i)).toBeDefined();
    });
  });

  it('submits updated cascade configuration', async () => {
    mockGetGatewayModels.mockResolvedValueOnce(sampleModels);
    mockGetTenantGatewayRoutes.mockResolvedValueOnce(sampleRoutes);
    mockGetTenantGatewayBudget.mockResolvedValueOnce(sampleBudget);
    mockUpdateTenantGatewayRoutes.mockResolvedValueOnce({
      status: 'updated',
      gateway_settings: sampleRoutes.gateway_settings,
      budget_settings: sampleRoutes.budget_settings,
    });

    render(<GatewayPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Smart Router Topology/i })).toBeDefined();
    });

    const updateBtn = screen.getByRole('button', { name: /Save Smart Router Topology/i });
    fireEvent.click(updateBtn);

    await waitFor(() => {
      expect(mockUpdateTenantGatewayRoutes).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Smart router topology & budget ceilings saved!/i)).toBeDefined();
    });
  });
});
