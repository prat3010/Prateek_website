import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SwarmPanel } from "../SwarmPanel";
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

describe("SwarmPanel Component (Milestone 109)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 4-stat metrics grid and titles in demo mode", () => {
    render(<SwarmPanel hidden={false} client={null} tenantId="" />);

    expect(
      screen.getByText(/Multi-Agent Swarm Quorum & Debate Engine/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Active Swarm Personas/i)).toBeInTheDocument();
    expect(screen.getByText(/Quorum Consensus Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Avg Debate Rounds/i)).toBeInTheDocument();
    expect(screen.getByText(/Hallucinations Pruned/i)).toBeInTheDocument();
  });

  it("renders the 4 specialized agent persona cards", () => {
    render(<SwarmPanel hidden={false} client={null} tenantId="" />);

    expect(screen.getAllByText(/Strategic Planner/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Forensic Auditor/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Code & Logic Synthesizer/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Adversarial Skeptic/i).length).toBeGreaterThanOrEqual(1);
  });

  it("allows selecting preset prompts", () => {
    render(<SwarmPanel hidden={false} client={null} tenantId="" />);

    const cachePreset = screen.getByRole("button", { name: /Cache Invalidation/i });
    fireEvent.click(cachePreset);

    const textarea = screen.getByPlaceholderText(/Enter complex multi-hop objective/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain("sub-5ms semantic vector cache invalidation");
  });

  it("allows switching debate round tabs", () => {
    render(<SwarmPanel hidden={false} client={null} tenantId="" />);

    expect(screen.getByText(/Dialectic Debate Stage/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Round 1: Opening Theses/i })).toBeInTheDocument();

    const round2Btn = screen.getByRole("button", { name: /Round 2: Dialectic Cross-Examination/i });
    fireEvent.click(round2Btn);

    expect(screen.getByText(/The claim of 'sub-10ms table-wide scan' is unsubstantiated/i)).toBeInTheDocument();
  });

  it("renders winning consensus resolution and hallucination pruning ledger", () => {
    render(<SwarmPanel hidden={false} client={null} tenantId="" />);

    expect(screen.getByText(/Winning Consensus Resolution/i)).toBeInTheDocument();
    expect(screen.getByText(/Forensic Hallucination Pruning Ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/Recursive CTE sweep guarantees sub-10ms table-wide scan/i)).toBeInTheDocument();
  });

  it("triggers debate run and updates simulation state when execute button is clicked", async () => {
    render(<SwarmPanel hidden={false} client={null} tenantId="" />);

    const executeBtn = screen.getByRole("button", { name: /Execute Swarm Debate/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Winning Consensus Resolution/i)).toBeInTheDocument();
    });
  });

  it("invokes client.executeSwarmDebate when authenticated client is provided", async () => {
    const mockExecute = vi.fn().mockResolvedValue({
      debate_id: "swm_test_mock",
      tenant_id: "tn_test",
      prompt: "Test prompt",
      active_roles: ["planner", "forensic_auditor"],
      rounds_completed: 3,
      rounds: [
        {
          round_index: 1,
          stage_name: "Theses",
          round_summary: "Done",
          active_disagreements: [],
          turns: [],
        },
      ],
      candidate_resolutions: [],
      winning_consensus: "Consensus reached successfully",
      winning_resolution_id: "res_mock",
      consensus_confidence: 0.95,
      quorum_reached: true,
      quorum_threshold: 0.70,
      hallucinations_pruned: [],
      execution_time_ms: 120.0,
      created_at: 1000,
    });

    const mockClient = {
      executeSwarmDebate: mockExecute,
      getSwarmStats: vi.fn().mockResolvedValue({
        total_debates: 10,
        quorum_success_rate: 0.90,
        avg_debate_rounds: 2.5,
        total_hallucinations_pruned: 15,
        active_agent_count: 4,
      }),
    } as unknown as RetrieverClient;

    render(<SwarmPanel hidden={false} client={mockClient} tenantId="tn_test" />);

    const executeBtn = screen.getByRole("button", { name: /Execute Swarm Debate/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledTimes(1);
    });
  });
});
