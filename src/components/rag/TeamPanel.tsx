"use client";

import { useState, useEffect, useCallback } from "react";
import { type RetrieverConfig } from "@/lib/rag-client";
import { useAuth } from "@/context/AuthContext";
import styles from "./rag.module.css";

interface TeamMember {
  id: string;
  tenant_id: string;
  user_id?: string;
  email: string;
  role: "owner" | "admin" | "member";
  created_at: string;
}

export function TeamPanel({
  config,
  hidden,
}: {
  config: RetrieverConfig | null;
  hidden: boolean;
}) {
  const { user, getAccessToken } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const url = config?.tenantId
        ? `/api/rag/members?tenantId=${encodeURIComponent(config.tenantId)}`
        : "/api/rag/members";

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (err) {
      console.warn("Failed to load team members:", err);
    }
  }, [user, config, getAccessToken]);

  useEffect(() => {
    if (!hidden && user) {
      let ignore = false;
      (async () => {
        setLoading(true);
        try {
          const token = await getAccessToken();
          const headers: Record<string, string> = {};
          if (token) headers.Authorization = `Bearer ${token}`;

          const url = config?.tenantId
            ? `/api/rag/members?tenantId=${encodeURIComponent(config.tenantId)}`
            : "/api/rag/members";

          const res = await fetch(url, { headers });
          if (res.ok && !ignore) {
            const data = await res.json();
            setMembers(data.members || []);
          }
        } catch (err) {
          console.warn("Failed to load team members:", err);
        } finally {
          if (!ignore) setLoading(false);
        }
      })();
      return () => {
        ignore = true;
      };
    }
  }, [hidden, user, config, getAccessToken]);

  if (hidden) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || inviting) return;
    setInviting(true);
    setStatusMsg(null);

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/rag/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          tenantId: config?.tenantId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation.");

      setStatusMsg({ ok: true, text: `Invitation sent to ${inviteEmail}` });
      setInviteEmail("");
      fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invitation failed.";
      setStatusMsg({ ok: false, text: msg });
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(memberId: string, email: string) {
    if (!confirm(`Revoke workspace access for ${email}?`)) return;
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/rag/members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ memberId }),
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch (err) {
      console.warn("Failed to revoke member:", err);
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Team Workspace Members</h2>
      <p className={styles.panelDesc}>
        Invite team members by email to grant them access to your RAG SaaS Studio workspace.
      </p>

      {!user ? (
        <p className={styles.connectFail}>
          ⚠️ Please log in with Google to manage your RAG workspace team members.
        </p>
      ) : (
        <>
          <form onSubmit={handleInvite} style={{ marginBottom: "1.5rem" }}>
            <div className={styles.row}>
              <div>
                <label className={styles.label}>Member Email</label>
                <input
                  className={styles.input}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Role</label>
                <select
                  className={styles.input}
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="comic-btn comic-btn-blue"
              disabled={inviting || !inviteEmail}
              style={{ marginTop: "0.5rem" }}
            >
              {inviting ? "Sending Invitation…" : "✉️ Send Email Invitation"}
            </button>
          </form>

          {statusMsg && (
            <p className={`${styles.connectStatus} ${statusMsg.ok ? styles.connectOk : styles.connectFail}`}>
              {statusMsg.ok ? "✓" : "✗"} {statusMsg.text}
            </p>
          )}

          <div style={{ marginTop: "1.5rem" }}>
            <h3 className={styles.panelTitle} style={{ fontSize: "1.1rem" }}>
              Active Team Members ({members.length})
            </h3>
            {loading ? (
              <p className={styles.panelDesc}>Loading team members…</p>
            ) : members.length === 0 ? (
              <p className={styles.panelDesc}>No additional team members invited yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color, #000)", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Email</th>
                    <th style={{ padding: "8px" }}>Role</th>
                    <th style={{ padding: "8px" }}>Joined</th>
                    <th style={{ padding: "8px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid var(--border-color, #eee)" }}>
                      <td style={{ padding: "8px", fontWeight: "bold" }}>{m.email}</td>
                      <td style={{ padding: "8px", textTransform: "capitalize" }}>{m.role}</td>
                      <td style={{ padding: "8px", fontSize: "0.85rem", opacity: 0.8 }}>
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right" }}>
                        {m.role !== "owner" && (
                          <button
                            className="comic-btn comic-btn-outline"
                            style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                            onClick={() => handleRevoke(m.id, m.email)}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
