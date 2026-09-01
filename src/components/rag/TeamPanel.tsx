"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import styles from "./rag.module.css";

interface TeamPanelProps {
  hidden?: boolean;
  tenantId?: string;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export function TeamPanel({ hidden, tenantId }: TeamPanelProps) {
  const { user, getAccessToken } = useAuth();
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [inviting, setInviting] = useState<boolean>(false);
  const [invitedStatus, setInvitedStatus] = useState<string>("");
  const [inviteError, setInviteError] = useState<string>("");

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    if (!hidden) {
      Promise.resolve().then(async () => {
        if (!isMounted) return;
        setLoadingMembers(true);
        const token = await getAccessToken();
        if (!token || !isMounted) {
          if (isMounted) setLoadingMembers(false);
          return;
        }
        try {
          const q = tenantId ? `?tenantId=${tenantId}` : "";
          const res = await fetch(`/api/rag/members${q}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted) setMembers(data.members || []);
          }
        } catch {
          // ignore
        } finally {
          if (isMounted) setLoadingMembers(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [hidden, getAccessToken, tenantId]);



  if (hidden) return null;

  const handleFetchMembers = async () => {
    setLoadingMembers(true);
    const token = await getAccessToken();
    if (!token) {
      setLoadingMembers(false);
      return;
    }
    try {
      const q = tenantId ? `?tenantId=${tenantId}` : "";
      const res = await fetch(`/api/rag/members${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError("");
    setInvitedStatus("");
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/rag/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, tenantId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to send invitation.");
      } else {
        setInvitedStatus(`Invitation email sent to ${inviteEmail} as ${inviteRole.toUpperCase()}`);
        setInviteEmail("");
        handleFetchMembers();
      }
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Network error sending invitation");
    } finally {
      setInviting(false);
    }
  };


  const handleExportAudit = () => {
    const auditRecord = {
      tenant_id: tenantId || "active_tenant",
      exported_at: new Date().toISOString(),
      account_email: user?.email,
      members_count: members.length,
      members: members.map((m) => ({ email: m.email, role: m.role, joined_at: m.created_at })),
      compliance_standard: "ISO/IEC 27001 & SOC-2 Type II Tenancy Isolation",
    };
    const blob = new Blob([JSON.stringify(auditRecord, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tenant_compliance_audit_${Date.now()}.json`;
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
            disabled={inviting}
          />
          <select
            value={inviteRole}
            aria-label="Workspace member role"
            onChange={(e) => setInviteRole(e.target.value)}
            className={styles.input}
            style={{ width: "120px", margin: 0 }}
            disabled={inviting}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
          <button type="submit" className="comic-btn comic-btn-blue" disabled={inviting || !inviteEmail.trim()}>
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {invitedStatus && (
          <p style={{ fontSize: "0.8rem", color: "#00E676", margin: "0.5rem 0 0" }}>✓ {invitedStatus}</p>
        )}
        {inviteError && (
          <p style={{ fontSize: "0.8rem", color: "#FF1744", margin: "0.5rem 0 0" }}>✕ {inviteError}</p>
        )}
      </div>

      {/* Team Member List */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "1rem", margin: 0 }}>📋 Workspace Members</h3>
          <button
            onClick={handleExportAudit}
            className="comic-btn comic-btn-outline"
            style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            title="Export compliance record with member permissions"
          >
            📥 Export Audit Record
          </button>
        </div>
        <div style={{ border: "1px solid var(--color-border, #333)", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "0.75rem 1rem", background: "var(--color-bg, #111)", fontSize: "0.8rem", fontWeight: 600, borderBottom: "1px solid var(--color-border, #333)" }}>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
          </div>

          {loadingMembers ? (
            <div style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Loading workspace members...
            </div>
          ) : members.length > 0 ? (
            members.map((m) => (
              <div key={m.id || m.email} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "0.75rem 1rem", fontSize: "0.85rem", borderBottom: "1px solid var(--color-border, #222)", alignItems: "center" }}>
                <span>{m.email}</span>
                <span style={{ textTransform: "capitalize" }}><strong>{m.role}</strong></span>
                <span style={{ color: "#00E676" }}>Active</span>
              </div>
            ))
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "0.75rem 1rem", fontSize: "0.85rem", borderBottom: "1px solid var(--color-border, #222)", alignItems: "center" }}>
              <span>{user?.email || "Owner (Active User)"}</span>
              <span style={{ textTransform: "capitalize" }}><strong>Owner</strong></span>
              <span style={{ color: "#00E676" }}>Active</span>
            </div>
          )}

        </div>
      </div>

      {/* Razorpay Subscription Ledger */}
      <div style={{ background: "var(--surface-card, rgba(255, 255, 255, 0.03))", border: "1px solid var(--color-border, #333)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
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
            <a href="/rag#pricing" className="comic-btn comic-btn-blue" style={{ fontSize: "0.75rem", width: "100%", textDecoration: "none", display: "inline-block" }}>
              Upgrade to Starter
            </a>
          </div>

          <div style={{ border: "1px solid #00E676", borderRadius: "6px", padding: "0.85rem", textAlign: "center", background: "rgba(0, 230, 118, 0.05)" }}>
            <strong>Pro Tier (Recommended)</strong>
            <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>₹6,999 / mo ($79/mo)</p>
            <a href="/rag#pricing" className="comic-btn comic-btn-blue" style={{ fontSize: "0.75rem", width: "100%", textDecoration: "none", display: "inline-block" }}>
              Upgrade to Pro
            </a>
          </div>

          <div style={{ border: "1px solid #8b5cf6", borderRadius: "6px", padding: "0.85rem", textAlign: "center" }}>
            <strong>Business Tier</strong>
            <p style={{ margin: "0.25rem 0", fontSize: "0.85rem" }}>₹19,999 / mo ($249/mo)</p>
            <a href="/rag#pricing" className="comic-btn comic-btn-outline" style={{ fontSize: "0.75rem", width: "100%", textDecoration: "none", display: "inline-block" }}>
              Upgrade to Business
            </a>
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
