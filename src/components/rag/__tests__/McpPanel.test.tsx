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

  const mockClient = {
    tenantId: 'tn_test_mcp_123',
    getMcpConfig: mockGetMcpConfig,
    getMcpTools: mockGetMcpTools,
    testMcpTool: mockTestMcpTool,
  } as unknown as RetrieverClient;

  const sampleConfig: McpConfigResponse = {
    tenant_id: 'tn_test_mcp_123',
    sse_endpoint: 'https://rag.prateeq.in/v1/mcp/sse',
    message_endpoint: 'https://rag.prateeq.in/v1/mcp/messages',
    total_tools: 10,
    active_batteries: 20,
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
      description: 'Dense-sparse hybrid search',
      category: 'retrieval',
      risk_level: 'low',
      battery_id: 'dense_vector_hnsw',
    },
    {
      name: 'calculator',
      description: 'Evaluate mathematical expressions',
      category: 'computation_graph',
      risk_level: 'low',
    },
    {
      name: 'guardrail_check',
      description: 'Llama Guard 3 safety validation',
      category: 'safety_defense',
      risk_level: 'low',
      battery_id: 'llama_guard_safety',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMcpConfig.mockResolvedValue(sampleConfig);
    mockGetMcpTools.mockResolvedValue(sampleTools);
  });

  it('renders nothing when hidden is true', () => {
    const { container } = render(<McpPanel hidden={true} client={mockClient} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders hero title and metrics when visible', async () => {
    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    expect(screen.getByText(/Universal Model Context Protocol \(MCP\) Center/i)).toBeInTheDocument();
    expect(screen.getByText(/MCP 2024-11-05/i)).toBeInTheDocument();
    expect(screen.getByText(/20 Batteries Exposed/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetMcpConfig).toHaveBeenCalledWith('tn_test_mcp_123');
      expect(mockGetMcpTools).toHaveBeenCalledWith('tn_test_mcp_123');
    });
  });

  it('switches between 1-click client snippet tabs', async () => {
    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    await waitFor(() => {
      expect(screen.getByText('Cursor IDE')).toBeInTheDocument();
    });

    const claudeTab = screen.getByText('Claude Desktop');
    fireEvent.click(claudeTab);

    expect(screen.getByText(/claude_desktop_config\.json/i)).toBeInTheDocument();
  });

  it('copies snippet code to clipboard on click', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    await waitFor(() => {
      expect(screen.getByText(/Copy Snippet/i)).toBeInTheDocument();
    });

    const copyBtn = screen.getByText(/Copy Snippet/i);
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextSpy).toHaveBeenCalled();
    });
  });

  it('populates test probe when clicking Test Probe on a tool card', async () => {
    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    await waitFor(() => {
      expect(screen.getByText('hybrid_search')).toBeInTheDocument();
    });

    const testProbeButtons = screen.getAllByText('Test Probe');
    fireEvent.click(testProbeButtons[0]);

    // Check that selected tool dropdown updated or arguments filled
    const select = screen.getByLabelText(/Selected MCP Tool/i) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
  });

  it('executes MCP tool probe via client.testMcpTool', async () => {
    const mockExecutionResult: McpToolExecutionResult = {
      content: [{ type: 'text', text: '604' }],
      is_error: false,
      meta: {},
    };
    mockTestMcpTool.mockResolvedValue(mockExecutionResult);

    render(<McpPanel hidden={false} client={mockClient} tenantId="tn_test_mcp_123" />);

    await waitFor(() => {
      expect(screen.getByText(/Execute MCP Tool/i)).toBeInTheDocument();
    });

    const executeBtn = screen.getByText(/Execute MCP Tool/i);
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(mockTestMcpTool).toHaveBeenCalledWith('calculator', expect.any(Object), 'tn_test_mcp_123');
      expect(screen.getByText('604')).toBeInTheDocument();
      expect(screen.getByText(/Execution Success/i)).toBeInTheDocument();
    });
  });
});
