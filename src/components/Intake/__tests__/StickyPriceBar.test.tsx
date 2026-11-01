import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StickyPriceBar } from '../StickyPriceBar';
import type { BaseEngineItem } from '@/data/resume';

const mockEngine: BaseEngineItem = {
  id: 'landing',
  title: 'High-Converting Landing Page',
  tier: 'Foundation Tier',
  priceINR: 45000,
  priceUSD: 600,
  laymanDescription: 'Single page portfolio or product launchpad',
  techSpecs: 'Next.js 16, React 19, CSS Modules',
};

describe('StickyPriceBar Component', () => {
  it('renders live price, formula breakdown, and total in active currency', () => {
    const totalCost = {
      totalINR: 75000,
      totalUSD: 1000,
      featuresINR: 30000,
      featuresUSD: 400,
      brandPriceINR: 0,
      brandPriceUSD: 0,
    };

    render(
      <StickyPriceBar
        selectedEngine={mockEngine}
        totalCost={totalCost}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        showMobileFormula={false}
        setShowMobileFormula={vi.fn()}
      />
    );

    expect(screen.getByText(/Live Pure Additive Arithmetic Formula/i)).toBeDefined();
    expect(screen.getByText(/Estimated Total:/i)).toBeDefined();
    expect(screen.getByText(/₹75,000/i)).toBeDefined();
  });

  it('renders embedded NEXT STEP progression CTA when currentStep < 4', () => {
    const onNextStep = vi.fn();
    const totalCost = {
      totalINR: 75000,
      totalUSD: 1000,
      featuresINR: 30000,
      featuresUSD: 400,
      brandPriceINR: 0,
      brandPriceUSD: 0,
    };

    render(
      <StickyPriceBar
        selectedEngine={mockEngine}
        totalCost={totalCost}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        showMobileFormula={false}
        setShowMobileFormula={vi.fn()}
        currentStep={1}
        onNextStep={onNextStep}
        nextStepLabel="NEXT: TECHNICAL SCOPE"
      />
    );

    const nextBtn = screen.getByRole('button', { name: /NEXT: TECHNICAL SCOPE/i });
    expect(nextBtn).toBeDefined();

    fireEvent.click(nextBtn);
    expect(onNextStep).toHaveBeenCalledTimes(1);
  });

  it('hides NEXT STEP button on Step 4 (final proposal review)', () => {
    const onNextStep = vi.fn();
    const totalCost = {
      totalINR: 75000,
      totalUSD: 1000,
      featuresINR: 30000,
      featuresUSD: 400,
      brandPriceINR: 0,
      brandPriceUSD: 0,
    };

    render(
      <StickyPriceBar
        selectedEngine={mockEngine}
        totalCost={totalCost}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        showMobileFormula={false}
        setShowMobileFormula={vi.fn()}
        currentStep={4}
        onNextStep={onNextStep}
        nextStepLabel={undefined}
      />
    );

    expect(screen.queryByRole('button', { name: /NEXT STEP/i })).toBeNull();
  });

  it('displays discount badge when volume bundle or promo discount is active', () => {
    const totalCost = {
      totalINR: 70000,
      totalUSD: 950,
      featuresINR: 30000,
      featuresUSD: 400,
      brandPriceINR: 0,
      brandPriceUSD: 0,
      bundleDiscountPercent: 10,
    };

    render(
      <StickyPriceBar
        selectedEngine={mockEngine}
        totalCost={totalCost}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        showMobileFormula={false}
        setShowMobileFormula={vi.fn()}
      />
    );

    expect(screen.getByText(/10% Bundle Active/i)).toBeDefined();
  });

  it('renders Scope Copilot and Architecture Cart actions with item counts', () => {
    const onOpenCart = vi.fn();
    const onOpenCopilot = vi.fn();
    const totalCost = {
      totalINR: 75000,
      totalUSD: 1000,
      featuresINR: 30000,
      featuresUSD: 400,
      brandPriceINR: 0,
      brandPriceUSD: 0,
    };

    render(
      <StickyPriceBar
        selectedEngine={mockEngine}
        totalCost={totalCost}
        currency="INR"
        priceInCurrency={(inr, usd) => `₹${inr.toLocaleString()} / $${usd}`}
        showMobileFormula={false}
        setShowMobileFormula={vi.fn()}
        onOpenCart={onOpenCart}
        onOpenCopilot={onOpenCopilot}
        itemCount={5}
      />
    );

    const copilotBtn = screen.getByRole('button', { name: /Open Scope Copilot/i });
    expect(copilotBtn).toBeDefined();
    fireEvent.click(copilotBtn);
    expect(onOpenCopilot).toHaveBeenCalledTimes(1);

    const cartBtn = screen.getByRole('button', { name: /Open Architecture Cart/i });
    expect(cartBtn).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    fireEvent.click(cartBtn);
    expect(onOpenCart).toHaveBeenCalledTimes(1);
  });
});
