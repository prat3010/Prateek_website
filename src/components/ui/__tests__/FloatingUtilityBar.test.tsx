import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import FloatingUtilityBar from '../FloatingUtilityBar';
import * as ThemeContext from '@/context/ThemeContext';

vi.mock('@/components/ui/ZenToggle', () => ({
  default: () => <button>MockedZenToggle</button>,
}));

vi.mock('@/components/ui/GestureScroll/GestureScroll', () => ({
  default: () => <button>MockedGestureScroll</button>,
}));

describe('FloatingUtilityBar Component', () => {
  it('renders quick controls dock with ZenToggle and GestureScroll when visible', async () => {
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      isNoir: false,
      audience: 'developer',
      region: 'india',
      isDetailsHidden: false,
      toggleTheme: vi.fn(),
      toggleDetailsHidden: vi.fn(),
      setAudience: vi.fn(),
      setRegion: vi.fn(),
      prevAudience: null,
      modeTransitionSeed: 0,
    });

    render(<FloatingUtilityBar />);

    expect(screen.getByRole('complementary', { name: /Quick controls dock/i })).toBeDefined();
    expect(screen.getByText('MockedZenToggle')).toBeDefined();
    expect(await screen.findByText('MockedGestureScroll')).toBeDefined();
  });

  it('hides GestureScroll and divider when isDetailsHidden is true', () => {
    vi.spyOn(ThemeContext, 'useTheme').mockReturnValue({
      theme: 'light',
      isNoir: false,
      audience: 'developer',
      region: 'india',
      isDetailsHidden: true,
      toggleTheme: vi.fn(),
      toggleDetailsHidden: vi.fn(),
      setAudience: vi.fn(),
      setRegion: vi.fn(),
      prevAudience: null,
      modeTransitionSeed: 0,
    });

    render(<FloatingUtilityBar />);

    expect(screen.getByRole('complementary', { name: /Quick controls dock/i })).toBeDefined();
    expect(screen.getByText('MockedZenToggle')).toBeDefined();
    expect(screen.queryByText('MockedGestureScroll')).toBeNull();
  });
});
