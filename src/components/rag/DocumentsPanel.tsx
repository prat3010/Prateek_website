"use client";

import { useState, useEffect, useCallback } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import type { DocumentMeta, GraphQueryResponse, GraphSummaryResponse, EntityTripleItem } from "@/lib/rag-types";
import styles from "./rag.module.css";

type DocSubTab = "library" | "graph" | "schema" | "connectors";

export function DocumentsPanel({ client, hidden, isExpired }: { client: RetrieverClient | null; hidden: boolean; isExpired?: boolean }) {
  const [subTab, setSubTab] = useState<DocSubTab>("library");
  const [docs, setDocs] = useState<DocumentMeta[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [error, setError] = useState("");

  // Doc-to-JSON state
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [extracting, setExtracting] = useState<boolean>(false);
  const [jsonSchema, setJsonSchema] = useState<string>(`{\n  "invoice_number": "string",\n  "total_amount": "number",\n  "vendor_name": "string"\n}`);
  const [extractedJson, setExtractedJson] = useState<string>("");

  // Real Knowledge Graph state
  const [graphEntity, setGraphEntity] = useState<string>("");
  const [graphHops, setGraphHops] = useState<number>(2);
  const [graphLoading, setGraphLoading] = useState<boolean>(false);
  const [graphResult, setGraphResult] = useState<GraphQueryResponse | null>(null);
  const [graphSummary, setGraphSummary] = useState<GraphSummaryResponse | null>(null);
  const [deletingTripleId, setDeletingTripleId] = useState<string | null>(null);



  const fetchDocs = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    setError("");
    try {
      const res = await client.listDocuments();
      setDocs(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {

    if (subTab === "graph" && client) {
      client.getGraphSummary().then(setGraphSummary).catch(() => {});
    }
  }, [subTab, client]);

  if (hidden) return null;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !client) return;
    setUploading(true);
    setUploadName(file.name);
    setError("");
    try {
      await client.uploadDocument(file);

      let pollCount = 0;
      const poll = setInterval(async () => {
        pollCount++;
        try {
          const updated = await client.listDocuments();
          setDocs(updated);
          const uploaded = updated.find((d) => d.filename === file.name);
          if (uploaded && (uploaded.status === "INDEXED" || uploaded.status === "FAILED" || pollCount >= 30)) {
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadName("");
    }
  }

  async function handleDelete(doc: DocumentMeta) {
    if (!client) return;
    if (!confirm(`Delete "${doc.filename}"?`)) return;
    try {
      await client.deleteDocument(doc.documentId);
      setDocs((prev) => prev ? prev.filter((d) => d.documentId !== doc.documentId) : null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("403") || msg.includes("scope") || msg.includes("Forbidden")) {
        setError("Guest mode is read-only. File deletion is restricted to tenant administrators.");
      } else {
        setError(msg || "Delete failed");
      }
    }
  }

  const handleTraverseGraph = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!graphEntity.trim() || !client || graphLoading) return;
    setGraphLoading(true);
    setError("");
    try {
      const res = await client.queryGraph(graphEntity.trim(), graphHops);
      setGraphResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Knowledge graph query failed");
    } finally {
      setGraphLoading(false);
    }
  };

  const handleDeleteTriple = async (tripleId: string) => {
    if (!client || deletingTripleId) return;
    setDeletingTripleId(tripleId);
    setError("");
    try {
      await client.deleteTriple(tripleId);
      if (graphResult) {
        setGraphResult({
          ...graphResult,
          triples: graphResult.triples.filter((t: EntityTripleItem) => t.triple_id !== tripleId),
        });
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete triple");
    } finally {
      setDeletingTripleId(null);
    }
  };

  const handleRunSchemaExtraction = async () => {
    if (!client) return;
    if (!selectedDocId) {
      setError("Please select an uploaded document to extract structured data from.");
      return;
    }
    setExtracting(true);
    setError("");
    setExtractedJson("");
    try {
      const res = await client.extractDocument(selectedDocId, jsonSchema);
      setExtractedJson(JSON.stringify(res.data, null, 2));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Schema extraction failed");
    } finally {
      setExtracting(false);
    }
  };


  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <h2 className={styles.panelTitle}>📄 Knowledge Base, GraphRAG & Connectors</h2>
        <p className={styles.panelDesc}>Ingest files, visualize GraphRAG triples, extract structured JSON schemas, and sync cloud data sources.</p>
      </div>

      {/* Sub-Nav Tabs */}
      <div className={styles.subTabNav}>
        <button
          onClick={() => setSubTab("library")}
          className={`${styles.subTabBtn} ${subTab === "library" ? styles.subTabBtnActive : ""}`}
        >
          📁 File Library
        </button>
        <button
          onClick={() => setSubTab("graph")}
          className={`${styles.subTabBtn} ${subTab === "graph" ? styles.subTabBtnActive : ""}`}
        >
          🕸️ GraphRAG Triples
        </button>
        <button
          onClick={() => setSubTab("schema")}
          className={`${styles.subTabBtn} ${subTab === "schema" ? styles.subTabBtnActive : ""}`}
        >
          📋 Doc-to-JSON Extractor
        </button>
        <button
          onClick={() => setSubTab("connectors")}
          className={`${styles.subTabBtn} ${subTab === "connectors" ? styles.subTabBtnActive : ""}`}
        >
          🔌 Cloud Connectors
        </button>
      </div>

      {/* Sub-Tab 1: File Library */}
      {subTab === "library" && (
        <div>
          <div className={styles.chatInput}>
            <button className="comic-btn comic-btn-blue" onClick={fetchDocs} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
            {isExpired ? (
              <button className="comic-btn comic-btn-outline" style={{ opacity: 0.5, cursor: "not-allowed" }} disabled title="Trial Expired — Please upgrade to upload new documents">
                🔒 Upload Disabled (Trial Expired)
              </button>
            ) : (
              <label className="comic-btn comic-btn-outline" style={{ cursor: uploading ? "wait" : "pointer" }}>
                {uploading ? `Uploading ${uploadName}…` : "Upload Document"}
                <input
                  type="file"
                  aria-label="Upload document to knowledge base"
                  accept=".pdf,.txt,.md,.docx,.csv"
                  style={{ display: "none" }}
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {uploading && <div className={styles.progressBar} />}

          {docs === null && !loading && (
            <p className={styles.empty}>Connect and refresh to see your documents.</p>
          )}

          {docs && docs.length === 0 && (
            <p className={styles.empty}>No documents yet. Upload a PDF, TXT, Markdown, or DOCX file to get started.</p>
          )}

          {docs && docs.length > 0 && (
            <ul className={styles.fileList}>
              {docs.map((doc) => (
                <li key={doc.documentId} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{doc.filename}</span>
                    {(doc.filename.toLowerCase().endsWith(".pdf") || doc.filename.includes("web_")) && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#38bdf8",
                          background: "rgba(56, 189, 248, 0.12)",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          borderRadius: "10px",
                          padding: "0.05rem 0.45rem",
                          marginLeft: "0.5rem",
                        }}
                        title="Vision OCR model page descriptors active for diagram & scanned page indexing"
                      >
                        👁️ Multi-Modal OCR
                      </span>
                    )}
                  </div>
                  <div className={styles.fileActions}>
                    <span className={styles.fileStatus}>{doc.status}</span>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(doc)}
                      aria-label={`Delete document ${doc.filename}`}
                      title="Delete document"
                    >
                      {"✕"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sub-Tab 2: GraphRAG Entity Triples Visualizer */}
      {subTab === "graph" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {graphSummary && (
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.8rem", background: "var(--surface-elevated, #16161a)", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--color-border, #333)" }}>
              <span>🗄️ Engine: <strong>{graphSummary.storage_engine.toUpperCase()}</strong></span>
              <span>🔗 Total Triples: <strong>{graphSummary.total_triples}</strong></span>
              <span>🏷️ Unique Entities: <strong>{graphSummary.unique_entities}</strong></span>
              {graphSummary.neo4j_status && <span>⚡ Neo4j: <strong>{graphSummary.neo4j_status}</strong></span>}
            </div>
          )}

          <form onSubmit={handleTraverseGraph} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              className={styles.input}
              type="text"
              aria-label="Root Entity to traverse"
              placeholder="Enter entity name (e.g. Authentication, PostgreSQL, Security)..."
              value={graphEntity}
              onChange={(e) => setGraphEntity(e.target.value)}
              style={{ flex: "1 1 240px", marginBottom: 0 }}
            />
            <select
              className={styles.input}
              value={graphHops}
              onChange={(e) => setGraphHops(Number(e.target.value))}
              aria-label="Max Hops Depth"
              style={{ width: "120px", marginBottom: 0 }}
            >
              <option value={1}>1 Hop Depth</option>
              <option value={2}>2 Hops Depth</option>
              <option value={3}>3 Hops Depth</option>
            </select>
            <button
              type="submit"
              className="comic-btn comic-btn-blue"
              disabled={!graphEntity.trim() || graphLoading || !client}
            >
              {graphLoading ? "Traversing..." : "🔍 Traverse Entity Graph"}
            </button>
          </form>

          {graphResult ? (
            <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.02))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Entity Subgraph for &quot;{graphResult.root_entity}&quot; ({graphResult.triples.length} triples, {graphResult.connected_entities.length} connected entities)
                </span>
              </div>

              {graphResult.connected_entities.length > 0 && (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                  {graphResult.connected_entities.map((ent: string) => (
                    <button
                      key={ent}
                      type="button"
                      onClick={() => {
                        setGraphEntity(ent);
                        client?.queryGraph(ent, graphHops).then(setGraphResult).catch(() => {});
                      }}
                      style={{
                        background: "var(--surface-elevated, #222)",
                        border: "1px solid var(--color-border, #444)",
                        borderRadius: "12px",
                        padding: "0.2rem 0.6rem",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        color: "var(--color-text, #fff)",
                      }}
                      title="Click to pivot graph traversal to this entity"
                    >
                      {ent}
                    </button>
                  ))}
                </div>
              )}

              {graphResult.triples.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #888)", margin: 0 }}>
                  No relationships or triples found for &quot;{graphResult.root_entity}&quot;. Try ingesting more documents or querying another entity.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {graphResult.triples.map((t: EntityTripleItem) => (
                    <div
                      key={t.triple_id}

                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.45rem 0.75rem",
                        background: "var(--surface-elevated, #1a1a20)",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ color: "#5A8EB6", fontWeight: 600 }}>{t.subject}</span>
                        <span style={{ color: "#00E676", fontSize: "0.75rem" }}>── {t.predicate} ──&gt;</span>
                        <span style={{ color: "#FFB300", fontWeight: 600 }}>{t.object}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => t.triple_id && handleDeleteTriple(t.triple_id)}
                        disabled={!t.triple_id || deletingTripleId === t.triple_id}

                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#ff5252",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                          padding: "0.2rem 0.4rem",
                        }}
                        title="Delete this triple from knowledge graph"
                      >
                        {deletingTripleId === t.triple_id ? "..." : "✕"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem", background: "var(--surface-card, rgba(255,255,255,0.01))", borderRadius: "8px", border: "1px dashed var(--color-border, #333)" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #888)", margin: 0 }}>
                Enter an entity keyword above to query recursive multi-hop relational paths stored in PostgreSQL pgvector / Neo4j.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Doc-to-JSON Schema Extractor */}
      {subTab === "schema" && (
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #888)", marginBottom: "0.75rem" }}>
            Select an ingested document from your library and specify a target JSON schema. The LLM will parse unstructured text chunks directly into validated JSON.
          </p>

          <div style={{ marginBottom: "1rem" }}>
            <label className={styles.label}>Select Ingested Document</label>
            <select
              className={styles.input}
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              aria-label="Select Document for JSON Schema Extraction"
            >
              <option value="">-- Choose a document ({docs?.length ?? 0} available) --</option>
              {docs?.map((d) => (
                <option key={d.documentId} value={d.documentId}>
                  {d.filename} ({d.chunksCount ?? 0} chunks)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div>
              <label className={styles.label}>Target JSON Schema</label>
              <textarea
                className={styles.input}
                aria-label="Target JSON Schema"
                style={{ height: "160px", fontFamily: "monospace", fontSize: "0.8rem" }}
                value={jsonSchema}
                onChange={(e) => setJsonSchema(e.target.value)}
              />
              <button
                onClick={handleRunSchemaExtraction}
                disabled={extracting || !selectedDocId || !client}
                className="comic-btn comic-btn-blue"
              >
                {extracting ? "⚡ Extracting via LLM..." : "⚡ Extract Structured JSON"}
              </button>
            </div>

            <div>
              <label className={styles.label}>Validated LLM Output</label>
              <textarea
                className={styles.input}
                aria-label="Validated JSON Output"
                style={{ height: "160px", fontFamily: "monospace", fontSize: "0.8rem", color: "#00E676" }}
                value={extractedJson || "// Output will appear here once extracted..."}
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Cloud Connectors & Web Crawler */}
      {subTab === "connectors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.02))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem" }}>
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>🌐 Managed Ingestion Connectors</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #888)", margin: "0 0 1rem", lineHeight: 1.5 }}>
              Enterprise data sources sync automatically via scheduled background workers on your dedicated Retriever container instance.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem", background: "var(--surface-elevated, #16161a)" }}>
                <h4 style={{ margin: "0 0 0.25rem" }}>🌐 Web Crawler Pipeline</h4>
                <p style={{ fontSize: "0.75rem", opacity: 0.75, margin: "0 0 0.75rem" }}>
                  Trafilatura + Playwright crawler indexing external documentation into pgvector with cron-based delta updates.
                </p>
                <span style={{ fontSize: "0.7rem", color: "#00E676", fontWeight: 600 }}>Active in Enterprise Cluster</span>
              </div>

              <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem", background: "var(--surface-elevated, #16161a)" }}>
                <h4 style={{ margin: "0 0 0.25rem" }}>📁 Google Drive Integration</h4>
                <p style={{ fontSize: "0.75rem", opacity: 0.75, margin: "0 0 0.75rem" }}>
                  Bidirectional webhook listener for shared drive folders, indexing PDFs, Sheets, and Docx files automatically.
                </p>
                <span style={{ fontSize: "0.7rem", color: "#5A8EB6", fontWeight: 600 }}>Provisioned via Admin Dashboard</span>
              </div>

              <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem", background: "var(--surface-elevated, #16161a)" }}>
                <h4 style={{ margin: "0 0 0.25rem" }}>📝 Notion Knowledge Workspace</h4>
                <p style={{ fontSize: "0.75rem", opacity: 0.75, margin: "0 0 0.75rem" }}>
                  Syncs company wikis and internal databases directly into multi-tenant collections with permission preservation.
                </p>
                <span style={{ fontSize: "0.7rem", color: "#5A8EB6", fontWeight: 600 }}>Provisioned via Admin Dashboard</span>
              </div>
            </div>

            <div style={{ marginTop: "1.25rem", padding: "0.75rem 1rem", background: "var(--surface-card, rgba(0,0,0,0.2))", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #888)" }}>
                Need a dedicated connector or private cloud storage sync?
              </span>
              <a
                href="/scoping?engine=saas&goal=ai_rag_app"
                className="comic-btn comic-btn-blue"
                style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", textDecoration: "none" }}
              >
                🛠️ Scope Enterprise Connector
              </a>
            </div>
          </div>
        </div>
      )}


      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
