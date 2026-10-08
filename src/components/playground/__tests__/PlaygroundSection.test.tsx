import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaygroundSection from '../PlaygroundSection';
import * as ThemeContext from '@/context/ThemeContext';

describe('PlaygroundSection Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      setTheme: vi.fn(),
      isNoir: false,
      isDetailsHidden: false,
      toggleDetailsHidden: vi.fn(),
      audience: 'developer',
      setAudience: vi.fn(),
      prevAudience: null,
      modeTransitionSeed: 0,
      region: 'india',
      setRegion: vi.fn(),
    } as unknown as ReturnType<typeof ThemeContext.useTheme>);
  });

  it('renders section container with id="playground"', () => {
    const { container } = render(<PlaygroundSection />);
    const section = container.querySelector('#playground');
    expect(section).not.toBeNull();
    expect(section?.getAttribute('aria-label')).toBe('Playground and Innovation Lab');
  });

  it('renders title, category tabs, and quick launchers', () => {
    render(<PlaygroundSection />);

    // Section title
    expect(screen.getByText(/the playground/i)).toBeInTheDocument();

    // Category tabs
    expect(screen.getByRole('tab', { name: /top highlights/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /arcade & labs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /saas prototypes/i })).toBeInTheDocument();

    // Quick launchers
    expect(screen.getByText(/play snake 2088/i)).toBeInTheDocument();
    expect(screen.getByText(/2d pathfinder lab/i)).toBeInTheDocument();
    expect(screen.getAllByText(/retriever ai studio/i).length).toBeGreaterThan(0);

    // Explore CTA
    const exploreCta = screen.getByRole('link', { name: /explore full playground archive/i });
    expect(exploreCta).toBeInTheDocument();
    expect(exploreCta.getAttribute('href')).toBe('/playground');
  });

  it('allows switching category tabs to filter creations', () => {
    render(<PlaygroundSection />);

    const arcadeTab = screen.getByRole('tab', { name: /arcade & labs/i });
    fireEvent.click(arcadeTab);

    expect(arcadeTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(/cyber snake 2088/i)).toBeInTheDocument();
  });
});
