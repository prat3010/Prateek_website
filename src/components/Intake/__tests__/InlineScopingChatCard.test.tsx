import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { InlineScopingChatCard } from '../InlineScopingChatCard';

describe('InlineScopingChatCard Component', () => {
  const mockOnApplyBlueprint = vi.fn();
  const mockOnNavigateStep = vi.fn();
  const mockSetChatSessionId = vi.fn();
  const mockSetChatTranscript = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chat card header with Drop RFP button and quick prompts', () => {
    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId={null}
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={[]}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    expect(screen.getByText(/Conversational Scoping Copilot/i)).toBeDefined();
    expect(screen.getByText(/Drop RFP \/ PRD \(PDF\)/i)).toBeDefined();
    expect(screen.getByText(/Gaming YouTuber Merch & VIP/i)).toBeDefined();
    expect(screen.getByText(/SaaS MVP with Billing/i)).toBeDefined();
    expect(
      screen.getByPlaceholderText(/Describe your idea or ask a question/i)
    ).toBeDefined();
  });

  it('opens RFP modal when Drop RFP button is clicked', () => {
    render(
      <InlineScopingChatCard
        currency="INR"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId={null}
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={[]}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    const rfpButton = screen.getByRole('button', {
      name: /Upload RFP or PRD Document/i,
    });
    fireEvent.click(rfpButton);

    expect(screen.getByRole('dialog', { name: /Multimodal RFP \/ PRD Parser/i })).toBeDefined();
    expect(screen.getByText(/Drag & drop your RFP, PRD, or Architecture Doc here/i)).toBeDefined();
  });

  it('renders reset button when chat transcript has messages and triggers reset', () => {
    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId="session_123"
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={[
          { role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
          { role: 'assistant', content: 'Hi there!', timestamp: new Date().toISOString() },
        ]}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /Reset conversation/i });
    expect(resetBtn).toBeDefined();

    fireEvent.click(resetBtn);
    expect(mockSetChatSessionId).toHaveBeenCalledWith('');
    expect(mockSetChatTranscript).toHaveBeenCalledWith([]);
  });

  it('renders blueprint action card and calls onApplyBlueprint when applied', () => {
    const transcriptWithBlueprint = [
      {
        role: 'assistant',
        content:
          'Here is your plan:\n<blueprint_action>\n{\n  "archetypeId": "saas_app",\n  "baseEngineId": "saas",\n  "featureIds": ["auth", "admin"],\n  "suggestedTimeline": "3–4 Weeks",\n  "title": "B2B SaaS MVP",\n  "totalINR": 375000,\n  "totalUSD": 5050\n}\n</blueprint_action>',
        timestamp: new Date().toISOString(),
      },
    ];

    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId="session_123"
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={transcriptWithBlueprint}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    expect(screen.getByText(/B2B SaaS MVP/i)).toBeDefined();
    expect(screen.getByText(/Engine: SAAS/i)).toBeDefined();
    expect(screen.getByText(/\$5,050/i)).toBeDefined();

    const applyBtn = screen.getByRole('button', { name: /Apply Blueprint to Quote/i });
    fireEvent.click(applyBtn);

    expect(mockOnApplyBlueprint).toHaveBeenCalledTimes(1);
    expect(mockOnApplyBlueprint).toHaveBeenCalledWith(
      expect.objectContaining({
        archetypeId: 'saas_app',
        baseEngineId: 'saas',
        featureIds: ['auth', 'admin'],
      })
    );
  });

  it('sends message to /api/scoping/chat and updates session ID from header', async () => {
    const originalFetch = global.fetch;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"delta":"Hello there!"}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Content-Type': 'text/event-stream',
        'X-Session-ID': 'session_returned_456',
      }),
      body: stream,
    });

    try {
      render(
        <InlineScopingChatCard
          currency="USD"
          isNoir={false}
          onApplyBlueprint={mockOnApplyBlueprint}
          onNavigateStep={mockOnNavigateStep}
          chatSessionId={null}
          setChatSessionId={mockSetChatSessionId}
          chatTranscript={[]}
          setChatTranscript={mockSetChatTranscript}
        />
      );

      const textarea = screen.getByPlaceholderText(/Describe your idea or ask a question/i);
      fireEvent.change(textarea, { target: { value: 'Build me an app' } });

      const sendButton = screen.getByRole('button', { name: /Send message/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/scoping/chat',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              message: 'Build me an app',
              sessionId: null,
              currency: 'USD',
            }),
          })
        );
        expect(mockSetChatSessionId).toHaveBeenCalledWith('session_returned_456');
      });
    } finally {
      global.fetch = originalFetch;
    }
  });
});
