import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

import { WorkflowsPanel } from '../WorkflowsPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowListResponse,
} from '@/lib/rag-types';

describe('WorkflowsPanel Component', () => {
  const mockListWorkflowBlueprints = vi.fn();
  const mockListWorkflowExecutions = vi.fn();
  const mockStartWorkflow = vi.fn();
  const mockRetryWorkflowExecution = vi.fn();
  const mockCancelWorkflowExecution = vi.fn();

  const mockClient = {
    listWorkflowBlueprints: mockListWorkflowBlueprints,
    listWorkflowExecutions: mockListWorkflowExecutions,
    startWorkflow: mockStartWorkflow,
    retryWorkflowExecution: mockRetryWorkflowExecution,
    cancelWorkflowExecution: mockCancelWorkflowExecution,
  } as unknown as RetrieverClient;

  const sampleBlueprints: WorkflowDefinition[] = [
    {
      name: 'vault_bulk_ingest',
      title: 'Vault Bulk Ingest & Chunk Pipeline',
      description: 'Ingest multi-file markdown/PDF vaults into pgvector.',
      concurrency_limit: 2,
      max_step_retries: 3,
      backoff_factor: 2.0,
      initial_interval_seconds: 1.0,
      steps: [
        { name: 'scan_documents', max_attempts: 3, timeout_seconds: 60 },
        { name: 'chunk_and_embed', max_attempts: 3, timeout_seconds: 180 },
        { name: 'index_vectors', max_attempts: 3, timeout_seconds: 120 },
      ],
    },
  ];

  const sampleExecutions: WorkflowExecution[] = [
    {
      execution_id: 'exec_test_001',
      tenant_id: 'tenant_123',
      workflow_name: 'vault_bulk_ingest',
      status: 'completed',
      trigger_event: 'manual',
      idempotency_key: 'idemp_001',
      input_payload: { vault_path: 'docs/test' },
      output_payload: { total_indexed: 42 },
      total_steps: 3,
      completed_steps: 3,
      current_step_name: null,
      error_message: null,
      step_history: [
        {
          step_id: 'step_1',
          execution_id: 'exec_test_001',
          step_name: 'scan_documents',
          step_index: 0,
          status: 'completed',
          attempts: 1,
          max_attempts: 3,
          memoized_output: { files_found: 10 },
          execution_time_ms: 120.5,
          started_at: '2026-09-04T12:00:00Z',
          completed_at: '2026-09-04T12:00:01Z',
        },
        {
          step_id: 'step_2',
          execution_id: 'exec_test_001',
          step_name: 'chunk_and_embed',
          step_index: 1,
          status: 'completed',
          attempts: 1,
          max_attempts: 3,
          memoized_output: { chunks: 42 },
          execution_time_ms: 3.2,
          started_at: '2026-09-04T12:00:01Z',
          completed_at: '2026-09-04T12:00:02Z',
        },
      ],
      started_at: '2026-09-04T12:00:00Z',
      completed_at: '2026-09-04T12:00:05Z',
    },
    {
      execution_id: 'exec_test_002',
      tenant_id: 'tenant_123',
      workflow_name: 'vault_bulk_ingest',
      status: 'failed',
      trigger_event: 'manual',
      input_payload: {},
      output_payload: {},
      total_steps: 3,
      completed_steps: 1,
      current_step_name: 'chunk_and_embed',
      error_message: 'OOM during large PDF extraction',
      step_history: [],
      started_at: '2026-09-04T13:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockListWorkflowBlueprints.mockResolvedValue(sampleBlueprints);
    mockListWorkflowExecutions.mockResolvedValue({
      items: sampleExecutions,
      total: sampleExecutions.length,
      limit: 50,
      offset: 0,
    } as WorkflowListResponse);
  });

  it('renders correctly with title and platform battery active', async () => {
    render(<WorkflowsPanel client={mockClient} />);

    expect(screen.getByText(/Durable Asynchronous Execution & Background AI Workflows/i)).toBeDefined();
    expect(screen.getByText(/Platform Battery #15 Active/i)).toBeDefined();

    await waitFor(() => {
      expect(mockListWorkflowBlueprints).toHaveBeenCalled();
      expect(mockListWorkflowExecutions).toHaveBeenCalled();
      expect(screen.getByText(/Vault Bulk Ingest & Chunk Pipeline/i)).toBeDefined();
    });
  });

  it('returns null when hidden is true', () => {
    const { container } = render(<WorkflowsPanel client={mockClient} hidden={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('filters executions by status tabs', async () => {
    render(<WorkflowsPanel client={mockClient} />);

    await waitFor(() => {
      const pills = screen.getAllByText(/exec_tes/i);
      expect(pills.length).toBeGreaterThan(0);
    });

    const failedTab = screen.getByRole('button', { name: /^failed$/i });
    fireEvent.click(failedTab);

    // The completed job should now be filtered out
    expect(screen.queryByText(/✓ Completed/i)).toBeNull();
    expect(screen.getByText(/✕ Failed/i)).toBeDefined();
  });

  it('opens launch modal and starts workflow execution', async () => {
    const newExec: WorkflowExecution = {
      execution_id: 'exec_test_003',
      tenant_id: 'tenant_123',
      workflow_name: 'vault_bulk_ingest',
      status: 'queued',
      input_payload: { test: true },
      output_payload: {},
      total_steps: 3,
      completed_steps: 0,
      step_history: [],
      started_at: '2026-09-04T14:00:00Z',
    };
    mockStartWorkflow.mockResolvedValueOnce(newExec);

    render(<WorkflowsPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText(/Launch Blueprint/i)).toBeDefined();
    });

    const launchBtn = screen.getAllByText(/Launch Blueprint/i)[0];
    fireEvent.click(launchBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText(/Execute Pipeline/i)).toBeDefined();
    });

    const executeBtn = screen.getByText(/Execute Pipeline/i);
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(mockStartWorkflow).toHaveBeenCalledWith(
        'vault_bulk_ingest',
        expect.any(Object),
        expect.any(String)
      );
    });
  });

  it('triggers retry for a failed execution', async () => {
    const resumedExec: WorkflowExecution = {
      ...sampleExecutions[1],
      status: 'running',
      error_message: null,
    };
    mockRetryWorkflowExecution.mockResolvedValueOnce(resumedExec);

    render(<WorkflowsPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText(/Resume/i)).toBeDefined();
    });

    const resumeBtn = screen.getByText(/Resume/i);
    fireEvent.click(resumeBtn);

    await waitFor(() => {
      expect(mockRetryWorkflowExecution).toHaveBeenCalledWith('exec_test_002');
    });
  });

  it('inspects step details when clicking DAG node', async () => {
    render(<WorkflowsPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getAllByText(/scan_documents/i).length).toBeGreaterThan(0);
    });

    // Pick the DAG node (which has "✓ scan_documents")
    const stepNode = screen.getByText(/✓ scan_documents/i);
    fireEvent.click(stepNode);

    await waitFor(() => {
      expect(screen.getByText(/Step Checkpoint Inspector/i)).toBeDefined();
      expect(screen.getByText(/Memoized Checkpoint Output:/i)).toBeDefined();
      expect(screen.getByText(/"files_found": 10/i)).toBeDefined();
    });
  });
});
