import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

let mockUser: { email: string } | null = null;
const mockLoginWithGoogle = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loginWithGoogle: mockLoginWithGoogle,
    getAccessToken: vi.fn(),
  }),
}));

import { InlineScopingChatCard } from '../InlineScopingChatCard';

describe('InlineScopingChatCard Component', () => {
  const mockOnApplyBlueprint = vi.fn();
  const mockOnNavigateStep = vi.fn();
  const mockSetChatSessionId = vi.fn();
  const mockSetChatTranscript = vi.fn();

  beforeEach(() => {
    mockUser = null;
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
    expect(screen.getByText(/Sculpt Lean MVP/i)).toBeDefined();
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

  it('renders dual Phase 1 MVP and Full Scope cards and allows applying Phase 1 only', () => {
    const transcriptWithPhased = [
      {
        role: 'assistant',
        content: `Here is your phased plan:
<blueprint_action>
{
  "archetypeId": "saas_app",
  "baseEngineId": "saas",
  "featureIds": ["auth", "admin", "ai_rag", "integrations"],
  "suggestedTimeline": "4 Weeks",
  "title": "Enterprise Knowledge SaaS",
  "totalINR": 480000,
  "totalUSD": 5800,
  "phasedBreakdown": {
    "phase1": {
      "title": "Phase 1: Core Lean MVP",
      "featureIds": ["auth", "ai_rag"],
      "suggestedTimeline": "2–3 Weeks",
      "totalINR": 290000,
      "totalUSD": 3500,
      "deliverablesSummary": "Core functional RAG knowledge base with authentication."
    },
    "phase2": {
      "title": "Phase 2: Scale & Automation",
      "featureIds": ["admin", "integrations"],
      "suggestedTimeline": "1–2 Weeks",
      "totalINR": 190000,
      "totalUSD": 2300,
      "deliverablesSummary": "Admin telemetry and external webhook integrations."
    }
  }
}
</blueprint_action>`,
        timestamp: new Date().toISOString(),
      },
    ];

    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId="session_phased_123"
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={transcriptWithPhased}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    expect(screen.getByText(/Phase 1 \(MVP\)/i)).toBeDefined();
    expect(screen.getByText(/\$3,500/i)).toBeDefined();
    expect(screen.getByText(/Full Roadmap/i)).toBeDefined();
    expect(screen.getAllByText(/\$5,800/i).length).toBeGreaterThanOrEqual(1);

    const applyPhase1Btn = screen.getByRole('button', { name: /Apply Phase 1 MVP/i });
    expect(applyPhase1Btn).toBeDefined();

    const applyFullBtn = screen.getByRole('button', { name: /Apply Full Scope/i });
    expect(applyFullBtn).toBeDefined();

    // Click Apply Phase 1
    fireEvent.click(applyPhase1Btn);

    expect(mockOnApplyBlueprint).toHaveBeenCalledTimes(1);
    expect(mockOnApplyBlueprint).toHaveBeenCalledWith(
      expect.objectContaining({
        baseEngineId: 'saas',
        featureIds: ['auth', 'ai_rag'],
        summaryRationale: 'Phase 1: Core Lean MVP',
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
              history: [{ role: 'user', content: 'Build me an app' }],
              sessionId: null,
              currency: 'USD',
              turnIndex: 1,
            }),
          })
        );
        expect(mockSetChatSessionId).toHaveBeenCalledWith('session_returned_456');
      });
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('renders near-limit warning when anonymous user reaches turn 3', () => {
    const transcriptWith3Turns = [
      { role: 'user', content: 'Turn 1 query' },
      { role: 'assistant', content: 'Turn 1 answer' },
      { role: 'user', content: 'Turn 2 query' },
      { role: 'assistant', content: 'Turn 2 answer' },
      { role: 'user', content: 'Turn 3 query' },
      { role: 'assistant', content: 'Turn 3 answer' },
    ];

    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId="session_123"
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={transcriptWith3Turns}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    expect(screen.getByText(/1 Free Turn Remaining/i)).toBeDefined();
    expect(screen.queryByText(/Turn limit reached for anonymous session/i)).toBeNull();
  });

  it('renders freemium soft-gate card and disables textarea when anonymous user reaches turn 4', () => {
    const transcriptWith4Turns = [
      { role: 'user', content: 'Turn 1 query' },
      { role: 'assistant', content: 'Turn 1 answer' },
      { role: 'user', content: 'Turn 2 query' },
      { role: 'assistant', content: 'Turn 2 answer' },
      { role: 'user', content: 'Turn 3 query' },
      { role: 'assistant', content: 'Turn 3 answer' },
      { role: 'user', content: 'Turn 4 query' },
      { role: 'assistant', content: 'Turn 4 answer' },
    ];

    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId="session_123"
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={transcriptWith4Turns}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    expect(screen.getByText(/You've Explored 4 Custom Architecture Revisions!/i)).toBeDefined();
    expect(screen.getByText(/Continue with Google \(1-Click Fast Pass\)/i)).toBeDefined();

    const textarea = screen.getByPlaceholderText(/Turn limit reached for anonymous session/i);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);

    const googleBtn = screen.getByRole('button', { name: /Continue with Google/i });
    fireEvent.click(googleBtn);
    expect(mockLoginWithGoogle).toHaveBeenCalled();
  });

  it('renders verified workspace badge and allows unlimited turns when user is authenticated', () => {
    mockUser = { email: 'client@company.com' };

    const transcriptWith5Turns = [
      { role: 'user', content: 'Turn 1 query' },
      { role: 'assistant', content: 'Turn 1 answer' },
      { role: 'user', content: 'Turn 2 query' },
      { role: 'assistant', content: 'Turn 2 answer' },
      { role: 'user', content: 'Turn 3 query' },
      { role: 'assistant', content: 'Turn 3 answer' },
      { role: 'user', content: 'Turn 4 query' },
      { role: 'assistant', content: 'Turn 4 answer' },
      { role: 'user', content: 'Turn 5 query' },
      { role: 'assistant', content: 'Turn 5 answer' },
    ];

    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId="session_123"
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={transcriptWith5Turns}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    expect(screen.getByText(/Verified Workspace/i)).toBeDefined();
    expect(screen.queryByText(/You've Explored 4 Custom Architecture Revisions!/i)).toBeNull();

    const textarea = screen.getByPlaceholderText(/Describe your idea or ask a question/i);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(false);
  });

  it('does not trigger parent form submission when send button is clicked or enter is pressed', async () => {
    const parentSubmitMock = vi.fn((e) => e.preventDefault());
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        headers: new Headers({ 'Content-Type': 'text/event-stream' }),
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          },
        }),
      })
    );

    try {
      render(
        <form onSubmit={parentSubmitMock} data-testid="parent-form">
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
        </form>
      );

      const textarea = screen.getByPlaceholderText(/Describe your idea or ask a question/i);
      fireEvent.change(textarea, { target: { value: 'Test query inside form' } });

      const sendButton = screen.getByRole('button', { name: /Send message/i });
      await act(async () => {
        fireEvent.click(sendButton);
      });

      // Verify parent form was NEVER submitted
      expect(parentSubmitMock).not.toHaveBeenCalled();

      // Test enter key
      fireEvent.change(textarea, { target: { value: 'Second query' } });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });
      });
      expect(parentSubmitMock).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('renders live scope sync banner and Step 2 quick prompt pills when currentScope is provided', () => {
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
        currentScope={{
          currentStep: 2,
          baseEngineId: 'saas',
          selectedFeatures: ['auth', 'payments', 'ai_rag'],
          totalINR: 280000,
          totalUSD: 3400,
        }}
      />
    );

    expect(screen.getByText(/Live Scope Sync:/i)).toBeDefined();
    expect(screen.getByText(/SAAS/i)).toBeDefined();
    expect(screen.getByText(/3 Modules Active/i)).toBeDefined();
    expect(screen.getByText(/Cut \$1,000 \/ ₹75k/i)).toBeDefined();
    expect(screen.getByText(/Delivery Timeline/i)).toBeDefined();
    expect(screen.getByText(/Suggest Lean Phase 1 MVP/i)).toBeDefined();
  });

  it('renders drawer close button and calls onCloseDrawer when clicked', () => {
    const mockOnClose = vi.fn();
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
        isDrawerMode={true}
        onCloseDrawer={mockOnClose}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close drawer/i });
    expect(closeBtn).toBeDefined();
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('navigates to step 2 and closes drawer when View in Architecture Topology Map is clicked in drawer mode', () => {
    const mockOnClose = vi.fn();
    const blueprintTranscript = [
      {
        role: 'assistant',
        content: `Here is your blueprint:
<blueprint_action>
{
  "archetypeId": "saas_app",
  "baseEngineId": "saas",
  "featureIds": ["auth", "payments"],
  "title": "SaaS Platform Blueprint",
  "totalINR": 240000,
  "totalUSD": 3000
}
</blueprint_action>`,
      },
    ];

    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        onNavigateStep={mockOnNavigateStep}
        chatSessionId={null}
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={blueprintTranscript}
        setChatTranscript={mockSetChatTranscript}
        isDrawerMode={true}
        onCloseDrawer={mockOnClose}
      />
    );

    const mapBtn = screen.getByRole('button', { name: /View in Architecture Topology Map/i });
    expect(mapBtn).toBeDefined();
    fireEvent.click(mapBtn);

    expect(mockOnNavigateStep).toHaveBeenCalledWith(2);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders data-lenis-prevent attributes on messagesViewport to prevent Lenis scroll hijacking', () => {
    render(
      <InlineScopingChatCard
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        chatSessionId={null}
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={[]}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    const viewport = screen.getByRole('region', { name: /Scoping conversation transcript/i });
    expect(viewport.getAttribute('data-lenis-prevent')).not.toBeNull();
    expect(viewport.getAttribute('data-lenis-prevent-wheel')).not.toBeNull();
    expect(viewport.getAttribute('data-lenis-prevent-touch')).not.toBeNull();
  });
});
