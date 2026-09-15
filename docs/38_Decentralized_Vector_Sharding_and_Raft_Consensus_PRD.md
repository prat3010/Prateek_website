# 38. Decentralized Multi-Tenant Vector Sharding & Distributed Raft Consensus PRD

> **Product Requirement Document (PRD 38)**  
> **Milestone:** Milestone 117 (`v1.7.0-alpha1`)  
> **Platform Battery:** #32 (`vector_raft_sharding`)  
> **Target Repositories:** `retriever` & `Prateek_website`  
> **Status:** Production  

---

## 1. Executive Summary & Objective

In massive enterprise knowledge vaults, storing and indexing millions of document vectors on a single database node leads to memory saturation (RAM needed for HNSW graphs), write latency spikes, and single-point-of-failure vulnerabilities.

**Milestone 117** implements horizontal vector index sharding combined with an in-process **Distributed Raft Consensus state machine** and **parallel scatter-gather query execution**.

---

## 2. Technical Architecture

### 2.1 Consistent Virtual-Node Hashing
- 32-bit FNV-1a hash ring: $[0, 2^{32}-1]$.
- 64 virtual nodes (`vnodes`) per shard partition ensuring uniform vector distribution.
- Support for dedicated tenant isolation or shared uniform partitioning.

### 2.2 Raft Consensus State Machine
- Monotonic term progression and leader lease tracking.
- Randomized election timeouts (150–300ms) with heartbeat intervals (50ms).
- Append-only `replicated_log` requiring majority quorum ($\lfloor N/2 \rfloor + 1$) for commits.

### 2.3 Scatter-Gather Parallel Vector Query
- Concurrent async query fan-out across shard partitions.
- Tunable read consistency quorums: `LOCAL`, `ONE`, `QUORUM`, `ALL`.
- Global Reciprocal Rank Fusion (RRF) and deduplication by `chunk_id`.

### 2.4 Online Shard Rebalancing
- Skew detection measuring vector distribution standard deviation across nodes.
- 2-phase migration (snapshot transfer + delta log catchup + atomic cutover) with zero query downtime.

---

## 3. UI/UX Design System 2.0 Invariants (`VectorShardingPanel.tsx`)

- **Dual-Theme Parity:** Full contrast and styling support across both **Azure** (cold-press `#FAF9F6` paper, `#FFFFFF` cards, slate blue `#3F6E91`, dark graphite `#2B2B36`) and **Noir** (obsidian glass `#08080a`, glowing cyan `#00f0ff`, neon green `#39ff14`).
- **Semantic CSS Tokens:** Exclusively uses `--color-text`, `--surface-card`, `--surface-elevated`, `--surface-glass-border`, `--badge-active-*`.
- **Sensory Kinetics:** Magnetic CTAs `<MagneticButton strength={0.25}>`, Framer Motion spring tab pills (`shardingTabPill`).
- **4 Dedicated Sub-Views:**
  1. *Shard Ring & Topology:* Partition cards with hash ranges, replica health, and capacity metrics.
  2. *Raft Consensus State:* Live participant table, term counts, quorum health, and replicated log ledger.
  3. *Scatter-Gather Benchmark:* Live query tester with tunable read quorum, per-shard latency breakdown, and globally merged results.
  4. *Cluster Rebalancer:* Node skew visualization and 1-click online rebalancing trigger.

---

## 4. Verification & Testing Standards

- **Pytest Suite:** `apps/api/tests/test_vector_raft_sharding.py` (9/9 passed).
- **Vitest Suite:** `src/components/rag/__tests__/VectorShardingPanel.test.tsx` (5/5 passed).
- **Zero-Toy Invariant Gate:** Authentic hash math, real Raft state machine, and real cosine similarity (0 violations across 323 production files).
- **Decoupled SDK Parity:** TypeScript (`@prat3010/retriever-client`) and Python (`retriever-python`) client libraries.
