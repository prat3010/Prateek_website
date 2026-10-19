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

  it('dynamically computes Bézier circuit curves and activates connections when connected nodes are active', () => {
    const { rerender } = render(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['auth']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    // conn_auth_postgres should be active because both auth and postgres are active
    const authPostgresTrace = screen.getByTestId('circuit-trace-conn_auth_postgres');
    expect(authPostgresTrace).toBeInTheDocument();
    expect(authPostgresTrace.getAttribute('data-active')).toBe('true');
    expect(authPostgresTrace.getAttribute('d')).toMatch(/^M \d+ \d+ C/);

    // conn_pgvector_retriever_rag should be dormant because ai_rag is not in selectedFeatureIds
    const ragTrace = screen.getByTestId('circuit-trace-conn_pgvector_retriever_rag');
    expect(ragTrace.getAttribute('data-active')).toBe('false');

    // conn_retriever_rag_graphrag (intra-tier same column) should be dormant
    const intraTierTrace = screen.getByTestId('circuit-trace-conn_retriever_rag_graphrag');
    expect(intraTierTrace.getAttribute('data-active')).toBe('false');
    // Intra-tier trace should route via outward arc without looping backwards
    expect(intraTierTrace.getAttribute('d')).toBe('M 780 97 C 805 97, 805 337, 780 337');

    // Now re-render with ai_rag active
    rerender(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['auth', 'ai_rag']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    const activeRagTrace = screen.getByTestId('circuit-trace-conn_pgvector_retriever_rag');
    expect(activeRagTrace.getAttribute('data-active')).toBe('true');

    const activeIntraTierTrace = screen.getByTestId('circuit-trace-conn_retriever_rag_graphrag');
    expect(activeIntraTierTrace.getAttribute('data-active')).toBe('true');
  });

  it('activates Docling OCR node when ai_vision_ocr is in blueprint', () => {
    const { rerender } = render(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['auth']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    expect(screen.getByRole('button', { name: /Docling Layout OCR \(Dormant\)/i })).toBeInTheDocument();

    rerender(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['auth', 'ai_vision_ocr']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    expect(screen.getByRole('button', { name: /Docling Layout OCR \(Active\)/i })).toBeInTheDocument();
  });
});
