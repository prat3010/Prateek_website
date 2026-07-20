"use client";

import { useState, useCallback } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import type { DocumentMeta } from "@/lib/rag-types";
import styles from "./rag.module.css";

export function DocumentsPanel({ client, hidden }: { client: RetrieverClient | null; hidden: boolean }) {
  const [docs, setDocs] = useState<DocumentMeta[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [error, setError] = useState("");

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
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Documents</h2>
      <p className={styles.panelDesc}>Manage indexed documents.</p>

      <div className={styles.chatInput}>
        <button className="comic-btn comic-btn-blue" onClick={fetchDocs} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <label className="comic-btn comic-btn-outline" style={{ cursor: uploading ? "wait" : "pointer" }}>
          {uploading ? `Uploading ${uploadName}…` : "Upload PDF"}
          <input type="file" accept=".pdf,.txt,.md,.docx" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
        </label>
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

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
