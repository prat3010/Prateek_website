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

import { MultiCloudPanel } from '../MultiCloudPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type {
  MultiCloudClusterOverviewResponse,
  RegionHealthProbe,
  FailoverResult,
  LibsqlReplicationStats,
  LibsqlReplicaConfig,
} from '@/lib/rag-types';

describe('MultiCloudPanel Component', () => {
  const mockGetMultiCloudClusters = vi.fn();
  const mockProbeMultiCloudRegions = vi.fn();
  const mockTriggerMultiCloudFailover = vi.fn();
  const mockGetLibsqlReplicationStatus = vi.fn();
  const mockGetTenantLibsqlConfig = vi.fn();
  const mockSyncTenantLibsqlReplica = vi.fn();

  const mockClient = {
    tenantId: 'tn_test_multicloud_123',
    getMultiCloudClusters: mockGetMultiCloudClusters,
    probeMultiCloudRegions: mockProbeMultiCloudRegions,
    triggerMultiCloudFailover: mockTriggerMultiCloudFailover,
    getLibsqlReplicationStatus: mockGetLibsqlReplicationStatus,
    getTenantLibsqlConfig: mockGetTenantLibsqlConfig,
    syncTenantLibsqlReplica: mockSyncTenantLibsqlReplica,
  } as unknown as RetrieverClient;

  const sampleOverview: MultiCloudClusterOverviewResponse = {
    topology: {
      cluster_id: 'cluster_test',
      active_leader_region: 'oci-bom',
      active_leader_node_id: 'node_oci_bom_01',
      generation_term: 1,
      total_nodes: 2,
      healthy_nodes: 2,
      quorum_state: 'consensus_reached',
      environment_mode: 'test',
      nodes: [
        {
          node_id: 'node_oci_bom_01',
          region: 'oci-bom',
          cloud_provider: 'oracle',
          role: 'primary_leader',
          endpoint_url: 'https://rag.prateeq.in',
          is_voting_member: true,
          priority_weight: 100,
          consecutive_failures: 0,
          latency_ms: 12.4,
          last_heartbeat_at: '2026-09-05T12:00:00Z',
        },
        {
          node_id: 'node_aws_iad_02',
          region: 'aws-iad',
          cloud_provider: 'aws',
          role: 'standby_replica',
          endpoint_url: 'https://iad.rag.prateeq.in',
          is_voting_member: true,
          priority_weight: 80,
          consecutive_failures: 0,
          latency_ms: 184.2,
          last_heartbeat_at: '2026-09-05T12:00:00Z',
        },
      ],
    },
    active_battery: {
      id: 'battery_19',
      name: 'multicloud_failover_libsql',
      status: 'active',
      algorithm_foundation: 'Raft / Paxos Quorum Consensus',
      latency_profile: 'Sub-1ms LibSQL read',
      milestone: 'Milestone 99',
    },
    probes_summary: {
      total_nodes: 2,
      healthy_count: 2,
      voting_quorum_ratio: '2/2',
      quorum_state: 'consensus_reached',
      environment_mode: 'test',
    },
  };

  const sampleProbes: RegionHealthProbe[] = [
    {
      node_id: 'node_oci_bom_01',
      region: 'oci-bom',
      probe_url: 'https://rag.prateeq.in/health/liveness',
      is_healthy: true,
      latency_ms: 11.8,
      status_code: 200,
      probed_at: '2026-09-05T12:00:00Z',
      is_simulated: false,
    },
    {
      node_id: 'node_aws_iad_02',
      region: 'aws-iad',
      probe_url: 'https://iad.rag.prateeq.in/health/liveness',
      is_healthy: true,
      latency_ms: 182.5,
      status_code: 200,
      probed_at: '2026-09-05T12:00:00Z',
      is_simulated: true,
    },
  ];

  const sampleFailoverResult: FailoverResult = {
    success: true,
    old_leader: 'oci-bom',
    new_leader: 'aws-iad',
    generation_term: 2,
    duration_ms: 45.2,
    quorum_votes_acquired: 3,
    total_voting_nodes: 4,
    quorum_state: 'consensus_reached',
    message: 'Failover successful',
    audit_event_id: 'evt_123',
  };

  const sampleReplicaConfig: LibsqlReplicaConfig = {
    tenant_id: 'tn_test_multicloud_123',
    primary_url: 'libsql://primary.rag.prateeq.in',
    replica_url: 'libsql://replica.rag.prateeq.in',
    auth_token: 'tkn_test',
    db_file_path: '/data/libsql/tenant_replica.db',
    sync_interval_seconds: 5,
    read_local: true,
    write_proxy_to_primary: true,
    replication_engine: 'turso_embedded',
  };

  const sampleReplicaStats: LibsqlReplicationStats = {
    tenant_id: 'tn_test_multicloud_123',
    primary_wal_frame: 41850,
    local_wal_frame: 41850,
    replication_lag_frames: 0,
    replication_lag_ms: 0.32,
    sync_status: 'synchronized',
    last_synced_at: '2026-09-05T12:05:10Z',
    is_embedded: true,
    writes_forwarded: 12,
    reads_served_locally: 540,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMultiCloudClusters.mockResolvedValue(sampleOverview);
    mockProbeMultiCloudRegions.mockResolvedValue(sampleProbes);
    mockTriggerMultiCloudFailover.mockResolvedValue(sampleFailoverResult);
    mockGetTenantLibsqlConfig.mockResolvedValue(sampleReplicaConfig);
    mockSyncTenantLibsqlReplica.mockResolvedValue(sampleReplicaStats);
  });

  it('renders nothing when hidden prop is true', () => {
    const { container } = render(<MultiCloudPanel hidden={true} client={mockClient} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title, badges, and metrics when visible', async () => {
    render(<MultiCloudPanel hidden={false} client={mockClient} tenantId="tn_test_multicloud_123" />);

    expect(
      screen.getByText(/Multi-Cloud Failover & Edge Turso LibSQL Quorum/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Milestone 99 • v0.84.0/i)).toBeInTheDocument();
    expect(screen.getByText(/Battery #19: Edge Distribution/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetMultiCloudClusters).toHaveBeenCalledTimes(1);
      expect(mockGetTenantLibsqlConfig).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers multi-cloud region probing', async () => {
    render(<MultiCloudPanel hidden={false} client={mockClient} />);

    const probeBtn = screen.getByRole('button', { name: /Probe All Regions/i });
    await waitFor(() => {
      expect(probeBtn).not.toBeDisabled();
    });
    fireEvent.click(probeBtn);

    await waitFor(() => {
      expect(mockProbeMultiCloudRegions).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Probed 2 multi-cloud regions successfully/i)
      ).toBeInTheDocument();
    });
  });

  it('executes quorum failover to elected target region', async () => {
    render(<MultiCloudPanel hidden={false} client={mockClient} />);

    const failoverBtn = screen.getByRole('button', { name: /Elect AWS-IAD as Leader/i });
    fireEvent.click(failoverBtn);

    await waitFor(() => {
      expect(mockTriggerMultiCloudFailover).toHaveBeenCalledWith({
        target_region: 'aws-iad',
        trigger_type: 'manual_operator',
        reason: 'Operator initiated multi-cloud failover drill',
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Failover successful! Region \[aws-iad\] elected leader/i)
      ).toBeInTheDocument();
    });
  });

  it('toggles primary Oracle BOM network partition simulation', () => {
    render(<MultiCloudPanel hidden={false} client={mockClient} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(
      screen.getByText(/Network partition injected on primary Oracle BOM/i)
    ).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(
      screen.getByText(/Oracle BOM connectivity restored/i)
    ).toBeInTheDocument();
  });

  it('triggers Turso LibSQL replica catch-up sync', async () => {
    render(<MultiCloudPanel hidden={false} client={mockClient} tenantId="tn_test_multicloud_123" />);

    const syncBtn = screen.getByRole('button', { name: /Trigger Replica Catch-up Sync/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(mockSyncTenantLibsqlReplica).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Replica synced. WAL Frame: 41850, Replication Lag: 0.32ms./i)
      ).toBeInTheDocument();
    });
  });
});
