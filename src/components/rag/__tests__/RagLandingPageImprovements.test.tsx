import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HeroCognitiveSandbox } from "../HeroCognitiveSandbox";
import { PricingSection } from "../PricingSection";
import RagLandingPage from "@/app/rag/page";

const mockSearchResponse = {
  query: "What are the payment terms, milestone split, and deliverable standards for a SaaS build?",
  results: [
    {
      chunkId: "84348cd0-7d0e-4700-9ad8-5c3b7f9a5a56",
      documentId: "6faee03a-3cf1-4e10-9684-ea29bd3f3513",
      content:
        "[Document: 04_commercial_governance_and_sow.md]\n1. **50/50 Milestone Escrow Structure:**\n- 50% Upfront Deposit: Required prior to initiating development.",
      score: 6.528,
      metadata: {},
    },
  ],
  searchMeta: {
    strategy: "exact_cache_hit",
    totalCandidates: 2,
    returnedResults: 1,
    durationMs: 14.2,
    stages: {
      embeddingMs: 0.0,
      searchMs: 0.0,
      fusionMs: 0.0,
    },
  },
};

// Mocks
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockUseAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

const mockScrollTo = vi.fn();
vi.mock("lenis/react", () => ({
  useLenis: () => ({
    scrollTo: mockScrollTo,
  }),
}));

vi.mock("@/components/ui/MagneticButton", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/TiltCard", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ScrollSection/ScrollSection", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/rag/ArchitectureComparisonCanvas", () => ({
  ArchitectureComparisonCanvas: () => <div id="architecture">Architecture Canvas</div>,
}));

vi.mock("@/components/rag/BatteriesBentoMatrix", () => ({
  BatteriesBentoMatrix: () => <div>Batteries Bento</div>,
}));

vi.mock("@/components/rag/TcoCalculator", () => ({
  TcoCalculator: () => <div>TCO Calculator</div>,
}));

vi.mock("@/components/rag/BenchmarkSection", () => ({
  BenchmarkSection: () => <div id="benchmarks">Benchmarks</div>,
}));

vi.mock("@/components/rag/InteractiveWidgetCustomizer", () => ({
  InteractiveWidgetCustomizer: () => <div id="widget-customizer">Widget Customizer</div>,
}));

vi.mock("@/components/rag/ComparisonSection", () => ({
  ComparisonSection: () => <div>Comparison Section</div>,
}));

vi.mock("@/components/rag/DeveloperApiSection", () => ({
  DeveloperApiSection: () => <div>Developer API</div>,
}));

vi.mock("@/components/rag/SegmentedPersonaSection", () => ({
  SegmentedPersonaSection: () => <div>Segmented Personas</div>,
}));

vi.mock("@/components/rag/FloatingChatWidget", () => ({
  FloatingChatWidget: () => <div>Floating Chat Widget</div>,
}));

