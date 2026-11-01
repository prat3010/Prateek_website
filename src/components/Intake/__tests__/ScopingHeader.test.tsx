import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import ScopingHeader from '@/app/scoping/ScopingHeader';
import * as ThemeContextModule from '@/context/ThemeContext';

describe('ScopingHeader Component', () => {
  beforeEach(() => {
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
  });

  it('renders navigation backlink, edition pill, scrambler title, and subtitle in light theme', () => {
    vi.spyOn(ThemeContextModule, 'useTheme').mockReturnValue({
      theme: 'light',
      toggleTheme: vi.fn(),
      isNoir: false,
      isDetailsHidden: false,
      toggleDetailsHidden: vi.fn(),
      audience: 'developer',
      prevAudience: 'developer',
      setAudience: vi.fn(),
      modeTransitionSeed: 0,
      region: 'global',
      setRegion: vi.fn(),
    });

    render(<ScopingHeader />);

    expect(screen.getByText(/Return to Base/i)).toBeDefined();
    expect(screen.getByText(/VOL\. 26 • SPEC-DRIVEN ARCHITECTURE LAB/i)).toBeDefined();
    expect(screen.getByText(/PROJECT SCOPING LAB \/\/ INSTANT QUOTE/i)).toBeDefined();
    expect(
      screen.getByText(/Transparent Fixed-Scope CPQ • Instant PDF Export • Zero Sales Calls/i)
    ).toBeDefined();
  });

  it('renders noir architecture title in noir theme', () => {
    vi.spyOn(ThemeContextModule, 'useTheme').mockReturnValue({
      theme: 'noir',
      toggleTheme: vi.fn(),
      isNoir: true,
      isDetailsHidden: false,
      toggleDetailsHidden: vi.fn(),
      audience: 'developer',
      prevAudience: 'developer',
      setAudience: vi.fn(),
      modeTransitionSeed: 0,
      region: 'global',
      setRegion: vi.fn(),
    });

    render(<ScopingHeader />);

    expect(screen.getByText(/PROJECT SCOPING LAB \/\/ ARCHITECTURE LAB/i)).toBeDefined();
  });
});
