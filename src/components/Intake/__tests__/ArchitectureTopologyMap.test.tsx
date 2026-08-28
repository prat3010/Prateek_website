import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { ArchitectureTopologyMap } from '../ArchitectureTopologyMap';
import type { BaseEngineItem, FeatureItem } from '@/data/resume';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';

const { engines, features } = questionnaireDefaults as {
  engines: BaseEngineItem[];
  features: FeatureItem[];
};

describe('ArchitectureTopologyMap Component', () => {
  it('renders title, active node count pill and circuit diagram', () => {
    render(
      <ArchitectureTopologyMap
        selectedEngineId="landing"
        selectedFeatureIds={['auth', 'payments']}
        allEngines={engines}
        allFeatures={features}
        currency="INR"
        onAddFeature={vi.fn()}
      />
    );

    expect(screen.getByText(/Live System Architecture Topology/i)).toBeInTheDocument();
    expect(screen.getByText(/Nodes Active/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Architecture Topology Circuit Blueprint/i })).toBeInTheDocument();
  });

  it('switches to Matrix View when clicking Matrix View toggle', () => {
    render(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['auth', 'admin', 'ai_rag']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
        onAddFeature={vi.fn()}
      />
    );

    const matrixBtn = screen.getByRole('button', { name: /Matrix View/i });
    fireEvent.click(matrixBtn);

    expect(screen.getByText(/1. Client & Presentation Layer/i)).toBeInTheDocument();
    expect(screen.getByText(/5. Cognitive AI Engine/i)).toBeInTheDocument();
  });

  it('calls onAddFeature when clicking Add button on a dormant node in matrix view', () => {
    const onAdd = vi.fn();
    render(
      <ArchitectureTopologyMap
        selectedEngineId="landing"
        selectedFeatureIds={['auth']}
        allEngines={engines}
        allFeatures={features}
        currency="INR"
        onAddFeature={onAdd}
      />
    );

    // Switch to matrix view
    const matrixBtn = screen.getByRole('button', { name: /Matrix View/i });
    fireEvent.click(matrixBtn);

    // Find and click an Add button
    const addBtns = screen.getAllByRole('button', { name: /Add/i });
    expect(addBtns.length).toBeGreaterThan(0);
    fireEvent.click(addBtns[0]);

    expect(onAdd).toHaveBeenCalled();
  });

  it('opens and closes fullscreen modal view', () => {
    render(
      <ArchitectureTopologyMap
        selectedEngineId="landing"
        selectedFeatureIds={['auth', 'email']}
        allEngines={engines}
        allFeatures={features}
        currency="INR"
      />
    );

    const expandBtn = screen.getByTitle(/Expand Fullscreen/i);
    fireEvent.click(expandBtn);

    expect(screen.getByRole('dialog', { name: /Fullscreen Architecture Topology/i })).toBeInTheDocument();

    const closeFullscreenBtn = screen.getByLabelText(/Close Fullscreen View/i);
    fireEvent.click(closeFullscreenBtn);

    expect(screen.queryByRole('dialog', { name: /Fullscreen Architecture Topology/i })).not.toBeInTheDocument();
  });
});
