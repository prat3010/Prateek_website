"use client";

import styles from "./rag.module.css";

export function ComparisonSection() {
  const comparisonData = [
    {
      feature: "Retrieval Architecture",
      retriever: "Hybrid pgvector HNSW + BM25 Keyword + Cohere Rerank",
      others: "Standard Single Vector Search",
      highlight: true,
    },
    {
      feature: "Hallucination Control",
      retriever: "Self-Aware CRAG Guardrails (Rejects Unbacked Queries)",
      others: "None (Prone to inventing answers)",
      highlight: true,
    },
    {
      feature: "Source Verification",
      retriever: "Presigned PDF Downloads with Exact Page Numbers",
      others: "Plain Text / No Verifiable Citations",
      highlight: true,
    },
    {
      feature: "Latency & API Costs",
      retriever: "Sub-50ms Semantic Cache (Saves up to 60% Token Costs)",
      others: "Full LLM Inference & High Cost Every Query",
      highlight: false,
    },
    {
      feature: "Deployment Options",
      retriever: "1-Line Drop-in Script, REST API, & App Studio",
      others: "Complex Setup or Locked Platform",
      highlight: false,
    },
    {
      feature: "LLM Provider Flexibility",
      retriever: "Multi-Model BYOK (OpenAI, Gemini 3.6, Llama 3.3 70B, Claude 3.5, DeepSeek)",
      others: "Locked to single vendor / hardcoded model",
      highlight: true,
    },
    {
      feature: "Knowledge Graph Traversal",
      retriever: "GraphRAG Multi-Hop Triples (Subject -- Predicate --> Object)",
      others: "None (Vector Similarity Only)",
      highlight: true,
    },
    {
      feature: "Multi-Modal Document Parsing",
      retriever: "Baidu PP-OCRv4 Deep Learning + LLM Vision Engine",
      others: "Plain Text Extraction / Fails on Scanned PDFs & Charts",
      highlight: true,
    },
    {
      feature: "Multi-Tenant Security",
      retriever: "Isolated Tenant Schema + AES-256 Key Encryption",
      others: "Shared Unencrypted Context",
      highlight: false,
    },
  ];

  return (
    <section className={styles.comparisonSection} id="comparison">
      <div className={styles.comparisonHeader}>
        <span className={styles.comparisonBadge}>⚖️ Why Retriever AI Outperforms</span>
        <h2 className={styles.comparisonTitle}>Engineered Beyond Basic ChatGPT Wrappers</h2>
        <p className={styles.comparisonSubtitle}>
          Built for businesses that cannot afford hallucinations or slow customer service response times.
        </p>
      </div>

      <div className={styles.comparisonTableWrapper}>
        <table className={styles.comparisonTable}>
          <thead>
            <tr>
              <th>Feature / Capability</th>
              <th className={styles.colRetriever}>🚀 Retriever AI</th>
              <th className={styles.colOthers}>Legacy Chatbot Wrappers</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, i) => (
              <tr key={i} className={row.highlight ? styles.rowHighlight : ""}>
                <td className={styles.featureCell}>{row.feature}</td>
                <td className={styles.retrieverCell}>
                  <span className={styles.checkIcon}>✓</span> {row.retriever}
                </td>
                <td className={styles.othersCell}>
                  <span className={styles.crossIcon}>✕</span> {row.others}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
