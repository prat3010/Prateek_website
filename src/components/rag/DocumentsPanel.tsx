"use client";

import { useState, useCallback } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import type { DocumentMeta } from "@/lib/rag-types";
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
  const [jsonSchema, setJsonSchema] = useState<string>(`{\n  "invoice_number": "string",\n  "total_amount": "number",\n  "vendor_name": "string"\n}`);
  const [extractedJson, setExtractedJson] = useState<string>("");

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

  const handleRunSchemaExtraction = () => {
    setExtractedJson(JSON.stringify({
      invoice_number: "INV-2026-0891",
      total_amount: 1450.00,
      vendor_name: "Acme Cloud Services Inc.",
      line_items: [
        { item: "Vector DB Storage Hosting", amount: 950.00 },
        { item: "Cohere Rerank API Calls", amount: 500.00 }
      ],
      extraction_confidence: "98.4%"
    }, null, 2));
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
                <input type="file" accept=".pdf,.txt,.md,.docx,.csv" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
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
                  </div>
                  <div className={styles.fileActions}>
                    <span className={styles.fileStatus}>{doc.status}</span>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(doc)} title="Delete document">{"✕"}</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sub-Tab 2: GraphRAG Entity Triples Visualizer */}
      {subTab === "graph" && (
        <div>
          <div className={styles.graphCanvas}>
            <svg width="100%" height="240" viewBox="0 0 600 240" style={{ maxWidth: "600px" }}>
              {/* Graph Connections */}
              <line x1="120" y1="120" x2="300" y2="60" stroke="#5A8EB6" strokeWidth="2" strokeDasharray="4 2" />
              <line x1="300" y1="60" x2="480" y2="120" stroke="#00E676" strokeWidth="2" />
              <line x1="120" y1="120" x2="300" y2="180" stroke="#8b5cf6" strokeWidth="2" />
              <line x1="300" y1="180" x2="480" y2="120" stroke="#FFB300" strokeWidth="2" />

              {/* Node 1: Subject */}
              <g transform="translate(120, 120)">
                <circle r="32" fill="#1e293b" stroke="#5A8EB6" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#fff" fontSize="11" fontWeight="600">Company PDF</text>
              </g>

              {/* Node 2: Entity */}
              <g transform="translate(300, 60)">
                <circle r="28" fill="#1e293b" stroke="#00E676" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#fff" fontSize="10">ISO Security</text>
              </g>

              {/* Node 3: Entity */}
              <g transform="translate(300, 180)">
                <circle r="28" fill="#1e293b" stroke="#8b5cf6" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#fff" fontSize="10">HIPAA Data</text>
              </g>

              {/* Node 4: Target */}
              <g transform="translate(480, 120)">
                <circle r="32" fill="#1e293b" stroke="#FFB300" strokeWidth="2" />
                <text textAnchor="middle" dy="4" fill="#fff" fontSize="11" fontWeight="600">Compliance</text>
              </g>

              {/* Predicate Labels */}
              <text x="210" y="80" fill="#5A8EB6" fontSize="10" textAnchor="middle">requires ➔</text>
              <text x="390" y="80" fill="#00E676" fontSize="10" textAnchor="middle">validates ➔</text>
              <text x="210" y="160" fill="#8b5cf6" fontSize="10" textAnchor="middle">enforces ➔</text>
            </svg>
          </div>

          <div style={{ marginTop: "1rem", background: "var(--color-bg, #111)", padding: "0.85rem", borderRadius: "6px", fontSize: "0.85rem" }}>
            <strong>Extracted Knowledge Triples:</strong>
            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", opacity: 0.85 }}>
              <li><code>Company PDF ➔ requires ➔ ISO Security Standard</code></li>
              <li><code>ISO Security Standard ➔ validates ➔ Enterprise Compliance</code></li>
              <li><code>Company PDF ➔ enforces ➔ HIPAA Data Privacy</code></li>
            </ul>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Doc-to-JSON Schema Extractor */}
      {subTab === "schema" && (
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #888)", marginBottom: "0.75rem" }}>
            Specify a target JSON Schema to extract structured JSON objects from invoices, medical reports, or unstructured contracts.
          </p>
          <div className={styles.row}>
            <div>
              <label className={styles.label}>Target JSON Schema</label>
              <textarea
                className={styles.input}
                style={{ height: "140px", fontFamily: "monospace", fontSize: "0.8rem" }}
                value={jsonSchema}
                onChange={(e) => setJsonSchema(e.target.value)}
              />
              <button onClick={handleRunSchemaExtraction} className="comic-btn comic-btn-blue">
                ⚡ Extract Structured JSON
              </button>
            </div>

            <div>
              <label className={styles.label}>Validated JSON Output</label>
              <textarea
                className={styles.input}
                style={{ height: "140px", fontFamily: "monospace", fontSize: "0.8rem", color: "#00E676" }}
                value={extractedJson || "// Output will appear here..."}
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Cloud Connectors & Web Crawler */}
      {subTab === "connectors" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem" }}>
            <h4>📁 Google Drive Sync</h4>
            <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0.25rem 0 0.75rem" }}>Sync PDF & Docx folders automatically.</p>
            <button className="comic-btn comic-btn-outline" style={{ fontSize: "0.75rem" }}>Connect Google Drive</button>
          </div>

          <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem" }}>
            <h4>📝 Notion Workspace</h4>
            <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0.25rem 0 0.75rem" }}>Ingest internal Notion documentation pages.</p>
            <button className="comic-btn comic-btn-outline" style={{ fontSize: "0.75rem" }}>Connect Notion</button>
          </div>

          <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1rem" }}>
            <h4>🌐 Automated Web Crawler</h4>
            <p style={{ fontSize: "0.8rem", opacity: 0.7, margin: "0.25rem 0 0.75rem" }}>Crawl https://docs.example.com automatically.</p>
            <button className="comic-btn comic-btn-outline" style={{ fontSize: "0.75rem" }}>Configure Crawler</button>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
