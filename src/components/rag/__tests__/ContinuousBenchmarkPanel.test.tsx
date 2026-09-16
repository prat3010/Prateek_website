import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/components/ui/Portal", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

import ContinuousBenchmarkPanel from "../ContinuousBenchmarkPanel";
import type { RetrieverClient } from "@/lib/rag-client";

describe("ContinuousBenchmarkPanel Component", () => {
  const mockListBenchmarkSuites = vi.fn();
  const mockCreateBenchmarkSuite = vi.fn();
  const mockListBenchmarkRuns = vi.fn();
  const mockGetBenchmarkRun = vi.fn();
  const mockTriggerBenchmarkRun = vi.fn();
  const mockEvaluateRegressionGate = vi.fn();
  const mockSimulateBenchmarkMath = vi.fn();

  const mockClient = {
    listBenchmarkSuites: mockListBenchmarkSuites,
    createBenchmarkSuite: mockCreateBenchmarkSuite,
    listBenchmarkRuns: mockListBenchmarkRuns,
    getBenchmarkRun: mockGetBenchmarkRun,
    triggerBenchmarkRun: mockTriggerBenchmarkRun,
    evaluateRegressionGate: mockEvaluateRegressionGate,
    simulateBenchmarkMath: mockSimulateBenchmarkMath,
  } as unknown as RetrieverClient;

  it("renders header, title, and Battery #37 badge", () => {
    render(<ContinuousBenchmarkPanel client={mockClient} tenantId="demo-tenant" />);

    expect(screen.getByText("Continuous Benchmark & Regression Gatekeeper")).toBeInTheDocument();
    expect(screen.getByText("Platform Battery #37")).toBeInTheDocument();
    expect(screen.getByText("Gatekeeper Active")).toBeInTheDocument();
  });

  it("switches tabs across suites, diff, inspector, and simulator", () => {
    render(<ContinuousBenchmarkPanel client={mockClient} tenantId="demo-tenant" />);

    // Initial tab is suites
    expect(screen.getByText("Configured Benchmark Suites")).toBeInTheDocument();
    expect(screen.getByText("Historical Benchmark Runs Ledger")).toBeInTheDocument();

    // Switch to comparative diff tab
    const diffBtn = screen.getByText("⚖️ Comparative Regression Diff");
    fireEvent.click(diffBtn);
    expect(screen.getByText("Statistical Regression Analysis")).toBeInTheDocument();

    // Switch to inspector tab
    const inspectorBtn = screen.getByText("🔍 Item-Level Query Inspector");
    fireEvent.click(inspectorBtn);
    expect(screen.getByText("Item-Level Test Query Breakdown")).toBeInTheDocument();

    // Switch to simulator tab
    const simBtn = screen.getByText("🧪 Welch's t-Test Simulator");
    fireEvent.click(simBtn);
    expect(screen.getByText("Interactive Statistical Regression Simulator")).toBeInTheDocument();
    expect(screen.getByText("Statistical Significance Verdict")).toBeInTheDocument();
  });

  it("triggers new benchmark suite modal", () => {
    render(<ContinuousBenchmarkPanel client={mockClient} tenantId="demo-tenant" />);

    const newSuiteBtn = screen.getByText("+ New Suite");
    fireEvent.click(newSuiteBtn);

    expect(screen.getByText("Register New Benchmark Suite")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Legal Contract Q&A Golden Set")).toBeInTheDocument();
  });

  it("handles mathematical simulation calculation button", () => {
    render(<ContinuousBenchmarkPanel client={mockClient} tenantId="demo-tenant" />);

    const simBtn = screen.getByText("🧪 Welch's t-Test Simulator");
    fireEvent.click(simBtn);

    const calcBtn = screen.getByText("Calculate Welch's t-Test");
    fireEvent.click(calcBtn);

    expect(screen.getByText("Statistical Significance Verdict")).toBeInTheDocument();
  });

  it("renders null when hidden is true", () => {
    const { container } = render(
      <ContinuousBenchmarkPanel client={mockClient} tenantId="demo-tenant" hidden={true} />
    );
    expect(container.firstChild).toBeNull();
  });
});
