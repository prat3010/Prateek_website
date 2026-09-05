import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

vi.mock('@/components/ui/MagneticButton', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/TiltCard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { EdgeSyncPanel } from '../EdgeSyncPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type { EdgeNodeMetadata, EdgeSearchResponse, EdgeSyncConflictResolution } from '@/lib/rag-types';

describe('EdgeSyncPanel Component', () => {
  const mockGetEdgeNodes = vi.fn();
  const mockSearchEdgeSimulated = vi.fn();
  const mockDownloadEdgeBundle = vi.fn();
  const mockReconcileEdgeMutations = vi.fn();

  const mockClient = {
    tenantId: 'tn_test_edge_12345678',
    getEdgeNodes: mockGetEdgeNodes,
    searchEdgeSimulated: mockSearchEdgeSimulated,
    downloadEdgeBundle: mockDownloadEdgeBundle,
    reconcileEdgeMutations: mockReconcileEdgeMutations,
  } as unknown as RetrieverClient;

  const sampleNodes: EdgeNodeMetadata[] = [
    {
      node_id: 'node_edge_alpha_1234567890',
      tenant_id: 'tn_test_edge_12345678',
      device_name: 'Field Ops Node Alpha',
      platform: 'darwin-arm64',
      tier: 'hybrid_cache',
      last_synced_seq: 14,
      last_heartbeat_at: '2026-09-05T12:00:00Z',
      status: 'online',
    },
    {
      node_id: 'node_edge_beta_1234567890',
      tenant_id: 'tn_test_edge_12345678',
      device_name: 'Mobile Gateway Beta',
      platform: 'linux-x86_64',
      tier: 'local_slm',
      last_synced_seq: 10,
      last_heartbeat_at: '2026-09-05T11:30:00Z',
      status: 'offline',
    },
  ];

  const sampleSearchResponse: EdgeSearchResponse = {
    results: [
      {
        chunk_id: 'chk_edge_alpha',
        document_id: 'doc_edge_1',
        content: 'Sovereign Edge embedded SQLite engine provides sub-2ms local vector search.',
        score: 0.9452,
        vector_score: 0.92,
        bm25_score: 0.88,
        match_type: 'hybrid',
      },
    ],
    total_hits: 1,
    latency_ms: 1.84,
    source: 'local_sqlite',
    execution_tier: 'hybrid_cache',
    synthesized_answer: 'Simulated offline edge hybrid search retrieved 1 chunk with zero network dependency.',
  };

  const sampleResolution: EdgeSyncConflictResolution = {
    mutation_id: 'mut_test_1',
    status: 'applied',
    cloud_sequence: 43,
    resolution_strategy: 'last_write_wins',
    message: 'Applied without conflict',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEdgeNodes.mockResolvedValue(sampleNodes);
    mockSearchEdgeSimulated.mockResolvedValue(sampleSearchResponse);
    mockDownloadEdgeBundle.mockResolvedValue(new Blob(['SQLite format 3\0']));
    mockReconcileEdgeMutations.mockResolvedValue([sampleResolution]);
  });

  it('renders nothing when hidden prop is true', () => {
    const { container } = render(<EdgeSyncPanel hidden={true} client={mockClient} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title, description, and battery #18 badge when visible', async () => {
    render(<EdgeSyncPanel hidden={false} client={mockClient} />);

    expect(
      screen.getByText(/Sovereign Edge SQLite & Offline-First Node Sync/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Milestone 98 \(Platform Battery #18\)/i)
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Platform Battery #18/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetEdgeNodes).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles network partition simulator state', () => {
    render(<EdgeSyncPanel hidden={false} client={mockClient} />);

    const partitionToggle = screen.getByTitle('Simulate network isolation');
    expect(partitionToggle).toHaveTextContent(/🟢 Cloud Connected/i);

    fireEvent.click(partitionToggle);
    expect(partitionToggle).toHaveTextContent(/🔴 Network Partitioned/i);

    fireEvent.click(partitionToggle);
    expect(partitionToggle).toHaveTextContent(/🟢 Cloud Connected/i);
  });

  it('displays fetched edge nodes in table', async () => {
    render(<EdgeSyncPanel hidden={false} client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText('Field Ops Node Alpha')).toBeInTheDocument();
      expect(screen.getByText('Mobile Gateway Beta')).toBeInTheDocument();
    });
  });

  it('executes edge search simulation and displays results', async () => {
    render(<EdgeSyncPanel hidden={false} client={mockClient} />);

    const searchBtn = screen.getByRole('button', { name: /^Simulate$/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(mockSearchEdgeSimulated).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.any(String),
          top_k: 4,
          use_hybrid: true,
          alpha: 0.5,
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Sovereign Edge embedded SQLite engine provides sub-2ms local vector search./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/1.84ms/i)).toBeInTheDocument();
    });
  });

  it('handles 1-click standalone .sqlite bundle export', async () => {
    const originalCreate = window.URL.createObjectURL;
    const originalRevoke = window.URL.revokeObjectURL;
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-sqlite');
    window.URL.revokeObjectURL = vi.fn();

    render(<EdgeSyncPanel hidden={false} client={mockClient} />);

    const exportBtn = screen.getByRole('button', { name: /💾 Export \.sqlite Bundle/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(mockDownloadEdgeBundle).toHaveBeenCalledTimes(1);
    });

    window.URL.createObjectURL = originalCreate;
    window.URL.revokeObjectURL = originalRevoke;
  });

  it('simulates offline mutation reconciliation', async () => {
    render(<EdgeSyncPanel hidden={false} client={mockClient} />);

    const mutateBtn = screen.getByRole('button', { name: /📝 Record & Sync Offline Mutation/i });
    fireEvent.click(mutateBtn);

    await waitFor(() => {
      expect(mockReconcileEdgeMutations).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            node_id: 'node_field_mac',
            action: 'insert',
            lamport_timestamp: 42,
          }),
        ])
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Offline mutation reconciled \(last_write_wins: applied\)!/i)
      ).toBeInTheDocument();
    });
  });
});
