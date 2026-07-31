"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RetrieverClient } from "@/lib/rag-client";
import { ChatPanel } from "@/components/rag/ChatPanel";
import { DocumentsPanel } from "@/components/rag/DocumentsPanel";
import { SearchPanel } from "@/components/rag/SearchPanel";
import { ConfigPanel } from "@/components/rag/ConfigPanel";
import styles from "@/components/rag/rag.module.css";

const GUEST_KEY = "ret_live_GuestAccessKey2026.ReadOnlyChat";

export default function RagAppStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"chat" | "upload" | "search" | "config">("chat");

  const [tenantId, setTenantId] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [client, setClient] = useState<RetrieverClient | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const tId = localStorage.getItem("retriever_tenant_id") || "00000000-0000-0000-0000-000000000000";
      const uId = localStorage.getItem("retriever_user_id") || "00000000-0000-0000-0000-000000000001";
      const key = localStorage.getItem("retriever_api_key") || GUEST_KEY;

      setTenantId(tId);
      setApiKey(key);
      setUserId(uId);
      setIsAdmin(key.includes("admin") || key === "dev-admin-master-key-change-in-production");

      const cli = new RetrieverClient({
        apiUrl: "https://rag.prateeq.in",
        tenantId: tId,
        apiKey: key,
        userId: uId,
      });
      setClient(cli);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("retriever_tenant_id");
    localStorage.removeItem("retriever_user_id");
    localStorage.removeItem("retriever_api_key");
    localStorage.removeItem("retriever_jwt");
    router.push("/rag/login");
  };

  return (
    <div className={styles.landingWrapper}>
      {/* Workspace Sub-Header */}
      <div className={styles.workspaceHeader}>
        <div className={styles.workspaceTitleGroup}>
          <h1 className={styles.workspaceTitle}>SaaS Studio Workspace</h1>
          <span className={styles.heroBadge} style={{ margin: 0 }}>
            Tenant ID: {tenantId.slice(0, 8)}…
          </span>
        </div>

        <div className={styles.navLinks}>
          {isAdmin && (
            <Link href="/admin/analytics" className="comic-btn comic-btn-blue">
              🛠️ Admin Dashboard
            </Link>
          )}

          <button className="comic-btn comic-btn-outline" onClick={handleLogout}>
            Log Out
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
                  apiUrl: "https://rag.prateeq.in",
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