describe("RAG Landing Page Improvements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      getAccessToken: vi.fn().mockResolvedValue(null),
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSearchResponse,
    });
  });

  describe("HeroCognitiveSandbox", () => {
    it("renders the live tenant context pill and performs live query on mount", async () => {
      render(<HeroCognitiveSandbox />);

      expect(
        screen.getByText("Querying Live Index: Prateeq Engineering SOW & Scoping Knowledge")
      ).toBeInTheDocument();
      expect(screen.getByText("LIVE COGNITIVE REPL • rag.prateeq.in")).toBeInTheDocument();

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/rag/guest/search",
          expect.objectContaining({
            method: "POST",
          })
        );
      });

      await waitFor(() => {
        // Source filename parsed from [Document: ...]
        expect(screen.getByText(/04_commercial_governance_and_sow.md/)).toBeInTheDocument();
        // Top score rendered from real result
        expect(screen.getByText(/Top Score: 6.528/)).toBeInTheDocument();
        // Server telemetry strategy
        expect(screen.getByText(/EXACT REDIS CACHE HIT/)).toBeInTheDocument();
      });
    });

    it("displays honest connection notice and retry button on fetch failure without fake numbers", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network connection lost"));

      render(<HeroCognitiveSandbox />);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText(/Guest RAG service unreachable. Check connection./)
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      });

      // Assert that synthetic fallback values are NOT present
      expect(screen.queryByText("16.4ms")).toBeNull();
      expect(screen.queryByText("0.978 (High)")).toBeNull();
    });
  });

  describe("PricingSection unauthenticated routing", () => {
    it("routes unauthenticated users clicking Starter to /login?context=rag&redirect_to=/rag/app?onboarding=true", () => {
      render(<PricingSection />);
      const starterBtn = screen.getByRole("button", { name: /start 7-day free trial/i });
      fireEvent.click(starterBtn);

      expect(mockPush).toHaveBeenCalledWith(
        `/login?context=rag&redirect_to=${encodeURIComponent("/rag/app?onboarding=true")}`
      );
    });

    it("routes unauthenticated users clicking Pro to /login?context=rag&redirect_to=...#pricing", () => {
      render(<PricingSection />);
      const proBtn = screen.getByRole("button", { name: /upgrade to pro/i });
      fireEvent.click(proBtn);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("/login?context=rag&redirect_to=")
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent("#pricing"))
      );
    });
  });

  describe("RagLandingPage layout & stats strip", () => {
    it("delegates section navigation to main Navbar without rendering duplicate in-page nav", async () => {
      render(<RagLandingPage />);
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      expect(screen.queryByRole("navigation", { name: /quick page navigation/i })).toBeNull();
    });

    it("renders Hero Micro-Stats Strip with all production metrics", async () => {
      render(<RagLandingPage />);
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      expect(screen.getByText("⚡ 14.8ms Median Latency")).toBeInTheDocument();
      expect(screen.getByText("🔒 PostgreSQL RLS Multi-Tenancy")).toBeInTheDocument();
      expect(screen.getByText("💰 $0 Local Embedding Cost")).toBeInTheDocument();
      expect(screen.getByText("📦 1-Line Drop-In Script")).toBeInTheDocument();
    });

    it("routes unauthenticated Hero CTA to unified login with rag context", async () => {
      render(<RagLandingPage />);
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const heroCta = screen.getByRole("link", { name: /start free sandbox/i });
      expect(heroCta).toHaveAttribute(
        "href",
        `/login?context=rag&redirect_to=${encodeURIComponent("/rag/app?onboarding=true")}`
      );
    });

    it("routes authenticated Hero CTA directly to app studio", async () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id", email: "tester@example.com" },
        loading: false,
        getAccessToken: vi.fn().mockResolvedValue("test-token"),
      });

      render(<RagLandingPage />);
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const heroCta = screen.getByRole("link", { name: /start free sandbox/i });
      expect(heroCta).toHaveAttribute("href", "/rag/app?onboarding=true");
    });

    it("handles hero secondary CTA click by updating history hash and scrolling to #sandbox-demo", async () => {
      const replaceStateSpy = vi.spyOn(window.history, "replaceState");
      render(<RagLandingPage />);
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const demoCta = screen.getByRole("link", { name: /💬 test live dogfooding sandbox/i });
      fireEvent.click(demoCta);

      expect(mockScrollTo).toHaveBeenCalledWith("#sandbox-demo", {
        duration: 1.2,
        offset: -120, // NAVBAR_SCROLL_OFFSET (-80) - 40
      });
      expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "#sandbox-demo");
    });

    it("scrolls to hash target on mount if window.location.hash is present", async () => {
      window.location.hash = "#benchmarks";

      render(<RagLandingPage />);
      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      // Wait for the hash timer (50ms) to fire wrapped in act
      await React.act(async () => {
        await new Promise((r) => setTimeout(r, 80));
      });

      expect(mockScrollTo).toHaveBeenCalledWith("#benchmarks", {
        duration: 1.0,
        offset: -120,
      });

      // Reset hash
      window.location.hash = "";
    });
  });

  describe("FloatingChatWidget guest proxy configuration", () => {
    it("injects the widget without a browser API key and points it at the guest proxy", async () => {
      const { FloatingChatWidget: ActualFloatingChatWidget } =
        await vi.importActual<typeof import("../FloatingChatWidget")>("../FloatingChatWidget");
      render(<ActualFloatingChatWidget />);
      const script = document.getElementById("retriever-floating-widget-script");
      expect(script).toBeInTheDocument();
      expect(script).not.toHaveAttribute("data-key");
      expect(script).toHaveAttribute("data-tenant", "guest");
      expect(script).toHaveAttribute("data-api-url", "/api/rag/guest");
      expect(script).toHaveAttribute("src", "https://rag.prateeq.in/widget.js");
    });
  });
});
