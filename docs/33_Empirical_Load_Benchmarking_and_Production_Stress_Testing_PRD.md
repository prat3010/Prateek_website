# PRD 33 — Empirical Load Benchmarking & Production Stress-Testing Showcase

> **Document ID:** `PRD-33`  
> **Status:** Implemented & Verified  
> **Target Release:** Design System 2.0 / Retriever SaaS Integration  
> **Route:** [`/rag/benchmarks`](https://prateeq.in/rag/benchmarks)  
> **Quality Gate:** Gate 10 Zero-Toy Static AST Verified (0 Mocks, 100% Genuine Metrics)

---

## 1. Overview & Objective

Demonstrate authentic systems-engineering capability by providing public, reproducible, and empirical performance metrics for the **Retriever Cognitive Engine**.

Instead of superficial claims or synthetic animations, PRD-33 establishes an automated load testing harness that runs progressive concurrency sweeps (5, 10, 20 VUs) against Retriever's live infrastructure on Oracle Cloud VPS (`130.210.35.134`), capturing microsecond latency distributions ($P_{50}, P_{90}, P_{95}, P_{99}$), throughput (QPS), and rate-limiting thresholds.

---

## 2. Architecture & Data Flow

```
[ Automated Async Runner ]
  (scripts/run_load_benchmark.py)
              │
              ├──► [ Public HTTPS API: https://rag.prateeq.in ]
              │       ├── /health/readiness (PostgreSQL Connection Pool)
              │       ├── /health/liveness (ASGI Event Loop & Nginx)
              │       └── /v1/admin/tenants (Control Plane Routing)
              │
              ▼
[ Empirical Artifact Generator ]
  ├── docs/benchmarks/latest_benchmark_run.json
  ├── docs/benchmarks/EMPIRICAL_LOAD_BENCHMARK_REPORT.md
  │
  ▼ (Auto-Sync)
[ Portfolio Web Application ]
  ├── src/data/benchmark_results.json
  ├── src/components/rag/BenchmarkSection.tsx (Design System 2.0)
  ├── src/app/rag/benchmarks/page.tsx (Public Showcase Route)
  └── src/app/rag/page.tsx (Product Hero Badge & Embedded Section)
```

---

## 3. UI/UX Specifications (Design System 2.0)

### Dual-Theme Parity:
* **Azure Theme:** Cold-press watercolor paper (`#FAF9F6`), high-contrast dark graphite (`#2B2B36`), terracotta accents (`#E06D53`), and slate blue (`#3F6E91`).
* **Noir Theme:** Cyber-monospace obsidian glass (`#08080a`), cyan neon borders (`#00f0ff`), and glowing green status badges (`#39ff14`).
* **Zero Hardcoded Colors:** All layout elements use semantic tokens (`--color-text`, `--color-text-muted`, `--surface-card`, `--surface-elevated`, `--surface-glass-border`).

### Sensory Kinetics:
* Concurrency tier switches update numeric values via `@number-flow/react`.
* KPI cards utilize `<TiltCard maxAngle={2} glare={false}>`.
* Primary CTAs utilize `<MagneticButton strength={0.25}>`.
* Interactive latency distribution bars animate dynamically with cubic-bezier transitions.

---

## 4. Key Metrics & Findings Captured

* **5 Virtual Users:** 30 requests, 2.3 QPS, $P_{50} = 2,291.6\text{ ms}$, $P_{95} = 3,932.3\text{ ms}$, **0.00% error rate**.
* **10 Virtual Users:** 60 requests, 4.4 QPS, $P_{50} = 2,340.4\text{ ms}$, $P_{95} = 3,862.6\text{ ms}$, **0.00% error rate**.
* **20 Virtual Users (The Breaking Point):** 120 requests, 13.7 QPS, **75.83% throttled** by active Nginx rate limiter (`x-ratelimit-limit: 120 req/min`).

---

## 5. Automated Verification Gates

1. **Gate 10 Zero-Toy Static AST Audit:** Guaranteed zero mock classes, zero synthetic score equations, and zero simulated 200 responses.
2. **Next.js 16 Production Build:** Verified clean compilation across 52 static and dynamic routes.
3. **Reproducible Command:** One-line CLI reproduction:
   ```bash
   python3 scripts/run_load_benchmark.py --target https://rag.prateeq.in
   ```
