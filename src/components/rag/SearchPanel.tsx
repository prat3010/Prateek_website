"use client";

import { useState, useEffect, useCallback } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import type { SearchResponse, OnlineEvaluationSummaryResponse } from "@/lib/rag-types";
import { highlightText } from "./utils";
import styles from "./rag.module.css";

type SearchSubTab = "search" | "benchmarks" | "pipeline";

export function SearchPanel({ client, hidden }: { client: RetrieverClient | null; hidden: boolean }) {
  const [subTab, setSubTab] = useState<SearchSubTab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [hybridAlpha, setHybridAlpha] = useState(0.7);
  const [enableLora, setEnableLora] = useState(false);
  const [rerankerEngine, setRerankerEngine] = useState<"colbert" | "cohere" | "none">("colbert");

  // Real Online Evaluation Telemetry State
  const [onlineEval, setOnlineEval] = useState<OnlineEvaluationSummaryResponse | null>(null);
  const [loadingEval, setLoadingEval] = useState(false);

  const fetchOnlineEval = useCallback(async () => {
    if (!client) return;
    setLoadingEval(true);
    try {
      const summary = await client.getOnlineEvaluationSummary();
      setOnlineEval(summary);
    } catch {
      // Keep null if not recorded yet
    } finally {
      setLoadingEval(false);
    }
  }, [client]);

  useEffect(() => {
    if (subTab === "benchmarks") {
      fetchOnlineEval();
    }
  }, [subTab, fetchOnlineEval]);

  if (hidden) return null;

  async function handleSearch() {
    if (!client || !query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await client.search(query, {
        hybridAlpha,
        enableLoraAdapter: enableLora,
        rerankerEngine,
        enableColbertRerank: rerankerEngine === "colbert",
      });
      setResults(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <h2 className={styles.panelTitle}>🔍 Search Inspector, Experiments & RAG Evaluator</h2>
        <p className={styles.panelDesc}>Debug hybrid search vector/keyword score breakdowns, calibrate sparse-dense convex ratios, and evaluate LoRA adapters.</p>
      </div>

      {/* Sub-Nav Tabs */}
      <div className={styles.subTabNav}>
        <button
          onClick={() => setSubTab("search")}
          className={`${styles.subTabBtn} ${subTab === "search" ? styles.subTabBtnActive : ""}`}
        >
          🔍 Hybrid Search Debugger
        </button>
        <button
          onClick={() => setSubTab("benchmarks")}
          className={`${styles.subTabBtn} ${subTab === "benchmarks" ? styles.subTabBtnActive : ""}`}
        >
          📊 Online Evaluator & Ragas
        </button>
        <button
          onClick={() => setSubTab("pipeline")}
          className={`${styles.subTabBtn} ${subTab === "pipeline" ? styles.subTabBtnActive : ""}`}
        >
          ⚙️ Active Pipeline Inspector
        </button>
      </div>


      {/* Sub-Tab 1: Hybrid Search Debugger */}
      {subTab === "search" && (
        <div>
          <div className={styles.chatInput}>
            <input
              className={styles.input}
              aria-label="Search knowledge base vector chunks"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter test query (e.g. 'What is our privacy policy?')..."
            />
            <button className="comic-btn comic-btn-blue" onClick={handleSearch} disabled={loading || !query.trim()}>
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          {/* M79: Sparse-Dense Hybrid Balance & LoRA Controls */}
          <div style={{ marginTop: "1rem", padding: "0.85rem", background: "var(--surface-elevated, rgba(0,0,0,0.03))", borderRadius: "8px", border: "1px solid var(--surface-glass-border, rgba(0,0,0,0.1))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>⚖️ Hybrid Blend Ratio (α): {hybridAlpha.toFixed(2)}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                {(hybridAlpha * 100).toFixed(0)}% Semantic Dense / {((1 - hybridAlpha) * 100).toFixed(0)}% BM25 Sparse
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={hybridAlpha}
              onChange={(e) => setHybridAlpha(parseFloat(e.target.value))}
              style={{ width: "100%", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "0.25rem", fontFamily: "monospace" }}>
              <span>0.0 (BM25 Code/Keywords)</span>
              <span>0.5 (Balanced)</span>
              <span>1.0 (Dense Vector)</span>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", fontSize: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <input
                  type="checkbox"
                  id="lora-toggle"
                  checked={enableLora}
                  onChange={(e) => setEnableLora(e.target.checked)}
                />
                <label htmlFor="lora-toggle">🧠 LoRA Domain Adapter</label>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <input type="checkbox" id="mq-toggle" defaultChecked />
                <label htmlFor="mq-toggle">🔀 Multi-Query Expansion</label>
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginLeft: "auto" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Reranker:</span>
                <button
                  type="button"
                  onClick={() => setRerankerEngine("colbert")}
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--surface-glass-border, rgba(0,0,0,0.1))",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    background: rerankerEngine === "colbert" ? "var(--badge-active-bg, rgba(0,230,118,0.15))" : "transparent",
                    color: rerankerEngine === "colbert" ? "var(--badge-active-color, #00E676)" : "var(--color-text-muted)",
                    fontWeight: rerankerEngine === "colbert" ? 600 : 400,
                  }}
                >
                  ⚡ ColBERT MaxSim
                </button>
                <button
                  type="button"
                  onClick={() => setRerankerEngine("cohere")}
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--surface-glass-border, rgba(0,0,0,0.1))",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    background: rerankerEngine === "cohere" ? "rgba(0,180,216,0.15)" : "transparent",
                    color: rerankerEngine === "cohere" ? "var(--pop-blue, #00b4d8)" : "var(--color-text-muted)",
                    fontWeight: rerankerEngine === "cohere" ? 600 : 400,
                  }}
                >
                  Cohere API
                </button>
                <button
                  type="button"
                  onClick={() => setRerankerEngine("none")}
                  style={{
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid var(--surface-glass-border, rgba(0,0,0,0.1))",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    background: rerankerEngine === "none" ? "var(--surface-elevated, rgba(0,0,0,0.06))" : "transparent",
                    color: rerankerEngine === "none" ? "var(--color-text)" : "var(--color-text-muted)",
                    fontWeight: rerankerEngine === "none" ? 600 : 400,
                  }}
                >
                  Off
                </button>
              </div>
            </div>
          </div>

          {!results && !loading && (
            <p className={styles.empty}>Enter a query above to search your indexed documents.</p>
          )}

          {results && (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <p className={styles.resultMeta} style={{ margin: 0 }}>
                  Found {results.results.length} result{results.results.length !== 1 ? "s" : ""}
                  {results.searchMeta?.durationMs && ` in ${results.searchMeta.durationMs}ms`}
                </p>
                <span className={styles.tag} style={{ background: "var(--badge-active-bg, rgba(0,230,118,0.15))", color: "var(--badge-active-color, #00E676)", fontSize: "0.75rem" }}>
                  {results.searchMeta?.strategy?.includes("colbert_maxsim") ? "⚡ ColBERT MaxSim Reranked" : `⚡ Strategy: ${results.searchMeta?.strategy || "normalized_hybrid"}`}
                </span>
              </div>

              {results.results.map((r, i) => {
                const isContextual = r.content.includes("[Context:") || Boolean(r.metadata?.context_prepended);
                const contextTag = isContextual
                  ? r.content.match(/\[Context:\s*([^\]]+)\]/)?.[1] || String(r.metadata?.context_prefix || "Document Context")
                  : null;

                return (
                  <div key={r.chunkId ?? i} className={styles.resultItem}>
                    <div className={styles.resultHeader}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className={styles.resultRank}>#{i + 1}</span>
                        {contextTag && (
                          <span className={styles.tag} style={{ background: "rgba(0,180,216,0.2)", color: "var(--pop-blue, #00b4d8)", fontSize: "0.7rem" }}>
                            🏷️ Context: {contextTag}
                          </span>
                        )}
                      </div>
                      <span className={styles.resultScore}>
                        Match Confidence: {(r.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className={styles.resultContent}>{highlightText(r.content, query)}</p>
                    {(r.metadata?.filename || r.metadata?.document_id) && (
                      <p className={styles.searchDoc}>
                        {"📄"} {String(r.metadata?.filename ?? String(r.metadata?.document_id ?? "").slice(0, 8))}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* Sub-Tab 2: Online Evaluations & Ragas Telemetry */}
      {subTab === "benchmarks" && (
        <div>
          <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #888)", margin: 0 }}>
              Live telemetry aggregated from verified chat responses, evaluating context faithfulness, prompt relevancy, and NLI entailment.
            </p>
            <button onClick={fetchOnlineEval} className="comic-btn comic-btn-blue" disabled={loadingEval}>
              {loadingEval ? "Refreshing..." : "🔄 Refresh Telemetry"}
            </button>
          </div>

          <div className={styles.benchmarkGrid}>
            <div className={styles.scoreCard}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Faithfulness Score</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.5rem 0 0.25rem", color: onlineEval && onlineEval.total_evaluations > 0 ? "var(--badge-active-color, #00E676)" : "var(--color-text-muted)" }}>
                {onlineEval && onlineEval.total_evaluations > 0 ? `${(onlineEval.avg_faithfulness * 100).toFixed(1)}%` : "--"}
              </div>
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Is answer backed by document text?</span>
            </div>

            <div className={styles.scoreCard}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Context Precision</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.5rem 0 0.25rem", color: onlineEval && onlineEval.total_evaluations > 0 ? "var(--badge-active-color, #00E676)" : "var(--color-text-muted)" }}>
                {onlineEval && onlineEval.total_evaluations > 0 && onlineEval.avg_context_precision != null ? `${(onlineEval.avg_context_precision * 100).toFixed(1)}%` : "--"}
              </div>
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Signal-to-noise ratio of retrieved chunks</span>
            </div>

            <div className={styles.scoreCard}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Hallucination Risk</span>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.5rem 0 0.25rem", color: onlineEval && onlineEval.total_evaluations > 0 ? "var(--pop-blue, #5A8EB6)" : "var(--color-text-muted)" }}>
                {onlineEval && onlineEval.total_evaluations > 0 && onlineEval.avg_hallucination_index != null ? `${(onlineEval.avg_hallucination_index * 100).toFixed(1)}%` : "--"}
              </div>
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Unverified claim ratio across responses</span>
            </div>

          </div>

          <div style={{ marginTop: "1.25rem", padding: "0.85rem 1rem", background: "var(--surface-elevated, #16161a)", borderRadius: "8px", border: "1px solid var(--color-border, #333)", fontSize: "0.8rem" }}>
            <strong>Evaluation Summary: </strong>
            <span>{onlineEval?.total_evaluations ?? 0} verified query evaluations logged. {onlineEval?.total_alerts ?? 0} hallucination threshold alerts triggered.</span>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Active Pipeline Configuration Inspector */}
      {subTab === "pipeline" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem", background: "var(--surface-card, rgba(255,255,255,0.02))" }}>
            <span style={{ fontSize: "0.75rem", color: "#5A8EB6", fontWeight: 700, textTransform: "uppercase" }}>Vector Retrieval Layer</span>
            <h4 style={{ margin: "0.5rem 0 0.25rem" }}>HNSW Dense + Convex BM25</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #888)", margin: "0 0 0.75rem" }}>Embedding Model: <code>nomic-embed-text</code> (768-dim, cosine distance)</p>
            <div style={{ background: "var(--surface-elevated, #111)", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>
              Convex Alpha: <strong>{hybridAlpha}</strong> (Dense weight: {Math.round(hybridAlpha * 100)}% / Sparse: {Math.round((1 - hybridAlpha) * 100)}%)
            </div>
          </div>

          <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem", background: "var(--surface-card, rgba(255,255,255,0.02))" }}>
            <span style={{ fontSize: "0.75rem", color: "#00E676", fontWeight: 700, textTransform: "uppercase" }}>Cross-Encoder Reranking</span>
            <h4 style={{ margin: "0.5rem 0 0.25rem" }}>{rerankerEngine === "colbert" ? "ColBERT MaxSim Late-Interaction" : rerankerEngine === "cohere" ? "Cohere Rerank v3" : "Dense-Only (No Rerank)"}</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #888)", margin: "0 0 0.75rem" }}>Token-level multi-vector late interaction scoring over top candidate chunks.</p>
            <div style={{ background: "var(--surface-elevated, #111)", padding: "0.5rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem" }}>
              LoRA Adapter: <strong>{enableLora ? "Active" : "Disabled (Base Model)"}</strong>
            </div>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
