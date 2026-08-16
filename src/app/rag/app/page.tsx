"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RetrieverClient } from "@/lib/rag-client";
import { ChatPanel } from "@/components/rag/ChatPanel";
import { DocumentsPanel } from "@/components/rag/DocumentsPanel";
import { SearchPanel } from "@/components/rag/SearchPanel";
import { ConfigPanel } from "@/components/rag/ConfigPanel";
import WorkspaceSwitcher from "@/components/ui/WorkspaceSwitcher";
import styles from "@/components/rag/rag.module.css";

export default function RagAppStudioPage() {
  const router = useRouter();
  const { user, loading: authLoading, getAccessToken, loginWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<"chat" | "upload" | "search" | "config">("chat");
  const [tenantId, setTenantId] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [client, setClient] = useState<RetrieverClient | null>(null);
  const [tenantLoading, setTenantLoading] = useState<boolean>(true);

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
            const resolvedTenant = data.tenantId || "guest-demo";
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

      // Guest / Fallback Mode when unauthenticated or offline
      const storedTenant = localStorage.getItem("retriever_tenant_id") || "guest-demo";
      const storedUser = localStorage.getItem("retriever_user_id") || "guest-user";
      const storedKey = localStorage.getItem("retriever_api_key") || "guest-demo-key";

      setTenantId(storedTenant);
      setApiKey(storedKey);
      setUserId(storedUser);
      setIsAdmin(storedKey.includes("admin") || storedKey === "dev-admin-master-key-change-in-production");

      const cli = new RetrieverClient({
        apiUrl: process.env.NEXT_PUBLIC_RETRIEVER_API_URL || "https://rag.prateeq.in",
        tenantId: storedTenant,
        apiKey: storedKey,
        userId: storedUser,
      });
      setClient(cli);
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

  return (
    <div className={styles.landingWrapper}>
      <WorkspaceSwitcher active="rag" />
      {/* Workspace Sub-Header */}
      <div className={styles.workspaceHeader}>
        <div className={styles.workspaceTitleGroup}>
          <h1 className={styles.workspaceTitle}>SaaS Studio Workspace</h1>
          <span className={styles.heroBadge} style={{ margin: 0 }}>
            {tenantLoading ? "Loading…" : `Tenant ID: ${tenantId.slice(0, 8)}…`}
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
              Sign In with Google for Workspace
            </button>
          )}
        </div>

        <div className={styles.navLinks}>
          {isAdmin && (
            <Link href="/admin/analytics" className="comic-btn comic-btn-blue">
              🛠️ Admin Dashboard
            </Link>
          )}

          <button className="comic-btn comic-btn-outline" onClick={handleExitStudio}>
            ← Back to Product Landing
          </button>
        </div>
      </div>

      {/* Main Studio Tabs */}
      <div className={styles.tabs} style={{ marginBottom: "1.5rem" }}>
        <button
          className={`${styles.tab} ${activeTab === "chat" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          💬 Chat Studio
        </button>
        <button
          className={`${styles.tab} ${activeTab === "upload" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          📄 Document Library
        </button>
        <button
          className={`${styles.tab} ${activeTab === "search" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("search")}
        >
          🔍 Search Inspector
        </button>
        <button
          className={`${styles.tab} ${activeTab === "config" ? styles.tabActive : ""}`}
          onClick={() => setActiveTab("config")}
        >
          ⚙️ Embed Configurator
        </button>
      </div>

      {/* Tab Panels */}
      <div className={styles.panelContainer}>
        <ChatPanel client={client} hidden={activeTab !== "chat"} />
        <DocumentsPanel client={client} hidden={activeTab !== "upload"} />
        <SearchPanel client={client} hidden={activeTab !== "search"} />
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
            localStorage.setItem("retriever_tenant_id", cfg.tenantId);
            localStorage.setItem("retriever_api_key", cfg.apiKey);
            localStorage.setItem("retriever_user_id", cfg.userId);
            window.location.reload();
          }}
          onClear={() => {
            localStorage.removeItem("retriever_tenant_id");
            localStorage.removeItem("retriever_api_key");
            localStorage.removeItem("retriever_user_id");
            window.location.reload();
          }}
          hidden={activeTab !== "config"}
        />
      </div>
    </div>
  );
}
