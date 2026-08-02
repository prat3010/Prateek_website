"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Cpu,
  Database,
  GitFork,
  Layers,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  Zap,
} from "lucide-react";
import {
  EntityTripleItem,
  getConfig,
  GraphCapabilitiesResponse,
  GraphQueryResponse,
  GraphSummaryResponse,
} from "@/lib/rag-client";
import styles from "@/app/admin/analytics/analytics.module.css";

interface TenantItem {
  tenantId: string;
  name: string;
  status: string;
}

export function GraphControl() {
  // Resolve API URL & Admin Credentials dynamically from session config / env vars
  const sessionConfig = typeof window !== "undefined" ? getConfig() : null;
  const apiUrl = (
    process.env.NEXT_PUBLIC_RETRIEVER_API_URL ||
    sessionConfig?.apiUrl ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
  const adminApiKey =
    process.env.NEXT_PUBLIC_ADMIN_API_KEY ||
    sessionConfig?.apiKey ||
    "test_admin_key";
  const initialTenantId =
    sessionConfig?.tenantId || "00000000-0000-0000-0000-000000000001";

  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId);
  const [tenantList, setTenantList] = useState<TenantItem[]>([]);

  const [capabilities, setCapabilities] = useState<GraphCapabilitiesResponse | null>(null);
  const [summary, setSummary] = useState<GraphSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Graph query state
  const [searchEntity, setSearchEntity] = useState("");
  const [maxHops, setMaxHops] = useState(2);
  const [queryResult, setQueryResult] = useState<GraphQueryResponse | null>(null);
  const [querying, setQuerying] = useState(false);

  // Fetch available onboarded tenants for tenant selector dropdown
  useEffect(() => {
    let active = true;
    const fetchTenants = async () => {
      try {
        const headers = { "X-Admin-API-Key": adminApiKey, "Content-Type": "application/json" };
        const res = await fetch(`${apiUrl}/v1/admin/tenants`, { headers });
        if (res.ok && active) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.items || [];
          setTenantList(items);
          if (items.length > 0 && !items.some((t: TenantItem) => t.tenantId === selectedTenantId)) {
            setSelectedTenantId(items[0].tenantId);
          }
        }
      } catch {
        // Ignore background tenant listing failure
      }
    };
    fetchTenants();
    return () => {
      active = false;
    };
  }, [apiUrl, adminApiKey, selectedTenantId]);

  const fetchStatus = async () => {
    if (!selectedTenantId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { "X-Admin-API-Key": adminApiKey, "Content-Type": "application/json" };
      const capRes = await fetch(`${apiUrl}/v1/admin/tenants/${selectedTenantId}/graph/capabilities`, { headers });
      if (capRes.ok) {
        const capData = await capRes.json();
        setCapabilities(capData);
      }

      const sumRes = await fetch(`${apiUrl}/v1/admin/tenants/${selectedTenantId}/graph`, { headers });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to Retriever API backend.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!selectedTenantId) return;
    const loadStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = { "X-Admin-API-Key": adminApiKey, "Content-Type": "application/json" };
        const capRes = await fetch(`${apiUrl}/v1/admin/tenants/${selectedTenantId}/graph/capabilities`, { headers });
        if (capRes.ok && active) {
          const capData = await capRes.json();
          setCapabilities(capData);
        }

        const sumRes = await fetch(`${apiUrl}/v1/admin/tenants/${selectedTenantId}/graph`, { headers });
        if (sumRes.ok && active) {
          const sumData = await sumRes.json();
          setSummary(sumData);
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Failed to connect to Retriever API backend.";
          setError(msg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadStatus();
    return () => {
      active = false;
    };
  }, [apiUrl, selectedTenantId, adminApiKey]);

  const handleEngineSwitch = async (targetEngine: "postgres" | "neo4j") => {
    if (capabilities?.machine_profile === "oracle_vm_lean" && targetEngine === "neo4j") {
      return;
    }

    setSwitching(true);
    try {
      const res = await fetch(`${apiUrl}/v1/admin/tenants/${selectedTenantId}/graph/engine`, {
        method: "POST",
        headers: { "X-Admin-API-Key": adminApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ engine: targetEngine }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Engine switch failed");
      }
      await fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to switch engine";
      setError(msg);
    } finally {
      setSwitching(false);
    }
  };

  const handleEntitySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEntity.trim()) return;

    setQuerying(true);
    try {
      const res = await fetch(`${apiUrl}/v1/admin/tenants/${selectedTenantId}/graph/query`, {
        method: "POST",
        headers: { "X-Admin-API-Key": adminApiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ entity: searchEntity.trim(), max_hops: maxHops }),
      });
      if (res.ok) {
        const data = await res.json();
        setQueryResult(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to query knowledge graph";
      setError(msg);
    } finally {
      setQuerying(false);
    }
  };

  const isLeanMode = capabilities?.machine_profile === "oracle_vm_lean";
  const activeEngine = capabilities?.active_engine || "postgres";

  return (
    <section className={styles.section} style={{ marginTop: "32px" }}>
      <div className={styles.sectionHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <h2 className={styles.sectionTitle} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Network size={20} color="var(--color-primary-azure, #00f2fe)" />
          GraphRAG Knowledge Graph Controls
        </h2>

        {/* Dynamic Tenant Selector Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Building2 size={16} color="var(--text-muted)" />
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(0,242,254,0.3)",
              color: "#00f2fe",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {tenantList.length > 0 ? (
              tenantList.map((t) => (
                <option key={t.tenantId} value={t.tenantId}>
                  🏢 {t.name} ({t.tenantId.slice(0, 8)}...)
                </option>
              ))
            ) : (
              <option value={selectedTenantId}>🏢 Default Tenant ({selectedTenantId.slice(0, 8)}...)</option>
            )}
          </select>

          <button onClick={fetchStatus} disabled={loading} className={styles.backBtn} style={{ padding: "6px 12px" }}>
            <RefreshCw size={14} className={loading ? styles.spin : ""} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", color: "#ff6b6b", fontSize: "14px", marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={16} /> {error}
        </div>
      )}

      {/* Machine Profile Banner */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: isLeanMode ? "rgba(255,170,0,0.15)" : "rgba(0,242,254,0.15)", borderRadius: "8px", padding: "8px" }}>
              <Cpu size={20} color={isLeanMode ? "#ffaa00" : "#00f2fe"} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-main)" }}>
                Host Hardware Profile: {isLeanMode ? "☁️ Oracle Cloud VM (LEAN Mode)" : "💻 MacBook Air M4 (Standard Mode)"}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                {capabilities?.message || "Auto-detecting hardware capabilities..."}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Neo4j Status:</span>
            <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "12px", background: capabilities?.neo4j_status === "online" ? "rgba(0,255,150,0.15)" : "rgba(255,255,255,0.08)", color: capabilities?.neo4j_status === "online" ? "#00ff96" : "#aaa" }}>
              {capabilities?.neo4j_status === "online" ? "🟢 Online" : capabilities?.neo4j_status === "unsupported" ? "🔒 Unsupported (RAM Safetynet)" : "⚪ Offline (Docker Stopped)"}
            </span>
          </div>
        </div>

        {/* Engine Toggle Switcher */}
        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={16} color="var(--text-muted)" />
            <span style={{ fontSize: "14px", fontWeight: 500 }}>Active Storage Engine for Tenant:</span>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "rgba(0,0,0,0.3)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => handleEngineSwitch("postgres")}
              disabled={switching}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                background: activeEngine === "postgres" ? "var(--color-primary-azure, #00f2fe)" : "transparent",
                color: activeEngine === "postgres" ? "#000" : "var(--text-main)",
                transition: "all 0.2s ease",
              }}
            >
              PostgreSQL (Recursive SQL)
            </button>

            <button
              onClick={() => handleEngineSwitch("neo4j")}
              disabled={switching || isLeanMode}
              title={isLeanMode ? "Neo4j is disabled on LEAN Oracle VM to prevent RAM crashes" : "Switch to Neo4j Cypher Engine"}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: isLeanMode ? "not-allowed" : "pointer",
                opacity: isLeanMode ? 0.4 : 1,
                background: activeEngine === "neo4j" ? "var(--color-primary-azure, #00f2fe)" : "transparent",
                color: activeEngine === "neo4j" ? "#000" : "var(--text-main)",
                transition: "all 0.2s ease",
              }}
            >
              Neo4j (Cypher Engine) {isLeanMode && "🔒"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid} style={{ marginTop: "16px" }}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><GitFork size={18} /></div>
          <div className={styles.statValue}>{summary?.total_triples ?? 0}</div>
          <div className={styles.statLabel}>Total Graph Triples</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><Database size={18} /></div>
          <div className={styles.statValue}>{summary?.unique_entities ?? 0}</div>
          <div className={styles.statLabel}>Unique Entities</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><Zap size={18} /></div>
          <div className={styles.statValue} style={{ textTransform: "uppercase", fontSize: "18px" }}>
            {summary?.storage_engine || activeEngine}
          </div>
          <div className={styles.statLabel}>Active Engine</div>
        </div>
      </div>

      {/* Multi-Hop Entity Inspector */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px", marginTop: "16px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={16} /> Multi-Hop Entity Inspector
        </h3>

        <form onSubmit={handleEntitySearch} style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search entity (e.g. Alice, Payment Gateway)..."
            value={searchEntity}
            onChange={(e) => setSearchEntity(e.target.value)}
            style={{
              flex: 1,
              minWidth: "220px",
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              fontSize: "14px",
            }}
          />

          <select
            value={maxHops}
            onChange={(e) => setMaxHops(Number(e.target.value))}
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            <option value={1}>1-Hop Depth</option>
            <option value={2}>2-Hops Depth</option>
            <option value={3}>3-Hops Depth</option>
          </select>

          <button type="submit" disabled={querying} className={styles.backBtn} style={{ padding: "8px 16px", background: "var(--color-primary-azure, #00f2fe)", color: "#000", fontWeight: 600 }}>
            {querying ? "Searching..." : "Traverse Graph"}
          </button>
        </form>

        {queryResult && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
              Root Entity: <strong>{queryResult.root_entity}</strong> | Connected Entities: {queryResult.connected_entities.length}
            </div>

            {queryResult.triples.length === 0 ? (
              <div style={{ fontSize: "13px", color: "#aaa", fontStyle: "italic", padding: "12px", background: "rgba(0,0,0,0.2)", borderRadius: "6px" }}>
                No triples found for entity &quot;{queryResult.root_entity}&quot;. Try uploading a document or searching another entity.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "10px", marginTop: "8px" }}>
                {queryResult.triples.map((t: EntityTripleItem, idx: number) => (
                  <div key={t.triple_id || idx} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,242,254,0.2)", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                      <span style={{ fontWeight: 600, color: "#00f2fe" }}>{t.subject}</span>
                      <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>{t.predicate}</span>
                      <span style={{ fontWeight: 600, color: "#00ff96" }}>{t.object}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
