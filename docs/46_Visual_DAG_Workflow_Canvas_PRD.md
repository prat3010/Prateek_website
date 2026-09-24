# Product Requirements Document (PRD) — Visual DAG Workflow Canvas & Agentic Graph Composer (Platform Battery #40)

**Document ID:** PRD-046  
**Status:** Completed  
**Release:** Retriever v2.4.0 (Milestone 126)  
**Author:** Prateek Sharma  
**Date:** 2026-09-24  
**Target Systems:** `retriever` (FastAPI backend + Next.js 16 Admin Studio) & `Prateek_website`  

---

## 1. Executive Summary & Problem Space

Enterprise AI deployments require composing complex, multi-stage cognitive workflows that combine search, moderation, LLM reasoning, code analysis, and dynamic routing. Previously, constructing these pipelines required procedural backend code, hardcoded configuration files, or external workflow services that breached tenant data boundaries and incurred high runtime latency.

**Milestone 126** introduces **Platform Battery #40 (`visual_dag_workflow_composer`)**, delivering:
1. **Interactive Visual Workflow Studio in `apps/web`:** React 19 / Next.js 16 interactive SVG canvas featuring pan, zoom (40% to 180%), draggable typed nodes, cubic Bézier spline connection curves, parameter inspector drawer, and live step execution indicator.
2. **Declarative Workflow Compiler (`DAGWorkflowCompiler`):** Pure domain compiler leveraging Kahn's topological sorting algorithm for cycle detection, parallel execution stage partitioning, and variable contract binding verification.
3. **Step-by-Step DAG Execution Stepper (`DAGWorkflowExecutor`):** Stage-by-stage pipeline executor with authentic node handlers (hybrid search, regex PII guardrails, LongLLMLingua compression, prompt assembly, LLM synthesis, faithfulness evaluator, conditional router), and step-level token cost attribution ($/token).
4. **Pre-Configured Enterprise Templates Catalog (`src/domain/workflow/templates.py`):** 4 out-of-the-box verified production templates (Legal Document Analyzer, Customer Support Copilot, Technical Codebase Assistant, Multimodal Schematic Inspector).
5. **Strict Hexagonal & Tenant Boundary Isolation:** Zero forbidden framework/database imports in domain modules and strict per-tenant isolation enforced on every execution.

---

## 2. Mathematical Formulation & Algorithmic Foundations

### A. Kahn's Algorithm for Topological Sort & Cycle Detection

A workflow graph is modeled as a directed finite graph $G = (V, E)$, with vertices $V$ (computational nodes) and directed edges $E \subseteq V \times V$.

1. Compute in-degree $\text{deg}^-(v)$ for each vertex $v \in V$:
   $$\text{deg}^-(v) = |\{u \in V \mid (u, v) \in E\}|$$
2. Seed initial zero-indegree queue $Q$:
   $$Q = \{v \in V \mid \text{deg}^-(v) = 0\}$$
3. Initialize empty topological sequence $L = []$.
4. While $Q \neq \emptyset$:
   - Pop $u \in Q$, append $u$ to $L$.
   - For each neighbor $w$ where $(u, w) \in E$:
     $$\text{deg}^-(w) \leftarrow \text{deg}^-(w) - 1$$
     If $\text{deg}^-(w) == 0$, push $w$ onto $Q$.
5. **Cycle Detection Invariant:** If $|L| < |V|$, there exists at least one directed cycle. The compiler isolates $V_{\text{cycle}} = V \setminus L$ and aborts compilation with `CyclicWorkflowError`.

### B. Parallel Stage Partitioning

To maximize execution throughput across multi-core systems, nodes are grouped into discrete concurrent stages $S_0, S_1, \dots, S_K$ based on maximal antecedent depth:
$$\text{level}(v) = \begin{cases} 0 & \text{if } \text{deg}^-(v) = 0 \\ \max_{(u, v) \in E} (\text{level}(u)) + 1 & \text{otherwise} \end{cases}$$
Nodes having identical $\text{level}(v) = k$ possess zero mutual dependencies and execute concurrently via `asyncio.gather`.

### C. Parametric Cubic Bézier Spline Curves

