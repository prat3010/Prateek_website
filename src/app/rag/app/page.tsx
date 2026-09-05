"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { RetrieverClient } from "@/lib/rag-client";
import { OverviewPanel } from "@/components/rag/OverviewPanel";
import { ChatPanel } from "@/components/rag/ChatPanel";
import { DocumentsPanel } from "@/components/rag/DocumentsPanel";
import { SearchPanel } from "@/components/rag/SearchPanel";
import { CachePanel } from "@/components/rag/CachePanel";
import { ConfigPanel } from "@/components/rag/ConfigPanel";
import { TeamPanel } from "@/components/rag/TeamPanel";
import { IntegrationsPanel } from "@/components/rag/IntegrationsPanel";
import { RlmStudioPanel } from "@/components/rag/RlmStudioPanel";
import { AgentStudioPanel } from "@/components/rag/AgentStudioPanel";
import { PromptOptimizationPanel } from "@/components/rag/PromptOptimizationPanel";
import { GatewayPanel } from "@/components/rag/GatewayPanel";
import { GuardrailsPanel } from "@/components/rag/GuardrailsPanel";
import { VectorVisualizerPanel } from "@/components/rag/VectorVisualizerPanel";
import { WorkflowsPanel } from "@/components/rag/WorkflowsPanel";
import { FeatureStudioPanel } from "@/components/rag/FeatureStudioPanel";
import { EdgeSyncPanel } from "@/components/rag/EdgeSyncPanel";
import { RagErrorBoundary } from "@/components/rag/ErrorBoundary";
import styles from "@/components/rag/rag.module.css";

type SubViewTab = "overview" | "chat" | "upload" | "search" | "visualizer" | "cache" | "workflows" | "rlm" | "agentic" | "prompts" | "gateway" | "guardrails" | "config" | "team" | "integrations" | "feature-studio" | "edge";

