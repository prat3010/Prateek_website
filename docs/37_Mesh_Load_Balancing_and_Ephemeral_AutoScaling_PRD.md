# PRD 37: Autonomous Mesh Dynamic Load-Balancing & Ephemeral Enclave Auto-Scaling

**Product Requirements Document (PRD)**  
**Milestone:** M116 (`v1.6.0-alpha1`)  
**Ecosystem Layer:** Distributed Mesh & Elastic Sovereign Compute  
**Platform Battery:** #31 (`mesh_load_balancer`)  
**Target Surface:** Retriever Cognitive Engine (`apps/api`), Decoupled SDKs, and SaaS Studio Workspace (`/rag/app?tab=mcp`)

---

## 1. Executive Summary

Milestone 116 introduces **Platform Battery #31: Autonomous Mesh Dynamic Load-Balancing & Ephemeral Enclave Auto-Scaling**, enhancing the Distributed MCP Mesh (M115) with mathematical load balancing, adaptive latency decay, and autonomous scale-to-zero enclave management.

It eliminates three major production bottlenecks:
1. **Traffic Stampedes & Hotspotting:** Naive lowest-latency routing drives sudden bursts to a single server. M116 deploys the **Power-of-Two-Choices (P2C)** algorithm to distribute load evenly across candidate nodes with minimal overhead.
2. **Static Resource Wastage:** Rather than paying for 24/7 idle edge hardware, ephemeral enclaves scale out dynamically under cluster pressure and **reap to zero** after 300s of inactivity.
3. **Cascading Overload:** Saturated clusters enforce an adaptive 95% slot utilization ceiling, gracefully shedding load with HTTP 429 status codes instead of crashing worker threads.

---

## 2. Core Capabilities & Architecture

### 2.1 Power-of-Two-Choices (P2C) Load Balancing
- Evaluates $N \ge 2$ nodes advertising the requested MCP tool.
- Randomly samples 2 candidates ($A, B$) and computes their composite load score:
  $$\text{LoadScore} = \text{EWMA} \times (1 + \text{QueueDepth}) \times \left(1 + \frac{\text{ActiveSlots}}{\text{MaxSlots}}\right) \times \text{StatusPenalty}$$
- Routes to the lower score candidate, preventing thundering herds and eliminating $O(N)$ sorting bottlenecks.

### 2.2 EWMA Latency Decay ($\alpha = 0.2$)
- Replaces static ping intervals with real observed execution duration.
- Execution slots are reserved via `acquire_slot` and released in a `finally` block:
  $$\text{EWMA}_t = \alpha \cdot \text{SampleLatency} + (1 - \alpha) \cdot \text{EWMA}_{t-1}$$
- Smoothes transient network spikes while rapidly responding to sustained latency degradation.

### 2.3 Autonomous Scaling & Scale-to-Zero Lifecycle
- `evaluate_autoscaling(cluster_id)` executes periodic or demand-driven evaluation:
  - **Scale-Up:** Triggered when cluster utilization $\ge 80\%$, queue depth $\ge 10$, or average EWMA $\ge 250$ms (up to `max_ephemeral_enclaves`).
  - **Scale-to-Zero Reaping:** Ephemeral enclaves with 0 active execution slots idle for $\ge 300$ seconds are autonomously terminated and unregistered.
  - **Load Shedding:** If all candidate nodes exceed 95% slot saturation, `MeshLoadSheddingError` is raised with HTTP 429 Too Many Requests.

---

## 3. SaaS Studio Control Plane (`/rag/app?tab=mcp`)

The Studio MCP Workspace incorporates Sub-View 4: **Dynamic Load & Enclaves (Battery #31)**:
- **Cluster Capacity Overview Cards:** Real-time Active Slots / Max Slots, Cluster Saturation %, EWMA Latency, and Ephemeral Enclave Count with smooth `@number-flow/react` transitions.
- **Node Capacity & Concurrency Visualizer:** Visual slot utilization progress bars, CPU %, queue depth counters, and idle timers per node.
- **Autoscaling Policy Tuner:** Interactive sliders for Scale-Up Utilization Threshold (50-90%), Scale-Down Idle Timeout (30-600s), and Max Ephemeral Enclaves (1-10) with immediate synchronization to the backend.
- **Manual Enclave Reaping Action:** Trigger manual scale-down evaluation across clusters with feedback notifications.
- **Live Autoscaling Audit Ledger:** Chronological event stream recording all `SCALE_UP`, `SCALE_DOWN`, `SHED_LOAD`, and `REBALANCE` actions with trigger metrics and timestamps.

---

## 4. Decoupled Client SDKs

The decoupled SDKs (`@prat3010/retriever-client` and `retriever-python`) expose first-class APIs for cluster load inspection, autoscaling policy management, and ephemeral enclave lifecycle:
- `getMeshLoadMetrics()` / `get_mesh_load_metrics()`
- `getAutoscalingEvents(limit)` / `get_autoscaling_events(limit)`
- `updateAutoscalingPolicy(policy)` / `update_autoscaling_policy(policy)`
- `reportNodeCapacityTelemetry(nodeId, metrics)` / `report_node_capacity_telemetry(node_id, metrics)`
- `reapIdleEnclaves(clusterId)` / `reap_idle_enclaves(cluster_id)`

---

## 5. Verification & Zero-Toy Compliance

- **Automated Quality Gates:** 100% green across all 10 verification gates (`./scripts/verify.sh`).
- **Pytest Suite:** `apps/api/tests/test_mesh_load_balancer.py` verifies P2C selection math, EWMA latency decay, slot tracking, 95% load shedding, autonomous scale-up/scale-down, and REST endpoints.
- **Vitest Suite:** `src/components/rag/__tests__/McpPanel.test.tsx` validates sub-view navigation, policy updates, and manual reaping actions.
- **Hexagonal Boundary Rule:** `src/domain/mcp/load_balancer_service.py` contains 0 framework dependencies.
