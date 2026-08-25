import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { ArchitectureCartDrawer } from '../ArchitectureCartDrawer';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { calcQuote } from '@/lib/pricing';

const { engines, features, brandAssets, maintenancePlans } = questionnaireDefaults;

describe('ArchitectureCartDrawer', () => {
  const quote = calcQuote(engines, features, brandAssets, maintenancePlans, {
    engineId: 'landing',
    featureIds: ['email', 'crm'],
    brandAssetId: 'none',
    maintenancePlanId: 'essential',
  }, 'INR');

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    quote,
    currency: 'INR' as const,
    allFeatures: features,
    onRemoveFeature: vi.fn(),
    onAddFeature: vi.fn(),
    onSwitchEngine: vi.fn(),
    promoCode: null,
    onApplyPromo: vi.fn().mockResolvedValue(true),
    onRemovePromo: vi.fn(),
    onProceed: vi.fn(),
    onExportPdf: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ArchitectureCartDrawer {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders cart title, item count badge, and items when isOpen is true', () => {
    render(<ArchitectureCartDrawer {...defaultProps} />);
    expect(screen.getByText('Architecture Cart')).toBeDefined();
    // Landing Page Core Engine + Email + CRM = 3 items
    expect(screen.getByText('3 items')).toBeDefined();
    expect(screen.getByText('Landing Page Core Engine')).toBeDefined();
    expect(screen.getByText('Automated Email Workflows (Resend Transactional)')).toBeDefined();
    expect(screen.getByText('CRM & Lead Management Module')).toBeDefined();
  });

  it('renders volume bundle discount meter', () => {
    render(<ArchitectureCartDrawer {...defaultProps} />);
    expect(screen.getByText(/Volume Bundle Discount Meter/i)).toBeDefined();
    expect(screen.getByText(/Standard CPQ/i)).toBeDefined();
  });

  it('renders GraphRAG upsell recommendations and handles add feature', () => {
    render(<ArchitectureCartDrawer {...defaultProps} />);
    expect(screen.getByText(/GraphRAG Intelligent Upsells/i)).toBeDefined();
    const addButtons = screen.getAllByRole('button', { name: /\+ Add/i });
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);
    expect(defaultProps.onAddFeature).toHaveBeenCalled();
  });

  it('calls onRemoveFeature when trash icon is clicked on a module', () => {
    render(<ArchitectureCartDrawer {...defaultProps} />);
    const removeButtons = screen.getAllByRole('button', { name: /Remove Automated Email/i });
    expect(removeButtons.length).toBeGreaterThan(0);
    fireEvent.click(removeButtons[0]);
    expect(defaultProps.onRemoveFeature).toHaveBeenCalledWith('email');
  });

  it('renders deposit split breakdown (50% upfront / 50% milestone)', () => {
    render(<ArchitectureCartDrawer {...defaultProps} />);
    expect(screen.getByText(/50% Upfront Deposit/i)).toBeDefined();
    expect(screen.getByText(/50% Milestone Balance/i)).toBeDefined();
    expect(screen.getAllByText('₹52,500').length).toBe(2);
  });

  it('handles promo code submission', async () => {
    render(<ArchitectureCartDrawer {...defaultProps} />);
    const input = screen.getByPlaceholderText(/ENTER PROMO CODE/i);
    const applyBtn = screen.getByRole('button', { name: /Apply/i });

    fireEvent.change(input, { target: { value: 'PRATEEQ10' } });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(defaultProps.onApplyPromo).toHaveBeenCalledWith('PRATEEQ10');
    });
  });

  it('renders active promo code badge when promoCode prop is provided', () => {
    render(
      <ArchitectureCartDrawer
        {...defaultProps}
        promoCode={{
          code: 'PRATEEQ10',
          discountType: 'percentage',
          discountValue: 10,
          discountAmountINR: 10500,
          discountAmountUSD: 140,
        }}
      />
    );
    expect(screen.getByText(/PRATEEQ10 applied \(-10%\)/i)).toBeDefined();
    const removePromoBtn = screen.getByRole('button', { name: /^Remove$/i });
    fireEvent.click(removePromoBtn);
    expect(defaultProps.onRemovePromo).toHaveBeenCalled();
  });
});