export default function RagAppStudioPage() {
  const router = useRouter();
  const { user, loading: authLoading, getAccessToken, loginWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<SubViewTab>("overview");
  const [tenantId, setTenantId] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [client, setClient] = useState<RetrieverClient | null>(null);
  const [tenantLoading, setTenantLoading] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [trialDaysRemaining] = useState<number>(6);

  const initWorkspace = useCallback(async () => {
    setTenantLoading(true);
    try {
      if (user) {
        const token = await getAccessToken();
        if (token) {
          const res = await fetch("/api/rag/tenant", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            const resolvedTenant = data.tenantId;
            const resolvedUser = data.userId || user.id;

            setTenantId(resolvedTenant);
            setApiKey(token);
            setUserId(resolvedUser);
            setIsAdmin(data.role === "owner" || data.role === "admin");

            const cli = new RetrieverClient({
              apiUrl: process.env.NEXT_PUBLIC_RETRIEVER_API_URL || "https://rag.prateeq.in",
              tenantId: resolvedTenant,
              apiKey: token,
              userId: resolvedUser,
            });
            setClient(cli);
            setTenantLoading(false);
            return;
          }
        }
      }

      setTenantId("");
      setApiKey("");
      setUserId("");
      setIsAdmin(false);
      setClient(null);
    } catch (err) {
      console.warn("RAG Studio workspace resolution warning:", err);
    } finally {
      setTenantLoading(false);
    }
  }, [user, getAccessToken]);

  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        void initWorkspace();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [authLoading, initWorkspace]);

  const handleExitStudio = () => {
    router.push("/rag");
  };

  const navItems: { id: SubViewTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview & Analytics", icon: "📊" },
    { id: "chat", label: "Chat Studio", icon: "💬" },
    { id: "upload", label: "Knowledge & Graph", icon: "📄" },
    { id: "search", label: "Search & Evaluator", icon: "🔍" },
    { id: "visualizer", label: "3D Vector Explorer", icon: "🪐" },
    { id: "cache", label: "Semantic Cache", icon: "⚡" },
    { id: "workflows", label: "Durable Workflows", icon: "⚡" },
    { id: "rlm", label: "RLM REPL Studio", icon: "🐍" },
    { id: "agentic", label: "Agent Studio", icon: "🤖" },
    { id: "prompts", label: "DSPy Prompt Studio", icon: "✨" },
    { id: "gateway", label: "Smart Router & Gateway", icon: "🔀" },
    { id: "guardrails", label: "NeMo Guardrails & Safety", icon: "🛡️" },
    { id: "config", label: "Widget Studio", icon: "⚙️" },
    { id: "team", label: "Team & Compliance", icon: "👥" },
    { id: "integrations", label: "Plugins & Integrations", icon: "🔌" },
    { id: "feature-studio", label: "Capability Studio & FDE", icon: "🛠️" },
    { id: "edge", label: "Sovereign Edge Sync", icon: "💾" },
  ];

  return (
    <div className={styles.landingWrapper} style={{ minHeight: "100vh", background: "var(--color-bg, #0b0f19)" }}>
      {/* Sleek Unified 56px B2B AI Studio Top Header Bar */}
      <header className={styles.studioTopBar}>
        <div className={styles.studioTopLeft}>
          <Link href="/rag" className={styles.studioBrandTitle}>
            <span>⚡</span>
            <span>Retriever Studio</span>
          </Link>
          <span className={styles.tenantPill}>
            {tenantLoading ? "Loading…" : tenantId ? `Tenant: ${tenantId.slice(0, 8)}…` : "Demo Tier"}
          </span>
        </div>

        <div className={styles.studioTopCenter}>
          <Link
            href="/rag#pricing"
            className={`${styles.trialPillCompact} ${trialDaysRemaining <= 0 ? styles.trialPillExpired : ""}`}
          >
            <span>{trialDaysRemaining <= 0 ? "🔒" : "⏱️"}</span>
            <span>
              {trialDaysRemaining <= 0
                ? "Trial Expired (Soft Paywall Active)"
                : `${trialDaysRemaining} Days Starter Trial`}
            </span>
            <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>➔ Upgrade</span>
          </Link>
        </div>

        <div className={styles.studioTopRight}>
          {authLoading ? (
            <button
              className="comic-btn comic-btn-blue"
              style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem", opacity: 0.6 }}
              disabled
            >
              Sign In
            </button>
          ) : user ? (
            <span className={styles.userBadgePill}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E676", display: "inline-block" }} />
              {user.email} {isAdmin ? "(Owner)" : ""}
            </span>
          ) : (
            <button
              onClick={() => loginWithGoogle("/rag/app")}
              className="comic-btn comic-btn-blue"
              style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
            >
              Sign In
            </button>
          )}

          <button className={styles.exitStudioBtn} onClick={handleExitStudio}>
            Exit Studio ➔
          </button>
        </div>
      </header>

      {/* Mobile Drawer Toggle */}
      <button
        className={styles.mobileToggleBtn}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <span>≡</span>
        <span>{navItems.find((n) => n.id === activeTab)?.icon} {navItems.find((n) => n.id === activeTab)?.label}</span>
      </button>

      {/* Phase 2 Left Sidebar Studio Grid */}
      <div className={styles.studioContainer}>
        {/* Left Sidebar Navigation */}
        <aside className={`${styles.studioSidebar} ${mobileMenuOpen ? styles.mobileSidebarOpen : ""}`}>
          <div className={styles.sidebarTitle}>Workspace Views</div>
          <nav className={styles.sidebarNav} role="tablist" aria-label="Retriever Studio Workspace Views">
            {navItems.map((item) => (
              <button
                key={item.id}
                role="tab"
                aria-selected={activeTab === item.id}
                tabIndex={activeTab === item.id ? 0 : -1}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`${styles.sidebarItem} ${activeTab === item.id ? styles.sidebarItemActive : ""}`}
              >
                {activeTab === item.id && (
                  <m.span
                    layoutId="ragStudioTabPill"
                    className={styles.sidebarTabPill}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span style={{ position: "relative", zIndex: 1 }}>{item.icon}</span>
                <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Sub-View Content Panel Container */}
        <main className={styles.panelContainer}>
          <RagErrorBoundary>
            <OverviewPanel client={client} hidden={activeTab !== "overview"} onNavigateTab={(tab) => setActiveTab(tab as SubViewTab)} />
            <ChatPanel client={client} hidden={activeTab !== "chat"} isExpired={trialDaysRemaining <= 0} />
            <DocumentsPanel client={client} hidden={activeTab !== "upload"} isExpired={trialDaysRemaining <= 0} />
            <SearchPanel client={client} hidden={activeTab !== "search"} />
            <VectorVisualizerPanel client={client} hidden={activeTab !== "visualizer"} />
            <CachePanel client={client} hidden={activeTab !== "cache"} />
            <WorkflowsPanel client={client} hidden={activeTab !== "workflows"} />
            <RlmStudioPanel client={client} hidden={activeTab !== "rlm"} isExpired={trialDaysRemaining <= 0} />
            <AgentStudioPanel client={client} hidden={activeTab !== "agentic"} isExpired={trialDaysRemaining <= 0} />
            <PromptOptimizationPanel client={client} hidden={activeTab !== "prompts"} />
            <GatewayPanel client={client} hidden={activeTab !== "gateway"} />
            <GuardrailsPanel client={client} hidden={activeTab !== "guardrails"} />

            <ConfigPanel
              config={
                client
                  ? {
                      apiUrl: process.env.NEXT_PUBLIC_RETRIEVER_API_URL || "https://rag.prateeq.in",
                      tenantId,
                      apiKey,
                      userId,
                    }
                  : null
              }
              onSave={(cfg) => {
                setTenantId(cfg.tenantId);
                setApiKey(cfg.apiKey);
                setUserId(cfg.userId);
                setClient(new RetrieverClient(cfg));
              }}
              onClear={() => {
                setTenantId("");
                setApiKey("");
                setUserId("");
                setClient(null);
              }}
              hidden={activeTab !== "config"}
            />
            <TeamPanel hidden={activeTab !== "team"} tenantId={tenantId} />
            <IntegrationsPanel hidden={activeTab !== "integrations"} tenantId={tenantId} />
            <FeatureStudioPanel client={client} hidden={activeTab !== "feature-studio"} />
            <EdgeSyncPanel client={client} hidden={activeTab !== "edge"} />

          </RagErrorBoundary>
        </main>
      </div>
    </div>
  );
}
