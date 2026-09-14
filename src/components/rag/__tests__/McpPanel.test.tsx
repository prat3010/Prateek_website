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

import { McpPanel } from '../McpPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type { McpConfigResponse, McpToolSummary, McpToolExecutionResult } from '@/lib/rag-types';

describe('McpPanel Component', () => {
  const mockGetMcpConfig = vi.fn();
  const mockGetMcpTools = vi.fn();
  const mockTestMcpTool = vi.fn();
  const mockGetMeshStatus = vi.fn();
  const mockListMeshNodes = vi.fn();
  const mockListMeshTools = vi.fn();
  const mockExecuteMeshTool = vi.fn();
  const mockDelegateFederatedTask = vi.fn();
  const mockGetMeshLoadMetrics = vi.fn();
  const mockGetAutoscalingEvents = vi.fn();
  const mockUpdateAutoscalingPolicy = vi.fn();
  const mockReapIdleEnclaves = vi.fn();

  const mockClient = {
    tenantId: 'tn_test_mcp_123',
    getMcpConfig: mockGetMcpConfig,
    getMcpTools: mockGetMcpTools,
    testMcpTool: mockTestMcpTool,
    getMeshStatus: mockGetMeshStatus,
    listMeshNodes: mockListMeshNodes,
    listMeshTools: mockListMeshTools,
    executeMeshTool: mockExecuteMeshTool,
    delegateFederatedTask: mockDelegateFederatedTask,
    getMeshLoadMetrics: mockGetMeshLoadMetrics,
    getAutoscalingEvents: mockGetAutoscalingEvents,
    updateAutoscalingPolicy: mockUpdateAutoscalingPolicy,
    reapIdleEnclaves: mockReapIdleEnclaves,
  } as unknown as RetrieverClient;

  const sampleConfig: McpConfigResponse = {
    tenant_id: 'tn_test_mcp_123',
    sse_endpoint: 'https://rag.prateeq.in/v1/mcp/sse',
    message_endpoint: 'https://rag.prateeq.in/v1/mcp/messages',
    total_tools: 10,
    active_batteries: 31,
    cursor_config: { mcpServers: { retriever: { url: 'https://rag.prateeq.in/v1/mcp/sse' } } },
    claude_desktop_config: { mcpServers: { retriever: { command: 'npx' } } },
    cline_config: { mcpServers: { retriever: { url: 'https://rag.prateeq.in/v1/mcp/sse' } } },
    snippets: [
      {
        name: 'Cursor IDE',
        filename: '.cursor/mcp.json',
        language: 'json',
        code: '{\n  "mcpServers": { "retriever": {} }\n}',
        description: 'Cursor snippet description',
      },
      {
        name: 'Claude Desktop',
        filename: 'claude_desktop_config.json',
        language: 'json',
        code: '{\n  "mcpServers": { "claude": {} }\n}',
        description: 'Claude Desktop snippet description',
      },
    ],
  };

  const sampleTools: McpToolSummary[] = [
    {
      name: 'hybrid_search',
      description: 'Hybrid vector search',
      category: 'retrieval',
      risk_level: 'low',
    },
    {
      name: 'calculator',
      description: 'Math calculation',
      category: 'computation_graph',
      risk_level: 'low',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMcpConfig.mockResolvedValue(sampleConfig);
    mockGetMcpTools.mockResolvedValue(sampleTools);
    mockGetMeshStatus.mockResolvedValue({
      battery_id: 'distributed_mcp_mesh',
      status: 'active',
      total_nodes: 3,
      active_nodes: 3,
      total_mesh_tools: 10,
      routing_policy: 'local_first',
      nodes: [],
    });
    mockListMeshNodes.mockResolvedValue([]);
    mockListMeshTools.mockResolvedValue(sampleTools);
    mockGetMeshLoadMetrics.mockResolvedValue(null);
    mockGetAutoscalingEvents.mockResolvedValue([]);
    mockUpdateAutoscalingPolicy.mockResolvedValue({
      scale_up_utilization_pct: 75.0,
      scale_up_queue_depth: 8,
      scale_up_latency_ms: 220.0,
      scale_down_idle_seconds: 180.0,
      min_enclaves: 0,
      max_ephemeral_enclaves: 6,
      load_shedding_threshold_pct: 95.0,
    });
    mockReapIdleEnclaves.mockResolvedValue([
      {
        event_id: 'evt_reap_test_01',
        timestamp: Date.now(),
        cluster_id: 'cluster_primary',
        action: 'scale_down',
        reason: 'Terminated idle enclave',
        node_id: 'ephemeral_enclave_01',
        trigger_metric: 'ephemeral_idle_seconds',
        metric_value: 320.0,
      },
    ]);
  });

  it('renders hero title and Battery #30 & #31 badges when visible', async () => {
    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    expect(screen.getByText(/Distributed MCP Mesh & Agent Federation/i)).toBeInTheDocument();
    expect(screen.getByText(/Batteries #30 & #31/i)).toBeInTheDocument();
    expect(screen.getByText(/JSON-RPC 2.0 \/ SSE/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetMcpConfig).toHaveBeenCalledWith('tn_test_mcp_123');
    });
  });

  it('renders decentralized cluster topology and node cards in mesh view', async () => {
    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    expect(screen.getByText(/Decentralized Cluster Topology/i)).toBeInTheDocument();
    expect(screen.getByText('node_us_gateway')).toBeInTheDocument();
    expect(screen.getByText('node_eu_sovereign_01')).toBeInTheDocument();
  });

  it('dispatches distributed tool execution over mesh', async () => {
    mockExecuteMeshTool.mockResolvedValue({
      content: [{ type: 'text', text: 'Executed gdpr_residency_audit on EU Sovereign Node' }],
      is_error: false,
      meta: { routed_node: 'node_eu_sovereign_01', cluster_id: 'cluster_eu_enclave' },
    });

    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    const dispatchBtn = screen.getByText(/Dispatch via Mesh/i);
    fireEvent.click(dispatchBtn);

    await waitFor(() => {
      expect(mockExecuteMeshTool).toHaveBeenCalledWith(
        'gdpr_residency_audit',
        expect.any(Object),
        'cluster_eu_enclave',
        'local_first'
      );
      expect(screen.getByText(/Executed gdpr_residency_audit on EU Sovereign Node/i)).toBeInTheDocument();
      expect(screen.getByText(/Routed Successfully/i)).toBeInTheDocument();
    });
  });

  it('switches to Cross-Cluster Agent Federation view and delegates task', async () => {
    mockDelegateFederatedTask.mockResolvedValue({
      delegation_id: 'del_test_999',
      status: 'completed',
      source_cluster_id: 'cluster_us_primary',
      target_cluster_id: 'cluster_eu_enclave',
      tenant_id: 'tn_test_mcp_123',
      synthesis: 'Sovereign data residency validated with zero leaks.',
      tool_trace_summary: [{ tool: 'sovereign_auditor', status: 'success' }],
      execution_latency_ms: 32.1,
      signature: 'hmac_sig_test',
    });

    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    const fedTab = screen.getByText(/Cross-Cluster Agent Federation/i);
    fireEvent.click(fedTab);

    expect(screen.getByText(/Cross-Cluster Agent Delegation Cockpit/i)).toBeInTheDocument();

    const delegateBtn = screen.getByText(/Delegate to Remote Cluster/i);
    fireEvent.click(delegateBtn);

    await waitFor(() => {
      expect(mockDelegateFederatedTask).toHaveBeenCalledWith(
        expect.objectContaining({
          target_cluster_id: 'cluster_eu_enclave',
          target_agent_role: 'forensic_auditor',
        })
      );
      expect(screen.getByText(/Sovereign data residency validated with zero leaks/i)).toBeInTheDocument();
      expect(screen.getByText(/Task Completed on cluster_eu_enclave/i)).toBeInTheDocument();
    });
  });

  it('tests circular loop breaker in federation view and halts safely', async () => {
    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    const fedTab = screen.getByText(/Cross-Cluster Agent Federation/i);
    fireEvent.click(fedTab);

    const loopBtn = screen.getByText(/Test Circular Loop Breaker/i);
    fireEvent.click(loopBtn);

    await waitFor(() => {
      expect(screen.getByText(/Safety Guard Triggered/i)).toBeInTheDocument();
      expect(screen.getByText(/Circular delegation loop detected/i)).toBeInTheDocument();
    });
  });

  it('switches to Dynamic Load & Enclaves (Battery #31) view and manages autoscaling', async () => {
    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    const loadTab = screen.getByText(/Dynamic Load & Enclaves/i);
    fireEvent.click(loadTab);

    expect(screen.getByText(/Live Enclave Concurrency & Node Telemetry/i)).toBeInTheDocument();
    expect(screen.getByText(/Autonomous Scaling & Load-Shedding Policy/i)).toBeInTheDocument();
    expect(screen.getByText(/Autoscaling & Load-Shedding Event Ledger/i)).toBeInTheDocument();

    // Test Save Policy Config button
    const saveBtn = screen.getByText(/Save Policy Config/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateAutoscalingPolicy).toHaveBeenCalled();
      expect(screen.getByText(/Autoscaling policy updated and active across mesh/i)).toBeInTheDocument();
    });

    // Test Evaluate & Reap Idle Enclaves button
    const reapBtn = screen.getByText(/Evaluate & Reap Idle Enclaves/i);
    fireEvent.click(reapBtn);

    await waitFor(() => {
      expect(mockReapIdleEnclaves).toHaveBeenCalledWith('cluster_primary');
      expect(screen.getByText(/Reaped 1 idle enclave\(s\) successfully/i)).toBeInTheDocument();
    });
  });

  it('switches to IDE Config view and displays 1-click snippets and tool registry', async () => {
    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    const ideTab = screen.getByText(/IDE Config & Stdio/i);
    fireEvent.click(ideTab);

    expect(screen.getByText(/1-Click IDE & Agent Configurations/i)).toBeInTheDocument();
    expect(screen.getByText('Cursor IDE')).toBeInTheDocument();

    const claudeTab = screen.getByText('Claude Desktop');
    fireEvent.click(claudeTab);

    expect(screen.getByText(/claude_desktop_config\.json/i)).toBeInTheDocument();
  });
});

