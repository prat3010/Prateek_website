import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { DependencyCascadeModal } from '../DependencyCascadeModal';
import type { FeatureItem } from '@/data/resume';

const mockTargetFeature: FeatureItem = {
  id: 'auth',
  label: 'User Auth & Client Portal (Google/Magic Link)',
  priceINR: 25000,
  priceUSD: 350,
  laymanDescription: 'Allows customers to securely sign in.',
  techSpecs: 'Google OAuth, PKCE, RLS',
};

const mockDependentFeatures: FeatureItem[] = [
  {
    id: 'admin',
    label: 'Admin Dashboard & Role Access Control (RBAC)',
    priceINR: 75000,
    priceUSD: 1000,
    laymanDescription: 'Command center for team.',
    techSpecs: 'Analytics, CRM, Permissions',
    dependsOn: ['auth'],
  },
  {
    id: 'crm',
    label: 'CRM & Lead Management Module',
    priceINR: 60000,
    priceUSD: 800,
    laymanDescription: 'Private pipeline to track deals.',
    techSpecs: 'Deal Pipeline, Custom Fields',
    dependsOn: ['auth'],
  },
];

describe('DependencyCascadeModal Component', () => {
  it('renders correctly when open with target and dependent features', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DependencyCascadeModal
        isOpen={true}
        targetFeature={mockTargetFeature}
        dependentFeatures={mockDependentFeatures}
        currency="INR"
        onConfirmRemoveAll={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Dependency Conflict Detected')).toBeInTheDocument();
    expect(screen.getByText(mockTargetFeature.label)).toBeInTheDocument();
    expect(screen.getByText(mockDependentFeatures[0].label)).toBeInTheDocument();
    expect(screen.getByText(mockDependentFeatures[1].label)).toBeInTheDocument();
    
    // Check total savings (Auth 25k + Admin 75k + CRM 60k = 160k INR)
    expect(screen.getByText(/Total Investment Reduction/i)).toBeInTheDocument();
    expect(screen.getByText(/₹1,60,000/i)).toBeInTheDocument();
  });

  it('calls onConfirmRemoveAll when clicking Remove All Modules button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DependencyCascadeModal
        isOpen={true}
        targetFeature={mockTargetFeature}
        dependentFeatures={mockDependentFeatures}
        currency="USD"
        onConfirmRemoveAll={onConfirm}
        onCancel={onCancel}
      />
    );

    const removeBtn = screen.getByText(/Remove All 3 Modules/i);
    fireEvent.click(removeBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when clicking Keep button', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DependencyCascadeModal
        isOpen={true}
        targetFeature={mockTargetFeature}
        dependentFeatures={mockDependentFeatures}
        currency="INR"
        onConfirmRemoveAll={onConfirm}
        onCancel={onCancel}
      />
    );

    const keepBtn = screen.getByText(/Keep User/i);
    fireEvent.click(keepBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when pressing Escape key', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DependencyCascadeModal
        isOpen={true}
        targetFeature={mockTargetFeature}
        dependentFeatures={mockDependentFeatures}
        currency="INR"
        onConfirmRemoveAll={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <DependencyCascadeModal
        isOpen={false}
        targetFeature={mockTargetFeature}
        dependentFeatures={mockDependentFeatures}
        currency="INR"
        onConfirmRemoveAll={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
