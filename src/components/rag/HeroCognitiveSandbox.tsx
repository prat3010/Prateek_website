"use client";

import { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./HeroCognitiveSandbox.module.css";

interface SearchResultItem {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata?: {
    filename?: string;
    section_title?: string;
  };
}

interface SearchStages {
  embeddingMs?: number;
  searchMs?: number;
  fusionMs?: number;
}

interface SearchResponseDto {
  query: string;
  results: SearchResultItem[];
  searchMeta?: {
    strategy?: string;
    totalCandidates?: number;
    returnedResults?: number;
    durationMs?: number;
    stages?: SearchStages;
  };
}

interface SandboxTelemetry {
  strategy: string;
  serverDurationMs: number;
  clientTransitMs: number;
  totalDurationMs: number;
  stages?: SearchStages;
  totalCandidates: number;
  returnedResults: number;
}

const PRESET_QUERIES = [
  "What are the payment terms, milestone split, and deliverable standards for a SaaS build?",
  "What is the difference between ColBERT MaxSim token search and dense HNSW?",
  "How does Ebbinghaus memory prevent catastrophic forgetting in long-horizon sessions?",
  "Explain the active-active multi-cloud vector replication guarantee.",
];

const GUEST_SEARCH_ENDPOINT = "/api/rag/guest/search";

function formatStrategy(strategy: string): string {
  switch (strategy) {
    case "exact_cache_hit":
      return "EXACT REDIS CACHE HIT";
    case "semantic_cache_hit":
      return "SEMANTIC CACHE HIT";
    case "hybrid_fusion_rrf":
      return "HYBRID HNSW + BM25 FUSION";
    case "vector_only_degraded_reranked":
      return "VECTOR HNSW + COLBERT RERANK";
    case "vector_only_degraded":
      return "VECTOR DEGRADED (FALLBACK)";
    default:
      return strategy.replace(/_/g, " ").toUpperCase();
  }
}

function parseChunkSourceAndContent(
  rawContent: string,
  metadata?: { filename?: string; section_title?: string }
) {
  let filename = metadata?.filename;
  const sectionTitle = metadata?.section_title;
  let cleanContent = rawContent;

  const docMatch = cleanContent.match(/^\[Document:\s*([^\]]+)\]\s*\n?/);
  if (docMatch) {
    if (!filename) {
      filename = docMatch[1].trim();
    }
    cleanContent = cleanContent.slice(docMatch[0].length);
  }

  return {
    filename: filename || "source_knowledge.md",
    sectionTitle,
    content: cleanContent,
  };
}

