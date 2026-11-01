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
  const storageStore: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();

    for (const key of Object.keys(storageStore)) {
      delete storageStore[key];
    }

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => storageStore[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
          storageStore[key] = String(value);
        }),
        removeItem: vi.fn((key: string) => {
          delete storageStore[key];
        }),
        clear: vi.fn(() => {
          for (const key of Object.keys(storageStore)) {
            delete storageStore[key];
          }
        }),
        key: vi.fn((index: number) => Object.keys(storageStore)[index] ?? null),
        get length() {
          return Object.keys(storageStore).length;
        },
      },
      writable: true,
      configurable: true,
    });

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

  it('launches text-based AI Twin session and disconnects via "exit"', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'twin' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/PRATEEQ\.AI \/\/ INTERACTIVE KNOWLEDGE TWIN \(v2\.5\)/i)).toBeDefined();
      expect(screen.getByText(/SYSTEM STATUS & TELEMETRY:/i)).toBeDefined();
      expect(screen.getByText(/Hello! I am Prateek's interactive AI Twin\./i)).toBeDefined();
    });

    // Check prompt switched to AI Twin prompt
    const aiPromptInput = screen.getByLabelText(/AI Twin chat prompt/i) as HTMLInputElement;
    expect(aiPromptInput).toBeDefined();

    // Type exit to disconnect
    fireEvent.change(aiPromptInput, { target: { value: 'exit' } });
    fireEvent.keyDown(aiPromptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/SYSTEM \/\/ Neural link closed\. Returned to standard shell\./i)).toBeDefined();
      expect(screen.getByLabelText(/Terminal command prompt/i)).toBeDefined();
    });
  });

  it('autocompletes commands with Tab key', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'proj' } });
    fireEvent.keyDown(promptInput, { key: 'Tab', code: 'Tab' });

    expect(promptInput.value).toBe('projects');
  });

  it('clears screen with Ctrl+L shortcut', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'help' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Available commands:/i)).toBeDefined();
    });

    fireEvent.keyDown(promptInput, { key: 'l', ctrlKey: true });

    await waitFor(() => {
      expect(screen.queryByText(/Available commands:/i)).toBeNull();
    });
  });

  it('clears screen when red window indicator button is clicked', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'help' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/Available commands:/i)).toBeDefined();
    });

    const clearDot = screen.getByRole('button', { name: /Clear terminal output/i });
    fireEvent.click(clearDot);

    await waitFor(() => {
      expect(screen.queryByText(/Available commands:/i)).toBeNull();
    });
  });

  it('records commands and prints session history with "history"', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'whoami' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/USER IDENTITY \/\/ TERMINAL CONSOLE SESSION:/i)).toBeDefined();
    });

    fireEvent.change(promptInput, { target: { value: 'history' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/COMMAND EXECUTION HISTORY:/i)).toBeDefined();
      expect(screen.getAllByText(/whoami/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('inspects virtual project directory with "ls"', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'ls' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/DIRECTORY: \/home\/prateeq\/developer-ecosystem/i)).toBeDefined();
      expect(screen.getByText(/Executive briefing card/i)).toBeDefined();
    });
  });

  it('autocompletes subcommands with Tab key', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'scope n' } });
    fireEvent.keyDown(promptInput, { key: 'Tab', code: 'Tab' });

    expect(promptInput.value).toBe('scope new ');
  });

  it('preserves draft input buffer when cycling ArrowUp and ArrowDown', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    // Execute a command first
    fireEvent.change(promptInput, { target: { value: 'pwd' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    // Now start drafting a new command
    fireEvent.change(promptInput, { target: { value: 'draft-query' } });

    // Press ArrowUp: cycles to 'pwd'
    fireEvent.keyDown(promptInput, { key: 'ArrowUp', code: 'ArrowUp' });
    expect(promptInput.value).toBe('pwd');

    // Press ArrowDown: returns to saved draft
    fireEvent.keyDown(promptInput, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(promptInput.value).toBe('draft-query');
  });

  it('toggles telemetry via the title bar toggle button (Focus Mode on/off)', async () => {
    render(<SiteInfoConsole />);

    // Initially telemetry grid is expanded
    expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
    expect(screen.queryByTestId('console-compact-status-bar')).toBeNull();

    // Find and click the Focus Mode button
    const toggleBtn = screen.getByRole('button', { name: /Collapse Telemetry into Focus Mode/i });
    expect(toggleBtn).toBeDefined();
    fireEvent.click(toggleBtn);

    // Now compact status bar is rendered, and full grid is unmounted
    await waitFor(() => {
      expect(screen.getByTestId('console-compact-status-bar')).toBeDefined();
      expect(screen.queryByTestId('console-telemetry-grid')).toBeNull();
    });

    // Toggle button now says "SHOW TELEMETRY"
    const expandBtn = screen.getByRole('button', { name: /Expand Telemetry Matrix/i });
    expect(expandBtn).toBeDefined();
    fireEvent.click(expandBtn);

    // Full grid is restored
    await waitFor(() => {
      expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
      expect(screen.queryByTestId('console-compact-status-bar')).toBeNull();
    });
  });

  it('clicking the compact status bar expands back to full telemetry matrix', async () => {
    render(<SiteInfoConsole />);

    // Collapse to focus mode first
    const toggleBtn = screen.getByRole('button', { name: /Collapse Telemetry into Focus Mode/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(screen.getByTestId('console-compact-status-bar')).toBeDefined();
    });

    // Click on compact status bar itself
    const compactBar = screen.getByTestId('console-compact-status-bar');
    fireEvent.click(compactBar);

    await waitFor(() => {
      expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
      expect(screen.queryByTestId('console-compact-status-bar')).toBeNull();
    });
  });

  it('executes the "telemetry" CLI command to toggle focus mode', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;

    // Run telemetry command to collapse
    fireEvent.change(promptInput, { target: { value: 'telemetry' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/TELEMETRY MATRIX \/\/ Collapsed into Focus Mode/i)).toBeDefined();
      expect(screen.getByTestId('console-compact-status-bar')).toBeDefined();
      expect(screen.queryByTestId('console-telemetry-grid')).toBeNull();
    });

    // Run telemetry command again to restore
    fireEvent.change(promptInput, { target: { value: 'telemetry' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/TELEMETRY MATRIX \/\/ Expanded\. Full telemetry matrix & Web Vitals grid restored/i)).toBeDefined();
      expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
      expect(screen.queryByTestId('console-compact-status-bar')).toBeNull();
    });
  });

  it('supports "telemetry off", "telemetry on", and "telemetry status" subcommands', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;

    // telemetry off
    fireEvent.change(promptInput, { target: { value: 'telemetry off' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByTestId('console-compact-status-bar')).toBeDefined();
    });

    // telemetry status while collapsed
    fireEvent.change(promptInput, { target: { value: 'telemetry status' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/TELEMETRY STATUS: COLLAPSED \(Focus Mode Active\)/i)).toBeDefined();
    });

    // telemetry on
    fireEvent.change(promptInput, { target: { value: 'telemetry on' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
    });
  });

  it('persists collapsible telemetry state to localStorage', async () => {
    render(<SiteInfoConsole />);

    const toggleBtn = screen.getByRole('button', { name: /Collapse Telemetry into Focus Mode/i });
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(window.localStorage.getItem('terminal_telemetry_collapsed')).toBe('true');
      expect(screen.getByTestId('console-compact-status-bar')).toBeDefined();
    });
  });

  it('restores focus mode from localStorage on mount', async () => {
    window.localStorage.setItem('terminal_telemetry_collapsed', 'true');
    render(<SiteInfoConsole />);

    await waitFor(() => {
      expect(screen.getByTestId('console-compact-status-bar')).toBeDefined();
      expect(screen.queryByTestId('console-telemetry-grid')).toBeNull();
      expect(screen.getByRole('button', { name: /Expand Telemetry Matrix/i })).toBeDefined();
    });
  });

  it('supports "focus", "focus off", and "telemetry help" commands', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;

    // focus (turns focus mode on)
    fireEvent.change(promptInput, { target: { value: 'focus' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByTestId('console-compact-status-bar')).toBeDefined();
    });

    // focus off (turns focus mode off)
    fireEvent.change(promptInput, { target: { value: 'focus off' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
    });

    // telemetry help
    fireEvent.change(promptInput, { target: { value: 'telemetry help' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/TELEMETRY & FOCUS MODE CONTROLS/i)).toBeDefined();
    });
  });

  it('autocompletes "telemetry" command with Tab key', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    await waitFor(() => {
      expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
    });

    fireEvent.change(promptInput, { target: { value: 'telem' } });
    fireEvent.keyDown(promptInput, { key: 'Tab', code: 'Tab' });

    expect(promptInput.value).toBe('telemetry');
  });

  it('autocompletes telemetry subcommands with Tab key', async () => {
    render(<SiteInfoConsole />);

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    await waitFor(() => {
      expect(screen.getByTestId('console-telemetry-grid')).toBeDefined();
    });

    fireEvent.change(promptInput, { target: { value: 'telemetry st' } });
    fireEvent.keyDown(promptInput, { key: 'Tab', code: 'Tab' });

    expect(promptInput.value).toBe('telemetry status ');
  });

  it('auto-scrolls terminal screen to bottom when a new command is executed', async () => {
    const { container } = render(<SiteInfoConsole />);
    const screenEl = container.querySelector('[role="log"]') as HTMLDivElement;
    expect(screenEl).toBeDefined();

    // Mock scrollHeight to simulate expanded command output
    Object.defineProperty(screenEl, 'scrollHeight', {
      configurable: true,
      get: () => 1200,
    });

    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'help' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screenEl.scrollTop).toBe(1200);
    });
  });

  it('resets scroll position to latest return when command is run even after user scrolled up', async () => {
    const { container } = render(<SiteInfoConsole />);
    const screenEl = container.querySelector('[role="log"]') as HTMLDivElement;
    expect(screenEl).toBeDefined();

    let currentScrollHeight = 800;
    Object.defineProperty(screenEl, 'scrollHeight', {
      configurable: true,
      get: () => currentScrollHeight,
    });
    Object.defineProperty(screenEl, 'clientHeight', {
      configurable: true,
      get: () => 300,
    });

    // Simulate user scrolling up (scrollTop = 100, so distanceFromBottom = 800 - 100 - 300 = 400 > 60)
    screenEl.scrollTop = 100;
    fireEvent.scroll(screenEl);

    // New command given
    currentScrollHeight = 1500;
    const promptInput = screen.getByLabelText(/Terminal command prompt/i) as HTMLInputElement;
    fireEvent.change(promptInput, { target: { value: 'tests' } });
    fireEvent.keyDown(promptInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screenEl.scrollTop).toBe(1500);
    });
  });
});

