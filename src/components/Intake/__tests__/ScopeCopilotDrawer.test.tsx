import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="portal-root">{children}</div>,
}));

vi.mock('lenis/react', () => ({
  useLenis: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

import { ScopeCopilotDrawer } from '../ScopeCopilotDrawer';

describe('ScopeCopilotDrawer Component', () => {
  const mockOnClose = vi.fn();
  const mockOnApplyBlueprint = vi.fn();
  const mockSetChatSessionId = vi.fn();
  const mockSetChatTranscript = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render dialog content when isOpen is false', () => {
    const { container } = render(
      <ScopeCopilotDrawer
        isOpen={false}
        onClose={mockOnClose}
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        chatSessionId={null}
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={[]}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('renders drawer dialog with header, live status, and chat card when isOpen is true', () => {
    render(
      <ScopeCopilotDrawer
        isOpen={true}
        onClose={mockOnClose}
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        chatSessionId="session-123"
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={[]}
        setChatTranscript={mockSetChatTranscript}
        currentScope={{
          currentStep: 2,
          baseEngineId: 'saas',
          selectedFeatures: ['auth', 'payments'],
          totalINR: 200000,
          totalUSD: 2500,
        }}
      />
    );

    expect(screen.getByRole('dialog', { name: /Conversational Scope Copilot Drawer/i })).toBeDefined();
    expect(screen.getByText('Scope Copilot')).toBeDefined();
    expect(screen.getByText('Bidirectional Solutions Architect')).toBeDefined();
    expect(screen.getByText(/Live Scope Sync:/i)).toBeDefined();
  });

  it('triggers onClose when close button is clicked', () => {
    render(
      <ScopeCopilotDrawer
        isOpen={true}
        onClose={mockOnClose}
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        chatSessionId={null}
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={[]}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /Close Scope Copilot Drawer/i });
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when Escape key is pressed', () => {
    render(
      <ScopeCopilotDrawer
        isOpen={true}
        onClose={mockOnClose}
        currency="USD"
        isNoir={false}
        onApplyBlueprint={mockOnApplyBlueprint}
        chatSessionId={null}
        setChatSessionId={mockSetChatSessionId}
        chatTranscript={[]}
        setChatTranscript={mockSetChatTranscript}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
