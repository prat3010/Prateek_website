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
    expect(screen.getByText(/Components Active/i)).toBeInTheDocument();
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

    expect(screen.getByText(/1. Visitor & Customer Access/i)).toBeInTheDocument();
    expect(screen.getByText(/4. AI Intelligence & Automation/i)).toBeInTheDocument();
    expect(screen.getByText(/5. Data & Connected Tools/i)).toBeInTheDocument();
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

    // conn_auth_database should be active because both auth and database are active
    const authDbTrace = screen.getByTestId('circuit-trace-conn_auth_database');
    expect(authDbTrace).toBeInTheDocument();
    expect(authDbTrace.getAttribute('data-active')).toBe('true');
    expect(authDbTrace.getAttribute('d')).toMatch(/^M \d+ \d+ C/);

    // conn_commerce_payments (intra-tier same column) should be dormant because commerce & payments are not selected
    const commercePaymentsTrace = screen.getByTestId('circuit-trace-conn_commerce_payments');
    expect(commercePaymentsTrace.getAttribute('data-active')).toBe('false');
    // Intra-tier trace routes via outward arc in the column gutter
    expect(commercePaymentsTrace.getAttribute('d')).toBe('M 585 106 C 607 106, 607 190, 585 190');

    // Now re-render with commerce and payments active
    rerender(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['auth', 'commerce', 'payments']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    const activeCommercePaymentsTrace = screen.getByTestId('circuit-trace-conn_commerce_payments');
    expect(activeCommercePaymentsTrace.getAttribute('data-active')).toBe('true');
  });

  it('activates AI Document Scanner node when ai_vision_ocr is in blueprint', () => {
    const { rerender } = render(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['auth']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    expect(screen.getByRole('button', { name: /AI Document Scanner \(Dormant\)/i })).toBeInTheDocument();

    rerender(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['auth', 'ai_vision_ocr']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    expect(screen.getByRole('button', { name: /AI Document Scanner \(Active\)/i })).toBeInTheDocument();
  });

  it('never displays internal agency portfolio toys (Hacker CLI terminal, internal proxy telemetry, Docling, GraphRAG, Retriever)', () => {
    render(
      <ArchitectureTopologyMap
        selectedEngineId="landing"
        selectedFeatureIds={[]}
        allEngines={engines}
        allFeatures={features}
        currency="INR"
      />
    );

    // Should never render agency-internal CLI terminal or internal libraries
    expect(screen.queryByText(/Hacker CLI Terminal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/CLI Remote RPC/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/GDPR daily IP hashing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Docling/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/GraphRAG/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Retriever/i)).not.toBeInTheDocument();

    // Renders the friendly client blueprint helper legend
    expect(screen.getByText(/Included in Your Scope/i)).toBeInTheDocument();
    expect(screen.getByText(/Available Add-on/i)).toBeInTheDocument();
    expect(screen.getByText(/Click any component to inspect what it delivers/i)).toBeInTheDocument();
  });

  it('keeps database dormant for static landing page without database features, and activates on SaaS or data features', () => {
    const { rerender } = render(
      <ArchitectureTopologyMap
        selectedEngineId="landing"
        selectedFeatureIds={[]}
        allEngines={engines}
        allFeatures={features}
        currency="INR"
      />
    );

    // On a pure landing page, database is dormant; only Web platform + Security shield are active
    expect(screen.getByRole('button', { name: /Encrypted Cloud Database \(Dormant\)/i })).toBeInTheDocument();
    expect(screen.getByText(/2 of 21 Components Active/i)).toBeInTheDocument();

    // When client adds Auth, database activates!
    rerender(
      <ArchitectureTopologyMap
        selectedEngineId="landing"
        selectedFeatureIds={['auth']}
        allEngines={engines}
        allFeatures={features}
        currency="INR"
      />
    );

    expect(screen.getByRole('button', { name: /Encrypted Cloud Database \(Active\)/i })).toBeInTheDocument();

    // When SaaS core engine is chosen, Encrypted Cloud Database activates automatically
    rerender(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={[]}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    expect(screen.getByRole('button', { name: /Encrypted Cloud Database \(Active\)/i })).toBeInTheDocument();
  });

  it('accurately activates client deliverables: e-commerce, LMS, CRM, i18n, video, voice AI, and integrations', () => {
    const { rerender } = render(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={[]}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    // Check dormant deliverables
    expect(screen.getByRole('button', { name: /Storefront & Cart \(Dormant\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Course & LMS Academy \(Dormant\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CRM & Lead Pipeline \(Dormant\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Global Multi-Language \(Dormant\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Video Streaming Hub \(Dormant\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Real-Time Voice AI \(Dormant\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Third-Party Integrations \(Dormant\)/i })).toBeInTheDocument();

    // Activate them
    rerender(
      <ArchitectureTopologyMap
        selectedEngineId="saas"
        selectedFeatureIds={['commerce', 'lms', 'crm', 'i18n', 'video', 'ai_voice_agent', 'integrations']}
        allEngines={engines}
        allFeatures={features}
        currency="USD"
      />
    );

    expect(screen.getByRole('button', { name: /Storefront & Cart \(Active\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Course & LMS Academy \(Active\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CRM & Lead Pipeline \(Active\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Global Multi-Language \(Active\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Video Streaming Hub \(Active\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Real-Time Voice AI \(Active\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Third-Party Integrations \(Active\)/i })).toBeInTheDocument();
  });

  it('displays layman business benefits and add-on CTA when inspecting a node', () => {
    const onAdd = vi.fn();
    render(
      <ArchitectureTopologyMap
        selectedEngineId="landing"
        selectedFeatureIds={[]}
        allEngines={engines}
        allFeatures={features}
        currency="INR"
        onAddFeature={onAdd}
      />
    );

    // Click on dormant Storefront & Cart node
    const commerceBtn = screen.getByRole('button', { name: /Storefront & Cart \(Dormant\)/i });
    fireEvent.click(commerceBtn);

    // Inspector should open with plain-English business explanation
    expect(screen.getByText(/What it delivers:/i)).toBeInTheDocument();
    expect(screen.getByText(/A complete online store with product catalog/i)).toBeInTheDocument();
    expect(screen.getByText(/System connection:/i)).toBeInTheDocument();

    // Click "Add Module" in inspector tooltip
    const addModuleBtn = screen.getByRole('button', { name: /Add Module/i });
    fireEvent.click(addModuleBtn);

    expect(onAdd).toHaveBeenCalledWith('commerce');
  });
});
