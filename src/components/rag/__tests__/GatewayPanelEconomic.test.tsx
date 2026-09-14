import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

import { GatewayPanel } from '../GatewayPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type {
  EconomicLedgerSummary,
  TaskComplexity,
} from '@/lib/rag-types';

describe('GatewayPanel Multi-Model Economic Orchestrator (Milestone 105)', () => {
  const mockGetGatewayModels = vi.fn();
  const mockGetTenantGatewayRoutes = vi.fn();
  const mockGetTenantGatewayBudget = vi.fn();
  const mockGetAgenticEconomicLedger = vi.fn();
  const mockClassifyAgenticComplexity = vi.fn();

  const mockClient = {
    getGatewayModels: mockGetGatewayModels,
    getTenantGatewayRoutes: mockGetTenantGatewayRoutes,
    getTenantGatewayBudget: mockGetTenantGatewayBudget,
    getAgenticEconomicLedger: mockGetAgenticEconomicLedger,
    classifyAgenticComplexity: mockClassifyAgenticComplexity,
  } as unknown as RetrieverClient;

  const sampleLedger: EconomicLedgerSummary = {
    tenant_id: 'tn_test_client',
    total_queries: 25,
    total_tokens: 50000,
    mid_tier_query_count: 22,
    frontier_query_count: 3,
    escalated_query_count: 2,
    mid_tier_share_percentage: 88.0,
    escalation_rate_percentage: 8.0,
    total_actual_cost_usd: 1.25,
    total_counterfactual_cost_usd: 25.00,
    total_savings_usd: 23.75,
    average_savings_percentage: 95.0,
    records: [
      {
        tenant_id: 'tn_test_client',
        thread_id: 'th_econ_01',
        query_preview: 'Calculate monthly ROI for vector indexing',
        mid_tier_tokens: 1500,
        frontier_tokens: 500,
        total_tokens: 2000,
        actual_cost_usd: 0.25,
        counterfactual_frontier_cost_usd: 1.00,
        net_savings_usd: 0.75,
        savings_percentage: 75.0,
        escalated: true,
        escalation_reason: 'step_count_threshold',
        timestamp: '2026-09-13T22:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetGatewayModels.mockResolvedValue([]);
    mockGetTenantGatewayRoutes.mockResolvedValue(null);
    mockGetTenantGatewayBudget.mockResolvedValue(null);
    mockGetAgenticEconomicLedger.mockResolvedValue(sampleLedger);
  });

  it('renders economic orchestrator metrics and ledger stats', async () => {
    render(<GatewayPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText('Multi-Model Economic Orchestrator & Smart Tool Gateway')).toBeDefined();
      expect(screen.getByText('Net Arbitrage Savings')).toBeDefined();
      expect(screen.getByText('Mid-Tier Workload Share')).toBeDefined();
      expect(screen.getByText('Mid-Flight Escalation Rate')).toBeDefined();
      expect(screen.getByText('Effective Cost Reduction')).toBeDefined();
      expect(screen.getByText('Recent Economic Ledger Transactions')).toBeDefined();
      expect(screen.getByText('Calculate monthly ROI for vector indexing')).toBeDefined();
      expect(screen.getByText('Escalated')).toBeDefined();
    });
  });

  it('classifies task complexity interactively through the lab form', async () => {
    const mockComplexityResult: TaskComplexity = {
      score: 0.75,
      tier_assigned: 'frontier',
      estimated_steps: 4,
      rationale: 'Assigned FRONTIER based on: code execution / debugging, mathematical synthesis',
      requires_code_execution: true,
      requires_multi_hop: false,
      requires_mathematical_synthesis: true,
    };
    mockClassifyAgenticComplexity.mockResolvedValue(mockComplexityResult);

    render(<GatewayPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText('Interactive Task Complexity Lab & Tier Pre-Classifier')).toBeDefined();
    });

    const input = screen.getByPlaceholderText(/e\.g\. Write a python script to calculate/i);
    const form = input.closest('form')!;

    fireEvent.change(input, {
      target: { value: 'Write python script to calculate compound interest and debug' },
    });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClassifyAgenticComplexity).toHaveBeenCalledWith(
        'Write python script to calculate compound interest and debug'
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('complexity-result-badge')).toBeDefined();
    });

    expect(screen.getByTestId('complexity-result-badge').textContent).toContain('Frontier Model');
    expect(screen.getByText('Code Execution')).toBeDefined();
    expect(screen.getByText('Math Synthesis')).toBeDefined();
  });
});
