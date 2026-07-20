"use client";

import { useState } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import type { SearchResponse } from "@/lib/rag-types";
import { highlightText } from "./utils";
import styles from "./rag.module.css";

export function SearchPanel({ client, hidden }: { client: RetrieverClient | null; hidden: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (hidden) return null;

  async function handleSearch() {
    if (!client || !query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await client.search(query);
      setResults(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Semantic Search</h2>
      <p className={styles.panelDesc}>Hybrid search across indexed documents.</p>

      <div className={styles.chatInput}>
        <input
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search query..."
        />
        <button className="comic-btn comic-btn-blue" onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {!results && !loading && (
        <p className={styles.empty}>Enter a query above to search your indexed documents.</p>
      )}

      {results && (
        <div style={{ marginTop: "1.5rem" }}>
          <p className={styles.resultMeta}>
            Found {results.results.length} result{results.results.length !== 1 ? "s" : ""}
            {results.searchMeta?.durationMs && ` in ${results.searchMeta.durationMs}ms`}
          </p>
          {results.results.map((r, i) => (
            <div key={r.chunkId ?? i} className={styles.resultItem}>
              <div className={styles.resultHeader}>
                <span className={styles.resultRank}>#{i + 1}</span>
                <span className={styles.resultScore}>{(r.score * 100).toFixed(1)}%</span>
              </div>
              <p className={styles.resultContent}>{highlightText(r.content, query)}</p>
              {(r.metadata?.filename || r.metadata?.document_id) && (
                <p className={styles.searchDoc}>
                  {"📄"} {r.metadata?.filename ?? r.metadata?.document_id?.slice(0, 8) ?? ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
