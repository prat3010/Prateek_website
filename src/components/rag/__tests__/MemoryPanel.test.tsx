import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryPanel } from "../MemoryPanel";
import type { RetrieverClient } from "@/lib/rag-client";

// Mock @number-flow/react for Vitest/jsdom compatibility
vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => <span data-testid="number-flow">{value}</span>,
}));

// Mock UI interaction wrappers
vi.mock("@/components/ui/TiltCard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/MagneticButton", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("MemoryPanel Component (Milestone 108)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 4-stat metrics grid and titles in demo mode", () => {
    render(<MemoryPanel hidden={false} client={null} tenantId="" />);

    expect(
      screen.getByText(/Cognitive Agent Memory & Experience Distillation/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Total Memories/i)).toBeInTheDocument();
    expect(screen.getByText(/Episodic \/ Procedural/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Stability \(S\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Experience Injections/i)).toBeInTheDocument();
  });

  it("filters memory nodes when clicking filter tabs", () => {
    render(<MemoryPanel hidden={false} client={null} tenantId="" />);

    // Initially "All" shows demo cards (3 demo nodes)
    expect(screen.getByText(/Execute Python script to process user usage CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Calculate enterprise volume discount pricing schedule/i)).toBeInTheDocument();

    // Click "Procedural" filter tab
    const proceduralTab = screen.getByRole("button", { name: /^Procedural$/i });
    fireEvent.click(proceduralTab);

    // Procedural card should be visible
    expect(screen.getByText(/Execute Python script to process user usage CSV/i)).toBeInTheDocument();
    // Episodic card should now be filtered out
    expect(screen.queryByText(/Calculate enterprise volume discount pricing schedule/i)).not.toBeInTheDocument();
  });

  it("allows searching memory nodes via input search box", () => {
    render(<MemoryPanel hidden={false} client={null} tenantId="" />);

    const searchInput = screen.getByPlaceholderText(/Search memories or tools/i);
    fireEvent.change(searchInput, { target: { value: "GraphRAG" } });

    // Only GraphRAG semantic node matches
    expect(screen.getByText(/Traverse GraphRAG triples for multi-cloud quorum topology/i)).toBeInTheDocument();
    expect(screen.queryByText(/Execute Python script to process user usage CSV/i)).not.toBeInTheDocument();
  });

  it("runs the Experience Distillation Simulator and renders guidance prompt", async () => {
    const mockClient = {
      testMemoryGuidance: vi.fn().mockResolvedValue({
        relevant_nodes: [
          {
            node: {
              id: "mem_mock_1",
              tenant_id: "tn_mock",
              memory_type: "procedural",
              query: "Run Python REPL script to process CSV",
              distilled_insight: "Self-healed CSV delimiter parsing.",
              tool_chain: ["rlm_execute"],
              success: true,
              turns_count: 2,
              importance_score: 0.85,
              stability_score: 3.5,
              retention_score: 0.95,
              last_accessed_at: Date.now() / 1000,
              access_count: 5,
              created_at: Date.now() / 1000,
            },
            similarity_score: 0.86,
            retention_score: 0.94,
          },
        ],
        guidance_prompt: "DISTILLED EXPERIENCE FROM PRIOR SESSIONS:\n- [Strategy (PROCEDURAL, sim=0.86)]: Self-healed CSV delimiter parsing.",
        matched_tool_chains: [["rlm_execute"]],
      }),
      getMemoryStats: vi.fn().mockResolvedValue({
        total_memories: 14,
        episodic_count: 8,
        semantic_count: 4,
        procedural_count: 2,
        avg_stability: 3.42,
        total_access_count: 47,
      }),
      listMemoryNodes: vi.fn().mockResolvedValue([]),
    } as unknown as RetrieverClient;

    render(<MemoryPanel hidden={false} client={mockClient} tenantId="tn_mock" />);

    const input = screen.getByPlaceholderText(/Enter hypothetical task/i);
    const form = input.closest("form")!;
    fireEvent.change(input, { target: { value: "Run Python REPL script to process CSV" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Test Guidance/i })).not.toBeDisabled();
    });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockClient.testMemoryGuidance).toHaveBeenCalled();
    });

    const container = await screen.findByTestId("guidance-result-container");
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain("Distilled Guidance Prompt");
    expect(container.textContent).toContain("DISTILLED EXPERIENCE FROM PRIOR SESSIONS");
  });

  it("calls client methods when live client is provided", async () => {
    const mockClient = {
      getMemoryStats: vi.fn().mockResolvedValue({
        total_memories: 25,
        episodic_count: 15,
        semantic_count: 6,
        procedural_count: 4,
        avg_stability: 4.8,
        total_access_count: 90,
      }),
      listMemoryNodes: vi.fn().mockResolvedValue([
        {
          id: "mem_live_1",
          tenant_id: "tn_live",
          memory_type: "episodic",
          query: "Live indexing run",
          distilled_insight: "Index refreshed with 0 errors.",
          tool_chain: ["hybrid_search"],
          success: true,
          turns_count: 1,
          importance_score: 0.7,
          stability_score: 2.0,
          last_accessed_at: Date.now() / 1000,
          access_count: 4,
          created_at: Date.now() / 1000,
        },
      ]),
      pruneMemories: vi.fn().mockResolvedValue({ pruned_count: 2, min_retention: 0.15 }),
      deleteMemoryNode: vi.fn().mockResolvedValue({ deleted: true, node_id: "mem_live_1" }),
    } as unknown as RetrieverClient;

    render(<MemoryPanel hidden={false} client={mockClient} tenantId="tn_live" />);

    await waitFor(() => {
      expect(mockClient.getMemoryStats).toHaveBeenCalled();
      expect(mockClient.listMemoryNodes).toHaveBeenCalled();
      expect(screen.getByText("Live indexing run")).toBeInTheDocument();
    });

    // Test prune button click
    const pruneBtn = screen.getByRole("button", { name: /Prune Decayed/i });
    fireEvent.click(pruneBtn);

    await waitFor(() => {
      expect(mockClient.pruneMemories).toHaveBeenCalledWith(0.15);
    });
  });
});
