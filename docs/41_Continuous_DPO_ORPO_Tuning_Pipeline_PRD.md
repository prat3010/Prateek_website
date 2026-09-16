# 41. Automated Continuous DPO / ORPO Model Fine-Tuning Pipeline PRD

> **Product Requirement Document (PRD 41)**  
> **Milestone:** Milestone 120 (`v1.9.0-alpha2`)  
> **Platform Battery:** #35 (`continuous_preference_tuning`)  
> **Category:** `ML_INTELLIGENCE`  
> **Target Repositories:** `retriever` & `Prateek_website`  
> **Status:** Production  

---

## 1. Executive Summary & Objective

Modern frontier RAG systems operate in dynamic enterprise environments where static base foundation models (`meta-llama/Llama-3-8B-Instruct`, `mistralai/Mistral-7B-Instruct`, `Qwen/Qwen2.5-7B-Instruct`) exhibit subtle stylistic misalignment, citation hallucinations, or verbose failure modes on specialized enterprise terminology. While prompt engineering and few-shot examples mitigate initial errors, true alignment requires continuous fine-tuning on real user preferences.

Historically, Reinforcement Learning from Human Feedback (RLHF) required complex multi-stage pipelines: training a separate reward model, performing unstable Proximal Policy Optimization (PPO), and maintaining multiple GPU memory copies. 

**Milestone 120** solves this by establishing **Platform Battery #35: `continuous_preference_tuning`**, an enterprise-grade automated pipeline for continuous Direct Preference Optimization (DPO) and Odds Ratio Preference Optimization (ORPO):

1. **Autonomous Preference Harvesting**:
   - Collects pairwise feedback $(x, y_w, y_l)$ directly from production user interactions: 👍/👎 ratings, regenerated queries, and explicit domain corrections.
   - Deduplicates prompts and buffers pairs per tenant until an automated training threshold (e.g. 20 pairs) is satisfied.
2. **Authentic Mathematical Alignment Engines**:
   - **Direct Preference Optimization (DPO)**: Optimizes the Bradley-Terry implicit reward formulation without a separate reward model:
     $$\mathcal{L}_{DPO}(\theta; \pi_{ref}) = -\mathbb{E}_{(x, y_w, y_l)} \left[ \log \sigma \left( \beta \log \frac{\pi_\theta(y_w | x)}{\pi_{ref}(y_w | x)} - \beta \log \frac{\pi_\theta(y_l | x)}{\pi_{ref}(y_l | x)} \right) \right]$$
   - **Odds Ratio Preference Optimization (ORPO)**: Monolithic reference-free preference alignment combining supervised cross-entropy with a log odds ratio penalty:
     $$\mathcal{L}_{ORPO}(\theta) = \mathcal{L}_{SFT}(\theta) + \lambda_{ORPO} \cdot \mathcal{L}_{odds}(\theta)$$
3. **Automated Validation Gate & Atomic Checkpoint Rollback**:
   - Every completed fine-tuning run is benchmarked against a held-out validation split ($\ge 75\%$ preference accuracy requirement).
   - Hot-swappable parameter-efficient fine-tuning (LoRA $r=16, \alpha=32$) with 1-click atomic rollback to prior stable checkpoints.
4. **SaaS App Studio Cockpit**:
   - 4-subview unified dashboard (`ContinuousTuningPanel.tsx`) under Design System 2.0 dual-theme aesthetics (Azure & Noir), complete with an interactive DPO/ORPO mathematical loss simulator.

---

## 2. Technical Architecture & Data Flow

