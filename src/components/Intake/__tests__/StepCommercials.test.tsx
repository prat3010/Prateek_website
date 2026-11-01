import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepCommercials } from '../StepCommercials';
import type { BaseEngineItem, MaintenancePlanOption } from '@/data/resume';

const mockEngine: BaseEngineItem = {
  id: 'saas',
  title: 'Full-Stack SaaS MVP Core',
  tier: 'Growth Tier',
  priceINR: 120000,
  priceUSD: 1500,
  laymanDescription: 'SaaS application with auth, DB, payments',
  techSpecs: 'Next.js 16, Supabase, Stripe',
};

const mockMaintenance: MaintenancePlanOption[] = [
  {
    id: 'essential',
    name: 'Essential Care Plan',
    priceINR: 15000,
    priceUSD: 200,
    period: '/ month',
    badge: 'Recommended',
    laymanDescription: 'Weekly security patches and database backups.',
    techSpecs: 'Automated backups, SLA response < 24h',
    includes: ['Security patches', 'Daily automated backups'],
  },
];

const mockTerms = [
  'Clause 1: 50% upfront deposit required to lock development sprint.',
  'Clause 2: 30-day post-launch warranty covering all bugs and browser inconsistencies.',
  'Clause 3: 100% intellectual property transfer upon final settlement.',
  'Clause 4: Professional liability capped strictly at developer fees paid.',
];

