"use client";

import { useState } from "react";
import { m } from "framer-motion";
import styles from "./rag.module.css";

export function DeveloperApiSection() {
  const [activeTab, setActiveTab] = useState<"curl" | "python" | "typescript" | "docker">("curl");
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST https://rag.prateeq.in/v1/tenants/YOUR_TENANT_ID/chat/sessions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-User-ID: YOUR_USER_ID" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id": "YOUR_USER_ID"}'

# Stream chat response:
curl -N -X POST https://rag.prateeq.in/v1/tenants/YOUR_TENANT_ID/chat/sessions/SESSION_ID/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-User-ID: YOUR_USER_ID" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "What are your core platform security SLA requirements?", "stream": true, "web_search_grounding": true, "metadata_filter": {"year": 2026}}'`,

    python: `import httpx

API_URL = "https://rag.prateeq.in"
TENANT_ID = "YOUR_TENANT_ID"
API_KEY = "YOUR_API_KEY"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "X-User-ID": "dev-user-01",
    "Content-Type": "application/json"
}

# 1. Search Knowledge Base (Hybrid HNSW + BM25)
with httpx.Client() as client:
    resp = client.post(
        f"{API_URL}/v1/tenants/{TENANT_ID}/search",
        headers=headers,
        json={"query": "RAG architecture HNSW", "top_k": 3, "enable_hybrid": True}
    )
    print("Search Results:", resp.json())`,

    typescript: `import { RetrieverClient } from "@/lib/rag-client";

const client = new RetrieverClient({
  apiUrl: "https://rag.prateeq.in",
  tenantId: "YOUR_TENANT_ID",
  apiKey: "YOUR_API_KEY",
  userId: "dev-user-01"
});

// Perform one-shot hybrid search
const searchResults = await client.search("hybrid vector search setup", {
  limit: 5,
  enableHybrid: true
});
console.log("Top Chunks:", searchResults);`,

    docker: `# 1-Click Launch with $0 local Ollama embeddings:
git clone https://github.com/prat3010/retriever.git
cd retriever
./scripts/quickstart.sh

# Interactive Swagger Docs: http://localhost:8000/docs
# Admin Control Studio:    http://localhost:3000
# Terminal Chat REPL:      python3 scripts/chat_repl.py`,
  };

  const copyCode = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles.devApiSection} id="api-docs">
      <div className={styles.devApiHeader}>
        <span className={styles.devApiBadge}>⚡ Developer RAG Platform</span>
        <h2 className={styles.devApiTitle}>Build Custom RAG Apps via REST API &amp; SDK</h2>
        <p className={styles.devApiSubtitle}>
          Integrate vector search, custom system prompts, and streaming inference into your existing applications in minutes.
        </p>
      </div>

      <div className={styles.devApiCard}>
        <div className={styles.devApiCardHeader}>
          <div className={styles.tabGroup}>
            <button
              className={`${styles.tabBtn} ${activeTab === "curl" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("curl")}
            >
              {activeTab === "curl" && (
                <m.span
                  layoutId="ragApiTabPill"
                  className={styles.apiTabPill}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              cURL
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "python" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("python")}
            >
              {activeTab === "python" && (
                <m.span
                  layoutId="ragApiTabPill"
                  className={styles.apiTabPill}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              Python (httpx)
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "typescript" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("typescript")}
            >
              {activeTab === "typescript" && (
                <m.span
                  layoutId="ragApiTabPill"
                  className={styles.apiTabPill}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              TypeScript / Node
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "docker" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("docker")}
            >
              {activeTab === "docker" && (
                <m.span
                  layoutId="ragApiTabPill"
                  className={styles.apiTabPill}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              🐳 Docker Quickstart
            </button>
          </div>

          <button className={`comic-btn ${styles.copyBtn}`} onClick={copyCode}>
            {copied ? "✓ Copied!" : "Copy Code"}
          </button>
        </div>

        <div className={styles.devApiBody}>
          <pre className={styles.heroCodeBlock}>
            <code>{snippets[activeTab]}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
