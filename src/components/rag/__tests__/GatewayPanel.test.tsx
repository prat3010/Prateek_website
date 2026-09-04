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
  ServerlessDeploymentStatus,
  ServerlessCostComparison,
  LoraAdapterMetadata,
  WarmBootMetrics,
} from '@/lib/rag-types';

describe('GatewayPanel Component', () => {
  const mockGetGatewayModels = vi.fn();
  const mockProbeGateway = vi.fn();
  const mockGetTenantGatewayRoutes = vi.fn();
  const mockUpdateTenantGatewayRoutes = vi.fn();
  const mockGetTenantGatewayBudget = vi.fn();
  const mockGetServerlessStatus = vi.fn();
  const mockProbeServerlessGpu = vi.fn();
  const mockGetServerlessCostSavings = vi.fn();
  const mockGetTenantLoraAdapters = vi.fn();
  const mockActivateTenantLoraAdapter = vi.fn();
  const mockDeactivateTenantLoraAdapter = vi.fn();

  const mockClient = {
    getGatewayModels: mockGetGatewayModels,
    probeGateway: mockProbeGateway,
    getTenantGatewayRoutes: mockGetTenantGatewayRoutes,
    updateTenantGatewayRoutes: mockUpdateTenantGatewayRoutes,
    getTenantGatewayBudget: mockGetTenantGatewayBudget,
    getServerlessStatus: mockGetServerlessStatus,
    probeServerlessGpu: mockProbeServerlessGpu,
    getServerlessCostSavings: mockGetServerlessCostSavings,
    getTenantLoraAdapters: mockGetTenantLoraAdapters,
    activateTenantLoraAdapter: mockActivateTenantLoraAdapter,
    deactivateTenantLoraAdapter: mockDeactivateTenantLoraAdapter,
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

  const sampleServerlessStatus: ServerlessDeploymentStatus = {
    provider: 'modal',
    gpu_tier: 'A10G',
    active_containers: 0,
    min_containers: 0,
    max_containers: 5,
    scaledown_window_seconds: 300,
    is_warm: false,
    endpoint_url: 'https://prateeq--vllm-llama-serve.modal.run',
    current_active_model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    active_lora_adapters: ['lora_test_arch'],
  };

  const sampleServerlessCost: ServerlessCostComparison = {
    active_hours: 15.0,
    gpu_tier: 'A10G',
    hourly_gpu_rate_usd: 1.0,
    serverless_monthly_cost_usd: 15.0,
    dedicated_monthly_cost_usd: 720.0,
    monthly_savings_usd: 705.0,
    savings_percentage: 97.92,
  };

  const sampleLoraAdapters: LoraAdapterMetadata[] = [
    {
      adapter_id: 'lora_test_arch',
      tenant_id: 'tenant_test_123',
      name: 'Test Architecture LoRA',
      base_model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      artifact_uri: 's3://vault/adapters/arch_lora_v1',
      rank: 16,
      alpha: 32.0,
      target_modules: ['q_proj', 'v_proj'],
      adapter_type: 'llm',
      description: 'Domain tuning for microservices',
      is_active: true,
    },
    {
      adapter_id: 'lora_test_sec',
      tenant_id: 'tenant_test_123',
      name: 'Security Audit LoRA',
      base_model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      artifact_uri: 's3://vault/adapters/sec_lora_v1',
      rank: 8,
      alpha: 16.0,
      target_modules: ['q_proj', 'k_proj'],
      adapter_type: 'llm',
      description: 'Vulnerability assessment fine-tuning',
      is_active: false,
    },
  ];

  const sampleWarmBootMetrics: WarmBootMetrics = {
    container_init_time_ms: 1820,
    model_weights_load_time_ms: 590,
    first_token_latency_ms: 138,
    total_cold_start_time_ms: 2548,
    is_cold_start: true,
    probed_at: '2026-09-05T02:00:00Z',
  };

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

  it('renders serverless GPU serving metrics, cold-start latency, and scale-to-zero cost savings', async () => {
    mockGetGatewayModels.mockResolvedValueOnce(sampleModels);
    mockGetTenantGatewayRoutes.mockResolvedValueOnce(sampleRoutes);
    mockGetTenantGatewayBudget.mockResolvedValueOnce(sampleBudget);
    mockGetServerlessStatus.mockResolvedValueOnce(sampleServerlessStatus);
    mockGetServerlessCostSavings.mockResolvedValueOnce(sampleServerlessCost);
    mockGetTenantLoraAdapters.mockResolvedValueOnce(sampleLoraAdapters);

    render(<GatewayPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText(/Serverless Dedicated GPU Serving & Dynamic LoRA/i)).toBeDefined();
      expect(screen.getByText(/0 Active Containers/i)).toBeDefined();
      expect(screen.getByText(/\$705\.00 Saved/i)).toBeDefined();
      expect(screen.getByText(/Test Architecture LoRA/i)).toBeDefined();
      expect(screen.getByText(/ACTIVE INFERENCE/i)).toBeDefined();
    });
  });

  it('triggers warm-boot latency probe when probe button is clicked', async () => {
    mockGetGatewayModels.mockResolvedValueOnce(sampleModels);
    mockGetTenantGatewayRoutes.mockResolvedValueOnce(sampleRoutes);
    mockGetTenantGatewayBudget.mockResolvedValueOnce(sampleBudget);
    mockGetServerlessStatus.mockResolvedValueOnce(sampleServerlessStatus);
    mockGetServerlessCostSavings.mockResolvedValueOnce(sampleServerlessCost);
    mockGetTenantLoraAdapters.mockResolvedValueOnce(sampleLoraAdapters);
    mockProbeServerlessGpu.mockResolvedValueOnce(sampleWarmBootMetrics);

    render(<GatewayPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Probe Warm-Boot Latency/i })).toBeDefined();
    });

    const probeBtn = screen.getByRole('button', { name: /Probe Warm-Boot Latency/i });
    fireEvent.click(probeBtn);

    await waitFor(() => {
      expect(mockProbeServerlessGpu).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/138ms TTFT/i)).toBeDefined();
    });
  });

  it('toggles dynamic LoRA adapter activation on serverless vLLM', async () => {
    mockGetGatewayModels.mockResolvedValueOnce(sampleModels);
    mockGetTenantGatewayRoutes.mockResolvedValueOnce(sampleRoutes);
    mockGetTenantGatewayBudget.mockResolvedValueOnce(sampleBudget);
    mockGetServerlessStatus.mockResolvedValueOnce(sampleServerlessStatus);
    mockGetServerlessCostSavings.mockResolvedValueOnce(sampleServerlessCost);
    mockGetTenantLoraAdapters.mockResolvedValueOnce(sampleLoraAdapters);
    mockActivateTenantLoraAdapter.mockResolvedValueOnce({
      ...sampleLoraAdapters[1],
      is_active: true,
    });

    render(<GatewayPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText(/Security Audit LoRA/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /⚡ Hot-Activate/i })).toBeDefined();
    });

    const activateBtn = screen.getByRole('button', { name: /⚡ Hot-Activate/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(mockActivateTenantLoraAdapter).toHaveBeenCalledWith('lora_test_sec');
      expect(screen.getByText(/hot-activated dynamically on serverless vLLM/i)).toBeDefined();
    });
  });
});
