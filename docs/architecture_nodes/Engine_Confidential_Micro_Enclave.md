---
id: Engine_Confidential_Micro_Enclave
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/src/"
runbook: docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/cognitive_engine
  - platform/retriever
invariants:
  - "Every query and database record MUST strictly enforce tenant_id isolation."
  - "Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError."
  - "Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys)."
test_suites:
  - apps/api/tests/test_architecture.py
downstream:
  - ../UNIFIED_MASTER_ROADMAP
  - ../../../retriever/docs/decisions/0023-confidential-micro-enclave-hardware-attestation
  - ../../../retriever/docs/features/confidential-micro-enclave
---

# Engine: Zero-Trust Micro-Enclave Encryption & Hardware KMS Remote Attestation (Milestone 101)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #confidential_computing #enclave #attestation #ed25519 #aes_gcm #hkdf #m101 #retriever

> **Confidential Micro-Enclave cryptographic subsystem delivering simulated hardware enclave roots, Ed25519 asymmetric quote attestation, volatile memory zeroing via `ctypes.memset`, and tenant-bound AES-256-GCM sealed memory envelopes (Platform Battery #21: `zero_trust_micro_enclave`).**

- **Domain Core:** `retriever/apps/api/src/domain/abstractions/enclave.py` (`EnclaveQuote`, `AttestationEvidence`, `SealedMemoryEnvelope`, `EnclaveKeyDerivationContext`, `EnclaveStatusReport`, `MicroEnclaveProtocol`, `MemorySanitizerProtocol`).
- **Memory Sanitizer:** `retriever/apps/api/src/adapters/security/memory_sanitizer.py` (tracks volatile buffers, provides `zero_memory` via `ctypes.memset`, registers `SIGINT`/`SIGTERM` cleanup traps).
- **Enclave Hardware KMS Adapter:** `retriever/apps/api/src/adapters/security/enclave_adapter.py` (simulates Nitro Enclave / AMD SEV-SNP roots, Ed25519 asymmetric attestation signing, HKDF-SHA256 tenant key derivation bound to PCR0, AES-256-GCM encryption with AAD).
- **Battery Registration:** `retriever/apps/api/src/domain/batteries/battery_service.py` (Platform Battery #21: `zero_trust_micro_enclave` under `SAFETY_DEFENSE`).
- **REST Endpoints:** `retriever/apps/api/src/routers/enclave.py` mounted at `/v1/enclave` (`/status`, `/attestation/quote`, `/attestation/verify`, `/seal`, `/unseal`, `/rotate-root`).
- **Admin Dashboard Cockpit:** `retriever/apps/web/src/app/(dashboard)/edge/page.tsx` (real-time enclave hardware status badge, active enclave quote verifier, and interactive AES-256-GCM memory sealing playground).

---

## 🔗 Related Architecture & Cross-References
- [Unified Master Roadmap](../UNIFIED_MASTER_ROADMAP.md)
- [ADR-023: Confidential Micro-Enclave Remote Attestation & Hardware KMS](../../../retriever/docs/decisions/0023-confidential-micro-enclave-hardware-attestation.md)
- [Feature Guide: Confidential Micro-Enclave & Hardware Attestation](../../../retriever/docs/features/confidential-micro-enclave.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