export function HeroCognitiveSandbox() {
  const [query, setQuery] = useState(PRESET_QUERIES[0]);
  const [mode, setMode] = useState<"hybrid" | "cache" | "graph" | "crag">("hybrid");
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [telemetry, setTelemetry] = useState<SandboxTelemetry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExecuteSearch = useCallback(
    async (
      targetQuery: string,
      targetMode: "hybrid" | "cache" | "graph" | "crag" = mode
    ) => {
      setLoading(true);
      setErrorMessage(null);
      const startTime = performance.now();

      try {
        const res = await fetch(GUEST_SEARCH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: targetQuery,
            limit: 2,
            enable_hybrid: targetMode === "hybrid" || targetMode === "crag",
            enable_colbert_rerank: targetMode === "graph",
          }),
        });

        const elapsed = Math.round((performance.now() - startTime) * 10) / 10;

        if (!res.ok) {
          throw new Error(`Search request failed with status ${res.status}`);
        }

        const data: SearchResponseDto = await res.json();
        const serverDuration = data.searchMeta?.durationMs ?? 0;
        const transitMs = Math.max(
          0,
          Math.round((elapsed - serverDuration) * 10) / 10
        );

        if (data.results && data.results.length > 0) {
          setResults(data.results);
          setTelemetry({
            strategy:
              data.searchMeta?.strategy ||
              (targetMode === "cache"
                ? "exact_cache_hit"
                : "hybrid_fusion_rrf"),
            serverDurationMs: Math.round(serverDuration * 10) / 10,
            clientTransitMs: transitMs,
            totalDurationMs: elapsed,
            stages: data.searchMeta?.stages,
            totalCandidates:
              data.searchMeta?.totalCandidates || data.results.length,
            returnedResults: data.results.length,
          });
        } else {
          setResults([]);
          setTelemetry({
            strategy: data.searchMeta?.strategy || "hybrid_fusion_rrf",
            serverDurationMs: Math.round(serverDuration * 10) / 10,
            clientTransitMs: transitMs,
            totalDurationMs: elapsed,
            stages: data.searchMeta?.stages,
            totalCandidates: data.searchMeta?.totalCandidates || 0,
            returnedResults: 0,
          });
        }
      } catch {
        setErrorMessage(
          "Guest RAG service unreachable. Check connection."
        );
        setTelemetry(null);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [mode]
  );

  useEffect(() => {
    let ignore = false;

    async function fetchInitialQuery() {
      const startTime = performance.now();
      try {
        const res = await fetch(GUEST_SEARCH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: PRESET_QUERIES[0],
            limit: 2,
            enable_hybrid: true,
          }),
        });

        const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
        if (!res.ok) {
          throw new Error(`Search request failed with status ${res.status}`);
        }
        const data: SearchResponseDto = await res.json();
        if (ignore) return;

        const serverDuration = data.searchMeta?.durationMs ?? 0;
        const transitMs = Math.max(
          0,
          Math.round((elapsed - serverDuration) * 10) / 10
        );

        if (data.results && data.results.length > 0) {
          setResults(data.results);
          setTelemetry({
            strategy: data.searchMeta?.strategy || "hybrid_fusion_rrf",
            serverDurationMs: Math.round(serverDuration * 10) / 10,
            clientTransitMs: transitMs,
            totalDurationMs: elapsed,
            stages: data.searchMeta?.stages,
            totalCandidates:
              data.searchMeta?.totalCandidates || data.results.length,
            returnedResults: data.results.length,
          });
        } else {
          setResults([]);
          setTelemetry({
            strategy: data.searchMeta?.strategy || "hybrid_fusion_rrf",
            serverDurationMs: Math.round(serverDuration * 10) / 10,
            clientTransitMs: transitMs,
            totalDurationMs: elapsed,
            stages: data.searchMeta?.stages,
            totalCandidates: data.searchMeta?.totalCandidates || 0,
            returnedResults: 0,
          });
        }
      } catch {
        if (!ignore) {
          setErrorMessage(
            "Guest RAG service unreachable. Check connection."
          );
          setTelemetry(null);
          setResults([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchInitialQuery();

    return () => {
      ignore = true;
    };
  }, []);

  const handleSelectPill = (q: string) => {
    setQuery(q);
    handleExecuteSearch(q);
  };

  const handleSelectMode = (
    newMode: "hybrid" | "cache" | "graph" | "crag"
  ) => {
    setMode(newMode);
    handleExecuteSearch(query, newMode);
  };

  return (
    <div className={styles.sandboxContainer}>
      {/* 1. Terminal Window Header */}
      <div className={styles.windowHeader}>
        <div className={styles.windowDots}>
          <span className={styles.dotRed} />
          <span className={styles.dotYellow} />
          <span className={styles.dotGreen} />
          <span className={styles.windowTitle}>
            <span className={styles.liveIndicator} />
            LIVE COGNITIVE REPL • rag.prateeq.in
          </span>
        </div>

        {/* Mode Selector */}
        <div className={styles.modeTabs}>
          <button
            className={`${styles.modeTab} ${mode === "hybrid" ? styles.modeTabActive : ""}`}
            onClick={() => handleSelectMode("hybrid")}
          >
            {mode === "hybrid" && (
              <m.span
                layoutId="sandboxModeTab"
                className={styles.tabPill}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            🔍 Hybrid (HNSW+BM25)
          </button>
          <button
            className={`${styles.modeTab} ${mode === "cache" ? styles.modeTabActive : ""}`}
            onClick={() => handleSelectMode("cache")}
          >
            {mode === "cache" && (
              <m.span
                layoutId="sandboxModeTab"
                className={styles.tabPill}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            ⚡ Semantic Cache
          </button>
          <button
            className={`${styles.modeTab} ${mode === "graph" ? styles.modeTabActive : ""}`}
            onClick={() => handleSelectMode("graph")}
          >
            {mode === "graph" && (
              <m.span
                layoutId="sandboxModeTab"
                className={styles.tabPill}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            🕸️ ColBERT / Graph
          </button>
          <button
            className={`${styles.modeTab} ${mode === "crag" ? styles.modeTabActive : ""}`}
            onClick={() => handleSelectMode("crag")}
          >
            {mode === "crag" && (
              <m.span
                layoutId="sandboxModeTab"
                className={styles.tabPill}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            🛡️ Self-Aware CRAG
          </button>
        </div>
      </div>

      {/* 2. Interactive Body */}
      <div className={styles.sandboxBody}>
        {/* Prompt Bar */}
        <div className={styles.promptBar}>
          <input
            type="text"
            className={styles.promptInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExecuteSearch(query)}
            placeholder="Ask a technical or architectural question..."
            aria-label="Cognitive Query Input"
          />
          <MagneticButton strength={0.25}>
            <button
              className={`comic-btn comic-btn-blue ${styles.executeBtn}`}
              onClick={() => handleExecuteSearch(query)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.loadingSpinner} />
                  Searching...
                </>
              ) : (
                "⚡ Run Query"
              )}
            </button>
          </MagneticButton>
        </div>

        {/* Live Tenant Context Pill */}
        <div className={styles.tenantContextRow}>
          <span className={styles.tenantContextPill}>
            <span className={styles.tenantLiveDot} />
            Querying Live Index: Prateeq Engineering SOW &amp; Scoping Knowledge
          </span>
        </div>

        {/* Preset Query Pills */}
        <div className={styles.pillsRow}>
          <span className={styles.pillsLabel}>Try Prompt:</span>
          {PRESET_QUERIES.map((q, idx) => (
            <button
              key={idx}
              className={styles.queryPill}
              onClick={() => handleSelectPill(q)}
            >
              {q.length > 40 ? `${q.slice(0, 38)}...` : q}
            </button>
          ))}
        </div>

        {/* Connection Notice banner on failure */}
        {errorMessage && (
          <div className={styles.errorNotice} role="alert">
            <span className={styles.errorIcon}>⚠️</span>
            <div className={styles.errorText}>
              <strong>Connection Notice:</strong> {errorMessage}
            </div>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={() => handleExecuteSearch(query)}
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* 3. Live Pipeline Waterfall */}
        <div className={styles.waterfallCard}>
          <div className={styles.waterfallHeader}>
            <span>
              RETRIEVAL PIPELINE STAGES
              {telemetry ? ` • ${formatStrategy(telemetry.strategy)}` : ""}
            </span>
            <span className={styles.waterfallBadge}>
              {loading
                ? "⚡ Executing Pipeline..."
                : telemetry
                  ? telemetry.strategy === "exact_cache_hit"
                    ? `⚡ ${telemetry.serverDurationMs}ms (Cache Hit)`
                    : `⚡ ${telemetry.serverDurationMs}ms Server (${telemetry.totalDurationMs}ms Total)`
                  : "Offline"}
            </span>
          </div>
          <div className={styles.waterfallStages}>
            <div className={styles.stageItem}>
              <span className={styles.stageName}>1. Embedding (Ollama)</span>
              <span className={styles.stageValue}>
                {loading ? (
                  <span className={styles.stageSkeleton} />
                ) : telemetry?.strategy === "exact_cache_hit" ? (
                  "0.0 ms (cached)"
                ) : telemetry?.stages?.embeddingMs != null ? (
                  `${telemetry.stages.embeddingMs.toFixed(1)} ms`
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className={styles.stageItem}>
              <span className={styles.stageName}>2. HNSW + BM25</span>
              <span className={styles.stageValue}>
                {loading ? (
                  <span className={styles.stageSkeleton} />
                ) : telemetry?.strategy === "exact_cache_hit" ? (
                  "0.0 ms (cached)"
                ) : telemetry?.stages?.searchMs != null ? (
                  `${telemetry.stages.searchMs.toFixed(1)} ms`
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className={styles.stageItem}>
              <span className={styles.stageName}>3. RRF Fusion (k=60)</span>
              <span className={styles.stageValue}>
                {loading ? (
                  <span className={styles.stageSkeleton} />
                ) : telemetry?.strategy === "exact_cache_hit" ? (
                  "0.0 ms (cached)"
                ) : telemetry?.stages?.fusionMs != null ? (
                  `${telemetry.stages.fusionMs.toFixed(1)} ms`
                ) : (
                  "—"
                )}
              </span>
            </div>
            <div className={styles.stageItem}>
              <span className={styles.stageName}>4. Network Transit</span>
              <span className={styles.stageValue}>
                {loading ? (
                  <span className={styles.stageSkeleton} />
                ) : telemetry ? (
                  `${telemetry.clientTransitMs.toFixed(1)} ms`
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Retrieved Chunks with Verified Citations */}
        <div className={styles.resultsArea}>
          <div className={styles.resultsTitle}>
            <span>📄 Grounded Evidence Chunks ({results.length})</span>
            {results.length > 0 && results[0]?.score != null && (
              <span className={styles.chunkScoreBadge}>
                Top Score: {results[0].score.toFixed(3)}
              </span>
            )}
          </div>

          {loading ? (
            <div className={styles.skeletonChunk}>
              <div className={styles.skeletonLineShort} />
              <div className={styles.skeletonLineFull} />
              <div className={styles.skeletonLineMedium} />
            </div>
          ) : results.length > 0 ? (
            results.map((chunk, idx) => {
              const parsed = parseChunkSourceAndContent(
                chunk.content,
                chunk.metadata
              );
              return (
                <div key={chunk.chunkId || idx} className={styles.chunkCard}>
                  <div className={styles.chunkHeader}>
                    <span className={styles.chunkSource}>
                      📂 {parsed.filename}
                      {parsed.sectionTitle && ` • ${parsed.sectionTitle}`}
                    </span>
                    <span className={styles.chunkScoreBadge}>
                      Score: {chunk.score.toFixed(3)}
                    </span>
                  </div>
                  <div className={styles.chunkContent}>{parsed.content}</div>
                </div>
              );
            })
          ) : !errorMessage ? (
            <div className={styles.emptyResults}>
              No matching chunks returned from index. Try another query above.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
