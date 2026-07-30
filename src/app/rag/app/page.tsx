"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RetrieverClient } from "@/lib/rag-client";
import { ChatPanel } from "@/components/rag/ChatPanel";
import { UploadPanel } from "@/components/rag/UploadPanel";
import { SearchPanel } from "@/components/rag/SearchPanel";
import { ConfigPanel } from "@/components/rag/ConfigPanel";
import styles from "@/components/rag/rag.module.css";

const GUEST_KEY = "ret_live_GuestAccessKey2026.ReadOnlyChat";

export default function RagAppStudioPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"chat" | "upload" | "search" | "config">("chat");

  const [tenantId, setTenantId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [client, setClient] = useState<RetrieverClient | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const tId = localStorage.getItem("retriever_tenant_id") || "00000000-0000-0000-0000-000000000000";
      const uId = localStorage.getItem("retriever_user_id") || "guest_visitor_user";
      const key = localStorage.getItem("retriever_api_key") || GUEST_KEY;

      setTenantId(tId);
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
      {/* App Header Navigation */}
      <header className={styles.ragNav}>
        <Link href="/rag" className={styles.navBrand}>
          <span style={{ fontSize: "1.5rem" }}>⚡</span> Retriever Workspace
        </Link>

        <div className={styles.navLinks}>
          <span className={styles.heroBadge} style={{ margin: 0 }}>
            Tenant: {tenantId.slice(0, 8)}…
          </span>

          {isAdmin && (
            <Link href="/admin/analytics" className="comic-btn comic-btn-blue">
              🛠️ Admin Dashboard
            </Link>
          )}

          <button className="comic-btn comic-btn-outline" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

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
        <UploadPanel client={client} hidden={activeTab !== "upload"} />
        <SearchPanel client={client} hidden={activeTab !== "search"} />
        <ConfigPanel hidden={activeTab !== "config"} />
      </div>
    </div>
  );
}
