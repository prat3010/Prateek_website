import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RlmStudioPanel } from '../RlmStudioPanel';
import type { RetrieverClient } from '@/lib/rag-client';

describe('RlmStudioPanel Component', () => {
  const mockExecuteRlmSubroutine = vi.fn();
  const mockClient = {
    executeRlmSubroutine: mockExecuteRlmSubroutine,
  } as unknown as RetrieverClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with title and presets', () => {
    render(<RlmStudioPanel client={mockClient} />);
    expect(screen.getByText(/RLM Python REPL Studio/i)).toBeDefined();
    expect(screen.getByText(/Multi-Doc Compliance Audit/i)).toBeDefined();
    expect(screen.getByText(/Tabular Financial Extraction/i)).toBeDefined();
  });

  it('returns null when hidden is true', () => {
    const { container } = render(<RlmStudioPanel client={mockClient} hidden={true} />);
    expect(container.firstChild).toBeNull();
  });

  it('populates textarea and triggers execution on preset click', async () => {
    mockExecuteRlmSubroutine.mockResolvedValueOnce({
      tenant_id: 't1',
      prompt: 'Compliance audit',
      analysis_summary: 'Synthesized security audit findings successfully.',
      code_executions: [
        {
          code: 'result = len(chunks)',
          stdout: 'Processed 5 chunks',
          result: '5',
          is_error: false,
          execution_time_ms: 12.5,
        },
      ],
      subcalls_count: 2,
      execution_time_ms: 45.2,
    });

    render(<RlmStudioPanel client={mockClient} />);
    const presetBtn = screen.getByText(/Multi-Doc Compliance Audit/i);
    fireEvent.click(presetBtn);

    await waitFor(() => {
      expect(mockExecuteRlmSubroutine).toHaveBeenCalled();
      expect(screen.getByText(/Synthesized security audit findings successfully/i)).toBeDefined();
      expect(screen.getByText(/Subcalls: 2/i)).toBeDefined();
    });
  });

  it('switches between summary, code, and console tabs', async () => {
    mockExecuteRlmSubroutine.mockResolvedValueOnce({
      tenant_id: 't1',
      prompt: 'Test prompt',
      analysis_summary: 'Test summary report',
      code_executions: [
        {
          code: 'total = sum(c.score for c in chunks)',
          stdout: 'Calculated score sum: 4.8',
          result: '4.8',
          is_error: false,
          execution_time_ms: 8.0,
        },
      ],
      subcalls_count: 2,
      execution_time_ms: 25.0,
    });

    render(<RlmStudioPanel client={mockClient} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Analyze score statistics' } });

    const runBtn = screen.getByText(/Run RLM REPL Loop/i);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Test summary report/i)).toBeDefined();
    });

    // Switch to Code Tab
    const codeTabBtn = screen.getByText(/Generated Python Code/i);
    fireEvent.click(codeTabBtn);
    expect(screen.getByText(/total = sum\(c\.score for c in chunks\)/i)).toBeDefined();

    // Switch to Console Tab
    const consoleTabBtn = screen.getByText(/REPL Console \/ Stdout/i);
    fireEvent.click(consoleTabBtn);
    expect(screen.getByText(/Calculated score sum: 4.8/i)).toBeDefined();
  });

  it('renders multi-turn trace tabs when multiple code executions occur', async () => {
    mockExecuteRlmSubroutine.mockResolvedValueOnce({
      tenant_id: 't1',
      prompt: 'Multi turn task',
      analysis_summary: 'Multi-turn loop completed',
      code_executions: [
        {
          code: 'bad_code()',
          stdout: 'NameError: name bad_code is not defined',
          result: 'None',
          is_error: true,
          execution_time_ms: 5.0,
        },
        {
          code: 'good_code()',
          stdout: 'Success',
          result: '100',
          is_error: false,
          execution_time_ms: 6.0,
        },
      ],
      subcalls_count: 3,
      execution_time_ms: 50.0,
    });

    render(<RlmStudioPanel client={mockClient} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Run multi-turn test' } });

    const runBtn = screen.getByText(/Run RLM REPL Loop/i);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/Turn 1/i)).toBeDefined();
      expect(screen.getByText(/Turn 2/i)).toBeDefined();
    });

    // Check Turn 2 code
    const turn2Btn = screen.getByText(/Turn 2/i);
    fireEvent.click(turn2Btn);

    const codeTabBtn = screen.getByText(/Generated Python Code/i);
    fireEvent.click(codeTabBtn);
    expect(screen.getByText(/good_code\(\)/i)).toBeDefined();
  });

  it('handles and displays execution errors gracefully', async () => {
    mockExecuteRlmSubroutine.mockRejectedValueOnce(new Error('REPL Sandbox timeout occurred'));

    render(<RlmStudioPanel client={mockClient} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Trigger error' } });

    const runBtn = screen.getByText(/Run RLM REPL Loop/i);
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(screen.getByText(/REPL Sandbox timeout occurred/i)).toBeDefined();
    });
  });
});
