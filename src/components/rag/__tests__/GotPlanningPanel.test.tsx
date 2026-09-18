import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

vi.mock("@/components/ui/MagneticButton", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

import GotPlanningPanel from "../GotPlanningPanel";
import type { RetrieverClient } from "@/lib/rag-client";

describe("GotPlanningPanel Component", () => {
  const mockCreateGoTPlan = vi.fn();
  const mockGetGoTPlan = vi.fn();
  const mockStepGoTPlan = vi.fn();
  const mockExecuteGoTPlan = vi.fn();
  const mockAggregateGoTThoughts = vi.fn();
  const mockGetHierarchicalMemory = vi.fn().mockResolvedValue(null);
  const mockDistillGoTPlan = vi.fn();
  const mockSimulateGoTMath = vi.fn();

  const mockClient = {
    createGoTPlan: mockCreateGoTPlan,
    getGoTPlan: mockGetGoTPlan,
    stepGoTPlan: mockStepGoTPlan,
    executeGoTPlan: mockExecuteGoTPlan,
    aggregateGoTThoughts: mockAggregateGoTThoughts,
    getHierarchicalMemory: mockGetHierarchicalMemory,
    distillGoTPlan: mockDistillGoTPlan,
    simulateGoTMath: mockSimulateGoTMath,
  } as unknown as RetrieverClient;

  it("renders header, title, and Platform Battery #38 badge", async () => {
    await act(async () => {
      render(<GotPlanningPanel client={mockClient} tenantId="demo-tenant" />);
    });

    expect(screen.getByText("Graph-of-Thoughts & Hierarchical Memory")).toBeInTheDocument();
    expect(screen.getByText("Platform Battery #38")).toBeInTheDocument();
    expect(screen.getByText(/Kahn’s topological optimal path/i)).toBeInTheDocument();
  });

  it("switches tabs across canvas, memory, ledger, and simulator", async () => {
    await act(async () => {
      render(<GotPlanningPanel client={mockClient} tenantId="demo-tenant" />);
    });

    // Initial tab is canvas
    expect(screen.getByPlaceholderText(/Enter reasoning goal/i)).toBeInTheDocument();
    expect(screen.getByText("Init GoT Plan")).toBeInTheDocument();
    expect(screen.getByText("+ Generate (1->3)")).toBeInTheDocument();

    // Switch to Memory Pyramid tab
    const memoryTab = screen.getByText("Hierarchical Memory Pyramid (L1/L2/L3)");
    await act(async () => {
      fireEvent.click(memoryTab);
    });
    expect(screen.getByText("3-Tier Hierarchical Associative Memory")).toBeInTheDocument();
    expect(screen.getByText(/L1 Scratchpad/i)).toBeInTheDocument();
    expect(screen.getByText(/L2 Episodic Memory/i)).toBeInTheDocument();
    expect(screen.getByText(/L3 Semantic Memory/i)).toBeInTheDocument();

    // Switch to Ledger tab
    const ledgerTab = screen.getByText("Thought Transformation Ledger");
    await act(async () => {
      fireEvent.click(ledgerTab);
    });
    expect(screen.getByText("Transformation Details")).toBeInTheDocument();
    expect(screen.getByText("Score Delta / Impact")).toBeInTheDocument();

    // Switch to Simulator tab
    const simTab = screen.getByText("GoT & Aggregation Math Simulator");
    await act(async () => {
      fireEvent.click(simTab);
    });
    expect(screen.getByText(/Branch Factor \(k\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Aggregation In-Degree \(M\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Mathematical Foundations & Algorithms/i)).toBeInTheDocument();
  });

  it("triggers branch generation action cleanly", async () => {
    await act(async () => {
      render(<GotPlanningPanel client={null} tenantId="demo-tenant" />);
    });

    const generateBtn = screen.getByText("+ Generate (1->3)");
    await act(async () => {
      fireEvent.click(generateBtn);
    });

    expect(screen.getByText(/Generated 3 candidate branches/i)).toBeInTheDocument();
  });

  it("supports thought node selection for multi-parent aggregation", async () => {
    await act(async () => {
      render(<GotPlanningPanel client={null} tenantId="demo-tenant" />);
    });

    // Click on node v_1 and node v_2 to select them
    const v1 = screen.getByText("v_1");
    const v2 = screen.getByText("v_2");

    await act(async () => {
      fireEvent.click(v1);
      fireEvent.click(v2);
    });

    // Aggregate button should now show (2) and be enabled
    const aggBtn = screen.getByText("⚡ Aggregate (2)");
    expect(aggBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(aggBtn);
    });
    expect(screen.getByText(/Thoughts aggregated with synergetic boost/i)).toBeInTheDocument();
  });

  it("renders nothing when hidden prop is true", async () => {
    let containerNode: HTMLElement | null = null;
    await act(async () => {
      const { container } = render(
        <GotPlanningPanel client={mockClient} tenantId="demo-tenant" hidden={true} />
      );
      containerNode = container;
    });

    expect(containerNode!.firstChild).toBeNull();
  });
});
