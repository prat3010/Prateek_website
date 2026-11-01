import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceTypeGate } from '../ServiceTypeGate';

describe('ServiceTypeGate Component', () => {
  it('renders Full Project Build and Quick Service cards with turnaround badges', () => {
    const onSelect = vi.fn();

    render(<ServiceTypeGate onSelectType={onSelect} />);

    expect(screen.getByText(/WHAT DO YOU NEED\?/i)).toBeDefined();
    expect(screen.getByText(/Full Project Build/i)).toBeDefined();
    expect(screen.getByText(/Quick Service/i)).toBeDefined();

    expect(screen.getByText(/2–4 Week Turnaround/i)).toBeDefined();
    expect(screen.getByText(/48-Hour Turnaround/i)).toBeDefined();
  });

  it('triggers onSelectType with "full" on clicking Full Project Build', () => {
    const onSelect = vi.fn();

    render(<ServiceTypeGate onSelectType={onSelect} />);

    const fullBtn = screen.getByText(/Full Project Build/i).closest('button');
    expect(fullBtn).toBeDefined();

    fireEvent.click(fullBtn!);
    expect(onSelect).toHaveBeenCalledWith('full');
  });

  it('triggers onSelectType with "quick" on clicking Quick Service', () => {
    const onSelect = vi.fn();

    render(<ServiceTypeGate onSelectType={onSelect} />);

    const quickBtn = screen.getByText(/Quick Service/i).closest('button');
    expect(quickBtn).toBeDefined();

    fireEvent.click(quickBtn!);
    expect(onSelect).toHaveBeenCalledWith('quick');
  });

  it('handles arrow key keyboard navigation between options', () => {
    const onSelect = vi.fn();

    render(<ServiceTypeGate onSelectType={onSelect} />);

    const fullBtn = screen.getByText(/Full Project Build/i).closest('button');
    const quickBtn = screen.getByText(/Quick Service/i).closest('button');

    fireEvent.keyDown(fullBtn!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(quickBtn);

    fireEvent.keyDown(quickBtn!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(fullBtn);
  });
});
