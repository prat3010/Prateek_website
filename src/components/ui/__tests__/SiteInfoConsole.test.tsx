import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SiteInfoConsole from '../SiteInfoConsole';

vi.mock('@/context/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    theme: 'azure',
    isNoir: false,
    audience: 'developer',
    setTheme: vi.fn(),
    setAudience: vi.fn(),
  })),
}));

vi.mock('@/lib/terminalAudio', () => ({
  toggleAudio: vi.fn(() => true),
  playKeySound: vi.fn(),
  playAchievementSound: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SiteInfoConsole Component (Decomposed Architecture)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/projects')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { title: 'Retriever RAG', tags: ['FastAPI', 'pgvector'] },
            { title: 'Prateek Portfolio', tags: ['Next.js', 'React'] },
          ],
        });
      }
      if (url.includes('/api/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            name: 'Prateek Sharma',
            intake: null,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it('renders telemetry dashboard, Web Vitals, and quick shortcuts', async () => {
    render(<SiteInfoConsole />);

    expect(screen.getByText(/COBALT TERMINAL CORE \/\/ SITE SCHEMATICS/i)).toBeDefined();
    expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
    expect(screen.getByText(/TELEMETRY MATRIX/i)).toBeDefined();
    expect(screen.getByText(/PERFORMANCE VITALS/i)).toBeDefined();
    expect(screen.getByText(/QUICK SHORTCUTS:/i)).toBeDefined();

    const promptInput = screen.getByLabelText(/Terminal command prompt/i);
    expect(promptInput).toBeDefined();
  });

  it('executes the "help" command and prints available commands', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'help' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Available commands:/i)).toBeDefined();
      expect(screen.getByText(/Executive Summary & Core Engineering Superpowers/i)).toBeDefined();
    });
  });

  it('executes the "tests" command and prints automated test suite metrics', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'tests' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/AUTOMATED TEST SUITES & CONTINUOUS VERIFICATION MATRIX/i)).toBeDefined();
    });
  });

  it('clears terminal history when the "clear" shortcut button is clicked', async () => {
    render(<SiteInfoConsole />);

    // First execute help to add content
    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'help' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Available commands:/i)).toBeDefined();
    });

    // Click quick shortcut "clear"
    const clearBtn = screen.getByRole('button', { name: /^clear$/i });
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Available commands:/i)).toBeNull();
    });
  });

  it('navigates command history with ArrowUp and ArrowDown keys', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;

    // Execute first command
    fireEvent.change(promptInput, { target: { value: 'projects' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    // Execute second command
    fireEvent.change(promptInput, { target: { value: 'system' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    // Press ArrowUp to retrieve 'system'
    fireEvent.keyDown(promptInput, { key: 'ArrowUp' });
    expect(promptInput.value).toBe('system');

    // Press ArrowUp again to retrieve 'projects'
    fireEvent.keyDown(promptInput, { key: 'ArrowUp' });
    expect(promptInput.value).toBe('projects');

    // Press ArrowDown to return to 'system'
    fireEvent.keyDown(promptInput, { key: 'ArrowDown' });
    expect(promptInput.value).toBe('system');

    // Press ArrowDown again to clear back to empty
    fireEvent.keyDown(promptInput, { key: 'ArrowDown' });
    expect(promptInput.value).toBe('');
  });
});
