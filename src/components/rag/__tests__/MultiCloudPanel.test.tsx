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
      active_leader: 'oracle-bom',
      generation_term: 1,
      quorum_state: 'quorum_established',
      nodes: [
        {
          region: 'oracle-bom',
          provider: 'oracle',
          role: 'leader',
          endpoint: 'https://rag.prateeq.in',
          is_active: true,
          weight: 100,
          health_status: 'healthy',
          consecutive_failures: 0,
          last_probe_ms: 12.4,
        },
        {
          region: 'aws-iad',
          provider: 'aws',
          role: 'standby',
          endpoint: 'https://iad.rag.prateeq.in',
          is_active: true,
          weight: 80,
          health_status: 'healthy',
          consecutive_failures: 0,
          last_probe_ms: 184.2,
        },
      ],
    },
    battery_registered: true,
    total_active_regions: 2,
  };

  const sampleProbes: RegionHealthProbe[] = [
    {
      region: 'oracle-bom',
      is_healthy: true,
      latency_ms: 11.8,
      http_status: 200,
      checked_at: '2026-09-05T12:00:00Z',
      is_simulated: false,
    },
    {
      region: 'aws-iad',
      is_healthy: true,
      latency_ms: 182.5,
      http_status: 200,
      checked_at: '2026-09-05T12:00:00Z',
      is_simulated: true,
    },
  ];

  const sampleFailoverResult: FailoverResult = {
    success: true,
    previous_leader: 'oracle-bom',
    new_leader: 'aws-iad',
    generation_term: 2,
    quorum_votes_acquired: 3,
    transition_timestamp: '2026-09-05T12:05:00Z',
    error_details: null,
  };

  const sampleReplicaConfig: LibsqlReplicaConfig = {
    tenant_id: 'tn_test_multicloud_123',
    primary_url: 'libsql://primary.rag.prateeq.in',
    replica_path: '/data/libsql/tenant_replica.db',
    sync_interval_seconds: 5,
    read_your_writes: true,
    embedded_replica_enabled: true,
  };

  const sampleReplicaStats: LibsqlReplicationStats = {
    tenant_id: 'tn_test_multicloud_123',
    current_wal_frame: 41850,
    applied_wal_frame: 41850,
    replication_lag_ms: 0.32,
    last_sync_timestamp: '2026-09-05T12:05:10Z',
    is_synchronized: true,
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
