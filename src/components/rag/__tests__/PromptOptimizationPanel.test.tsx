import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromptOptimizationPanel } from '../PromptOptimizationPanel';
import type { RetrieverClient } from '@/lib/rag-client';

describe('PromptOptimizationPanel Component', () => {
  const mockGetCompiledPrompts = vi.fn();
  const mockGetActiveCompiledPrompt = vi.fn();
  const mockCompilePrompt = vi.fn();
  const mockActivateCompiledPrompt = vi.fn();
  const mockDeactivateCompiledPrompt = vi.fn();
  const mockDeleteCompiledPrompt = vi.fn();

  const mockClient = {
    getCompiledPrompts: mockGetCompiledPrompts,
    getActiveCompiledPrompt: mockGetActiveCompiledPrompt,
    compilePrompt: mockCompilePrompt,
    activateCompiledPrompt: mockActivateCompiledPrompt,
    deactivateCompiledPrompt: mockDeactivateCompiledPrompt,
    deleteCompiledPrompt: mockDeleteCompiledPrompt,
  } as unknown as RetrieverClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with title and controls', () => {
    mockGetCompiledPrompts.mockResolvedValueOnce([]);
    mockGetActiveCompiledPrompt.mockResolvedValueOnce(null);

    render(<PromptOptimizationPanel client={mockClient} />);
    expect(screen.getByText(/DSPy Declarative Prompt Optimization Studio/i)).toBeDefined();
    expect(screen.getByText(/Teleprompter Optimization Cockpit/i)).toBeDefined();
    expect(screen.getByText(/Compile & Optimize Prompt/i)).toBeDefined();
  });

  it('returns null when hidden is true', () => {
    const { container } = render(<PromptOptimizationPanel client={mockClient} hidden={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays active compiled prompt program and demonstrations', async () => {
    const activeProg = {
      program_id: 'prog_active_01',
      tenant_id: 'tenant_test',
      name: 'support_cot_v1',
      signature_name: 'RAGAnswerSignature',
      optimizer: 'BootstrapFewShot',
      baseline_score: 0.65,
      compiled_score: 0.88,
      improvement_pct: 35.38,
      metric_name: 'composite',
      compiled_instruction: 'Answer accurately using verified sources.',
      few_shot_demos: [
        {
          question: 'What is the return window?',
          context: 'Return window is 30 calendar days.',
          thought: 'Extract 30 days.',
          answer: '30 calendar days.',
          score: 1.0,
        },
      ],
      is_active: true,
      created_at: new Date().toISOString(),
    };

    mockGetCompiledPrompts.mockResolvedValue([activeProg]);
    mockGetActiveCompiledPrompt.mockResolvedValue(activeProg);

    render(<PromptOptimizationPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText('DSPy Program Active')).toBeDefined();
      expect(screen.getAllByText(/support_cot_v1/i).length).toBeGreaterThanOrEqual(1);
    });

    const toggleBtn = screen.getByRole('button', { name: /View Demos|Hide Demos/i });
    if (toggleBtn.textContent?.includes('View Demos')) {
      fireEvent.click(toggleBtn);
    }

    await waitFor(() => {
      expect(screen.getByText(/What is the return window\?/i)).toBeDefined();
    });
  });

  it('triggers compilation and updates results', async () => {
    mockGetCompiledPrompts.mockResolvedValue([
      {
        program_id: 'prog_new_01',
        tenant_id: 'tenant_test',
        name: 'custom_mipro_prog',
        signature_name: 'RAGAnswerSignature',
        optimizer: 'MIPROv2',
        baseline_score: 0.60,
        compiled_score: 0.85,
        improvement_pct: 41.67,
        metric_name: 'composite',
        compiled_instruction: 'MIPRO optimized instructions.',
        few_shot_demos: [],
        is_active: false,
        created_at: new Date().toISOString(),
      },
    ]);
    mockGetActiveCompiledPrompt.mockResolvedValue(null);
    mockCompilePrompt.mockResolvedValueOnce({
      program_id: 'prog_new_01',
      tenant_id: 'tenant_test',
      name: 'custom_mipro_prog',
      signature_name: 'RAGAnswerSignature',
      optimizer: 'MIPROv2',
      baseline_score: 0.60,
      compiled_score: 0.85,
      improvement_pct: 41.67,
      metric_name: 'composite',
      compiled_instruction: 'MIPRO optimized instructions.',
      few_shot_demos: [],
      is_active: false,
      created_at: new Date().toISOString(),
    });

    render(<PromptOptimizationPanel client={mockClient} />);

    const compileBtn = screen.getByText(/Compile & Optimize Prompt/i);
    fireEvent.click(compileBtn);

    await waitFor(() => {
      expect(mockCompilePrompt).toHaveBeenCalled();
      expect(screen.getByText(/Optimization Success: custom_mipro_prog/i)).toBeDefined();
    });
  });

  it('handles activation and deactivation toggling', async () => {
    const prog = {
      program_id: 'prog_to_activate',
      tenant_id: 'tenant_test',
      name: 'inactive_prog',
      signature_name: 'RAGAnswerSignature',
      optimizer: 'BootstrapFewShot',
      baseline_score: 0.70,
      compiled_score: 0.89,
      improvement_pct: 27.14,
      metric_name: 'composite',
      compiled_instruction: 'Instruction text',
      few_shot_demos: [],
      is_active: false,
      created_at: new Date().toISOString(),
    };

    mockGetCompiledPrompts.mockResolvedValue([prog]);
    mockGetActiveCompiledPrompt.mockResolvedValue(null);
    mockActivateCompiledPrompt.mockResolvedValueOnce({ ...prog, is_active: true });

    render(<PromptOptimizationPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText(/inactive_prog/i)).toBeDefined();
    });

    const activateBtn = screen.getByRole('button', { name: /Activate/i });
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(mockActivateCompiledPrompt).toHaveBeenCalledWith('prog_to_activate');
    });
  });
});
