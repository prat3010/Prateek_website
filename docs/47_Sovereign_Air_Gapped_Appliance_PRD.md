# Product Requirements Document (PRD) — Sovereign Air-Gapped Appliance & Embedded Edge Engine (Platform Battery #41)

**Document ID:** PRD-047  
**Status:** Completed  
**Release:** Retriever v2.5.0 (Milestone 127)  
**Author:** Prateek Sharma  
**Date:** 2026-09-24  
**Target Systems:** `retriever` (FastAPI backend + Next.js 16 Admin Studio) & `Prateek_website`  

---

## 1. Executive Summary & Problem Space

Regulated enterprise operators—spanning defense agencies, critical infrastructure SCADA environments, maritime and tactical edge deployments, intelligence communities, and sovereign banking enclaves—operate under strict physical and logical **air-gap mandates**.

In these environments:
1. **Zero Internet Egress:** Systems must operate with zero outbound connections to external cloud APIs, vector clouds, or remote CDNs.
2. **Physical Capture & Tamper Protection:** Devices deployed to the tactical edge face physical extraction risks. On-disk vector stores, document chunks, and embeddings must be cryptographically sealed to host silicon hardware roots of trust (TPM 2.0 / Apple Secure Enclave).
3. **Autonomous Self-Sufficiency:** The system must run completely self-contained with embedded storage (SQLite FTS5 + Vector BLOBs) and local neural voice models (Whisper ASR + Piper TTS) with zero external microservice dependencies.

**Milestone 127** introduces **Platform Battery #41 (`sovereign_air_gapped_appliance`)**, delivering:
1. **Hardware-Rooted Vector Index Sealing:** Authenticated AES-256-GCM encryption of persistent SQLite vector databases bound to host TPM 2.0 PCR registers or Apple Secure Enclave silicon seeds via HKDF-SHA256, with instant fail-fast locking on tamper detection (`HardwareSealingTamperError`).
2. **Zero-Egress Strict Mode & Network Sentinel:** In-process watchdog (`AirgapNetworkSentinel`) that continuously audits sockets and DNS resolvers in `/etc/resolv.conf`, blocking WAN connection attempts with `AirgapEgressViolationError`.
3. **Offline Full-Duplex Neural Voice RAG Engine:** Hands-free voice interface integrating local Whisper ASR (with RMS VAD endpointing), embedded SQLite hybrid search, local SLM answer synthesis, and Piper neural TTS audio stream output with sub-350ms total conversational latency ($TTFAB < 250\text{ms}$).
4. **Sovereign Appliance Manager Coordinator:** Coordinates boot attestation quotes, vector store seal/unseal lifecycles, and pre-baked model manifest verification (`nomic-embed-text`, `whisper-tiny-en`, `piper-en-natural`, `qwen2.5-0.5b-instruct`).
5. **Distroless Appliance Container Packaging:** Minimal single-container OCI recipe (`deploy/docker/Dockerfile.appliance`) embedding SQLite FTS5 runtime, pre-cached model directories, and non-root execution (`UID 10001`).
6. **Interactive Sovereign Appliance Cockpit in `apps/web`:** Built `sovereign-appliance-cockpit.tsx` featuring real-time Air-Gap Security Shield, PCR attestation card, 1-click seal/unseal controls, embedded storage telemetry, and offline voice RAG query simulator with latency waterfall.
7. **Platform Battery #41 Registration:** Cataloged `sovereign_air_gapped_appliance` in `BatteryService` under `EDGE_DISTRIBUTION` (bringing verified platform batteries to 41).

---

## 2. Mathematical Formulation & Algorithmic Foundations

### A. Hardware Key Derivation via HKDF-SHA256
Encryption keys are never stored in plaintext. They are derived ephemerally from host hardware root seeds:

$$\text{PRK} = \text{HMAC-Hash}(\text{Salt}=\text{PCR0},\, \text{IKM}=\text{MasterSeed})$$

$$\text{Key} = \text{HKDF-Expand}(\text{PRK},\, \text{Info}=\text{"retriever:vector\_sealer:"} \parallel \text{TenantID},\, L=32)$$

