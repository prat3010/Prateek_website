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
import { MultiCloudPanel } from "@/components/rag/MultiCloudPanel";
import { VoiceStudioPanel } from "@/components/rag/VoiceStudioPanel";
import { McpPanel } from "@/components/rag/McpPanel";
import { MemoryPanel } from "@/components/rag/MemoryPanel";
import { SwarmPanel } from "@/components/rag/SwarmPanel";
import { VectorShardingPanel } from "@/components/rag/VectorShardingPanel";
import { ZkpAttestationPanel } from "@/components/rag/ZkpAttestationPanel";
import { IdentityFederationPanel } from "@/components/rag/IdentityFederationPanel";
import { ContinuousTuningPanel } from "@/components/rag/ContinuousTuningPanel";
import { MpcEnclavePanel } from "@/components/rag/MpcEnclavePanel";
import ContinuousBenchmarkPanel from "@/components/rag/ContinuousBenchmarkPanel";
import GotPlanningPanel from "@/components/rag/GotPlanningPanel";
import { ApiKeysPanel } from "@/components/rag/ApiKeysPanel";
import { QuickLaunchWizardModal } from "@/components/rag/QuickLaunchWizardModal";
import { RagErrorBoundary } from "@/components/rag/ErrorBoundary";
import styles from "@/components/rag/rag.module.css";

