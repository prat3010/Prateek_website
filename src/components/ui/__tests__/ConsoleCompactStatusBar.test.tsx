import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConsoleCompactStatusBar from '../ConsoleCompactStatusBar';

describe('ConsoleCompactStatusBar Component', () => {
  const defaultProps = {
    stats: {
      fps: 60,
      bundleSize: 142,
      domNodes: 385,
      uptime: '00:04:12',
    },
    webVitals: {
      lcp: 1.2,
      fid: 14,
      cls: 0.01,
      hasInteraction: true,
    },
    onExpand: vi.fn(),
  };

  it('renders all key performance metrics in a single status bar', () => {
    render(<ConsoleCompactStatusBar {...defaultProps} />);

    expect(screen.getByTestId('console-compact-status-bar')).toBeDefined();
    expect(screen.getByText('60')).toBeDefined();
    expect(screen.getByText('00:04:12')).toBeDefined();
    expect(screen.getByText('385')).toBeDefined();
    expect(screen.getByText('1.2s')).toBeDefined();
    expect(screen.getByText('142 KB')).toBeDefined();
    expect(screen.getByText(/FOCUS MODE/i)).toBeDefined();
    expect(screen.getByText(/EXPAND/i)).toBeDefined();
  });

  it('renders "measuring..." when LCP is 0', () => {
    render(
      <ConsoleCompactStatusBar
        {...defaultProps}
        webVitals={{ ...defaultProps.webVitals, lcp: 0 }}
      />
    );

    expect(screen.getByText('measuring...')).toBeDefined();
  });

  it('triggers onExpand callback when clicked', () => {
    const onExpand = vi.fn();
    render(<ConsoleCompactStatusBar {...defaultProps} onExpand={onExpand} />);

    fireEvent.click(screen.getByTestId('console-compact-status-bar'));
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('triggers onExpand callback when Enter or Space key is pressed', () => {
    const onExpand = vi.fn();
    render(<ConsoleCompactStatusBar {...defaultProps} onExpand={onExpand} />);

    const bar = screen.getByTestId('console-compact-status-bar');
    fireEvent.keyDown(bar, { key: 'Enter' });
    expect(onExpand).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(bar, { key: ' ' });
    expect(onExpand).toHaveBeenCalledTimes(2);
  });

  it('provides an accessible aria-label containing real-time performance metrics', () => {
    render(<ConsoleCompactStatusBar {...defaultProps} />);

    const bar = screen.getByTestId('console-compact-status-bar');
    expect(bar.getAttribute('aria-label')).toBe(
      'Telemetry Focus Mode: FPS 60, Uptime 00:04:12, DOM 385, LCP 1.2s. Press Enter to expand full telemetry matrix.'
    );
  });
});