```mermaid
graph TD
    subgraph ClientInteraction["1. Continuous Preference Harvesting"]
        User[End User / Domain Expert] -->|Chat Query x| ChatAPI[/v1/chat]
        ChatAPI --> AssistantResp[Model Response]
        User -->|👍 Upvote / 👎 Downvote / Correction| HarvestAPI[/v1/tenants/{tenantId}/tuning/pairs]
        HarvestAPI --> Buffer[(Tenant Preference Buffer)]
    end

    subgraph TriggerEvaluation["2. Continuous Trigger & State Machine"]
        Buffer -->|Pairs >= Threshold (e.g. 20)| AutoTrigger{Buffer >= 20?}
        AutoTrigger -->|Yes| QueueJob[State: QUEUED]
        QueueJob --> RunTraining[State: TRAINING]
    end

    subgraph OptimizationEngine["3. Mathematical Alignment (DPO / ORPO)"]
        RunTraining --> Splitting[Train Split 80% / Held-out Eval Split 20%]
        Splitting --> LossCalc{Objective}
        LossCalc -->|DPO| DPOMath["L_DPO = -log σ(β · Δr)"]
        LossCalc -->|ORPO| ORPOMath["L_ORPO = L_SFT + λ · L_odds"]
        DPOMath --> LoRAWeights[PEFT LoRA Adapter r=16, α=32]
        ORPOMath --> LoRAWeights
    end

    subgraph ValidationAndServing["4. Automated Validation Gate & Serving"]
        LoRAWeights --> EvalGate{Val Accuracy >= 0.75?}
        EvalGate -->|Passed| Registry[(LoRA Checkpoint Registry)]
        EvalGate -->|Failed| AlertAdmin[State: FAILED (Gate Rejected)]
        Registry --> HotSwap[Zero-Downtime Hot Promotion]
        HotSwap --> ProductionInference[Tenant Serving Model]
        ProductionInference -.->|Rollback Trigger| RollbackCheck[Atomic Rollback to Prior LoRA]
    end
```

---

## 3. Mathematical Foundations

### 3.1 Direct Preference Optimization (DPO)
Under the Bradley-Terry preference model, the probability that response $y_w$ is preferred over $y_l$ given prompt $x$ is:
$$p^*(y_w \succ y_l | x) = \sigma(r^*(x, y_w) - r^*(x, y_l))$$

Rafailov et al. (2023) showed that the ground-truth reward can be expressed analytically through the optimal policy $\pi^*$ and a reference policy $\pi_{ref}$:
$$r(x, y) = \beta \log \frac{\pi_\theta(y | x)}{\pi_{ref}(y | x)}$$

The reward margin $\Delta r$ is given by:
$$\Delta r = \beta \left[ \log \frac{\pi_\theta(y_w | x)}{\pi_{ref}(y_w | x)} - \log \frac{\pi_\theta(y_l | x)}{\pi_{ref}(y_l | x)} \right]$$

The loss is minimized via maximum likelihood:
$$\mathcal{L}_{DPO} = -\log \sigma(\Delta r) = \log (1 + e^{-\Delta r})$$

### 3.2 Odds Ratio Preference Optimization (ORPO)
Hong et al. (2024) introduced ORPO to remove the requirement of maintaining a frozen reference model $\pi_{ref}$ in GPU VRAM during training. The odds of generation are defined as:
$$\text{Odds}_\theta(y | x) = \frac{\pi_\theta(y | x)}{1 - \pi_\theta(y | x)}$$

The Odds Ratio between preferred response $y_w$ and rejected response $y_l$ is:
$$\text{OR}_\theta(y_w, y_l | x) = \frac{\text{Odds}_\theta(y_w | x)}{\text{Odds}_\theta(y_l | x)}$$

The monolithic ORPO objective combines standard supervised negative log-likelihood with the log odds penalty:
$$\mathcal{L}_{ORPO} = -\log \pi_\theta(y_w | x) - \lambda_{ORPO} \cdot \log \sigma \left( \log \text{OR}_\theta(y_w, y_l | x) \right)$$

---

