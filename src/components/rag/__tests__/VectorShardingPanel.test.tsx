import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/MagneticButton', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { VectorShardingPanel } from '../VectorShardingPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type {
  ShardTopologyResponse,
  RaftConsensusStatus,
  ScatterGatherResponse,
  ShardRebalancePlan,
} from '@/lib/rag-types';

describe('VectorShardingPanel Component (M117)', () => {
  const mockGetShardTopology = vi.fn();
  const mockGetRaftConsensusStatus = vi.fn();
  const mockQueryShardedVectors = vi.fn();
  const mockTriggerRaftElection = vi.fn();
  const mockRebalanceShards = vi.fn();
  const mockSnapshotShard = vi.fn();

  const mockClient = {
    tenantId: 'tn_test_sharding',
    getShardTopology: mockGetShardTopology,
    getRaftConsensusStatus: mockGetRaftConsensusStatus,
    queryShardedVectors: mockQueryShardedVectors,
    triggerRaftElection: mockTriggerRaftElection,
    rebalanceShards: mockRebalanceShards,
    snapshotShard: mockSnapshotShard,
  } as unknown as RetrieverClient;

  const sampleTopology: ShardTopologyResponse = {
    cluster_id: 'cluster_alpha',
    total_shards: 8,
    replication_factor: 3,
    shards: [
      {
        shard_id: 'shard_000',
        tenant_id: null,
        hash_range_start: 0,
        hash_range_end: 536870911,
        leader_node_id: 'node_core_01',
        replica_node_ids: ['node_core_02', 'node_core_03'],
        status: 'healthy',
        vector_count: 1250,
        index_size_bytes: 7680000,
        created_at: 1700000000,
        updated_at: 1700000000,
      },
      {
        shard_id: 'shard_001',
        tenant_id: null,
        hash_range_start: 536870912,
        hash_range_end: 1073741823,
        leader_node_id: 'node_core_02',
        replica_node_ids: ['node_core_01', 'node_core_03'],
        status: 'healthy',
        vector_count: 980,
        index_size_bytes: 6021120,
        created_at: 1700000000,
        updated_at: 1700000000,
      },
    ],
    skew_metrics: {
      cluster_id: 'cluster_alpha',
      node_distribution: { node_core_01: 1250, node_core_02: 980, node_core_03: 0 },
      mean_vectors_per_node: 743.3,
      skew_std_dev: 53.2,
      is_skewed: true,
    },
  };

  const sampleRaftStatus: RaftConsensusStatus = {
    cluster_id: 'cluster_alpha',
    current_term: 2,
    active_leader_id: 'node_core_01',
    total_nodes: 3,
    leader_elected: true,
    quorum_healthy: true,
    nodes: [
      {
        node_id: 'node_core_01',
        current_term: 2,
        role: 'leader',
        commit_index: 14,
        last_applied: 14,
        leader_id: 'node_core_01',
        log_length: 14,
        heartbeat_timestamp: Date.now() / 1000,
      },
      {
        node_id: 'node_core_02',
        current_term: 2,
        role: 'follower',
        commit_index: 14,
        last_applied: 14,
        leader_id: 'node_core_01',
        log_length: 14,
        heartbeat_timestamp: Date.now() / 1000,
      },
    ],
    recent_log_entries: [
      {
        index: 14,
        term: 2,
        command_type: 'INSERT_VECTORS',
        payload: { tenant_id: 'tn_test', vector_count: 10 },
        timestamp: Date.now() / 1000,
      },
    ],
  };

  const sampleQueryResponse: ScatterGatherResponse = {
    query_id: 'q_test_123',
    tenant_id: 'tn_test_sharding',
    total_shards_queried: 8,
    successful_shards: 8,
    quorum_achieved: true,
    total_latency_ms: 18.5,
    shard_breakdown: [
      {
        shard_id: 'shard_000',
        node_id: 'node_core_01',
        latency_ms: 4.2,
        candidates_count: 2,
        status: 'success',
      },
    ],
    results: [
      {
        chunk_id: 'chunk_alpha_1',
        score: 0.985,
        text: 'Distributed Raft consensus algorithm chunk.',
        metadata: { source: 'raft.pdf' },
        shard_id: 'shard_000',
        node_id: 'node_core_01',
      },
    ],
  };

  const sampleRebalancePlan: ShardRebalancePlan = {
    plan_id: 'reb_test_999',
    source_node_id: 'node_core_01',
    target_node_id: 'node_core_02',
    shard_id: 'shard_000',
    status: 'completed',
    vectors_transferred: 1250,
    total_vectors: 1250,
    start_time: Date.now() / 1000 - 5,
    completion_time: Date.now() / 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetShardTopology.mockResolvedValue(sampleTopology);
    mockGetRaftConsensusStatus.mockResolvedValue(sampleRaftStatus);
    mockQueryShardedVectors.mockResolvedValue(sampleQueryResponse);
    mockRebalanceShards.mockResolvedValue(sampleRebalancePlan);
  });

  it('renders correctly and displays cluster metrics', async () => {
    render(<VectorShardingPanel client={mockClient} tenantId="tn_test_sharding" />);

    expect(screen.getByText(/Vector Sharding & Raft Consensus/i)).toBeDefined();
    expect(screen.getByText(/Platform Battery #32/i)).toBeDefined();

    await waitFor(() => {
      expect(mockGetShardTopology).toHaveBeenCalledTimes(1);
      expect(mockGetRaftConsensusStatus).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Term 2/i)).toBeDefined();
  });

  it('switches to Raft Consensus tab and displays participant nodes', async () => {
    render(<VectorShardingPanel client={mockClient} tenantId="tn_test_sharding" />);

    await waitFor(() => {
      expect(mockGetRaftConsensusStatus).toHaveBeenCalled();
    });

    const raftTab = screen.getByRole('tab', { name: /Raft Consensus State/i });
    fireEvent.click(raftTab);

    expect(screen.getByText(/Cluster Consensus State Machine/i)).toBeDefined();
    expect(screen.getByText('node_core_01')).toBeDefined();
    expect(screen.getByText('LEADER')).toBeDefined();
  });

  it('executes scatter-gather query simulator', async () => {
    render(<VectorShardingPanel client={mockClient} tenantId="tn_test_sharding" />);

    await waitFor(() => {
      expect(mockGetShardTopology).toHaveBeenCalled();
    });

    const sgTab = screen.getByRole('tab', { name: /Scatter-Gather Benchmark/i });
    fireEvent.click(sgTab);

    const searchBtn = screen.getByRole('button', { name: /Execute Scatter-Gather/i });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(mockQueryShardedVectors).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Total Latency:/i)).toBeDefined();
    expect(screen.getByText(/Distributed Raft consensus algorithm chunk/i)).toBeDefined();
  });

  it('triggers cluster rebalancing', async () => {
    render(<VectorShardingPanel client={mockClient} tenantId="tn_test_sharding" />);

    await waitFor(() => {
      expect(mockGetShardTopology).toHaveBeenCalled();
    });

    const rebTab = screen.getByRole('tab', { name: /Cluster Rebalance/i });
    fireEvent.click(rebTab);

    const rebBtn = screen.getByRole('button', { name: /Trigger Auto-Rebalance/i });
    fireEvent.click(rebBtn);

    await waitFor(() => {
      expect(mockRebalanceShards).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/reb_test_999/i)).toBeDefined();
  });

  it('returns null when hidden is true', () => {
    const { container } = render(
      <VectorShardingPanel client={mockClient} tenantId="tn_test_sharding" hidden={true} />
    );
    expect(container.firstChild).toBeNull();
  });
});
