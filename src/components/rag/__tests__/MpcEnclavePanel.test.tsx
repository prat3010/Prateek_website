import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/components/ui/Portal", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

import { MpcEnclavePanel } from "../MpcEnclavePanel";
import type { RetrieverClient } from "@/lib/rag-client";

describe("MpcEnclavePanel Component", () => {
  const mockCreateMpcSession = vi.fn();
  const mockListMpcSessions = vi.fn();
  const mockGetMpcSession = vi.fn();
  const mockJoinMpcSession = vi.fn();
  const mockSubmitMpcVectorShares = vi.fn();
  const mockExecuteMpcCompute = vi.fn();
  const mockGetMpcResults = vi.fn();
  const mockAbortMpcSession = vi.fn();
  const mockSimulateMpcMath = vi.fn();

  const mockClient = {
    createMpcSession: mockCreateMpcSession,
    listMpcSessions: mockListMpcSessions,
    getMpcSession: mockGetMpcSession,
    joinMpcSession: mockJoinMpcSession,
    submitMpcVectorShares: mockSubmitMpcVectorShares,
    executeMpcCompute: mockExecuteMpcCompute,
    getMpcResults: mockGetMpcResults,
    abortMpcSession: mockAbortMpcSession,
    simulateMpcMath: mockSimulateMpcMath,
  } as unknown as RetrieverClient;

  it("renders header, title, and Battery #36 badge", () => {
    render(<MpcEnclavePanel client={mockClient} tenantId="demo-tenant" />);

    expect(screen.getByText("Confidential Multi-Party Vector Computation (MPC)")).toBeInTheDocument();
    expect(screen.getByText("Battery #36")).toBeInTheDocument();
    expect(screen.getByText("Protocol: Beaver Triples (PPIP)")).toBeInTheDocument();
  });

  it("switches tabs across consortium, shares, results, and simulator", () => {
    render(<MpcEnclavePanel client={mockClient} tenantId="demo-tenant" />);

    // Initial tab is consortium
    expect(screen.getByText("Active Consortium Sessions (2)")).toBeInTheDocument();

    // Switch to shares tab
    const sharesBtn = screen.getByText("🎲 Secret Share Distributor & Noise");
    fireEvent.click(sharesBtn);
    expect(screen.getByText("Additive Secret Sharing Architecture")).toBeInTheDocument();
    expect(screen.getByText("Zero Bits Leaked to < N Parties")).toBeInTheDocument();

    // Switch to results tab
    const resultsBtn = screen.getByText("📊 Confidential Inner Product & Top-K");
    fireEvent.click(resultsBtn);
    expect(screen.getByText("Threshold Top-K Matches")).toBeInTheDocument();
    expect(screen.getByText("Differential Privacy & Performance Telemetry")).toBeInTheDocument();

    // Switch to simulator tab
    const simBtn = screen.getByText("🧮 Interactive Beaver Triples Simulator");
    fireEvent.click(simBtn);
    expect(screen.getByText("Interactive Beaver Triple PPIP Simulator")).toBeInTheDocument();
    expect(screen.getByText("Plaintext Ground Truth Dot Product")).toBeInTheDocument();
    expect(screen.getByText("MPC Beaver Reconstructed Product")).toBeInTheDocument();
  });

  it("opens create enclave modal on + New Enclave click", () => {
    render(<MpcEnclavePanel client={mockClient} tenantId="demo-tenant" />);

    const newEnclaveBtn = screen.getByText("+ New Enclave");
    fireEvent.click(newEnclaveBtn);

    expect(screen.getByText("Create MPC Privacy Enclave")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Cross-Enterprise IP Patent Prior Art")).toBeInTheDocument();
  });

  it("opens join party modal on + Join as Party click", () => {
    render(<MpcEnclavePanel client={mockClient} tenantId="demo-tenant" />);

    const joinBtn = screen.getByText("+ Join as Party");
    fireEvent.click(joinBtn);

    expect(screen.getByText("Join MPC Consortium Session")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. hospital_partner_03")).toBeInTheDocument();
  });

  it("renders nothing when hidden prop is true", () => {
    const { container } = render(<MpcEnclavePanel client={mockClient} tenantId="demo-tenant" hidden={true} />);
    expect(container.firstChild).toBeNull();
  });
});
