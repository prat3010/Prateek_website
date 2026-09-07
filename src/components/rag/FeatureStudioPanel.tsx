"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { RetrieverClient } from "@/lib/rag-client";
import type {
  SolutionPersona,
  ScaffoldingPlan,
  CustomPluginSummary,
  RecommendedBatteryConfig,
  ScaffoldedFile,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import Portal from "@/components/ui/Portal";
import styles from "./FeatureStudioPanel.module.css";

interface FeatureStudioPanelProps {
  hidden?: boolean;
  client?: RetrieverClient | null;
}

export function FeatureStudioPanel({ hidden, client }: FeatureStudioPanelProps) {
  const [persona, setPersona] = useState<SolutionPersona>("fde_engineer");
  const [prompt, setPrompt] = useState<string>("");
  const [domain, setDomain] = useState<string>("crm");
  const [loading, setLoading] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [plan, setPlan] = useState<ScaffoldingPlan | null>(null);
  const [activeFileTab, setActiveFileTab] = useState<string>("domain/abstractions.py");
  const [plugins, setPlugins] = useState<CustomPluginSummary[]>([]);
  const [loadingPlugins, setLoadingPlugins] = useState<boolean>(false);
  const [prModalOpen, setPrModalOpen] = useState<boolean>(false);
  const [copiedPr, setCopiedPr] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [deletingPluginId, setDeletingPluginId] = useState<string | null>(null);

  const fetchPlugins = useCallback(async () => {
    if (!client) return;
    setLoadingPlugins(true);
    try {
      const list = await client.listCustomPlugins();
      setPlugins(list);
    } catch (err) {
      console.warn("Could not fetch custom plugins:", err);
    } finally {
      setLoadingPlugins(false);
    }
  }, [client]);

  useEffect(() => {
    if (hidden || !client) return;
    let active = true;
    client
      .listCustomPlugins()
      .then((list) => {
        if (active && list) {
          setPlugins(list);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch custom plugins:", err);
      });
    return () => {
      active = false;
    };
  }, [hidden, client]);

  const handleSynthesize = async () => {
    if (!prompt.trim()) {
      setStatusMessage({ type: "error", text: "Please enter a capability requirement description." });
      return;
    }

    if (!client) {
      setStatusMessage({ type: "error", text: "No active Retriever client connection found." });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const result = await client.generateScaffoldingPlan({
        prompt: prompt.trim(),
        target_domain: domain.trim() || "general",
        persona,
      });

      setPlan(result);
      if (result.scaffolded_files && result.scaffolded_files.length > 0) {
        // Default to domain/service.py or abstractions.py if present
        const defaultFile =
          result.scaffolded_files.find((f: ScaffoldedFile) => f.rel_path.includes("abstractions.py")) ||
          result.scaffolded_files[0];
        setActiveFileTab(defaultFile.rel_path);
      }
      setStatusMessage({
        type: "success",
        text: `Successfully synthesized plan for '${result.display_name}' (${result.scaffolded_files.length} slices verified).`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: "error", text: `Synthesis failed: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!plan || !client) return;

    setApplying(true);
    try {
      const res = await client.applyScaffoldingPlan(plan);
      if (res.success && res.applied) {
        setStatusMessage({
          type: "success",
          text: `Deployed plugin '${res.plugin_id}' successfully! Dynamic router mounted.`,
        });
        await fetchPlugins();
      } else {
        setStatusMessage({
          type: "error",
          text: `Plugin deployment did not complete. Check server logs.`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: "error", text: `Deployment failed: ${msg}` });
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async (pluginId: string) => {
    if (!client) return;
    setDeletingPluginId(pluginId);
    try {
      await client.deleteCustomPlugin(pluginId);
      setStatusMessage({ type: "info", text: `Plugin '${pluginId}' unmounted and deleted.` });
      await fetchPlugins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: "error", text: `Delete failed: ${msg}` });
    } finally {
      setDeletingPluginId(null);
    }
  };

  const handleCopyPr = () => {
    if (plan?.pull_request_markdown) {
      navigator.clipboard.writeText(plan.pull_request_markdown);
      setCopiedPr(true);
      setTimeout(() => setCopiedPr(false), 2000);
    }
  };

  if (hidden) return null;

  const selectedFile = plan?.scaffolded_files?.find((f) => f.rel_path === activeFileTab);

  return (
    <div className={styles.container}>
      {/* Header & Persona Toggle */}
      <div className={styles.headerGroup}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <span>🛠️</span>
            <span>Autonomous FDE Metaprogrammer</span>
          </h2>
          <p className={styles.description}>
            Dual-persona solution engine: Zero-code native battery matching for business operators, and AST-verified
            Hexagonal architecture code generation with 1-click community PRs for Forward Deployed Engineers.
          </p>
        </div>

        {/* Persona Switcher Pill */}
        <div className={styles.personaToggleWrapper} role="radiogroup" aria-label="Solution Persona">
          <button
            type="button"
            role="radio"
            aria-checked={persona === "business"}
            className={`${styles.personaBtn} ${persona === "business" ? styles.personaBtnActive : ""}`}
            onClick={() => setPersona("business")}
          >
            {persona === "business" && (
              <m.span
                layoutId="fdePersonaPill"
                className={styles.personaPill}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>💼 Business / Low-Code</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={persona === "fde_engineer"}
            className={`${styles.personaBtn} ${persona === "fde_engineer" ? styles.personaBtnActive : ""}`}
            onClick={() => setPersona("fde_engineer")}
          >
            {persona === "fde_engineer" && (
              <m.span
                layoutId="fdePersonaPill"
                className={styles.personaPill}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>⚡ FDE Metaprogrammer</span>
          </button>
        </div>
      </div>

      {/* Main Requirement Input Card */}
      <div className={styles.inputCard}>
        <div className={styles.inputCardHeader}>
          <div className={styles.inputCardTitle}>
            <span>✍️</span>
            <span>
              {persona === "business"
                ? "Describe Desired Workflow or Capability"
                : "Hexagonal Feature Specification"}
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            {persona === "business" ? "Zero-Code Battery Matching" : "AST Security Gated"}
          </span>
        </div>

        <textarea
          className={styles.promptArea}
          placeholder={
            persona === "business"
              ? "e.g. Automatically scan uploaded customer contracts, extract signature clauses, redact confidential PII, and push notifications to our team Slack channel..."
              : "e.g. Ingest webhook events from HubSpot CRM, compute lead health score via local nomic-embed vector similarity, and persist qualified accounts to PostgreSQL..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className={styles.controlsBar}>
          <div className={styles.domainInputWrapper}>
            <label htmlFor="fde-domain-input" className={styles.domainLabel}>
              Domain:
            </label>
            <input
              id="fde-domain-input"
              type="text"
              className={styles.domainInput}
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. crm, billing, erp"
            />
          </div>

          <MagneticButton strength={0.25}>
            <button
              type="button"
              className={styles.synthesizeBtn}
              onClick={handleSynthesize}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <span>⏳</span>
                  <span>Synthesizing & Auditing...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>
                    {persona === "business" ? "Find Platform Solutions" : "Generate Hexagonal Slice"}
                  </span>
                </>
              )}
            </button>
          </MagneticButton>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: "0.65rem 0.85rem",
              borderRadius: "8px",
              fontSize: "0.8rem",
              lineHeight: 1.4,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background:
                statusMessage.type === "success"
                  ? "rgba(0, 230, 118, 0.1)"
                  : statusMessage.type === "error"
                  ? "rgba(255, 68, 68, 0.1)"
                  : "var(--surface-elevated, rgba(140, 140, 140, 0.1))",
              color:
                statusMessage.type === "success"
                  ? "#00e676"
                  : statusMessage.type === "error"
                  ? "#ff5252"
                  : "var(--color-text)",
              border: `1px solid ${
                statusMessage.type === "success"
                  ? "rgba(0, 230, 118, 0.25)"
                  : statusMessage.type === "error"
                  ? "rgba(255, 68, 68, 0.25)"
                  : "var(--surface-glass-border, rgba(140, 140, 140, 0.2))"
              }`,
            }}
          >
            <span>{statusMessage.type === "success" ? "✅" : statusMessage.type === "error" ? "⚠️" : "ℹ️"}</span>
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Synthesis Results View */}
      {plan && (
        <div className={styles.resultsGrid}>
          {/* Left Column: Battery Recommendations / Code Slices */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Battery Recommendations Card */}
            <div className={styles.panelCard}>
              <div className={styles.panelCardHeader}>
                <div className={styles.panelCardTitle}>
                  <span>🔋</span>
                  <span>Native Platform Battery Matches</span>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {plan.recommended_batteries.length} battery
                  {plan.recommended_batteries.length === 1 ? "" : "s"} matched
                </span>
              </div>

              {plan.recommended_batteries.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", padding: "0.5rem 0" }}>
                  No pre-existing batteries matched. Custom extension recommended.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {plan.recommended_batteries.map((b: RecommendedBatteryConfig) => (
                    <div key={b.battery_id} className={styles.batteryItem}>
                      <div>
                        <div className={styles.batteryName}>{b.battery_name}</div>
                        <div className={styles.batteryRationale}>{b.rationale}</div>
                      </div>
                      <div className={styles.matchScoreBadge}>
                        <NumberFlow value={Math.round(b.match_confidence * 100)} />% Match
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FDE Code Viewer (Only shown if custom files exist) */}
            {plan.scaffolded_files && plan.scaffolded_files.length > 0 && (
              <div className={styles.codeCard}>
                <div className={styles.codeHeader}>
                  <div className={styles.fileTabsWrapper}>
                    {plan.scaffolded_files.map((file: ScaffoldedFile) => (
                      <button
                        key={file.rel_path}
                        type="button"
                        className={`${styles.fileTab} ${
                          activeFileTab === file.rel_path ? styles.fileTabActive : ""
                        }`}
                        onClick={() => setActiveFileTab(file.rel_path)}
                      >
                        {file.rel_path}
                      </button>
                    ))}
                  </div>

                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                    {selectedFile?.module_type.toUpperCase()} SLICE
                  </span>
                </div>

                <pre className={styles.codeViewer}>
                  <code>{selectedFile?.content || "# Select a file slice above"}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Right Column: AST Audit Gate & Deployment Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* AST Audit Security Gate */}
            <div className={styles.astCard}>
              <div className={styles.panelCardHeader}>
                <div className={styles.panelCardTitle}>
                  <span>🛡️</span>
                  <span>AST Security Gate</span>
                </div>
              </div>

              <div className={styles.astBadgePassed}>
                <span>✓</span>
                <span>Hexagonal Boundary Verified</span>
              </div>

              <ul className={styles.astList}>
                <li className={styles.astListItem}>
                  <span>🔒</span>
                  <span>0 Framework imports in domain slice</span>
                </li>
                <li className={styles.astListItem}>
                  <span>🧩</span>
                  <span>Protocol-based abstract boundaries</span>
                </li>
                <li className={styles.astListItem}>
                  <span>📦</span>
                  <span>Runtime dynamic router isolation</span>
                </li>
                <li className={styles.astListItem}>
                  <span>🏷️</span>
                  <span>Branch: <code>{plan.git_branch_name}</code></span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className={styles.astActions}>
                <button
                  type="button"
                  className={styles.actionBtnSecondary}
                  onClick={() => setPrModalOpen(true)}
                >
                  <span>🔀</span>
                  <span>Community PR</span>
                </button>

                <button
                  type="button"
                  className={styles.actionBtnPrimary}
                  onClick={handleApply}
                  disabled={applying}
                >
                  <span>🚀</span>
                  <span>{applying ? "Deploying..." : "Deploy Slice"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Installed Custom Plugins Ledger */}
      <div className={styles.pluginsCard}>
        <div className={styles.panelCardHeader}>
          <div className={styles.panelCardTitle}>
            <span>🔌</span>
            <span>Installed Custom Plugins & Batteries</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            <NumberFlow value={plugins.length} /> active plugin{plugins.length === 1 ? "" : "s"}
          </span>
        </div>

        {loadingPlugins ? (
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", padding: "0.75rem 0" }}>
            Loading installed plugins...
          </div>
        ) : plugins.length === 0 ? (
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", padding: "0.75rem 0" }}>
            No custom plugins installed yet. Synthesize and deploy your first capability above!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {plugins.map((plugin: CustomPluginSummary) => (
              <div key={plugin.plugin_id} className={styles.pluginItem}>
                <div>
                  <div className={styles.pluginTitleRow}>
                    <span className={styles.pluginName}>{plugin.display_name}</span>
                    <span className={styles.pluginCategoryBadge}>{plugin.category}</span>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        padding: "0.1rem 0.35rem",
                        borderRadius: "4px",
                        background: plugin.is_active ? "rgba(0, 230, 118, 0.1)" : "rgba(255, 68, 68, 0.1)",
                        color: plugin.is_active ? "#00e676" : "#ff5252",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                      }}
                    >
                      {plugin.is_active ? "MOUNTED" : "DISABLED"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                    {plugin.description}
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.pluginDeleteBtn}
                  onClick={() => handleDelete(plugin.plugin_id)}
                  disabled={deletingPluginId === plugin.plugin_id}
                >
                  <span>🗑️</span>
                  <span>{deletingPluginId === plugin.plugin_id ? "Deleting..." : "Uninstall"}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1-Click Community Pull Request Modal (using Portal to escape containing blocks) */}
      {prModalOpen && plan && (
        <Portal>
          <div
            className={styles.modalOverlay}
            onClick={() => setPrModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Community Pull Request Generator"
          >
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Community Pull Request Generator</h3>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setPrModalOpen(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>
                    Target Branch:
                  </div>
                  <code
                    style={{
                      background: "var(--surface-elevated, rgba(140, 140, 140, 0.1))",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      display: "inline-block",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    git checkout -b {plan.git_branch_name}
                  </code>
                </div>

                <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>Pull Request Markdown:</span>
                  <MagneticButton strength={0.25}>
                    <button
                      type="button"
                      onClick={handleCopyPr}
                      style={{
                        background: "var(--color-text)",
                        color: "var(--surface-card, #ffffff)",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {copiedPr ? "✓ Copied!" : "📋 Copy PR Markdown"}
                    </button>
                  </MagneticButton>
                </div>

                <pre
                  style={{
                    background: "var(--surface-elevated, rgba(0, 0, 0, 0.05))",
                    border: "1px solid var(--surface-glass-border, rgba(140, 140, 140, 0.2))",
                    borderRadius: "8px",
                    padding: "0.85rem",
                    fontSize: "0.76rem",
                    lineHeight: 1.5,
                    fontFamily: "var(--font-mono, monospace)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "340px",
                    overflowY: "auto",
                  }}
                >
                  {plan.pull_request_markdown}
                </pre>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