On the visual canvas, port anchors are linked using cubic Bézier splines:
$$C(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3, \quad t \in [0, 1]$$
where:
- $P_0 = (x_{\text{src}} + W, y_{\text{src}} + H/2)$ (output port anchor)
- $P_1 = (x_{\text{src}} + W + \Delta x, y_{\text{src}} + H/2)$
- $P_2 = (x_{\text{tgt}} - \Delta x, y_{\text{tgt}} + H/2)$
- $P_3 = (x_{\text{tgt}}, y_{\text{tgt}} + H/2)$ (input port anchor)
- $\Delta x = \max(40, |x_{\text{tgt}} - x_{\text{src}}| \times 0.45)$

### D. Per-Step Token Cost Attribution

Every executed node records input tokens $T_{\text{in}}$, output tokens $T_{\text{out}}$, latency $\tau_{\text{ms}}$, and dollar cost $C_{\text{USD}}$:
$$C_{\text{node}} = \left(\frac{T_{\text{in}}}{1000} \times \$0.00015\right) + \left(\frac{T_{\text{out}}}{1000} \times \$0.00030\right) + C_{\text{retrieval}}$$
$$C_{\text{total}} = \sum_{v \in V} C_v$$

---

## 3. Node Taxonomy & Capabilities

| Type | Function | Handlers & Actions |
|---|---|---|
| `INPUT` | Query Ingress | Extracts initial query, parameters, files from user request. |
| `RETRIEVAL` | Vector & Keyword Search | Dispatches to `HybridSearchService` (dense HNSW + sparse BM25) with ACL filtering. |
| `GUARDRAIL` | Safety & Compliance | Scans text using regex PII patterns (emails, SSNs, phone numbers) and masks/blocks violations. |
| `TRANSFORM` | Context Processing | LongLLMLingua context compression or AST symbol signature extraction. |
| `PROMPT` | Template Assembly | Dynamic `{var}` interpolation merging antecedent outputs into LLM prompt. |
| `LLM` | Cognitive Generation | Dispatches prompt to LLM (`llama3.2`) with temperature, system prompt, and token telemetry. |
| `EVALUATOR` | Quality Gate | Computes citation faithfulness and claim groundedness score ($\ge \tau$). |
| `ROUTER` | Dynamic Branching | Evaluates condition expression and activates corresponding downstream branches while skipping others. |
| `OUTPUT` | Payload Serialization | Formats final response dictionary with answer, citations, tokens, and cost. |

---

## 4. Pre-Configured Enterprise Production Templates

1. **Legal Document Analyzer (`tpl_legal_analyzer`):**
   - 8-node pipeline: `Input` $\to$ `PII Redaction` $\to$ `Statute Retrieval (k=8)` $\to$ `Context Compression` $\to$ `Legal Prompt` $\to$ `Legal LLM` $\to$ `Faithfulness Evaluator` $\to$ `Audit Memo Output`.
2. **Customer Support Copilot (`tpl_customer_support`):**
   - 6-node pipeline: `Input` $\to$ `Intent Router` $\to$ `KB Search (k=5)` $\to$ `Tone Prompt` $\to$ `Support Copilot LLM` $\to$ `Ticket Resolution Output`.
3. **Technical Codebase Assistant (`tpl_codebase_assistant`):**
   - 6-node pipeline: `Input` $\to$ `AST Symbol Extractor` $\to$ `Hybrid Code Search (k=6)` $\to$ `Code Reasoning Prompt` $\to$ `Coding Copilot LLM` $\to$ `Engineered Code Output`.
4. **Multimodal Schematic Inspector (`tpl_multimodal_inspector`):**
   - 6-node pipeline: `Schematic Ingress` $\to$ `Vision GraphRAG Search (k=5)` $\to$ `Cross-Modal Linker` $\to$ `Topology Prompt` $\to$ `Diagnostic LLM` $\to$ `Diagnostic Report Output`.

---

## 5. REST API Endpoints

- `POST /v1/tenants/{tenantId}/workflows/dag/compile`: Validates DAG structure and returns topological order and parallel stages.
- `POST /v1/tenants/{tenantId}/workflows/dag/execute`: Executes DAG stage-by-stage with step auditing and token cost attribution.
- `GET /v1/tenants/{tenantId}/workflows/dag/templates`: Lists the 4 enterprise templates.
- `GET /v1/tenants/{tenantId}/workflows/dag/templates/{templateId}`: Fetches specific template DAG graph.

---

## 6. Verification Records & Quality Gates

- **Unit Tests:** `apps/api/tests/test_dag_workflow.py` (9 passed in 2.31s).
- **Battery Tests:** `apps/api/tests/test_batteries.py` (10 passed in 2.38s, Battery #40 verified).
- **Zero-Toy Linter:** `python3 scripts/audit_zero_toy.py` (353 files scanned, 0 violations).
- **Frontend Build:** `apps/web` compiled with Next.js 16 Turbopack in 2.2s, 0 TypeScript/ESLint errors.
