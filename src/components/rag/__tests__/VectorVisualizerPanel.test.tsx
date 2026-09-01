import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VectorVisualizerPanel } from "../VectorVisualizerPanel";
import type { RetrieverClient } from "@/lib/rag-client";

// Mock ResizeObserver for jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("VectorVisualizerPanel Component", () => {
  const mockProjectEmbeddings = vi.fn();
  const mockSearch = vi.fn();

  const mockClient = {
    projectEmbeddings: mockProjectEmbeddings,
    search: mockSearch,
  } as unknown as RetrieverClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when hidden is true", () => {
    const { container } = render(<VectorVisualizerPanel client={mockClient} hidden={true} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders correctly with title, controls and fetches projection on mount", async () => {
    mockProjectEmbeddings.mockResolvedValueOnce({
      tenant_id: "t1",
      total_points: 3,
      dimensions: 3,
      method_used: "pca",
      points: [
        {
          chunk_id: "c1",
          document_id: "d1",
          document_title: "Architecture.md",
          coordinates: [10.5, 20.2, -5.1],
          cluster_id: 0,
          cluster_label: "System Design",
          text_preview: "Architecture overview and system design principles.",
        },
        {
          chunk_id: "c2",
          document_id: "d1",
          document_title: "Architecture.md",
          coordinates: [12.0, 22.1, -4.8],
          cluster_id: 0,
          cluster_label: "System Design",
          text_preview: "Modular component boundaries and clean architecture.",
        },
        {
          chunk_id: "c3",
          document_id: "d2",
          document_title: "Billing.md",
          coordinates: [-30.1, -15.5, 12.0],
          cluster_id: 1,
          cluster_label: "Invoices & Stripe",
          text_preview: "Monthly invoice generation and payment webhooks.",
        },
      ],
      centroids: [
        {
          cluster_id: 0,
          cluster_label: "System Design",
          coordinates: [11.25, 21.15, -4.95],
          chunk_count: 2,
        },
        {
          cluster_id: 1,
          cluster_label: "Invoices & Stripe",
          coordinates: [-30.1, -15.5, 12.0],
          chunk_count: 1,
        },
      ],
      variance_explained: [0.65, 0.25, 0.1],
      silhouette_score: 0.72,
    });

    render(<VectorVisualizerPanel client={mockClient} />);

    expect(screen.getByText(/3D Embedding Space Explorer/i)).toBeDefined();
    expect(screen.getByText(/Milestone 82 SOTA/i)).toBeDefined();

    await waitFor(() => {
      expect(mockProjectEmbeddings).toHaveBeenCalledTimes(1);
      expect(screen.getByText("3")).toBeDefined(); // Total chunks count
      expect(screen.getByText("0.720")).toBeDefined(); // Silhouette score
    });
  });

  it("switches to table view and displays points properly", async () => {
    mockProjectEmbeddings.mockResolvedValueOnce({
      tenant_id: "t1",
      total_points: 2,
      dimensions: 3,
      method_used: "pca",
      points: [
        {
          chunk_id: "c1",
          document_id: "d1",
          document_title: "Spec.pdf",
          coordinates: [5.0, 10.0, 15.0],
          cluster_id: 0,
          cluster_label: "API Specs",
          text_preview: "REST API endpoints and contracts.",
        },
        {
          chunk_id: "c2",
          document_id: "d2",
          document_title: "Auth.pdf",
          coordinates: [-5.0, -10.0, -15.0],
          cluster_id: 1,
          cluster_label: "Authentication",
          text_preview: "JWT authentication and session handling.",
        },
      ],
      centroids: [],
    });

    render(<VectorVisualizerPanel client={mockClient} />);

    const tableToggleBtn = screen.getByText(/📋 Table View/i);
    fireEvent.click(tableToggleBtn);

    await waitFor(() => {
      expect(screen.getByText("Spec.pdf")).toBeDefined();
      expect(screen.getByText("Auth.pdf")).toBeDefined();
      expect(screen.getByText("API Specs")).toBeDefined();
      expect(screen.getByText("Authentication")).toBeDefined();
    });
  });

  it("handles empty collection state gracefully", async () => {
    mockProjectEmbeddings.mockResolvedValueOnce({
      tenant_id: "t1",
      total_points: 0,
      dimensions: 3,
      method_used: "none",
      points: [],
      centroids: [],
    });

    render(<VectorVisualizerPanel client={mockClient} />);

    await waitFor(() => {
      expect(screen.getByText(/No Document Embeddings Found/i)).toBeDefined();
    });
  });
});
