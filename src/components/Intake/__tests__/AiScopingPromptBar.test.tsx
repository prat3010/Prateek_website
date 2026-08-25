import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiScopingPromptBar } from '../AiScopingPromptBar';

describe('AiScopingPromptBar Component', () => {
  it('renders prompt input, action buttons, and live telemetry badge', () => {
    const onApply = vi.fn();
    render(<AiScopingPromptBar onApplyBlueprint={onApply} currency="INR" isNoir={false} />);

    expect(screen.getByPlaceholderText(/Describe your project in plain English/i)).toBeDefined();
    expect(screen.getByText(/Analyze Scope/i)).toBeDefined();
    expect(screen.getByText(/Drop RFP \/ PRD/i)).toBeDefined();
    expect(screen.getByText(/Chat with Scoping AI/i)).toBeDefined();
    expect(screen.getByText(/Powered by Retriever Multi-Tenant Engine/i)).toBeDefined();
  });

  it('renders quick blueprint pills and populates prompt on click', () => {
    const onApply = vi.fn();
    render(<AiScopingPromptBar onApplyBlueprint={onApply} currency="USD" isNoir={false} />);

    const ragPill = screen.getByText(/Real Estate RAG Portal/i);
    expect(ragPill).toBeDefined();

    fireEvent.click(ragPill);
    const input = screen.getByPlaceholderText(/Describe your project in plain English/i) as HTMLInputElement;
    expect(input.value).toContain('real estate portal with private AI knowledge base');
  });
});