type SubViewTab = "overview" | "chat" | "upload" | "keys" | "config" | "search" | "visualizer" | "cache" | "workflows" | "rlm" | "agentic" | "prompts" | "gateway" | "guardrails" | "team" | "integrations" | "feature-studio" | "edge" | "multicloud" | "voice" | "mcp" | "memory" | "swarm" | "sharding" | "zkp" | "identity" | "tuning" | "mpc" | "benchmarks" | "got-planning";

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
  const [planTier, setPlanTier] = useState<string>("starter");
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(7);
  const [showQuickWizard, setShowQuickWizard] = useState<boolean>(false);
  const [isUpgradedCelebration, setIsUpgradedCelebration] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

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
            setApiKey(data.apiKey || token);
            setUserId(resolvedUser);
            setIsAdmin(data.role === "owner" || data.role === "admin");
            setPlanTier(data.planTier || "starter");
            setTrialDaysRemaining(data.trialDaysRemaining ?? 7);

            const cli = new RetrieverClient({
              apiUrl: process.env.NEXT_PUBLIC_RETRIEVER_API_URL || "https://rag.prateeq.in",
              tenantId: resolvedTenant,
              apiKey: data.apiKey || token,
              userId: resolvedUser,
            });
            setClient(cli);
            setTenantLoading(false);

            if (typeof window !== "undefined") {
              const urlParams = new URLSearchParams(window.location.search);
              if (urlParams.get("upgraded") === "true") {
                setIsUpgradedCelebration(true);
              }
              if (urlParams.get("onboarding") === "true") {
                setShowQuickWizard(true);
              }
            }
            return;
          }
        }
      }

      setTenantId("");
      setApiKey("");
      setUserId("");
      setIsAdmin(false);
      setPlanTier("starter");
      setTrialDaysRemaining(7);
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

  const coreNavItems: { id: SubViewTab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview & Usage", icon: "📊" },
    { id: "upload", label: "Knowledge & Documents", icon: "📄" },
    { id: "chat", label: "Chat Studio", icon: "💬" },
    { id: "config", label: "AI Persona & Widget", icon: "⚙️" },
    { id: "keys", label: "API Keys & SDK", icon: "🔑" },
  ];

  const advancedNavItems: { id: SubViewTab; label: string; icon: string }[] = [
    { id: "search", label: "Search & Evaluator", icon: "🔍" },
    { id: "visualizer", label: "3D Vector Explorer", icon: "🪐" },
    { id: "cache", label: "Semantic Cache", icon: "⚡" },
    { id: "workflows", label: "Durable Workflows", icon: "⚡" },
    { id: "rlm", label: "RLM REPL Studio", icon: "🐍" },
    { id: "agentic", label: "Agent Studio", icon: "🤖" },
    { id: "prompts", label: "DSPy Prompt Studio", icon: "✨" },
    { id: "gateway", label: "Smart Router & Gateway", icon: "🔀" },
    { id: "guardrails", label: "NeMo Guardrails & Safety", icon: "🛡️" },
    { id: "team", label: "Team & Compliance", icon: "👥" },
    { id: "integrations", label: "Plugins & Integrations", icon: "🔌" },
    { id: "feature-studio", label: "Capability Studio & FDE", icon: "🛠️" },
    { id: "edge", label: "Sovereign Edge Sync", icon: "💾" },
    { id: "multicloud", label: "Multi-Cloud & Turso LibSQL", icon: "🌐" },
    { id: "voice", label: "Sovereign Edge Voice", icon: "🎙️" },
    { id: "mcp", label: "Model Context Protocol (MCP)", icon: "🔌" },
    { id: "memory", label: "Cognitive Memory & Distillation", icon: "🧠" },
    { id: "swarm", label: "Multi-Agent Swarm Quorum", icon: "🤝" },
    { id: "sharding", label: "Vector Shards & Raft", icon: "💎" },
    { id: "zkp", label: "ZKP Verifiable Grounding", icon: "📜" },
    { id: "identity", label: "Enterprise Identity & RB-VAC", icon: "🛡️" },
    { id: "tuning", label: "Continuous DPO / ORPO Tuning", icon: "🧠" },
    { id: "mpc", label: "Confidential MPC Enclaves", icon: "🛡️" },
    { id: "benchmarks", label: "Continuous Benchmark Gate", icon: "🎯" },
    { id: "got-planning", label: "Graph-of-Thoughts & Memory", icon: "🕸️" },
  ];

  const allNavItems = [...coreNavItems, ...advancedNavItems];

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
          {planTier === "pro" || planTier === "business" ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.25rem 0.75rem",
                borderRadius: "20px",
                background: "rgba(0, 230, 118, 0.12)",
                border: "1px solid #00E676",
                fontSize: "0.78rem",
                color: "#00E676",
                fontWeight: 600,
              }}
            >
              <span>⚡</span>
              <span>{planTier.toUpperCase()} WORKSPACE (Active)</span>
            </div>
          ) : (
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
          )}
        </div>

        <div className={styles.studioTopRight}>
          <button
            onClick={() => setShowQuickWizard(true)}
            className="comic-btn comic-btn-outline"
            style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem" }}
          >
            🚀 Quick Setup
          </button>

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
        <span>{allNavItems.find((n) => n.id === activeTab)?.icon} {allNavItems.find((n) => n.id === activeTab)?.label}</span>
      </button>

      {/* Phase 2 Left Sidebar Studio Grid */}
      <div className={styles.studioContainer}>
        {/* Left Sidebar Navigation */}
        <aside className={`${styles.studioSidebar} ${mobileMenuOpen ? styles.mobileSidebarOpen : ""}`}>
          <div className={styles.sidebarTitle}>Core Essentials</div>
          <nav className={styles.sidebarNav} role="tablist" aria-label="Retriever Studio Core Views">
            {coreNavItems.map((item) => (
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

          {/* Advanced Batteries Collapsible Section */}
          <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--color-border, #222)", paddingTop: "1rem" }}>
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 700,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                padding: "0.25rem 0.5rem",
              }}
            >
              <span>🛠️ Advanced Batteries ({advancedNavItems.length})</span>
              <span>{advancedOpen ? "▲" : "▼"}</span>
            </button>

            {advancedOpen && (
              <nav className={styles.sidebarNav} style={{ marginTop: "0.5rem" }} role="tablist" aria-label="Retriever Studio Advanced Batteries">
                {advancedNavItems.map((item) => (
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
            )}
          </div>
        </aside>

        {/* Main Sub-View Content Panel Container */}
        <main className={styles.panelContainer}>
          <RagErrorBoundary>
            {/* Post-Purchase Celebratory Banner */}
            {isUpgradedCelebration && (
              <div
                style={{
                  background: "rgba(0, 230, 118, 0.12)",
                  border: "1px solid #00E676",
                  borderRadius: "8px",
                  padding: "0.85rem 1.25rem",
                  marginBottom: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "var(--color-text)",
                  fontSize: "0.875rem",
                }}
              >
                <span>
                  🎉 <strong>Subscription Active:</strong> Welcome to Retriever {planTier.toUpperCase()}! Your workspace limits have been upgraded to 1,000,000 monthly tokens with 100 documents and custom widget branding unlocked.
                </span>
                <button
                  onClick={() => setIsUpgradedCelebration(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#00E676",
                    fontSize: "1rem",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            <OverviewPanel client={client} hidden={activeTab !== "overview"} onNavigateTab={(tab) => setActiveTab(tab as SubViewTab)} />
            <DocumentsPanel client={client} hidden={activeTab !== "upload"} isExpired={trialDaysRemaining <= 0} />
            <ChatPanel client={client} hidden={activeTab !== "chat"} isExpired={trialDaysRemaining <= 0} />
            <ApiKeysPanel hidden={activeTab !== "keys"} tenantId={tenantId} apiKey={apiKey} planTier={planTier} />
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
              client={client}
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
            <MultiCloudPanel client={client} tenantId={tenantId} hidden={activeTab !== "multicloud"} />
            <VoiceStudioPanel client={client} tenantId={tenantId} hidden={activeTab !== "voice"} />
            <McpPanel client={client} tenantId={tenantId} hidden={activeTab !== "mcp"} isExpired={trialDaysRemaining <= 0} />
            <MemoryPanel client={client} tenantId={tenantId} hidden={activeTab !== "memory"} isExpired={trialDaysRemaining <= 0} />
            <SwarmPanel client={client} tenantId={tenantId} hidden={activeTab !== "swarm"} isExpired={trialDaysRemaining <= 0} />
            <VectorShardingPanel client={client} tenantId={tenantId} hidden={activeTab !== "sharding"} />
            <ZkpAttestationPanel client={client} tenantId={tenantId} hidden={activeTab !== "zkp"} />
            <IdentityFederationPanel client={client} tenantId={tenantId} hidden={activeTab !== "identity"} />
            <ContinuousTuningPanel client={client} tenantId={tenantId} hidden={activeTab !== "tuning"} />
            <MpcEnclavePanel client={client} tenantId={tenantId} hidden={activeTab !== "mpc"} />
            <ContinuousBenchmarkPanel client={client} tenantId={tenantId} hidden={activeTab !== "benchmarks"} />
            <GotPlanningPanel client={client} tenantId={tenantId} hidden={activeTab !== "got-planning"} />

            <QuickLaunchWizardModal
              isOpen={showQuickWizard}
              onClose={() => setShowQuickWizard(false)}
              tenantId={tenantId}
              apiKey={apiKey}
              client={client}
              onSuccessComplete={() => {
                setShowQuickWizard(false);
                setActiveTab("chat");
              }}
            />
          </RagErrorBoundary>
        </main>
      </div>
    </div>
  );
}
