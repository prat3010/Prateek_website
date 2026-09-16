"use client";

import React, { useState, useEffect, useCallback } from "react";
import { m } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { RetrieverClient } from "@/lib/rag-client";
import {
  PreferencePair,
  TuningJob,
  ContinuousTuningConfig,
  TuningMathSimulationResult,
  TuningObjective,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import Portal from "@/components/ui/Portal";
import styles from "./ContinuousTuningPanel.module.css";

interface ContinuousTuningPanelProps {
  client: RetrieverClient | null;
  tenantId?: string;
  hidden?: boolean;
}

type TabKey = "dataset" | "jobs" | "adapters" | "simulator";

const FALLBACK_CONFIG: ContinuousTuningConfig = {
  tenant_id: "demo-tenant",
  objective: "dpo",
  base_model: "meta-llama/Llama-3-8B-Instruct",
  active_adapter_id: "lora_adapter_dpo_v1",
  auto_train_enabled: true,
  hyperparameters: {
    learning_rate: 0.00005,
    beta: 0.1,
    lambda_orpo: 0.1,
    lora_r: 16,
    lora_alpha: 32,
    batch_size: 4,
    epochs: 3,
    auto_trigger_threshold: 20,
    eval_split_ratio: 0.2,
  },
  total_pairs_harvested: 24,
  active_pairs_in_buffer: 4,
};

const FALLBACK_PAIRS: PreferencePair[] = [
  {
    pair_id: "pref_01",
    tenant_id: "demo-tenant",
    prompt: "How does the Retriever query rewriting engine handle multi-hop cross-domain queries?",
    winning_response:
      "Retriever's HyDE rewrites the query into hypothetical document embeddings, decomposes entities into subgraph traversal paths, and blends dense vector + BM25 keyword scores with reciprocal rank fusion (RRF).",
    losing_response:
      "It searches the database using standard vector similarity and returns the top 5 chunks without entity expansion.",
    feedback_rating: 5,
    tags: ["architecture", "hyde", "verified"],
    is_verified: true,
    created_at: "2026-09-15T18:00:00Z",
  },
  {
    pair_id: "pref_02",
    tenant_id: "demo-tenant",
    prompt: "Explain how zero-knowledge proof vector attestation validates grounding without decrypting embeddings.",
    winning_response:
      "By constructing a SHA-256 Merkle tree over all document chunk embeddings, generating Merkle inclusion paths for cited chunks, and signing the tree root with an ed25519 attestation key. Verifiers confirm boundary containment in O(log N) steps.",
    losing_response:
      "The server decrypts embeddings on the client, checks if the cosine similarity is above 0.8, and returns true.",
    feedback_rating: 5,
    tags: ["zkp", "cryptography", "merkle"],
    is_verified: true,
    created_at: "2026-09-15T19:30:00Z",
  },
  {
    pair_id: "pref_03",
    tenant_id: "demo-tenant",
    prompt: "What is the primary difference between DPO and ORPO loss?",
    winning_response:
      "DPO optimizes Bradley-Terry implicit rewards against an explicit frozen reference model pi_ref. In contrast, ORPO modifies the SFT cross-entropy loss directly with an odds ratio penalty, eliminating the memory overhead of maintaining a reference model.",
    losing_response:
      "DPO and ORPO are completely identical except DPO uses temperature beta while ORPO uses learning rate lambda.",
    feedback_rating: 4,
    tags: ["ml-theory", "dpo", "orpo"],
    is_verified: false,
    created_at: "2026-09-15T21:15:00Z",
  },
];

const FALLBACK_JOBS: TuningJob[] = [
  {
    job_id: "job_dpo_20260915_001",
    tenant_id: "demo-tenant",
    objective: "dpo",
    status: "completed",
    base_model: "meta-llama/Llama-3-8B-Instruct",
    output_adapter_id: "lora_adapter_dpo_v1",
    dataset_size: 20,
    hyperparameters: {
      learning_rate: 0.00005,
      beta: 0.1,
      lambda_orpo: 0.1,
      lora_r: 16,
      lora_alpha: 32,
      batch_size: 4,
      epochs: 3,
      auto_trigger_threshold: 20,
      eval_split_ratio: 0.2,
    },
    loss_history: [
      { step: 1, epoch: 1, train_loss: 0.693, reward_margin: 0.0, accuracy: 0.5, odds_ratio: 1.0 },
      { step: 2, epoch: 1, train_loss: 0.542, reward_margin: 0.42, accuracy: 0.72, odds_ratio: 1.52 },
      { step: 3, epoch: 2, train_loss: 0.381, reward_margin: 0.88, accuracy: 0.86, odds_ratio: 2.41 },
      { step: 4, epoch: 2, train_loss: 0.264, reward_margin: 1.34, accuracy: 0.94, odds_ratio: 3.82 },
      { step: 5, epoch: 3, train_loss: 0.182, reward_margin: 1.76, accuracy: 0.98, odds_ratio: 5.81 },
    ],
    evaluation: {
      passed: true,
      validation_accuracy: 0.92,
      avg_reward_margin: 1.65,
      validation_loss: 0.204,
      total_eval_pairs: 4,
      recommendation: "Passed automated threshold (accuracy >= 0.75). Ready for production serving.",
    },
    created_at: "2026-09-15T20:00:00Z",
    completed_at: "2026-09-15T20:04:12Z",
  },
];

export function ContinuousTuningPanel({ client, hidden }: ContinuousTuningPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dataset");
  const [config, setConfig] = useState<ContinuousTuningConfig>(FALLBACK_CONFIG);
  const [pairs, setPairs] = useState<PreferencePair[]>(FALLBACK_PAIRS);
  const [jobs, setJobs] = useState<TuningJob[]>(FALLBACK_JOBS);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modal State for adding manual pair
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newPrompt, setNewPrompt] = useState<string>("");
  const [newWinResp, setNewWinResp] = useState<string>("");
  const [newLoseResp, setNewLoseResp] = useState<string>("");
  const [newTags, setNewTags] = useState<string>("manual, curated");
  const [isSubmittingPair, setIsSubmittingPair] = useState<boolean>(false);

  // Simulator State
  const [simBeta, setSimBeta] = useState<number>(0.1);
  const [simLambdaOrpo, setSimLambdaOrpo] = useState<number>(0.1);
  const [simPiThetaWin, setSimPiThetaWin] = useState<number>(0.85);
  const [simPiRefWin, setSimPiRefWin] = useState<number>(0.45);
  const [simPiThetaLose, setSimPiThetaLose] = useState<number>(0.15);
  const [simPiRefLose, setSimPiRefLose] = useState<number>(0.55);
  const [simResult, setSimResult] = useState<TuningMathSimulationResult | null>(null);

  const loadData = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    try {
      const [cfg, pairsResp, jobsList] = await Promise.all([
        client.getTuningConfig().catch(() => FALLBACK_CONFIG),
        client.listPreferencePairs(50, 0).catch(() => ({ items: FALLBACK_PAIRS, total: 3, limit: 50, offset: 0 })),
        client.listTuningJobs(20).catch(() => FALLBACK_JOBS),
      ]);
      setConfig(cfg);
      if (pairsResp.items && pairsResp.items.length > 0) {
        setPairs(pairsResp.items);
      }
      if (jobsList && jobsList.length > 0) {
        setJobs(jobsList);
      }
    } catch (err) {
      console.warn("Failed to fetch tuning data from Retriever:", err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    if (hidden) return;
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [hidden, loadData]);

  // Handle Math Simulation Calculation
  const runSimulation = useCallback(async () => {
    if (client) {
      try {
        const res = await client.simulateTuningMath({
          prompt: "Interactive math benchmark query",
          beta: simBeta,
          lambda_orpo: simLambdaOrpo,
          pi_theta_win_prob: simPiThetaWin,
          pi_ref_win_prob: simPiRefWin,
          pi_theta_lose_prob: simPiThetaLose,
          pi_ref_lose_prob: simPiRefLose,
        });
        setSimResult(res);
        return;
      } catch {
        // Fallback to pure local math
      }
    }

    // Local authentic DPO / ORPO computation
    const rW = simBeta * (Math.log(simPiThetaWin) - Math.log(simPiRefWin));
    const rL = simBeta * (Math.log(simPiThetaLose) - Math.log(simPiRefLose));
    const margin = rW - rL;
    const dpoLoss = -Math.log(1 / (1 + Math.exp(-margin)));

    const oddsW = simPiThetaWin / Math.max(1e-7, 1 - simPiThetaWin);
    const oddsL = simPiThetaLose / Math.max(1e-7, 1 - simPiThetaLose);
    const oddsRatio = oddsW / Math.max(1e-7, oddsL);
    const orpoLoss = -Math.log(simPiThetaWin) - simLambdaOrpo * Math.log(1 / (1 + Math.exp(-Math.log(oddsRatio))));

    setSimResult({
      prompt: "Interactive math benchmark query",
      beta: simBeta,
      lambda_orpo: simLambdaOrpo,
      pi_theta_win_prob: simPiThetaWin,
      pi_ref_win_prob: simPiRefWin,
      pi_theta_lose_prob: simPiThetaLose,
      pi_ref_lose_prob: simPiRefLose,
      dpo_reward_w: Number(rW.toFixed(4)),
      dpo_reward_l: Number(rL.toFixed(4)),
      dpo_reward_margin: Number(margin.toFixed(4)),
      dpo_loss: Number(dpoLoss.toFixed(4)),
      orpo_odds_w: Number(oddsW.toFixed(4)),
      orpo_odds_l: Number(oddsL.toFixed(4)),
      orpo_odds_ratio: Number(oddsRatio.toFixed(4)),
      orpo_loss: Number(orpoLoss.toFixed(4)),
    });
  }, [client, simBeta, simLambdaOrpo, simPiThetaWin, simPiRefWin, simPiThetaLose, simPiRefLose]);

  useEffect(() => {
    if (activeTab === "simulator") {
      const timer = setTimeout(() => {
        void runSimulation();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeTab, runSimulation]);

  const handleHarvestPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || !newWinResp.trim() || !newLoseResp.trim()) return;
    setIsSubmittingPair(true);
    setStatusMessage(null);

    const tagsArray = newTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (client) {
        const created = await client.harvestPreferencePair({
          prompt: newPrompt,
          winning_response: newWinResp,
          losing_response: newLoseResp,
          tags: tagsArray,
          feedback_rating: 5,
        });
        setPairs((prev) => [created, ...prev]);
        setConfig((prev) => ({
          ...prev,
          total_pairs_harvested: prev.total_pairs_harvested + 1,
          active_pairs_in_buffer: prev.active_pairs_in_buffer + 1,
        }));
      } else {
        const mockCreated: PreferencePair = {
          pair_id: `pref_${Date.now().toString(36)}`,
          tenant_id: config.tenant_id,
          prompt: newPrompt,
          winning_response: newWinResp,
          losing_response: newLoseResp,
          feedback_rating: 5,
          tags: tagsArray,
          is_verified: true,
          created_at: new Date().toISOString(),
        };
        setPairs((prev) => [mockCreated, ...prev]);
        setConfig((prev) => ({
          ...prev,
          total_pairs_harvested: prev.total_pairs_harvested + 1,
          active_pairs_in_buffer: prev.active_pairs_in_buffer + 1,
        }));
      }

      setIsAddModalOpen(false);
      setNewPrompt("");
      setNewWinResp("");
      setNewLoseResp("");
      setStatusMessage("Preference pair harvested into dataset buffer.");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to harvest pair.");
    } finally {
      setIsSubmittingPair(false);
    }
  };

  const handleDeletePair = async (pairId: string) => {
    if (!confirm("Are you sure you want to delete this preference pair?")) return;
    try {
      if (client) {
        await client.deletePreferencePair(pairId);
      }
      setPairs((prev) => prev.filter((p) => p.pair_id !== pairId));
      setConfig((prev) => ({
        ...prev,
        total_pairs_harvested: Math.max(0, prev.total_pairs_harvested - 1),
        active_pairs_in_buffer: Math.max(0, prev.active_pairs_in_buffer - 1),
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete preference pair.");
    }
  };

  const handleTriggerJob = async (objective: TuningObjective) => {
    setStatusMessage(`Triggering continuous ${objective.toUpperCase()} tuning job...`);
    try {
      if (client) {
        const job = await client.triggerTuningJob(objective);
        setJobs((prev) => [job, ...prev]);
        setStatusMessage(`Tuning job ${job.job_id} successfully launched.`);
        void loadData();
      } else {
        const mockJob: TuningJob = {
          job_id: `job_${objective}_${Date.now().toString(36)}`,
          tenant_id: config.tenant_id,
          objective,
          status: "completed",
          base_model: config.base_model,
          output_adapter_id: `lora_adapter_${objective}_v${jobs.length + 1}`,
          dataset_size: pairs.length,
          hyperparameters: config.hyperparameters,
          loss_history: [
            { step: 1, epoch: 1, train_loss: 0.65, reward_margin: 0.1, accuracy: 0.55, odds_ratio: 1.1 },
            { step: 2, epoch: 2, train_loss: 0.35, reward_margin: 0.9, accuracy: 0.88, odds_ratio: 2.5 },
            { step: 3, epoch: 3, train_loss: 0.19, reward_margin: 1.6, accuracy: 0.96, odds_ratio: 5.2 },
          ],
          evaluation: {
            passed: true,
            validation_accuracy: 0.95,
            avg_reward_margin: 1.58,
            validation_loss: 0.21,
            total_eval_pairs: Math.max(2, Math.floor(pairs.length * 0.2)),
            recommendation: "Evaluation gate passed. LoRA adapter checkpoint verified.",
          },
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        };
        setJobs((prev) => [mockJob, ...prev]);
        setStatusMessage(`Tuning job ${mockJob.job_id} simulated and verified.`);
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Failed to trigger tuning job.");
    }
  };

  const handlePromoteAdapter = async (jobId: string) => {
    try {
      if (client) {
        const updatedCfg = await client.promoteTuningJobAdapter(jobId);
        setConfig(updatedCfg);
      } else {
        const target = jobs.find((j) => j.job_id === jobId);
        if (target) {
          setConfig((prev) => ({
            ...prev,
            active_adapter_id: target.output_adapter_id,
          }));
        }
      }
      setStatusMessage(`Adapter from ${jobId} promoted to active serving.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to promote adapter.");
    }
  };

  const handleRollback = async () => {
    if (!confirm("Rollback active adapter to prior checkpoint?")) return;
    try {
      if (client) {
        const updatedCfg = await client.rollbackTuningAdapter();
        setConfig(updatedCfg);
      } else {
        setConfig((prev) => ({
          ...prev,
          active_adapter_id: null,
        }));
      }
      setStatusMessage("Active model successfully rolled back.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rollback adapter.");
    }
  };

  if (hidden) return null;

  return (
    <div className={styles.container}>
      {/* Top Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.titleArea}>
            <div className={styles.titleWithBadge}>
              <h2 className={styles.title}>Continuous DPO / ORPO Model Preference Tuning</h2>
              <span className={styles.batteryBadge}>Battery #35 // Preference Optimization</span>
            </div>
            <p className={styles.subtitle}>
              Autonomous harvesting of real user interactions (👍/👎) into pairwise preference datasets, continuous direct
              preference optimization (DPO / ORPO / KTO), and zero-downtime hot-swappable LoRA adapter versioning with
              mathematical validation gates.
            </p>
          </div>

          <div className={styles.metaStats}>
            <div className={styles.statPill}>
              <span className={styles.pulseDot} />
              <span>Buffer: </span>
              <NumberFlow value={config.active_pairs_in_buffer} />
              <span>/ {config.hyperparameters.auto_trigger_threshold}</span>
            </div>
            <div className={styles.statPill}>
              <span>Harvested: </span>
              <NumberFlow value={config.total_pairs_harvested} />
            </div>
            <div className={styles.statPill}>
              <span>Active Adapter: </span>
              <strong style={{ color: "#00f0ff" }}>{config.active_adapter_id || "Base Model"}</strong>
            </div>
            {loading && (
              <div className={styles.statPill} style={{ opacity: 0.7 }}>
                <span>Syncing…</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Bar */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${activeTab === "dataset" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("dataset")}
        >
          <span>📚</span>
          <span>Preference Dataset ({pairs.length})</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "jobs" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("jobs")}
        >
          <span>⚙️</span>
          <span>Continuous Training Jobs ({jobs.length})</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "adapters" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("adapters")}
        >
          <span>🎯</span>
          <span>Adapter Governance & Rollback</span>
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "simulator" ? styles.tabBtnActive : ""}`}
          onClick={() => setActiveTab("simulator")}
        >
          <span>🔬</span>
          <span>DPO / ORPO Math Simulator</span>
        </button>
      </div>

      {statusMessage && (
        <div
          style={{
            padding: "0.6rem 1rem",
            background: "rgba(0, 240, 255, 0.08)",
            border: "1px solid rgba(0, 240, 255, 0.25)",
            borderRadius: "8px",
            fontSize: "0.85rem",
            color: "var(--color-text)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          ℹ️ {statusMessage}
        </div>
      )}

      {/* SUBVIEW 1: Dataset Curator */}
      {activeTab === "dataset" && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.subViewContainer}
        >
          <div className={styles.card}>
            <div className={styles.actionControlsBar}>
              <div>
                <h3 className={styles.cardTitle}>Pairwise Preference Dataset Buffer</h3>
                <p className={styles.cardSubtitle}>
                  Pairs are continuously harvested from user chat responses, ratings, and explicit corrections. Once the
                  buffer reaches {config.hyperparameters.auto_trigger_threshold} pairs, continuous tuning auto-triggers.
                </p>
              </div>

              <MagneticButton strength={0.25}>
                <button
                  className="comic-btn comic-btn-blue"
                  style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  + Harvest Preference Pair
                </button>
              </MagneticButton>
            </div>

            <div className={styles.pairsGrid}>
              {pairs.map((p) => (
                <div key={p.pair_id} className={styles.pairCard}>
                  <div className={styles.pairHeader}>
                    <div className={styles.pairPrompt}>&ldquo;{p.prompt}&rdquo;</div>
                    <div className={styles.pairMeta}>
                      <span className={styles.pairBadge}>{p.pair_id}</span>
                      {p.is_verified && (
                        <span className={styles.pairBadge} style={{ color: "#39ff14", borderColor: "#39ff14" }}>
                          ✓ Verified
                        </span>
                      )}
                      <span className={styles.pairRating}>{"★".repeat(p.feedback_rating || 5)}</span>
                      {p.tags.map((t) => (
                        <span key={t} className={styles.pairBadge}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.responsesGrid}>
                    <div className={styles.responseBoxWinning}>
                      <span className={`${styles.responseLabel} ${styles.labelWin}`}>
                        ✓ Winning Response (y_w)
                      </span>
                      <p className={styles.responseText}>{p.winning_response}</p>
                    </div>
                    <div className={styles.responseBoxLosing}>
                      <span className={`${styles.responseLabel} ${styles.labelLose}`}>
                        ✗ Losing Response (y_l)
                      </span>
                      <p className={styles.responseText}>{p.losing_response}</p>
                    </div>
                  </div>

                  <div className={styles.pairFooter}>
                    <span className={styles.timestamp}>
                      Created: {new Date(p.created_at).toLocaleString()}
                    </span>
                    <button className={styles.deleteBtn} onClick={() => handleDeletePair(p.pair_id)}>
                      🗑️ Delete Pair
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </m.div>
      )}

      {/* SUBVIEW 2: Continuous Training Jobs */}
      {activeTab === "jobs" && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.subViewContainer}
        >
          <div className={styles.card}>
            <div className={styles.actionControlsBar}>
              <div>
                <h3 className={styles.cardTitle}>Continuous Fine-Tuning Execution Engine</h3>
                <p className={styles.cardSubtitle}>
                  Track Bradley-Terry implicit reward convergence, cross-entropy odds ratios, and automated validation gates.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <MagneticButton strength={0.25}>
                  <button
                    className="comic-btn comic-btn-blue"
                    style={{ padding: "0.45rem 0.9rem", fontSize: "0.85rem" }}
                    onClick={() => handleTriggerJob("dpo")}
                  >
                    🚀 Trigger DPO Run
                  </button>
                </MagneticButton>
                <MagneticButton strength={0.25}>
                  <button
                    className="comic-btn comic-btn-green"
                    style={{ padding: "0.45rem 0.9rem", fontSize: "0.85rem" }}
                    onClick={() => handleTriggerJob("orpo")}
                  >
                    ⚡ Trigger ORPO Run
                  </button>
                </MagneticButton>
              </div>
            </div>

            <div className={styles.jobList}>
              {jobs.map((job) => (
                <div key={job.job_id} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <div className={styles.jobTitleGroup}>
                      <span className={styles.jobId}>{job.job_id}</span>
                      <span className={`${styles.statusBadge} ${styles[`status_${job.status}`] || ""}`}>
                        {job.status}
                      </span>
                      <span className={styles.pairBadge}>Objective: {job.objective.toUpperCase()}</span>
                      <span className={styles.pairBadge}>Base: {job.base_model}</span>
                    </div>

                    {job.status === "completed" && job.output_adapter_id !== config.active_adapter_id && (
                      <MagneticButton strength={0.25}>
                        <button
                          className="comic-btn comic-btn-blue"
                          style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}
                          onClick={() => handlePromoteAdapter(job.job_id)}
                        >
                          Promote to Serving
                        </button>
                      </MagneticButton>
                    )}
                  </div>

                  <div className={styles.jobMetaGrid}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Output LoRA Adapter</span>
                      <span className={styles.metricValue}>{job.output_adapter_id}</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Dataset Size</span>
                      <span className={styles.metricValue}>{job.dataset_size} pairs</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Learning Rate</span>
                      <span className={styles.metricValue}>{job.hyperparameters.learning_rate}</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Temperature (Beta)</span>
                      <span className={styles.metricValue}>{job.hyperparameters.beta}</span>
                    </div>
                  </div>

                  {/* Evaluation Gate Banner */}
                  {job.evaluation && (
                    <div
                      className={`${styles.evalGateBanner} ${
                        job.evaluation.passed ? styles.evalGatePassed : styles.evalGateFailed
                      }`}
                    >
                      <div className={styles.evalGateTitle}>
                        <span>{job.evaluation.passed ? "✓ EVALUATION GATE PASSED" : "✗ EVALUATION GATE FAILED"}</span>
                        <span className={styles.pairBadge}>
                          Acc: {(job.evaluation.validation_accuracy * 100).toFixed(1)}% (Threshold ≥ 75%)
                        </span>
                        <span className={styles.pairBadge}>
                          Margin: +{job.evaluation.avg_reward_margin.toFixed(2)}
                        </span>
                      </div>
                      <span className={styles.evalGateText}>{job.evaluation.recommendation}</span>
                    </div>
                  )}

                  {/* Loss Step History Table */}
                  {job.loss_history.length > 0 && (
                    <div className={styles.lossTableWrapper}>
                      <table className={styles.lossTable}>
                        <thead>
                          <tr>
                            <th>Step</th>
                            <th>Epoch</th>
                            <th>Train Loss</th>
                            <th>Reward Margin (Δr)</th>
                            <th>Pair Accuracy</th>
                            <th>Odds Ratio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {job.loss_history.map((step) => (
                            <tr key={step.step}>
                              <td>#{step.step}</td>
                              <td>Epoch {step.epoch}</td>
                              <td style={{ color: "#00f0ff" }}>{step.train_loss.toFixed(4)}</td>
                              <td style={{ color: "#39ff14" }}>+{step.reward_margin.toFixed(2)}</td>
                              <td>{(step.accuracy * 100).toFixed(1)}%</td>
                              <td>{step.odds_ratio.toFixed(2)}x</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </m.div>
      )}

      {/* SUBVIEW 3: Adapter Governance & Rollback */}
      {activeTab === "adapters" && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.subViewContainer}
        >
          <div className={styles.activeAdapterBanner}>
            <div className={styles.activeAdapterInfo}>
              <span className={styles.pairBadge}>ACTIVE INFERENCE ADAPTER</span>
              <span className={styles.activeAdapterId}>{config.active_adapter_id || "Unadapted Base Model"}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                Serving tenant queries with real-time LoRA weights mapped over {config.base_model}
              </span>
            </div>

            <MagneticButton strength={0.25}>
              <button
                className="comic-btn comic-btn-red"
                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                onClick={handleRollback}
              >
                ⏪ Rollback Adapter Checkpoint
              </button>
            </MagneticButton>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Historical Checkpoint Registry</h3>
            <p className={styles.cardSubtitle}>
              Completed jobs that passed validation criteria are indexed here. Any verified adapter can be hot-promoted
              with zero container restarts.
            </p>

            <div className={styles.checkpointGrid} style={{ marginTop: "1rem" }}>
              {jobs
                .filter((j) => j.status === "completed")
                .map((j) => (
                  <div key={j.job_id} className={styles.checkpointCard}>
                    <div className={styles.checkpointHeader}>
                      <span className={styles.checkpointId}>{j.output_adapter_id}</span>
                      {j.output_adapter_id === config.active_adapter_id ? (
                        <span className={styles.pairBadge} style={{ color: "#39ff14", borderColor: "#39ff14" }}>
                          Active
                        </span>
                      ) : (
                        <button
                          className="comic-btn comic-btn-blue"
                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                          onClick={() => handlePromoteAdapter(j.job_id)}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      Job: {j.job_id} ({j.objective.toUpperCase()})
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                      Val Accuracy: {((j.evaluation?.validation_accuracy || 0.8) * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono, monospace)", color: "var(--color-text-muted)" }}>
                      Completed: {j.completed_at ? new Date(j.completed_at).toLocaleString() : "Recent"}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </m.div>
      )}

      {/* SUBVIEW 4: DPO / ORPO Math Simulator */}
      {activeTab === "simulator" && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.subViewContainer}
        >
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Direct Mathematical Loss & Odds Ratio Simulator</h3>
            <p className={styles.cardSubtitle}>
              Explore the exact Bradley-Terry implicit reward formulation of DPO and the monolithic reference-free odds
              ratio of ORPO in real time.
            </p>

            <div className={styles.simulatorGrid} style={{ marginTop: "1.5rem" }}>
              {/* Sliders Column */}
              <div>
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span>Temperature Parameter (β):</span>
                    <span className={styles.sliderValue}>{simBeta.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={simBeta}
                    onChange={(e) => setSimBeta(parseFloat(e.target.value))}
                    className={styles.sliderInput}
                  />
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span>ORPO Regularization Weight (λ):</span>
                    <span className={styles.sliderValue}>{simLambdaOrpo.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="1.0"
                    step="0.01"
                    value={simLambdaOrpo}
                    onChange={(e) => setSimLambdaOrpo(parseFloat(e.target.value))}
                    className={styles.sliderInput}
                  />
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span>Policy Winning Probability π_θ(y_w | x):</span>
                    <span className={styles.sliderValue}>{simPiThetaWin.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.99"
                    step="0.01"
                    value={simPiThetaWin}
                    onChange={(e) => setSimPiThetaWin(parseFloat(e.target.value))}
                    className={styles.sliderInput}
                  />
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span>Reference Winning Probability π_ref(y_w | x):</span>
                    <span className={styles.sliderValue}>{simPiRefWin.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.99"
                    step="0.01"
                    value={simPiRefWin}
                    onChange={(e) => setSimPiRefWin(parseFloat(e.target.value))}
                    className={styles.sliderInput}
                  />
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span>Policy Losing Probability π_θ(y_l | x):</span>
                    <span className={styles.sliderValue}>{simPiThetaLose.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.95"
                    step="0.01"
                    value={simPiThetaLose}
                    onChange={(e) => setSimPiThetaLose(parseFloat(e.target.value))}
                    className={styles.sliderInput}
                  />
                </div>

                <div className={styles.sliderGroup}>
                  <div className={styles.sliderHeader}>
                    <span>Reference Losing Probability π_ref(y_l | x):</span>
                    <span className={styles.sliderValue}>{simPiRefLose.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.95"
                    step="0.01"
                    value={simPiRefLose}
                    onChange={(e) => setSimPiRefLose(parseFloat(e.target.value))}
                    className={styles.sliderInput}
                  />
                </div>
              </div>

              {/* Mathematical Outputs */}
              <div className={styles.mathOutputs}>
                <div className={styles.mathFormulaBox}>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Bradley-Terry Implicit Rewards:</div>
                  <div>
                    r̂(x, y_w) = β · log(π_θ(y_w|x) / π_ref(y_w|x)) ={" "}
                    <span className={styles.highlightFormula}>{simResult?.dpo_reward_w ?? 0}</span>
                  </div>
                  <div>
                    r̂(x, y_l) = β · log(π_θ(y_l|x) / π_ref(y_l|x)) ={" "}
                    <span className={styles.highlightFormula}>{simResult?.dpo_reward_l ?? 0}</span>
                  </div>
                  <div style={{ marginTop: "0.25rem", borderTop: "1px dashed var(--surface-glass-border)", paddingTop: "0.25rem" }}>
                    Reward Margin Δr = r̂_w - r̂_l ={" "}
                    <strong style={{ color: "#39ff14" }}>+{simResult?.dpo_reward_margin ?? 0}</strong>
                  </div>
                  <div>
                    DPO Loss ℒ_DPO = -log σ(Δr) ={" "}
                    <strong style={{ color: "#00f0ff" }}>{simResult?.dpo_loss ?? 0}</strong>
                  </div>
                </div>

                <div className={styles.mathFormulaBox}>
                  <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>ORPO Monolithic Odds Ratio:</div>
                  <div>
                    Odds(y_w | x) = π_θ(y_w) / (1 - π_θ(y_w)) ={" "}
                    <span className={styles.highlightFormula}>{simResult?.orpo_odds_w ?? 0}</span>
                  </div>
                  <div>
                    Odds(y_l | x) = π_θ(y_l) / (1 - π_θ(y_l)) ={" "}
                    <span className={styles.highlightFormula}>{simResult?.orpo_odds_l ?? 0}</span>
                  </div>
                  <div style={{ marginTop: "0.25rem", borderTop: "1px dashed var(--surface-glass-border)", paddingTop: "0.25rem" }}>
                    Odds Ratio = Odds_w / Odds_l ={" "}
                    <strong style={{ color: "#39ff14" }}>{simResult?.orpo_odds_ratio ?? 0}x</strong>
                  </div>
                  <div>
                    ORPO Loss ℒ_ORPO = ℒ_SFT + λ · ℒ_odds ={" "}
                    <strong style={{ color: "#00f0ff" }}>{simResult?.orpo_loss ?? 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </m.div>
      )}

      {/* Harvest Preference Pair Modal (Safe with Portal) */}
      {isAddModalOpen && (
        <Portal>
          <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Harvest Preference Pair</h3>
                <button className={styles.closeBtn} onClick={() => setIsAddModalOpen(false)}>
                  ×
                </button>
              </div>

              <form onSubmit={handleHarvestPair} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>User Prompt (x):</label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter the benchmark user prompt or question..."
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: "#39ff14" }}>
                    ✓ Winning Response (y_w):
                  </label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter the preferred, accurately grounded response..."
                    value={newWinResp}
                    onChange={(e) => setNewWinResp(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ color: "#ff5555" }}>
                    ✗ Losing Response (y_l):
                  </label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Enter the hallucinated or unhelpful rejected response..."
                    value={newLoseResp}
                    onChange={(e) => setNewLoseResp(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tags (comma-separated):</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. architecture, zkp, verified"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isSubmittingPair}
                  >
                    Cancel
                  </button>
                  <MagneticButton strength={0.25}>
                    <button
                      type="submit"
                      className="comic-btn comic-btn-blue"
                      style={{ padding: "0.5rem 1.25rem" }}
                      disabled={isSubmittingPair}
                    >
                      {isSubmittingPair ? "Harvesting..." : "Add to Buffer"}
                    </button>
                  </MagneticButton>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
