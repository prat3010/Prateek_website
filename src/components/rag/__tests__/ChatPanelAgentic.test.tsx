import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

import { ChatPanel } from '../ChatPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type { ReActStreamEvent } from '@/lib/rag-types';

describe('ChatPanel ReAct Agentic Mode & Trace Visualizer', () => {
  const mockCreateSession = vi.fn();
  const mockStreamAgenticWorkflow = vi.fn();
  const mockChat = vi.fn();

  const mockClient = {
    createSession: mockCreateSession,
    streamAgenticWorkflow: mockStreamAgenticWorkflow,
    chat: mockChat,
  } as unknown as RetrieverClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateSession.mockResolvedValue({ sessionId: 'session-react-123' });
  });

  it('renders mode toggle button and toggles between Direct RAG and ReAct Agent', async () => {
    render(<ChatPanel client={mockClient} hidden={false} />);

    // Session auto-starts on mount or via click
    await waitFor(() => {
      expect(screen.getByText(/session: session-/i)).toBeInTheDocument();
    });

    // Default mode is Direct RAG
    const toggleBtn = screen.getByRole('button', { name: /direct rag/i });
    expect(toggleBtn).toBeInTheDocument();

    // Toggle to ReAct Agent
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /react agent/i })).toBeInTheDocument();

    // Toggle back
    fireEvent.click(screen.getByRole('button', { name: /react agent/i }));
    expect(screen.getByRole('button', { name: /direct rag/i })).toBeInTheDocument();
  });

  it('executes streamAgenticWorkflow and renders thought, tool calls, self-healing, and circuit-breaker in trace', async () => {
    mockStreamAgenticWorkflow.mockImplementation(
      async (prompt: string, onEvent: (ev: ReActStreamEvent) => void) => {
        // Emit thought event
        onEvent({
          event_id: 'ev_1',
          event_type: 'thought',
          step_index: 0,
          state: 'reasoning',
          data: { thought: 'I need to check system telemetry.' },
          timestamp: new Date().toISOString(),
        });

        // Emit tool call
        onEvent({
          event_id: 'ev_2',
          event_type: 'tool_start',
          step_index: 0,
          state: 'executing_battery',
          data: { tool_name: 'vector_search', arguments: { query: 'server status' } },
          timestamp: new Date().toISOString(),
        });

        // Emit tool done
        onEvent({
          event_id: 'ev_3',
          event_type: 'tool_done',
          step_index: 0,
          state: 'observing_result',
          data: {
            tool_name: 'vector_search',
            output: 'Found 3 servers active.',
            is_error: false,
            latency_ms: 45,
          },
          timestamp: new Date().toISOString(),
        });

        // Emit self healing
        onEvent({
          event_id: 'ev_4',
          event_type: 'self_healing',
          step_index: 0,
          state: 'self_healing',
          data: {
            tool_name: 'vector_search',
            error: 'None',
            recovery_action: 'Self healing verified',
          },
          timestamp: new Date().toISOString(),
        });

        // Emit circuit breaker tripped on step 1
        onEvent({
          event_id: 'ev_5',
          event_type: 'circuit_breaker',
          step_index: 1,
          state: 'evaluating_completion',
          data: {
            tool_name: 'vector_search',
            warning: 'Prevented loop on vector_search',
          },
          timestamp: new Date().toISOString(),
        });

        // Emit final answer
        onEvent({
          event_id: 'ev_6',
          event_type: 'final_answer',
          step_index: 1,
          state: 'completed',
          data: { final_answer: 'Systems are fully operational with 3 active nodes.' },
          timestamp: new Date().toISOString(),
        });

        return 'Systems are fully operational with 3 active nodes.';
      }
    );

    render(<ChatPanel client={mockClient} hidden={false} />);

    // Wait for session auto-start
    await waitFor(() => {
      expect(screen.getByText(/session: session-/i)).toBeInTheDocument();
    });

    // Switch to ReAct Agent mode
    fireEvent.click(screen.getByRole('button', { name: /direct rag/i }));
    expect(screen.getByRole('button', { name: /react agent/i })).toBeInTheDocument();

    // Type a prompt and send
    const input = screen.getByLabelText(/ask workspace knowledge base/i);
    fireEvent.change(input, { target: { value: 'What is the server status?' } });
    fireEvent.click(screen.getByRole('button', { name: /^send$/i }));

    // Verify streamAgenticWorkflow was called with prompt
    await waitFor(() => {
      expect(mockStreamAgenticWorkflow).toHaveBeenCalledWith(
        'What is the server status?',
        expect.any(Function),
        expect.any(Object)
      );
    });

    // Verify final answer is rendered
    await waitFor(() => {
      expect(
        screen.getByText('Systems are fully operational with 3 active nodes.')
      ).toBeInTheDocument();
    });

    // Verify trace accordion elements
    expect(screen.getByText(/⚡ ReAct Trace/i)).toBeInTheDocument();
    expect(screen.getAllByText(/🩹 Self-Healed/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/🛡️ Circuit Breaker/i)).toBeInTheDocument();
    expect(screen.getByText('I need to check system telemetry.')).toBeInTheDocument();
    expect(screen.getByText('vector_search')).toBeInTheDocument();
    expect(screen.getByText(/Prevented loop on vector_search/i)).toBeInTheDocument();
  });
});
