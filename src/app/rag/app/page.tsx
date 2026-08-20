"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RetrieverClient } from "@/lib/rag-client";
import { OverviewPanel } from "@/components/rag/OverviewPanel";
import { ChatPanel } from "@/components/rag/ChatPanel";
import { DocumentsPanel } from "@/components/rag/DocumentsPanel";
import { SearchPanel } from "@/components/rag/SearchPanel";
import { CachePanel } from "@/components/rag/CachePanel";
import { ConfigPanel } from "@/components/rag/ConfigPanel";
import { TeamPanel } from "@/components/rag/TeamPanel";
import WorkspaceSwitcher from "@/components/ui/WorkspaceSwitcher";
import styles from "@/components/rag/rag.module.css";

type SubViewTab = "overview" | "chat" | "upload" | "search" | "cache" | "config" | "team";

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
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(6);

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
    { id: "cache", label: "Semantic Cache", icon: "⚡" },
    { id: "config", label: "Widget Studio", icon: "⚙️" },
    { id: "team", label: "Team & Compliance", icon: "👥" },
  ];

  return (
    <div className={styles.landingWrapper}>
      <WorkspaceSwitcher active="rag" />

      {/* Top Telemetry & Workspace Sub-Header */}
      <div className={styles.workspaceHeader}>
        <div className={styles.workspaceTitleGroup}>
          <h1 className={styles.workspaceTitle}>SaaS Studio Workspace</h1>
          <span className={styles.heroBadge} style={{ margin: 0 }}>
            {tenantLoading ? "Loading Workspace…" : `Tenant: ${tenantId ? tenantId.slice(0, 8) + "…" : "Demo Tier"}`}
          </span>
          {user ? (
            <span className={styles.heroBadge} style={{ margin: 0, backgroundColor: "rgba(0, 230, 118, 0.15)", color: "#00E676" }}>
              ✓ Authenticated ({user.email})
            </span>
          ) : (
            <button
              onClick={() => loginWithGoogle("/rag/app")}
              className="comic-btn comic-btn-blue"
              style={{ padding: "0.2rem 0.6rem", fontSize: "0.8rem" }}
            >
              Sign In for Workspace
            </button>
          )}
        </div>

        <div className={styles.navLinks}>
          {isAdmin && (
            <Link href="/analytics" className="comic-btn comic-btn-blue">
              🛠️ Admin Dashboard
            </Link>
          )}

          <button className="comic-btn comic-btn-outline" onClick={handleExitStudio}>
            ← Back to Product Landing
          </button>
        </div>
      </div>

      {/* 7-Day Free Trial Telemetry Banner */}
      <div className={styles.trialBanner} style={trialDaysRemaining <= 0 ? { background: "rgba(255, 23, 68, 0.15)", borderColor: "#FF1744", color: "#FF1744" } : {}}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>{trialDaysRemaining <= 0 ? "🔒" : "⏱️"}</span>
          <span>
            {trialDaysRemaining <= 0 ? (
              <strong>Trial Expired — Soft Read-Only Paywall Active</strong>
            ) : (
              <><strong>7-Day Free Starter Trial Active</strong> — {trialDaysRemaining} Days Remaining before soft lockout</>
            )}
          </span>
        </div>
        <Link href="/rag#pricing" className="comic-btn comic-btn-blue" style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}>
          Upgrade Plan ➔
        </Link>
      </div>

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
          <nav className={styles.sidebarNav}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`${styles.sidebarItem} ${activeTab === item.id ? styles.sidebarItemActive : ""}`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Sub-View Content Panel Container */}
        <main className={styles.panelContainer}>
          <OverviewPanel hidden={activeTab !== "overview"} onNavigateTab={(tab) => setActiveTab(tab as SubViewTab)} />
          <ChatPanel client={client} hidden={activeTab !== "chat"} isExpired={trialDaysRemaining <= 0} />
          <DocumentsPanel client={client} hidden={activeTab !== "upload"} isExpired={trialDaysRemaining <= 0} />
          <SearchPanel client={client} hidden={activeTab !== "search"} />
          <CachePanel hidden={activeTab !== "cache"} />
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
          <TeamPanel hidden={activeTab !== "team"} />
        </main>
      </div>
    </div>
  );
}