describe('StepCommercials Component', () => {
  it('renders summary box with itemized volume bundle savings line', () => {
    const totalCost = {
      totalINR: 165000,
      totalUSD: 2100,
      featuresINR: 60000,
      featuresUSD: 800,
      brandOpt: { label: 'Included', priceINR: 0, priceUSD: 0 },
      bundleDiscountPercent: 10,
      bundleDiscountAmountINR: 6000,
      bundleDiscountAmountUSD: 80,
    };

    render(
      <StepCommercials
        selectedEngine={mockEngine}
        totalCost={totalCost}
        maintenancePlans={mockMaintenance}
        formData={{
          selectedFeatures: ['auth', 'admin', 'payments'],
          selectedMaintenanceId: 'essential',
          timeline: 'Fast-Track MVP (2–3 weeks)',
          additionalNotes: '',
          hostingOwnership: 'client_owned',
          taxInvoicingPreference: 'standard',
          agreedToTerms: false,
          contactEmail: 'founder@acme.corp',
          contactPhone: '+1-555-0199',
        }}
        autoMaintenancePlanId="essential"
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        timelineOptions={['Fast-Track MVP (2–3 weeks)']}
        termsList={mockTerms}
        togglePopover={vi.fn()}
        onChangeField={vi.fn()}
      />
    );

    expect(screen.getByText(/VOLUME BUNDLE SAVINGS \(-10%\)/i)).toBeDefined();
    expect(screen.getByText(/₹6,000/i)).toBeDefined();
    expect(screen.getByText(/TOTAL BUILD INVESTMENT \(ESTIMATE\)/i)).toBeDefined();
  });

  it('renders itemized promo code savings line when promoDiscount is active', () => {
    const totalCost = {
      totalINR: 155000,
      totalUSD: 1950,
      featuresINR: 60000,
      featuresUSD: 800,
      brandOpt: { label: 'Included', priceINR: 0, priceUSD: 0 },
      promoDiscount: {
        code: 'LAUNCH10',
        discountType: 'percentage' as const,
        discountValue: 10,
        discountAmountINR: 10000,
        discountAmountUSD: 150,
      },
      promoDiscountAmountINR: 10000,
      promoDiscountAmountUSD: 150,
    };

    render(
      <StepCommercials
        selectedEngine={mockEngine}
        totalCost={totalCost}
        maintenancePlans={mockMaintenance}
        formData={{
          selectedFeatures: ['auth', 'admin'],
          selectedMaintenanceId: 'essential',
          timeline: 'Standard (3–4 weeks)',
          additionalNotes: '',
          hostingOwnership: 'client_owned',
          taxInvoicingPreference: 'standard',
          agreedToTerms: false,
        }}
        autoMaintenancePlanId="essential"
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        currency="USD"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        timelineOptions={['Standard (3–4 weeks)']}
        termsList={mockTerms}
        togglePopover={vi.fn()}
        onChangeField={vi.fn()}
      />
    );

    const promoRow = screen.getByText(/PROMO CODE SAVINGS \(LAUNCH10\)/i).closest('div');
    expect(promoRow).toBeDefined();
    expect(promoRow?.textContent).toContain('$150');
  });

  it('displays computed 50% milestone figures and commercial guarantees', () => {
    const totalCost = {
      totalINR: 200000,
      totalUSD: 2500,
      featuresINR: 80000,
      featuresUSD: 1000,
      brandOpt: { label: 'Included', priceINR: 0, priceUSD: 0 },
      depositINR: 100000,
      depositUSD: 1250,
      balanceINR: 100000,
      balanceUSD: 1250,
    };

    render(
      <StepCommercials
        selectedEngine={mockEngine}
        totalCost={totalCost}
        maintenancePlans={mockMaintenance}
        formData={{
          selectedFeatures: ['auth', 'admin'],
          selectedMaintenanceId: 'essential',
          timeline: 'Standard (3–4 weeks)',
          additionalNotes: '',
          hostingOwnership: 'client_owned',
          taxInvoicingPreference: 'standard',
          agreedToTerms: false,
        }}
        autoMaintenancePlanId="essential"
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        timelineOptions={['Standard (3–4 weeks)']}
        termsList={mockTerms}
        togglePopover={vi.fn()}
        onChangeField={vi.fn()}
      />
    );

    expect(screen.getByText(/50% Milestone Lock/i)).toBeDefined();
    expect(screen.getByText(/30-Day Post-Launch Warranty/i)).toBeDefined();
    expect(screen.getAllByText(/100% IP Transfer/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Capped Commercial Liability/i)).toBeDefined();

    expect(screen.getAllByText(/Upfront Deposit/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/₹1,00,000/i).length).toBe(2);
    expect(screen.getByText(/Final Handoff/i)).toBeDefined();
  });

  it('toggles expandable full legal terms accordion on click', () => {
    const totalCost = {
      totalINR: 200000,
      totalUSD: 2500,
      featuresINR: 80000,
      featuresUSD: 1000,
      brandOpt: { label: 'Included', priceINR: 0, priceUSD: 0 },
    };

    render(
      <StepCommercials
        selectedEngine={mockEngine}
        totalCost={totalCost}
        maintenancePlans={mockMaintenance}
        formData={{
          selectedFeatures: ['auth'],
          selectedMaintenanceId: 'essential',
          timeline: 'Standard (3–4 weeks)',
          additionalNotes: '',
          hostingOwnership: 'client_owned',
          taxInvoicingPreference: 'standard',
          agreedToTerms: false,
        }}
        autoMaintenancePlanId="essential"
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        timelineOptions={['Standard (3–4 weeks)']}
        termsList={mockTerms}
        togglePopover={vi.fn()}
        onChangeField={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /View Full Legal Terms/i });
    expect(toggleBtn).toBeDefined();

    expect(screen.queryByText(/Clause 1:/i)).toBeNull();

    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Clause 1: 50% upfront deposit/i)).toBeDefined();
    expect(screen.getByText(/Clause 3: 100% intellectual property/i)).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(screen.queryByText(/Clause 1:/i)).toBeNull();
  });

  it('renders deferred contact email and phone inputs and triggers onChangeField', () => {
    const onChange = vi.fn();
    const totalCost = {
      totalINR: 200000,
      totalUSD: 2500,
      featuresINR: 80000,
      featuresUSD: 1000,
      brandOpt: { label: 'Included', priceINR: 0, priceUSD: 0 },
    };

    render(
      <StepCommercials
        selectedEngine={mockEngine}
        totalCost={totalCost}
        maintenancePlans={mockMaintenance}
        formData={{
          selectedFeatures: ['auth'],
          selectedMaintenanceId: 'essential',
          timeline: 'Standard (3–4 weeks)',
          additionalNotes: '',
          hostingOwnership: 'client_owned',
          taxInvoicingPreference: 'standard',
          agreedToTerms: false,
          contactEmail: '',
          contactPhone: '',
        }}
        autoMaintenancePlanId="essential"
        activePopoverId={null}
        setActivePopoverId={vi.fn()}
        popoverAnchor={null}
        setPopoverAnchor={vi.fn()}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        timelineOptions={['Standard (3–4 weeks)']}
        termsList={mockTerms}
        togglePopover={vi.fn()}
        onChangeField={onChange}
      />
    );

    const emailInput = screen.getByLabelText(/Contact Email/i);
    expect(emailInput).toBeDefined();
    fireEvent.change(emailInput, { target: { value: 'ceo@startup.io' } });
    expect(onChange).toHaveBeenCalledWith('contactEmail', 'ceo@startup.io');

    const phoneInput = screen.getByLabelText(/Contact Phone or WhatsApp/i);
    expect(phoneInput).toBeDefined();
    fireEvent.change(phoneInput, { target: { value: '+91 99999 88888' } });
    expect(onChange).toHaveBeenCalledWith('contactPhone', '+91 99999 88888');
  });
});
