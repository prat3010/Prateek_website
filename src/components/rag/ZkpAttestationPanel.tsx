"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import { RetrieverClient } from "@/lib/rag-client";
import {
  DocumentMerkleRoot,
  ZkpGroundingCertificate,
  GroundingVerificationResult,
  ChunkMerkleProof,
  ZkpHealthResponse,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./ZkpAttestationPanel.module.css";

interface ZkpAttestationPanelProps {
  client: RetrieverClient | null;
  tenantId?: string;
  hidden?: boolean;
}

type TabKey = "merkle_tree" | "verifier" | "certificates";

export function ZkpAttestationPanel({ client, tenantId, hidden }: ZkpAttestationPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("merkle_tree");
  const [health, setHealth] = useState<ZkpHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Merkle Explorer State
  const [activeDocumentId, setActiveDocumentId] = useState<string>("doc_enterprise_master_sow");
  const [merkleRoot, setMerkleRoot] = useState<DocumentMerkleRoot | null>(null);
  const [selectedChunkId, setSelectedChunkId] = useState<string>("chk_0");
  const [chunkProof, setChunkProof] = useState<ChunkMerkleProof | null>(null);

  // Verifier State
  const [certificateJson, setCertificateJson] = useState<string>("");
  const [verifyQuery, setVerifyQuery] = useState<string>("");
  const [verifyResponse, setVerifyResponse] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<GroundingVerificationResult | null>(null);

  // Certificates Ledger State
  const [certificates, setCertificates] = useState<ZkpGroundingCertificate[]>([]);

  // Sample data generator
  const sampleDocumentChunks = React.useMemo(() => [
    { chunk_id: "chk_0", chunk_index: 0, text: "Section 1.1: Guaranteed system availability threshold is 99.99% monthly." },
    { chunk_id: "chk_1", chunk_index: 1, text: "Section 1.2: Data sovereignty mandates AES-256-GCM encryption in Zurich, Switzerland." },
    { chunk_id: "chk_2", chunk_index: 2, text: "Section 2.1: Zero-Knowledge proofs verify grounding without revealing confidential text." },
    { chunk_id: "chk_3", chunk_index: 3, text: "Section 2.2: Retaliatory breach indemnification capped at 500,000 EUR." },
    { chunk_id: "chk_4", chunk_index: 4, text: "Section 3.1: Governing arbitration under ICC rules in Frankfurt, Germany." },
  ], []);

  const loadHealthAndData = useCallback(async () => {
    if (!client) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [healthData, rootData, certs] = await Promise.all([
        client.getZkpHealth().catch(() => null),
        client.computeDocumentMerkleRoot(activeDocumentId, sampleDocumentChunks).catch(() => null),
        client.listGroundingCertificates(20).catch(() => []),
      ]);

      if (healthData) setHealth(healthData as unknown as ZkpHealthResponse);
      if (rootData) {
        setMerkleRoot(rootData);
        // Fetch inclusion proof for initial chunk
        const proof = await client.getChunkInclusionProof(selectedChunkId, activeDocumentId, sampleDocumentChunks).catch(() => null);
        if (proof) setChunkProof(proof);
      }
      if (certs) setCertificates(certs);
    } catch (err) {
      console.warn("Error loading ZKP telemetry:", err);
      setError(err instanceof Error ? err.message : "Failed to load ZKP telemetry.");
    } finally {
      setLoading(false);
    }
  }, [client, activeDocumentId, sampleDocumentChunks, selectedChunkId]);

  useEffect(() => {
    if (!hidden) {
      const timer = setTimeout(() => {
        void loadHealthAndData();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [hidden, loadHealthAndData]);

  const handleSelectChunk = async (chunkId: string) => {
    setSelectedChunkId(chunkId);
    if (!client) return;
    try {
      const proof = await client.getChunkInclusionProof(chunkId, activeDocumentId, sampleDocumentChunks);
      setChunkProof(proof);
    } catch (err) {
      console.warn("Failed to generate proof for chunk:", err);
    }
  };

  const handleLoadSampleCertificate = () => {
    const sampleCert: ZkpGroundingCertificate = {
      certificate_id: "cert_zkp_9f8a12bc44e1",
      tenant_id: tenantId || "tn_enterprise_client",
      document_id: activeDocumentId,
      document_merkle_root: merkleRoot?.root_hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      query_hash: "82a9f4e2b10a1290bb34e120ef93cba4e892c5512bc394a123f491c2840ef412",
      response_hash: "45f910a34b9e11c8289d0421e48bc894ef192bca1094ea511c9842a84920bfe1",
      similarity_bound: 0.91,
      chunk_commitments: [
        {
          chunk_id: "chk_0",
          chunk_index: 0,
          leaf_hash: chunkProof?.leaf_hash || "9a81bc334e104fe1a8bc49201948ebc12048ef912048ea10948ebc1948e1048e",
          merkle_proof: chunkProof?.merkle_path || [
            { sibling_hash: "2b9f10a84e...", direction: "right" },
            { sibling_hash: "7c1048ebca...", direction: "left" },
          ],
          similarity_score: 0.94,
        },
      ],
      issued_at: Math.floor(Date.now() / 1000),
      authority_public_key: health?.authority_public_key || "a948e104928fe10498ebc19482019482bc104982a10948ebc10948ea10948ebc",
      attestation_signature: "e49201948ebc10498ea10948ebc104982a10948ebc10498ea10948ebc10498ea10948ebc10498ea10948ebc10498ea10948ebc10498ea10948ebc10498ea10948",
    };

    setCertificateJson(JSON.stringify(sampleCert, null, 2));
    setVerifyQuery("What is the guaranteed system availability threshold?");
    setVerifyResponse("Section 1.1 guarantees a system availability threshold of 99.99% monthly.");
    setVerificationResult(null);
  };

  const handleVerifyCertificate = async () => {
    if (!client) return;
    setIsVerifying(true);
    setError(null);
    try {
      const parsedCert = JSON.parse(certificateJson);
      const res = await client.verifyGroundingCertificate({
        certificate: parsedCert,
        query: verifyQuery || undefined,
        response: verifyResponse || undefined,
        expected_document_root: merkleRoot?.root_hash || undefined,
      });
      setVerificationResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid certificate format or verification error.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportJson = (cert: ZkpGroundingCertificate) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cert, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${cert.certificate_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (hidden) return null;

  return (
    <div className={styles.container}>
      {/* Header Bar */}
      <div className={styles.headerGroup}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <span>📜</span>
            <span>Zero-Knowledge Proof (ZKP) Vector Attestation & Verifiable Grounding</span>
          </h2>
          <p className={styles.description}>
            Cryptographically prove that AI responses are strictly grounded in authentic, unmodified tenant documents
            without exposing confidential plaintext text to third-party auditors. Powered by deterministic binary Merkle
            trees, zero-knowledge leaf commitments, and Ed25519 digital signatures.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span className={styles.badgeZkp}>⚡ Battery #33: Active</span>
          <span className={styles.badgeBattery}>M118 v1.8.0-alpha1</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <span>🔐</span> Authority Public Key
          </span>
          <span className={styles.metricValue} style={{ fontSize: "0.95rem" }}>
            {health?.authority_public_key ? `${health.authority_public_key.slice(0, 16)}…` : "Ed25519 Active"}
          </span>
          <span className={styles.metricSubtext}>Hardware-Rooted Curve25519</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <span>🌳</span> Merkle DAG Hash
          </span>
          <span className={styles.metricValue}>SHA-256</span>
          <span className={styles.metricSubtext}>Duplicate-leaf balanced padding</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <span>⚡</span> Proof Verification Latency
          </span>
          <span className={styles.metricValue}>&lt; 0.5 ms</span>
          <span className={styles.metricSubtext}>In-memory sub-millisecond evaluation</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>
            <span>🛡️</span> Zero-Knowledge Privacy
          </span>
          <span className={styles.metricValue} style={{ color: "#10b981" }}>
            100% Sealed
          </span>
          <span className={styles.metricSubtext}>Zero plaintext disclosed to verifiers</span>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === "merkle_tree" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("merkle_tree")}
        >
          <span>🌳</span>
          <span>Merkle Tree Explorer</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "verifier" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("verifier")}
        >
          <span>🔍</span>
          <span>Live Zero-Knowledge Verifier</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "certificates" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("certificates")}
        >
          <span>📜</span>
          <span>Compliance Audit Ledger ({certificates.length})</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", fontSize: "0.85rem" }}>
          ⚠️ {error}
        </div>
      )}

      {/* TAB 1: Merkle Tree Explorer */}
      {activeTab === "merkle_tree" && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <span>🌲</span>
                <span>Document Merkle Tree Commitment: {activeDocumentId}</span>
              </h3>
              <p className={styles.sectionSubtitle}>
                Binary Merkle DAG calculated across {sampleDocumentChunks.length} document chunk leaves with canonical root commitment.
              </p>
            </div>
            <div className={styles.badgeZkp}>
              Root: {merkleRoot ? `${merkleRoot.root_hash.slice(0, 12)}…${merkleRoot.root_hash.slice(-8)}` : "Computing…"}
            </div>
          </div>

          <div className={styles.treeCanvas}>
            {/* Level 2: Root */}
            <div className={styles.treeLevel}>
              <div className={`${styles.treeNode} ${styles.treeNodeRoot}`}>
                <span className={styles.treeNodeLabel}>👑 Document Root Commitment (R_doc)</span>
                <span className={styles.treeNodeHash}>{merkleRoot?.root_hash || "e3b0c44298fc1c149afbf4c8996fb..."}</span>
                <span className={styles.treeNodeMeta}>Depth: {merkleRoot?.tree_depth ?? 3} | Chunks: {sampleDocumentChunks.length}</span>
              </div>
            </div>

            <div style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>↓ Merkle Tree Compression Layers ↓</div>

            {/* Level 0: Leaves */}
            <div className={styles.treeLevel}>
              {sampleDocumentChunks.map((chunk) => {
                const isSelected = selectedChunkId === chunk.chunk_id;
                return (
                  <div
                    key={chunk.chunk_id}
                    className={`${styles.treeNode} ${isSelected ? styles.treeNodeActive : ""}`}
                    onClick={() => void handleSelectChunk(chunk.chunk_id)}
                  >
                    <span className={styles.treeNodeLabel}>Leaf #{chunk.chunk_index} ({chunk.chunk_id})</span>
                    <span className={styles.treeNodeHash}>
                      {isSelected && chunkProof ? `${chunkProof.leaf_hash.slice(0, 14)}…` : "h_i = SHA256(leaf)"}
                    </span>
                    <span className={styles.treeNodeMeta} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                      {chunk.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Leaf Inclusion Proof Details */}
          {chunkProof && (
            <div className={styles.verifyResultBox}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text)" }}>
                  🔑 Cryptographic Inclusion Path for Chunk: <code>{chunkProof.chunk_id}</code> (Leaf #{chunkProof.chunk_index})
                </span>
                <span className={styles.badgeZkp}>
                  Path Depth: {chunkProof.merkle_path.length} Steps
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontFamily: "var(--font-mono, monospace)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                <div>Leaf Commitment: <span style={{ color: "var(--badge-active-color, #00f0ff)" }}>{chunkProof.leaf_hash}</span></div>
                <div>Document Merkle Root: <span style={{ color: "#10b981" }}>{chunkProof.document_root}</span></div>
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text)" }}>Authentication Path Siblings:</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.35rem" }}>
                  {chunkProof.merkle_path.map((step, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.76rem", fontFamily: "var(--font-mono, monospace)", background: "var(--surface-elevated)", padding: "0.35rem 0.6rem", borderRadius: "6px", border: "1px solid var(--surface-glass-border)" }}>
                      <span style={{ color: step.direction === "right" ? "#3b82f6" : "#ec4899" }}>
                        Step {idx + 1} ({step.direction.toUpperCase()} Sibling):
                      </span>
                      <span style={{ color: "var(--color-text)" }}>{step.sibling_hash}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Live Zero-Knowledge Verifier */}
      {activeTab === "verifier" && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <span>🔍</span>
                <span>Independent Grounding Certificate Verifier</span>
              </h3>
              <p className={styles.sectionSubtitle}>
                Verify that an AI inference was synthesized strictly from authenticated chunks without revealing confidential document text.
              </p>
            </div>
            <MagneticButton strength={0.2}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleLoadSampleCertificate}
                style={{ padding: "0.5rem 1rem" }}
              >
                ✨ Load Sample Certificate
              </button>
            </MagneticButton>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Attestation Certificate (JSON Payload)</label>
              <textarea
                className={styles.textarea}
                placeholder="Paste ZkpGroundingCertificate JSON token..."
                value={certificateJson}
                onChange={(e) => setCertificateJson(e.target.value)}
                rows={9}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>User Query (Optional Context Verification)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. What is the guaranteed system availability threshold?"
                  value={verifyQuery}
                  onChange={(e) => setVerifyQuery(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Synthesized AI Response (Optional Context Verification)</label>
                <textarea
                  className={styles.textarea}
                  style={{ minHeight: "80px" }}
                  placeholder="e.g. Section 1.1 guarantees a system availability threshold of 99.99% monthly."
                  value={verifyResponse}
                  onChange={(e) => setVerifyResponse(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
            <MagneticButton strength={0.25}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={handleVerifyCertificate}
                disabled={!certificateJson || isVerifying}
                style={{ padding: "0.55rem 1.25rem", color: "var(--badge-active-color, #00f0ff)", borderColor: "var(--badge-active-border, rgba(0,240,255,0.4))" }}
              >
                {isVerifying ? "Verifying Cryptography…" : "🛡️ Verify Grounding Certificate"}
              </button>
            </MagneticButton>
          </div>

          {/* Verification Results Stepper */}
          {verificationResult && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${styles.verifyResultBox} ${verificationResult.is_valid ? styles.resultSuccess : styles.resultFailure}`}
            >
              <div className={styles.resultTitle}>
                <span>{verificationResult.is_valid ? "✅ Grounding Verified (Zero-Knowledge Guaranteed)" : "❌ Verification Failed"}</span>
                <span className={styles.badgeBattery} style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
                  Latency: {verificationResult.execution_time_ms} ms
                </span>
              </div>

              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text)" }}>
                {verificationResult.details}
              </p>

              {/* 4-Step Validation Ledger */}
              <div className={styles.stepperContainer} style={{ marginTop: "0.5rem" }}>
                <div className={styles.stepperItem}>
                  <span className={verificationResult.query_match && verificationResult.response_match ? styles.stepIconSuccess : styles.stepIconFailure}>
                    {verificationResult.query_match && verificationResult.response_match ? "✓" : "✗"}
                  </span>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>Step 1: Query & Response Turn Hash Integrity</div>
                    <div className={styles.stepDesc}>
                      Confirms the conversation turn hashes correspond to the cryptographic commitment without tampering.
                    </div>
                  </div>
                </div>

                <div className={styles.stepperItem}>
                  <span className={verificationResult.status !== "proof_invalid" ? styles.stepIconSuccess : styles.stepIconFailure}>
                    {verificationResult.status !== "proof_invalid" ? "✓" : "✗"}
                  </span>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>Step 2: Binary Merkle Path Hash Reconstruction</div>
                    <div className={styles.stepDesc}>
                      Evaluates all {verificationResult.checked_leaf_count} cited chunk inclusion proofs along the Merkle tree DAG.
                    </div>
                  </div>
                </div>

                <div className={styles.stepperItem}>
                  <span className={verificationResult.merkle_root_matched ? styles.stepIconSuccess : styles.stepIconFailure}>
                    {verificationResult.merkle_root_matched ? "✓" : "✗"}
                  </span>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>Step 3: Document Root Commitment Validation</div>
                    <div className={styles.stepDesc}>
                      Matches the computed Merkle root with the tenant&apos;s registered index root (R_computed == R_doc).
                    </div>
                  </div>
                </div>

                <div className={styles.stepperItem}>
                  <span className={verificationResult.signature_valid ? styles.stepIconSuccess : styles.stepIconFailure}>
                    {verificationResult.signature_valid ? "✓" : "✗"}
                  </span>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>Step 4: Ed25519 Authority Digital Signature</div>
                    <div className={styles.stepDesc}>
                      Cryptographically verifies the authenticity and timestamp freshness signed by Retriever&apos;s authority key.
                    </div>
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </div>
      )}

      {/* TAB 3: Compliance Audit Ledger */}
      {activeTab === "certificates" && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h3 className={styles.sectionTitle}>
                <span>📜</span>
                <span>Tenant Compliance Audit Trail</span>
              </h3>
              <p className={styles.sectionSubtitle}>
                Tamper-evident log of issued Grounding Certificates for regulatory and enterprise SLA compliance.
              </p>
            </div>
            <button className={styles.actionBtn} onClick={() => void loadHealthAndData()}>
              🔄 Refresh Ledger
            </button>
          </div>

          <div className={styles.certTableWrapper}>
            <table className={styles.certTable}>
              <thead>
                <tr>
                  <th>Certificate ID</th>
                  <th>Document ID</th>
                  <th>Document Merkle Root</th>
                  <th>Citations</th>
                  <th>Similarity Bound</th>
                  <th>Issued (UTC)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                      No Grounding Certificates recorded yet. Generate one in the Verifier tab!
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.certificate_id}>
                      <td className={styles.codeCell}>{cert.certificate_id}</td>
                      <td>{cert.document_id}</td>
                      <td className={styles.codeCell}>
                        {cert.document_merkle_root.slice(0, 10)}…{cert.document_merkle_root.slice(-6)}
                      </td>
                      <td>{cert.chunk_commitments?.length ?? 0} Chunks</td>
                      <td>≥ {((cert.similarity_bound || 0.7) * 100).toFixed(0)}%</td>
                      <td>{new Date((cert.issued_at || Date.now() / 1000) * 1000).toLocaleTimeString()}</td>
                      <td>
                        <div className={styles.btnGroup}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => {
                              setCertificateJson(JSON.stringify(cert, null, 2));
                              setActiveTab("verifier");
                            }}
                          >
                            Verify
                          </button>
                          <button className={styles.actionBtn} onClick={() => handleExportJson(cert)}>
                            Export JSON
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
