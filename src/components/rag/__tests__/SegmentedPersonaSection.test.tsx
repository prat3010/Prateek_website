import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/ui/MagneticButton", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/TiltCard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("lenis/react", () => ({
  useLenis: () => null,
}));

import { SegmentedPersonaSection } from "../SegmentedPersonaSection";

describe("SegmentedPersonaSection Component", () => {
  it("renders section badge, title, and all three buyer personas", () => {
    render(<SegmentedPersonaSection />);

    expect(screen.getByText("🎯 Built For Your Exact Stack")).toBeInTheDocument();
    expect(screen.getByText("One Sovereign Engine. Three Purpose-Built Workflows.")).toBeInTheDocument();

    // Persona 1: E-Commerce
    expect(screen.getByText("1-Line Embed Copilot")).toBeInTheDocument();
    expect(screen.getByText("No-Code & E-Commerce")).toBeInTheDocument();
    expect(screen.getByText("Customize Embed Widget →")).toBeInTheDocument();

    // Persona 2: Developers
    expect(screen.getByText("Headless Vector & REST API")).toBeInTheDocument();
    expect(screen.getByText("Developer-First Core")).toBeInTheDocument();
    expect(screen.getByText("View API Keys & SDKs →")).toBeInTheDocument();

    // Persona 3: Enterprise
    expect(screen.getByText("Sovereign Multi-Tenancy & Privacy")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Compliance")).toBeInTheDocument();
    expect(screen.getByText("Build Enterprise Scope →")).toBeInTheDocument();
  });
});