## 4. REST API Endpoint Specifications

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/tuning/health` | Public | Battery health, active device, and supported objectives |
| `GET` | `/v1/tenants/{tenant_id}/tuning/config` | Tenant API Key | Retrieve tenant tuning hyperparameters and active adapter |
| `PUT` | `/v1/tenants/{tenant_id}/tuning/config` | Tenant API Key | Update auto-train toggle, learning rate, beta, and trigger threshold |
| `GET` | `/v1/tenants/{tenant_id}/tuning/pairs` | Tenant API Key | Paginated list of harvested preference pairs |
| `POST` | `/v1/tenants/{tenant_id}/tuning/pairs` | Tenant API Key | Ingest a new preference pair (auto-dispatches if threshold reached) |
| `DELETE` | `/v1/tenants/{tenant_id}/tuning/pairs/{pair_id}` | Tenant API Key | Delete a pair from the buffer |
| `POST` | `/v1/tenants/{tenant_id}/tuning/jobs` | Tenant API Key | Manually trigger a DPO, ORPO, or KTO fine-tuning run |
| `GET` | `/v1/tenants/{tenant_id}/tuning/jobs` | Tenant API Key | List historical and active fine-tuning jobs |
| `GET` | `/v1/tenants/{tenant_id}/tuning/jobs/{job_id}` | Tenant API Key | Inspect job status, loss curve steps, and validation gate |
| `POST` | `/v1/tenants/{tenant_id}/tuning/jobs/{job_id}/promote` | Tenant API Key | Promote a verified LoRA adapter checkpoint to active serving |
| `POST` | `/v1/tenants/{tenant_id}/tuning/rollback` | Tenant API Key | Atomic 1-click rollback of active adapter to prior checkpoint |
| `POST` | `/v1/tuning/math/simulate` | Public / Key | Mathematical verification simulator for DPO / ORPO calculations |

---

## 5. SaaS App Studio Cockpit (`ContinuousTuningPanel.tsx`)

Mounted as the **`🧠 Continuous DPO / ORPO Tuning`** tab in `/rag/app`:

- **Sub-View 1: Preference Dataset Curator**:
  - Live buffer inspection with prompt deduplication and verification tags.
  - Side-by-side winning ($y_w$, emerald border) vs losing ($y_l$, ruby border) response inspection.
  - Interactive "Harvest Preference Pair" modal enclosed in `<Portal>` to escape CSS containing blocks.
- **Sub-View 2: Continuous Training Jobs & Convergence**:
  - Visual tracking of the job state machine: `COLLECTING` $\to$ `QUEUED` $\to$ `TRAINING` $\to$ `EVALUATING` $\to$ `COMPLETED`.
  - Step-by-step epoch loss table displaying training loss, Bradley-Terry reward margin ($\Delta r$), pair accuracy, and odds ratio multiplier.
  - Automated Evaluation Gate pass/fail badge (validation accuracy $\ge 75\%$).
- **Sub-View 3: Adapter Governance & Rollback**:
  - Active LoRA serving banner mapped over the base foundation model.
  - Historical checkpoint cards with 1-click hot promotion.
  - 1-click atomic rollback to instantly revert an adapter without restarting backend inference services.
- **Sub-View 4: Interactive DPO / ORPO Math Simulator**:
  - Real-time parameter sliders for temperature $\beta$, ORPO regularization $\lambda_{ORPO}$, policy winning/losing probabilities, and reference probabilities.
  - Instant LaTeX-aligned computation of implicit rewards, reward margin, DPO loss, odds ratios, and monolithic ORPO loss.

---

## 6. Verification & Quality Gates

- **Unit & Integration Testing**:
  - `retriever`: 10/10 automated tests in `apps/api/tests/test_continuous_tuning.py` verifying mathematical bounds, buffer thresholds, validation gates, and rollbacks.
  - `Prateek_website`: 4/4 Vitest tests in `src/components/rag/__tests__/ContinuousTuningPanel.test.tsx` verifying tab navigation, math simulation, and modal harvesting.
- **Zero-Toy Invariant (Gate 10)**:
  - 100% genuine mathematical calculations without fake timer facades or hardcoded heuristics.
- **TypeScript & Lint Integrity**:
  - `npx tsc --noEmit` clean (0 errors).
  - `npm run lint` clean (0 warnings).
  - Full dual-theme parity across Azure and Noir.
