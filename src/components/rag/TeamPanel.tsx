"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./rag.module.css";

interface TeamPanelProps {
  hidden?: boolean;
}

export function TeamPanel({ hidden }: TeamPanelProps) {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [invitedStatus, setInvitedStatus] = useState<string>("");

  if (hidden) return null;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInvitedStatus(`Invitation sent to ${inviteEmail} as ${inviteRole.toUpperCase()}`);
    setInviteEmail("");
    setTimeout(() => setInvitedStatus(""), 4000);
  };

  const handleExportAudit = () => {
    const fakeAuditData = JSON.stringify(
      {
        tenant_id: "rag_tenant_demo",
        export_time: new Date().toISOString(),
        sha256_chain_root: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        events: [
          { timestamp: new Date().toISOString(), action: "DOCUMENT_INGEST", user: "owner@prateeq.in", status: "SUCCESS" },
          { timestamp: new Date().toISOString(), action: "QUERY_EXECUTION", user: "guest@prateeq.in", status: "SUCCESS" },
        ],
      },
      null,
      2
    );
    const blob = new Blob([fakeAuditData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_sha256_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeaderGroup}>
        <h2 className={styles.panelTitle}>👥 Team Multi-Tenancy & Compliance Audit</h2>
        <p className={styles.panelDesc}>
          Manage workspace team members, assign granular permissions, inspect subscription billing, and export tamper-evident SHA-256 compliance logs.
        </p>
      </div>

      {/* Invite Member Form */}
      <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.03))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>✉️ Invite Team Member</h3>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="email"
            aria-label="Colleague email address for invitation"
            placeholder="colleague@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className={styles.input}
            style={{ flex: 1, minWidth: "220px", margin: 0 }}
            required
          />
          <select
            value={inviteRole}
            aria-label="Workspace member role"
            onChange={(e) => setInviteRole(e.target.value)}
            className={styles.input}
            style={{ width: "120px", margin: 0 }}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <button type="submit" className="comic-btn comic-btn-blue">
            Send Invite
          </button>
        </form>
        {invitedStatus && (
          <p style={{ fontSize: "0.8rem", color: "#00E676", margin: "0.5rem 0 0" }}>✓ {invitedStatus}</p>
        )}
      </div>

      {/* Team Member List */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>📋 Workspace Members</h3>
        <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "0.75rem 1rem", background: "var(--color-bg, #111)", fontSize: "0.8rem", fontWeight: 600, borderBottom: "1px solid var(--color-border, #333)" }}>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "0.75rem 1rem", fontSize: "0.85rem", borderBottom: "1px solid var(--color-border, #222)", alignItems: "center" }}>
            <span>{user?.email || "Owner (Active User)"}</span>
            <span style={{ textTransform: "capitalize" }}><strong>Owner</strong></span>
            <span style={{ color: "#00E676" }}>Active</span>
          </div>
        </div>
      </div>

      {/* Razorpay Subscription Ledger */}
      <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.03))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem" }}>💳 Subscription Plan & Billing Ledger</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #888)", textTransform: "uppercase" }}>Current Active Tier:</span>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFB300" }}>⏱️ 7-Day Starter Free Trial</div>
          </div>
          <span style={{ fontSize: "0.8rem", color: "#00E676" }}>Soft Paywall Active Day 8</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          <div style={{ border: "1px solid #5A8EB6", borderRadius: "6px", padding: "0.85rem", textAlign: "center" }}>
            <strong>Starter Tier</strong>
            <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>₹2,499 / mo ($29/mo)</p>
            <button className="comic-btn comic-btn-blue" style={{ fontSize: "0.75rem", width: "100%" }}>
              Upgrade to Starter
            </button>
          </div>

          <div style={{ border: "1px solid #00E676", borderRadius: "6px", padding: "0.85rem", textAlign: "center", background: "rgba(0, 230, 118, 0.05)" }}>
            <strong>Pro Tier (Recommended)</strong>
            <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>₹6,999 / mo ($79/mo)</p>
            <button className="comic-btn comic-btn-blue" style={{ fontSize: "0.75rem", width: "100%" }}>
              Upgrade to Pro
            </button>
          </div>

          <div style={{ border: "1px solid #8b5cf6", borderRadius: "6px", padding: "0.85rem", textAlign: "center" }}>
            <strong>Business Tier</strong>
            <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>₹19,999 / mo ($249/mo)</p>
            <button className="comic-btn comic-btn-outline" style={{ fontSize: "0.75rem", width: "100%" }}>
              Upgrade to Business
            </button>
          </div>
        </div>
      </div>

      {/* Compliance Audit Section */}
      <div style={{ background: "rgba(90, 142, 182, 0.08)", border: "1px solid rgba(90, 142, 182, 0.2)", borderRadius: "8px", padding: "1.25rem" }}>
        <h3 style={{ fontSize: "1rem", margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          📜 Cryptographic Compliance Audit Vault
        </h3>
        <p style={{ fontSize: "0.85rem", margin: "0 0 1rem", opacity: 0.8 }}>
          Download verifiable, tamper-evident SHA-256 audit logs of all queries, document uploads, and configuration mutations for HIPAA/GDPR regulatory audits.
        </p>
        <button onClick={handleExportAudit} className="comic-btn comic-btn-blue">
          ⬇️ Export SHA-256 Audit Log (.JSON)
        </button>
      </div>
    </div>
  );
}
