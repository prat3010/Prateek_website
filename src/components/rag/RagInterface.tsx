"use client";

import { useState } from "react";
import { RetrieverClient, type RetrieverConfig } from "@/lib/rag-client";
import { RagErrorBoundary } from "./ErrorBoundary";
import { ConfigPanel } from "./ConfigPanel";
import { ChatPanel } from "./ChatPanel";
import { SearchPanel } from "./SearchPanel";
import { DocumentsPanel } from "./DocumentsPanel";
import { TeamPanel } from "./TeamPanel";
import { TelemetryPanel } from "./TelemetryPanel";
import styles from "./rag.module.css";

type Tab = "config" | "chat" | "search" | "documents" | "team" | "telemetry";

export default function RagInterface() {
  const [tab, setTab] = useState<Tab>("config");
  // API and BYOK credentials intentionally live only for this browser tab.
  // Persisting them in localStorage makes any XSS issue an account compromise.
  const [config, setConfig] = useState<RetrieverConfig | null>(null);
  const [client, setClient] = useState<RetrieverClient | null>(null);

  function handleSaveConfig(c: RetrieverConfig) {
    setConfig(c);
    setClient(new RetrieverClient(c));
    setTab("chat");
  }

  function handleClear() {
    setConfig(null);
    setClient(null);
  }

  return (
    <RagErrorBoundary>
      <div className={styles.wrapper}>
        <nav className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "config" ? styles.active : ""}`} onClick={() => setTab("config")}>
            Config
          </button>
          <button className={`${styles.tab} ${tab === "chat" ? styles.active : ""}`} onClick={() => setTab("chat")} disabled={!client}>
            Chat
          </button>
          <button className={`${styles.tab} ${tab === "search" ? styles.active : ""}`} onClick={() => setTab("search")} disabled={!client}>
            Search
          </button>
          <button className={`${styles.tab} ${tab === "documents" ? styles.active : ""}`} onClick={() => setTab("documents")} disabled={!client}>
            Documents
          </button>
          <button className={`${styles.tab} ${tab === "team" ? styles.active : ""}`} onClick={() => setTab("team")}>
            Team
          </button>
          <button className={`${styles.tab} ${tab === "telemetry" ? styles.active : ""}`} onClick={() => setTab("telemetry")}>
            Telemetry
          </button>
        </nav>

        <div className={styles.status}>
          {client
            ? <span className={styles.connected}>Connected: {config?.tenantId?.slice(0, 8)}…</span>
            : <span className={styles.disconnected}>Not configured</span>}
        </div>

        <div className={styles.content}>
          <ConfigPanel key={config?.apiKey ?? "empty"} config={config} onSave={handleSaveConfig} onClear={handleClear} hidden={tab !== "config"} />
          <ChatPanel client={client} hidden={tab !== "chat"} />
          <SearchPanel client={client} hidden={tab !== "search"} />
          <DocumentsPanel client={client} hidden={tab !== "documents"} />
          <TeamPanel config={config} hidden={tab !== "team"} />
          <TelemetryPanel config={config} hidden={tab !== "telemetry"} />
        </div>
      </div>
    </RagErrorBoundary>
  );
}
