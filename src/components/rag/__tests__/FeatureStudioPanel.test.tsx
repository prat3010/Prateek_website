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

import { FeatureStudioPanel } from '../FeatureStudioPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type { ScaffoldingPlan, CustomPluginSummary } from '@/lib/rag-types';

describe('FeatureStudioPanel Component', () => {
  const mockGenerateScaffoldingPlan = vi.fn();
  const mockApplyScaffoldingPlan = vi.fn();
  const mockListCustomPlugins = vi.fn();
  const mockDeleteCustomPlugin = vi.fn();

  const mockClient = {
    generateScaffoldingPlan: mockGenerateScaffoldingPlan,
    applyScaffoldingPlan: mockApplyScaffoldingPlan,
    listCustomPlugins: mockListCustomPlugins,
    deleteCustomPlugin: mockDeleteCustomPlugin,
  } as unknown as RetrieverClient;

  const samplePlugins: CustomPluginSummary[] = [
    {
      plugin_id: 'hubspot_crm_sync',
      display_name: 'HubSpot CRM Sync',
      version: '0.1.0',
      category: 'connectors',
      persona: 'fde_engineer',
      description: 'Bidirectional sync with HubSpot contacts and deals.',
      is_active: true,
    },
  ];

  const samplePlan: ScaffoldingPlan = {
    plugin_id: 'custom_lead_scorer',
    display_name: 'Custom Lead Scorer',
    description: 'Computes AI lead priority based on interaction vectors.',
    persona: 'fde_engineer',
    manifest: {
      id: 'custom_lead_scorer',
      name: 'Custom Lead Scorer',
      version: '0.1.0',
      category: 'computation',
      persona: 'fde_engineer',
      description: 'Computes AI lead priority based on interaction vectors.',
      algorithm_foundation: 'Cosine similarity',
      latency_profile: 'p95 < 20ms',
      integration_hooks: {
        api_router: 'v1/plugins/custom_lead_scorer',
        battery_service: true,
      },
      required_secrets: [],
      tenant_isolation: 'strict',
    },
    recommended_batteries: [
      {
        battery_id: 'hybrid_search_bm25_pgvector',
        battery_name: 'Hybrid Search (BM25 + pgvector)',
        category: 'retrieval',
        match_confidence: 0.95,
        rationale: 'High overlap with vector similarity ranking.',
      },
    ],
    needs_custom_scaffold: true,
    scaffolded_files: [
      {
        rel_path: 'domain/abstractions.py',
        content: '# Abstractions slice\nfrom typing import Protocol',
        module_type: 'abstractions',
      },
      {
        rel_path: 'domain/service.py',
        content: '# Service slice\nclass LeadScorerService: pass',
        module_type: 'service',
      },
    ],
    ast_audit_passed: true,
    git_branch_name: 'feat/plugin-custom_lead_scorer',
    pull_request_markdown: '## Pull Request: Custom Lead Scorer\nHexagonal slice verified.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockListCustomPlugins.mockResolvedValue(samplePlugins);
    mockGenerateScaffoldingPlan.mockResolvedValue(samplePlan);
    mockApplyScaffoldingPlan.mockResolvedValue({
      success: true,
      applied: true,
      dry_run: false,
      plugin_id: 'custom_lead_scorer',
      files_written: ['domain/abstractions.py', 'domain/service.py'],
      mounted: true,
    });
    mockDeleteCustomPlugin.mockResolvedValue({ success: true, plugin_id: 'hubspot_crm_sync' });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('renders correctly and loads custom plugins', async () => {
    render(<FeatureStudioPanel client={mockClient} />);

    expect(screen.getByText('Autonomous FDE Metaprogrammer')).toBeDefined();
    expect(screen.getByText('💼 Business / Low-Code')).toBeDefined();
    expect(screen.getByText('⚡ FDE Metaprogrammer')).toBeDefined();

    await waitFor(() => {
      expect(mockListCustomPlugins).toHaveBeenCalledTimes(1);
      expect(screen.getByText('HubSpot CRM Sync')).toBeDefined();
      expect(screen.getByText('MOUNTED')).toBeDefined();
    });
  });

  it('returns null when hidden is true', () => {
    const { container } = render(<FeatureStudioPanel client={mockClient} hidden={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('toggles between personas', () => {
    render(<FeatureStudioPanel client={mockClient} />);

    const businessBtn = screen.getByText('💼 Business / Low-Code');
    fireEvent.click(businessBtn);

    expect(screen.getByText('Describe Desired Workflow or Capability')).toBeDefined();
    expect(screen.getByText('Zero-Code Battery Matching')).toBeDefined();

    const fdeBtn = screen.getByText('⚡ FDE Metaprogrammer');
    fireEvent.click(fdeBtn);

    expect(screen.getByText('Hexagonal Feature Specification')).toBeDefined();
    expect(screen.getByText('AST Security Gated')).toBeDefined();
  });

  it('shows error message if prompt is empty', async () => {
    render(<FeatureStudioPanel client={mockClient} />);

    const synthesizeBtn = screen.getByText('Generate Hexagonal Slice');
    // Button is disabled when prompt is empty
    expect(synthesizeBtn.closest('button')?.disabled).toBe(true);
  });

  it('synthesizes scaffolding plan and reveals AST gate & code slices', async () => {
    render(<FeatureStudioPanel client={mockClient} />);

    const textarea = screen.getByPlaceholderText(/Ingest webhook events/i);
    fireEvent.change(textarea, { target: { value: 'Build a custom lead scorer for enterprise sales.' } });

    const synthesizeBtn = screen.getByText('Generate Hexagonal Slice');
    fireEvent.click(synthesizeBtn);

    await waitFor(() => {
      expect(mockGenerateScaffoldingPlan).toHaveBeenCalledWith({
        prompt: 'Build a custom lead scorer for enterprise sales.',
        target_domain: 'crm',
        persona: 'fde_engineer',
      });
      expect(screen.getByText('Hexagonal Boundary Verified')).toBeDefined();
      expect(screen.getByText('0 Framework imports in domain slice')).toBeDefined();
      expect(screen.getByText('Hybrid Search (BM25 + pgvector)')).toBeDefined();
      expect(screen.getByText('domain/abstractions.py')).toBeDefined();
      expect(screen.getByText('domain/service.py')).toBeDefined();
    });
  });

  it('allows switching file tabs in the code slice viewer', async () => {
    render(<FeatureStudioPanel client={mockClient} />);

    const textarea = screen.getByPlaceholderText(/Ingest webhook events/i);
    fireEvent.change(textarea, { target: { value: 'Build lead scorer' } });
    fireEvent.click(screen.getByText('Generate Hexagonal Slice'));

    await waitFor(() => {
      expect(screen.getByText('domain/abstractions.py')).toBeDefined();
    });

    // Default was abstractions.py
    expect(screen.getByText(/# Abstractions slice/i)).toBeDefined();

    // Click domain/service.py tab
    const serviceTab = screen.getByText('domain/service.py');
    fireEvent.click(serviceTab);

    expect(screen.getByText(/# Service slice/i)).toBeDefined();
  });

  it('opens community PR modal and copies PR markdown', async () => {
    render(<FeatureStudioPanel client={mockClient} />);

    const textarea = screen.getByPlaceholderText(/Ingest webhook events/i);
    fireEvent.change(textarea, { target: { value: 'Build lead scorer' } });
    fireEvent.click(screen.getByText('Generate Hexagonal Slice'));

    await waitFor(() => {
      expect(screen.getByText('Community PR')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Community PR'));

    expect(screen.getByText('Community Pull Request Generator')).toBeDefined();
    expect(screen.getByText(/git checkout -b feat\/plugin-custom_lead_scorer/i)).toBeDefined();

    const copyBtn = screen.getByText('📋 Copy PR Markdown');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(samplePlan.pull_request_markdown);
  });

  it('deploys scaffolded slice to workspace', async () => {
    render(<FeatureStudioPanel client={mockClient} />);

    const textarea = screen.getByPlaceholderText(/Ingest webhook events/i);
    fireEvent.change(textarea, { target: { value: 'Build lead scorer' } });
    fireEvent.click(screen.getByText('Generate Hexagonal Slice'));

    await waitFor(() => {
      expect(screen.getByText('Deploy Slice')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Deploy Slice'));

    await waitFor(() => {
      expect(mockApplyScaffoldingPlan).toHaveBeenCalledWith(samplePlan);
      expect(screen.getByText(/Deployed plugin 'custom_lead_scorer' successfully!/i)).toBeDefined();
      expect(mockListCustomPlugins).toHaveBeenCalledTimes(2);
    });
  });

  it('deletes an installed plugin', async () => {
    render(<FeatureStudioPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText('Uninstall')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Uninstall'));

    await waitFor(() => {
      expect(mockDeleteCustomPlugin).toHaveBeenCalledWith('hubspot_crm_sync');
      expect(mockListCustomPlugins).toHaveBeenCalledTimes(2);
    });
  });
});
