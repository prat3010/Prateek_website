import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { ArchitectureCartDrawer } from '../ArchitectureCartDrawer';
import styles from '../ArchitectureCartDrawer.module.css';
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

  it('renders active fixed promo code badge with correct currency in USD ($60 rather than raw $5,000)', () => {
    render(
      <ArchitectureCartDrawer
        {...defaultProps}
        currency="USD"
        promoCode={{
          code: 'FOUNDER50',
          discountType: 'fixed',
          discountValue: 5000,
          discountAmountINR: 5000,
          discountAmountUSD: 60,
        }}
      />
    );
    expect(screen.getByText(/FOUNDER50 applied \(-\$60\)/i)).toBeDefined();
  });

  it('isolates scroll from Lenis and locks body overflow when open', () => {
    const { unmount } = render(<ArchitectureCartDrawer {...defaultProps} isOpen={true} />);

    // Body overflow is locked to prevent background scroll
    expect(document.body.style.overflow).toBe('hidden');

    // Cart drawer containers carry data-lenis-prevent to enable native scrolling
    const cartDialog = screen.getByRole('dialog');
    expect(cartDialog.getAttribute('data-lenis-prevent')).not.toBeNull();

    const scrollableContent = cartDialog.querySelector(`.${styles.content}`);
    expect(scrollableContent?.getAttribute('data-lenis-prevent')).not.toBeNull();
    expect(scrollableContent?.getAttribute('data-lenis-prevent-wheel')).not.toBeNull();
    expect(scrollableContent?.getAttribute('data-lenis-prevent-touch')).not.toBeNull();

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders lock badge instead of delete button for compulsory features in lockedFeatureIds', () => {
    render(
      <ArchitectureCartDrawer
        {...defaultProps}
        lockedFeatureIds={['email']}
      />
    );

    // Email is locked - no remove button should exist for it
    expect(screen.queryByRole('button', { name: /Remove Automated Email/i })).toBeNull();
    // Instead, lock badge with title/aria-label is rendered
    expect(screen.getByLabelText('Required by selected goal archetype')).toBeDefined();

    // CRM is NOT locked - remove button should still exist
    expect(screen.getByRole('button', { name: /Remove CRM & Lead/i })).toBeDefined();
  });

  it('disables the PDF export button and shows Generating... when generatingPdf is true', () => {
    render(
      <ArchitectureCartDrawer
        {...defaultProps}
        generatingPdf={true}
      />
    );

    const pdfBtn = screen.getByRole('button', { name: /Generating PDF.../i });
    expect(pdfBtn).toBeDefined();
    expect(pdfBtn.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Generating...')).toBeDefined();
  });

  it('sets progressWidth to 0 and progressbar aria-valuenow to 0 when 0 features are selected', () => {
    const emptyQuote = calcQuote(engines, features, brandAssets, maintenancePlans, {
      engineId: 'landing',
      featureIds: [],
      brandAssetId: 'none',
      maintenancePlanId: 'essential',
    }, 'INR');

    render(
      <ArchitectureCartDrawer
        {...defaultProps}
        quote={emptyQuote}
      />
    );

    const progressBar = screen.getByRole('progressbar', { name: /Volume Bundle Discount Progress/i });
    expect(progressBar).toBeDefined();
    expect(progressBar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('traps focus inside the drawer and closes on Escape key', async () => {
    render(<ArchitectureCartDrawer {...defaultProps} />);

    // Initial focus lands on the close button
    const closeBtn = screen.getByRole('button', { name: /Close cart drawer/i });
    await waitFor(() => {
      expect(document.activeElement).toBe(closeBtn);
    });

    // Escape closes the drawer
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders promo code validation error with role="alert"', async () => {
    const onApplyPromoMock = vi.fn().mockResolvedValue(false);
    render(
      <ArchitectureCartDrawer
        {...defaultProps}
        onApplyPromo={onApplyPromoMock}
      />
    );

    const input = screen.getByLabelText(/Promo code or partner referral/i);
    const applyBtn = screen.getByRole('button', { name: /Apply/i });

    fireEvent.change(input, { target: { value: 'BADCODE' } });
    fireEvent.click(applyBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeDefined();
      expect(alert.textContent).toContain('Invalid or expired promo code');
    });
  });
});
