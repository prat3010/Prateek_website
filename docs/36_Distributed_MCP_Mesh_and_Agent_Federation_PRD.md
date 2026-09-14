# PRD 36: Distributed Model Context Protocol (MCP) Mesh & Agent Federation

**Product Requirements Document (PRD)**  
**Milestone:** M115 (`v1.5.0-alpha1`)  
**Ecosystem Layer:** Cognitive Multi-Agent Systems & Tool Protocols  
**Platform Battery:** #30 (`distributed_mcp_mesh`)  
**Target Surface:** Retriever Cognitive Engine (`apps/api`), Decoupled SDKs, and SaaS Studio Workspace (`/rag/app?tab=mcp`)

---

## 1. Executive Summary

Milestone 115 introduces **Platform Battery #30: Distributed Model Context Protocol (MCP) Mesh & Agent Federation**, elevating Retriever from a single-node tool server to an enterprise decentralized agent federation network.

It solves three critical enterprise AI challenges:
1. **Sovereignty & Data Residency:** Sensitive tools and data enclaves remain physically hosted on regional sovereign clusters (e.g. EU GDPR enclaves), while remaining securely invokable by global AI agents.
2. **Cryptographic Zero-Trust Defense:** Inter-cluster tool execution and agent sub-task delegation require signed HMAC-SHA256 trust envelopes with sliding-window nonce deduplication, preventing spoofing and replay attacks.
3. **Circular Loop Breakers:** Pure domain recursion guards enforce strict depth limits and circular path detection, preventing runaway agentic loops and token exhaustion.

---

## 2. Core Capabilities & Architecture

### 2.1 Decentralized MCP Mesh Topology
- Peer nodes register via `/v1/mesh/nodes/register` with roles (`SEED_GATEWAY`, `SOVEREIGN_NODE`, `EDGE_ENCLAVE`, `REMOTE_PEER`).
- Nodes broadcast heartbeat pings every 30s. Liveness leases expire after 120s of inactivity, marking the node `UNREACHABLE`.
- Dynamic capability advertisement aggregates unique tools across all online clusters.

### 2.2 Latency-Weighted Routing
- Routing policies supported:
  - `local_first`: Prefer local in-process batteries if available; route remote otherwise.
  - `lowest_latency`: Select the online peer node with minimum ping latency.
  - `failover`: Primary node with automated replica fallback.

### 2.3 Cryptographic Trust Envelopes
$$\text{Signature} = \text{HMAC-SHA256}(K, \text{sender} \parallel \text{receiver} \parallel \text{tenant} \parallel \text{nonce} \parallel \text{timestamp} \parallel \text{payload\_hash})$$
- Timestamp skew allowed: $\le 60.0$ seconds.
- Nonce sliding-window deduplication eliminates replay attempts.

### 2.4 Cross-Cluster Agent Federation
- A parent ReAct reasoning loop (or Swarm Quorum agent) delegates sub-goals to specialist roles on remote clusters via `POST /v1/mesh/federation/delegate`.
- Anti-loop recursion breaker:
  - Halts execution if `target_cluster_id in visited_clusters` (`FederationLoopError`).
  - Halts execution if `len(visited_clusters) >= max_depth` (`max_depth` capped at 3).
- Remote cluster sub-agent executes bounded local tools and returns a cryptographically signed completion synthesis with step-by-step trace audits.

---

## 3. UI & Control Plane Integration

The SaaS Studio Workspace (`src/components/rag/McpPanel.tsx`) at `/rag/app?tab=mcp` provides a 3-tab segmented interface:
1. **Distributed MCP Mesh View:** Visual cards for all cluster nodes, latency badges, advertised tools pills, and a live distributed tool execution dispatcher.
2. **Cross-Cluster Agent Federation View:** Interactive delegation cockpit with cluster selector, specialist role picker, intent textarea, depth limit slider, and simulated circular loop breaker testing.
3. **IDE Config & Stdio View:** 1-click JSON configuration snippets for Cursor Composer, Claude Desktop, and VS Code Cline.

**Design System 2.0 Invariants:**
- Full dual-theme parity across Azure (cold-press `#FAF9F6` paper, dark graphite `#2B2B36`) and Noir (cyber-monospace `#08080a` obsidian glass, glowing cyan `#00f0ff`).
- Dynamic counters using `@number-flow/react`.
- `<MagneticButton>` sensory kinetics on primary dispatch buttons.

---

## 4. Verification & Quality Gates

- **Unit Tests:** Pytest `apps/api/tests/test_mcp_mesh.py` (Hexagonal purity, Battery #30 registration, node lifecycle, routing, trust envelopes, circular loop detection, REST endpoints).
- **Frontend Tests:** Vitest `src/components/rag/__tests__/McpPanel.test.tsx` (renders topology, dispatches distributed tool, tests federation delegation and circular loop breaker).
- **TypeScript:** 100% type safety via `tsc --noEmit`.
- **Zero-Toy Audit:** 100% compliant with zero synthetic facades via `audit_zero_toy.py`.