### B. Authenticated Encryption with AAD Binding
On-disk SQLite vector stores are sealed using authenticated AES-256-GCM with a 96-bit random nonce $\text{Nonce}_{96}$. The Associated Authenticated Data (AAD) binds the ciphertext cryptographically to both the `tenant_id` and the hardware measurement digest:

$$\text{AAD} = \text{JSON}(\{\text{"tenant\_id"}: T,\, \text{"pcr\_measurement"}: \text{PCR0}\})$$

$$C,\, \text{Tag} = \text{AES-256-GCM-Encrypt}(\text{Key},\, \text{Nonce}_{96},\, P_{\text{SQLite}},\, \text{AAD})$$

### C. Fail-Fast Tamper Defense & Key Sanitization
If host measurements drift ($\text{PCR0}_{\text{host}} \neq \text{PCR0}_{\text{sealed}}$) or if the authentication tag verification fails:
1. `HardwareSealingTamperError` is immediately raised.
2. The derived symmetric key buffer is overwritten in RAM using `EphemeralMemorySanitizer.sanitize_buffer()`.
3. The database file remains sealed in ciphertext.

### D. Offline Voice Conversational Latency Decomposition
Turn-taking latency for full-duplex voice RAG queries is modeled as:

$$T_{\text{total}} = T_{\text{ASR}}(\text{Whisper}) + T_{\text{Retrieval}}(\text{SQLite}) + T_{\text{LLM}}(\text{SLM}) + T_{\text{TTS}}(\text{Piper})$$

where $T_{\text{total}} < 350\text{ms}$ on modern edge hardware.

---

## 3. Implemented Files & Deliverables Matrix

| File | Repo | Scope & Description |
|---|---|---|
| `appliance.py` | `retriever` | Pure domain abstractions (`ApplianceDeploymentMode`, `ApplianceSealingState`, `AirgapNetworkState`, `AirgapEgressViolationError`, `HardwareSealingTamperError`, etc.). |
| `airgap_sentinel.py` | `retriever` | In-process network isolation sentinel auditing interfaces, sockets, and DNS resolvers. |
| `hardware_vector_sealer.py` | `retriever` | AES-256-GCM hardware-bound vector database sealer and unsealer. |
| `voice_rag_engine.py` | `retriever` | Offline full-duplex voice RAG pipeline connecting Whisper ASR, SQLite hybrid search, and Piper TTS. |
| `appliance_manager.py` | `retriever` | Domain coordinator for hardware attestation, sealing states, and model manifests. |
| `appliance.py` (Router) | `retriever` | FastAPI REST endpoints for status, audits, manifests, sealing, unsealing, and voice queries. |
| `battery_service.py` | `retriever` | Registered Platform Battery #41 (`sovereign_air_gapped_appliance`) under `EDGE_DISTRIBUTION`. |
| `Dockerfile.appliance` | `retriever` | Self-contained distroless edge appliance container recipe. |
| `sovereign-appliance-cockpit.tsx` | `retriever` | Interactive Admin Dashboard cockpit with Air-Gap Security Shield and Voice RAG simulator. |
| `use-appliance.ts` | `retriever` | TanStack Query hooks for appliance telemetry, sealing mutations, and voice queries. |
| `test_sovereign_appliance.py` | `retriever` | 9 unit and integration tests verifying hexagonal purity, AES-256-GCM sealing, sentinel, voice RAG, and REST API. |
| `sovereign-air-gapped-appliance.md` | `retriever` | Comprehensive technical feature guide. |
| `47_Sovereign_Air_Gapped_Appliance_PRD.md` | `Prateek_website` | Formal dual-repo PRD 47. |

---

## 4. Verification & Quality Gates

1. **Pytest Coverage:** 25 tests passed across `test_sovereign_appliance.py`, `test_batteries.py`, and `test_architecture.py`.
2. **Zero-Toy Verification:** 359 production Python files scanned, 0 violations.
3. **Frontend Build & Lint:** `apps/web` compiled with Next.js 16 in 2.2s; 0 ESLint errors.
4. **Hexagonal Boundary Purity:** AST analysis confirmed zero forbidden imports in `src/domain/abstractions/appliance.py`.
