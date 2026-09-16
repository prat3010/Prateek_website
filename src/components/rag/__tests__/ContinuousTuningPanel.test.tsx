import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

import { ContinuousTuningPanel } from '../ContinuousTuningPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type { ContinuousTuningConfig, PreferenceListResponse, TuningJob } from '@/lib/rag-types';

describe('ContinuousTuningPanel Component', () => {
  const mockGetTuningConfig = vi.fn();
  const mockListPreferencePairs = vi.fn();
  const mockListTuningJobs = vi.fn();
  const mockHarvestPreferencePair = vi.fn();
  const mockDeletePreferencePair = vi.fn();
  const mockTriggerTuningJob = vi.fn();
  const mockPromoteTuningJobAdapter = vi.fn();
  const mockRollbackTuningAdapter = vi.fn();
  const mockSimulateTuningMath = vi.fn();

  const mockClient = {
    getTuningConfig: mockGetTuningConfig,
    listPreferencePairs: mockListPreferencePairs,
    listTuningJobs: mockListTuningJobs,
    harvestPreferencePair: mockHarvestPreferencePair,
    deletePreferencePair: mockDeletePreferencePair,
    triggerTuningJob: mockTriggerTuningJob,
    promoteTuningJobAdapter: mockPromoteTuningJobAdapter,
    rollbackTuningAdapter: mockRollbackTuningAdapter,
    simulateTuningMath: mockSimulateTuningMath,
  } as unknown as RetrieverClient;

  const sampleConfig: ContinuousTuningConfig = {
    tenant_id: 'tenant_enterprise',
    objective: 'dpo',
    base_model: 'meta-llama/Llama-3-8B-Instruct',
    active_adapter_id: 'lora_adapter_dpo_v1',
    auto_train_enabled: true,
    hyperparameters: {
      learning_rate: 0.00005,
      beta: 0.1,
      lambda_orpo: 0.1,
      lora_r: 16,
      lora_alpha: 32,
      batch_size: 4,
      epochs: 3,
      auto_trigger_threshold: 20,
      eval_split_ratio: 0.2,
    },
    total_pairs_harvested: 24,
    active_pairs_in_buffer: 4,
  };

  const samplePairsResponse: PreferenceListResponse = {
    items: [
      {
        pair_id: 'pref_101',
        tenant_id: 'tenant_enterprise',
        prompt: 'What is hybrid search in Retriever?',
        winning_response: 'It combines dense embeddings and BM25 with reciprocal rank fusion.',
        losing_response: 'It is a keyword search with no vector index.',
        feedback_rating: 5,
        tags: ['retrieval', 'hybrid'],
        is_verified: true,
        created_at: '2026-09-15T10:00:00Z',
      },
    ],
    total: 1,
    limit: 50,
    offset: 0,
  };

  const sampleJobs: TuningJob[] = [
    {
      job_id: 'job_dpo_test_001',
      tenant_id: 'tenant_enterprise',
      objective: 'dpo',
      status: 'completed',
      base_model: 'meta-llama/Llama-3-8B-Instruct',
      output_adapter_id: 'lora_adapter_dpo_v1',
      dataset_size: 20,
      hyperparameters: sampleConfig.hyperparameters,
      loss_history: [
        { step: 1, epoch: 1, train_loss: 0.693, reward_margin: 0.0, accuracy: 0.5, odds_ratio: 1.0 },
        { step: 2, epoch: 2, train_loss: 0.25, reward_margin: 1.4, accuracy: 0.95, odds_ratio: 4.1 },
      ],
      evaluation: {
        passed: true,
        validation_accuracy: 0.95,
        avg_reward_margin: 1.45,
        validation_loss: 0.21,
        total_eval_pairs: 4,
        recommendation: 'Validation criteria met (accuracy >= 0.75).',
      },
      created_at: '2026-09-15T11:00:00Z',
      completed_at: '2026-09-15T11:05:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTuningConfig.mockResolvedValue(sampleConfig);
    mockListPreferencePairs.mockResolvedValue(samplePairsResponse);
    mockListTuningJobs.mockResolvedValue(sampleJobs);
    mockSimulateTuningMath.mockResolvedValue({
      prompt: 'test query',
      beta: 0.1,
      lambda_orpo: 0.1,
      pi_theta_win_prob: 0.85,
      pi_ref_win_prob: 0.45,
      pi_theta_lose_prob: 0.15,
      pi_ref_lose_prob: 0.55,
      dpo_reward_w: 0.0636,
      dpo_reward_l: -0.1299,
      dpo_reward_margin: 0.1935,
      dpo_loss: 0.6006,
      orpo_odds_w: 5.6667,
      orpo_odds_l: 0.1765,
      orpo_odds_ratio: 32.1133,
      orpo_loss: 0.1656,
    });
  });

  it('renders header and initial dataset pairs when active', async () => {
    render(<ContinuousTuningPanel client={mockClient} tenantId="tenant_enterprise" />);

    expect(screen.getByText('Continuous DPO / ORPO Model Preference Tuning')).toBeDefined();
    expect(screen.getByText('Battery #35 // Preference Optimization')).toBeDefined();

    await waitFor(() => {
      expect(mockGetTuningConfig).toHaveBeenCalled();
      expect(mockListPreferencePairs).toHaveBeenCalled();
      expect(screen.getByText('“What is hybrid search in Retriever?”')).toBeDefined();
    });
  });

  it('switches between tabs and displays jobs subview', async () => {
    render(<ContinuousTuningPanel client={mockClient} tenantId="tenant_enterprise" />);

    await waitFor(() => {
      expect(mockListTuningJobs).toHaveBeenCalled();
    });

    const jobsTabBtn = screen.getByRole('button', { name: /Continuous Training Jobs/i });
    fireEvent.click(jobsTabBtn);

    expect(screen.getByText('Continuous Fine-Tuning Execution Engine')).toBeDefined();
    expect(screen.getByText('job_dpo_test_001')).toBeDefined();
    expect(screen.getByText('✓ EVALUATION GATE PASSED')).toBeDefined();
  });

  it('switches to simulator tab and calculates mathematical losses', async () => {
    render(<ContinuousTuningPanel client={mockClient} tenantId="tenant_enterprise" />);

    const simTabBtn = screen.getByRole('button', { name: /DPO \/ ORPO Math Simulator/i });
    fireEvent.click(simTabBtn);

    expect(screen.getByText('Direct Mathematical Loss & Odds Ratio Simulator')).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText('Bradley-Terry Implicit Rewards:')).toBeDefined();
      expect(screen.getByText('ORPO Monolithic Odds Ratio:')).toBeDefined();
    });
  });

  it('opens harvest modal and adds a new preference pair', async () => {
    mockHarvestPreferencePair.mockResolvedValue({
      pair_id: 'pref_102',
      tenant_id: 'tenant_enterprise',
      prompt: 'New user query',
      winning_response: 'Ground truth answer',
      losing_response: 'Hallucinated answer',
      feedback_rating: 5,
      tags: ['manual', 'curated'],
      is_verified: true,
      created_at: '2026-09-15T12:00:00Z',
    });

    render(<ContinuousTuningPanel client={mockClient} tenantId="tenant_enterprise" />);

    const openModalBtn = screen.getByRole('button', { name: /\+ Harvest Preference Pair/i });
    fireEvent.click(openModalBtn);

    expect(screen.getByText('Harvest Preference Pair')).toBeDefined();

    const textareas = screen.getAllByRole('textbox');
    // textareas: prompt, win, lose, tags
    fireEvent.change(textareas[0], { target: { value: 'New user query' } });
    fireEvent.change(textareas[1], { target: { value: 'Ground truth answer' } });
    fireEvent.change(textareas[2], { target: { value: 'Hallucinated answer' } });

    const submitBtn = screen.getByRole('button', { name: /Add to Buffer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockHarvestPreferencePair).toHaveBeenCalledWith({
        prompt: 'New user query',
        winning_response: 'Ground truth answer',
        losing_response: 'Hallucinated answer',
        tags: ['manual', 'curated'],
        feedback_rating: 5,
      });
    });
  });
});
