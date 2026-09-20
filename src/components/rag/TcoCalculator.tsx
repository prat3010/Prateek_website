"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";
import styles from "./TcoCalculator.module.css";

export function TcoCalculator() {
  const [queries, setQueries] = useState<number>(250000);
  const [docs, setDocs] = useState<number>(5000);
  const [useLocalOllama, setUseLocalOllama] = useState<boolean>(true);
  const [enableSemanticCache, setEnableSemanticCache] = useState<boolean>(true);

  // Transparent calculation rates (Industry standards vs Retriever):
  // 1. Vector Storage: Pinecone $70 base + $0.096 per GB vs PostgreSQL pgvector $0 base
  // 2. Embeddings: OpenAI text-embedding-3-small $0.02 / 1M tokens (avg 800 tokens/query+doc) vs Local Ollama $0
  // 3. Reranking: Cohere Rerank $1.00 / 1k queries vs Local ColBERT/Cross-Encoder $0
  // 4. Semantic Cache: 45% cache hit rate eliminates 45% of LLM queries

  const avgTokensPerQuery = 600;
  const totalQueryTokens = (queries * avgTokensPerQuery) / 1_000_000;
  const embeddingCostTrad = totalQueryTokens * 0.02;
  const pineconeCost = Math.max(70, Math.round((docs * 0.05) + 70));
  const cohereRerankCost = (queries / 1000) * 1.0;
  const llmCostTrad = (queries * 0.003); // Approximate $0.003/query on GPT-4o / Claude

  const tradMonthlyTotal = Math.round(pineconeCost + embeddingCostTrad + cohereRerankCost + llmCostTrad);

  // Retriever cost:
  const retrieverBaseCompute = 40; // Self-hosted VPS or Cloud Starter
  const cacheHitDiscount = enableSemanticCache ? 0.45 : 0.0;
  const retrieverLlmCost = Math.round(llmCostTrad * (1 - cacheHitDiscount));
  const retrieverEmbeddingCost = useLocalOllama ? 0 : embeddingCostTrad;
  const retrieverMonthlyTotal = Math.round(retrieverBaseCompute + retrieverEmbeddingCost + (retrieverLlmCost * 0.4));

  const monthlySavings = Math.max(tradMonthlyTotal - retrieverMonthlyTotal, 0);
  const annualSavings = monthlySavings * 12;
  const savingsPct = tradMonthlyTotal > 0 ? Math.round((monthlySavings / tradMonthlyTotal) * 100) : 90;

  return (
    <section className={styles.tcoSection} id="tco-calculator">
      {/* Header */}
      <div className={styles.tcoHeader}>
        <div className={styles.tcoBadge}>
          💰 Infrastructure Economics • 100% Transparent Math
        </div>
        <h2 className={styles.tcoTitle}>
          Calculate Your Annual AI Infrastructure Savings
        </h2>
        <p className={styles.tcoSubtitle}>
          See how much your organization saves by replacing metered cloud vector databases and token embedding APIs with Retriever.
        </p>
      </div>

      {/* Card */}
      <div className={styles.tcoCard}>
        {/* Controls Column */}
        <div className={styles.controlsColumn}>
          {/* Slider 1: Monthly Searches */}
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>Monthly Vector Queries</span>
              <span className={styles.sliderValue}>{queries.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={25000}
              max={2500000}
              step={25000}
              value={queries}
              onChange={(e) => setQueries(Number(e.target.value))}
              className={styles.rangeInput}
              aria-label="Monthly Vector Queries Slider"
            />
          </div>

          {/* Slider 2: Documents */}
          <div className={styles.sliderGroup}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>Knowledge Base Documents</span>
              <span className={styles.sliderValue}>{docs.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={500}
              max={50000}
              step={500}
              value={docs}
              onChange={(e) => setDocs(Number(e.target.value))}
              className={styles.rangeInput}
              aria-label="Knowledge Base Documents Slider"
            />
          </div>

          {/* Toggles */}
          <div className={styles.togglesGroup}>
            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={useLocalOllama}
                onChange={(e) => setUseLocalOllama(e.target.checked)}
              />
              <span>Use Local Ollama ($0 Embeddings via nomic-embed-text)</span>
            </label>

            <label className={styles.toggleRow}>
              <input
                type="checkbox"
                checked={enableSemanticCache}
                onChange={(e) => setEnableSemanticCache(e.target.checked)}
              />
              <span>Enable Sub-15ms Semantic Cache (45% Hit Rate Savings)</span>
            </label>
          </div>
        </div>

        {/* Output Column */}
        <div className={styles.outputColumn}>
          <div>
            <div className={styles.comparisonItem}>
              <span className={styles.comparisonLabel}>Traditional Fragmented Stack:</span>
              <span className={`${styles.comparisonPrice} ${styles.priceRed}`}>
                $<NumberFlow value={tradMonthlyTotal} /> / mo
              </span>
            </div>

            <div className={styles.comparisonItem}>
              <span className={styles.comparisonLabel}>Retriever AI Stack:</span>
              <span className={`${styles.comparisonPrice} ${styles.priceGreen}`}>
                $<NumberFlow value={retrieverMonthlyTotal} /> / mo
              </span>
            </div>
          </div>

          <div className={styles.savingsBox}>
            <div className={styles.savingsTag}>Estimated Annual Savings</div>
            <div className={styles.savingsTotal}>
              $<NumberFlow value={annualSavings} />
            </div>
            <div className={styles.savingsPct}>
              Save {savingsPct}% on your vector &amp; token infrastructure bills
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
