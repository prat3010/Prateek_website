import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HeroCognitiveSandbox } from "../HeroCognitiveSandbox";
import { PricingSection } from "../PricingSection";
import RagLandingPage from "@/app/rag/page";

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
  });

  describe("HeroCognitiveSandbox", () => {
    it("renders the live tenant context pill above preset pills", () => {
      render(<HeroCognitiveSandbox />);
      expect(
        screen.getByText("Querying Live Index: Prateeq Engineering SOW & Scoping Knowledge")
      ).toBeInTheDocument();
      expect(screen.getByText("LIVE COGNITIVE REPL • rag.prateeq.in")).toBeInTheDocument();
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
    it("delegates section navigation to main Navbar without rendering duplicate in-page nav", () => {
      render(<RagLandingPage />);

      expect(screen.queryByRole("navigation", { name: /quick page navigation/i })).toBeNull();
    });

    it("renders Hero Micro-Stats Strip with all production metrics", () => {
      render(<RagLandingPage />);

      expect(screen.getByText("⚡ 14.8ms Median Latency")).toBeInTheDocument();
      expect(screen.getByText("🔒 PostgreSQL RLS Multi-Tenancy")).toBeInTheDocument();
      expect(screen.getByText("💰 $0 Local Embedding Cost")).toBeInTheDocument();
      expect(screen.getByText("📦 1-Line Drop-In Script")).toBeInTheDocument();
    });

    it("routes unauthenticated Hero CTA to unified login with rag context", () => {
      render(<RagLandingPage />);

      const heroCta = screen.getByRole("link", { name: /start free sandbox/i });
      expect(heroCta).toHaveAttribute(
        "href",
        `/login?context=rag&redirect_to=${encodeURIComponent("/rag/app?onboarding=true")}`
      );
    });

    it("routes authenticated Hero CTA directly to app studio", () => {
      mockUseAuth.mockReturnValue({
        user: { id: "test-user-id", email: "tester@example.com" },
        loading: false,
        getAccessToken: vi.fn().mockResolvedValue("test-token"),
      });

      render(<RagLandingPage />);

      const heroCta = screen.getByRole("link", { name: /start free sandbox/i });
      expect(heroCta).toHaveAttribute("href", "/rag/app?onboarding=true");
    });

    it("handles hero secondary CTA click by updating history hash and scrolling to #sandbox-demo", () => {
      const replaceStateSpy = vi.spyOn(window.history, "replaceState");
      render(<RagLandingPage />);

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

  describe("FloatingChatWidget fallback configuration", () => {
    it("injects script with guest scoping API key fallback when env key is absent", async () => {
      const { FloatingChatWidget: ActualFloatingChatWidget } =
        await vi.importActual<typeof import("../FloatingChatWidget")>("../FloatingChatWidget");
      render(<ActualFloatingChatWidget />);
      const script = document.getElementById("retriever-floating-widget-script");
      expect(script).toBeInTheDocument();
      expect(script).toHaveAttribute("data-key", "ret_live_ScopingGuest2026.ReadOnlyChat");
      expect(script).toHaveAttribute("data-tenant", "1f85286c-9d9a-4ebc-9c62-a99360a5ece4");
    });
  });
});
