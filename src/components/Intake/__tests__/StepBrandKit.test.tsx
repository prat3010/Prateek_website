import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepBrandKit } from '../StepBrandKit';
import type { BrandAssetOption } from '@/data/resume';

const mockBrandAssets: BrandAssetOption[] = [
  {
    id: 'ready',
    label: 'All Brand Assets Ready (Figma, Adobe XD, Logo & Copy)',
    priceINR: 0,
    priceUSD: 0,
    description: 'Client supplies Figma / Adobe XD design files, vector logo, and text content.',
    designReadiness: 'figma_ready',
  },
  {
    id: 'copy',
    label: 'Need Technical Copywriting & Section Formatting',
    priceINR: 15000,
    priceUSD: 200,
    description: 'Professional tech copywriting, tagline crafting, and bullet formatting.',
    designReadiness: 'wireframes_ready',
  },
  {
    id: 'scratch',
    label: 'Starting from Scratch (Starter Brand Kit & Copy)',
    priceINR: 45000,
    priceUSD: 600,
    description: 'Starter Brand Kit: custom logo concepts, color palette, and copywriting.',
    designReadiness: 'concept_only',
  },
];

describe('StepBrandKit Component', () => {
  it('renders all brand options with deliverable chips and scope tags', () => {
    const onSelect = vi.fn();

    render(
      <StepBrandKit
        brandAssets={mockBrandAssets}
        selectedBrandAssetId="ready"
        currency="INR"
        onSelectBrandAsset={onSelect}
      />
    );

    expect(screen.getByText(/Design System & Content Readiness Tier/i)).toBeDefined();
    expect(screen.getAllByText(/Included in Base/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Copywriting Add-On/i)).toBeDefined();
    expect(screen.getByText(/Full Brand & Content/i)).toBeDefined();

    // Verify deliverable chips
    expect(screen.getByText(/Client Figma Spec Ingestion/i)).toBeDefined();
    expect(screen.getByText(/Technical Storytelling/i)).toBeDefined();
    expect(screen.getByText(/3 Logo Concepts/i)).toBeDefined();
  });

  it('triggers onSelectBrandAsset when an option card is clicked', () => {
    const onSelect = vi.fn();

    render(
      <StepBrandKit
        brandAssets={mockBrandAssets}
        selectedBrandAssetId="ready"
        currency="INR"
        onSelectBrandAsset={onSelect}
      />
    );

    const copyCard = screen.getByText(/Need Technical Copywriting/i).closest('button');
    expect(copyCard).toBeDefined();

    fireEvent.click(copyCard!);
    expect(onSelect).toHaveBeenCalledWith(mockBrandAssets[1]);
  });
});
