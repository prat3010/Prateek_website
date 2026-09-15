# 39. Zero-Knowledge Proof (ZKP) Vector Attestation & Verifiable Document Grounding PRD

> **Product Requirement Document (PRD 39)**  
> **Milestone:** Milestone 118 (`v1.8.0-alpha1`)  
> **Platform Battery:** #33 (`zkp_vector_attestation`)  
> **Target Repositories:** `retriever` & `Prateek_website`  
> **Status:** Production  

---

## 1. Executive Summary & Objective

In high-stakes enterprise applications (legal contract review, healthcare protocol adherence, financial compliance, and regulatory audits), enterprise clients require verifiable proof that AI responses were generated strictly from authentic, unmodified tenant documents without hallucination or unauthorized context injection.

Furthermore, compliance authorities, third-party insurers, or cross-department auditors often need to independently verify the grounding of an inference *without* possessing plaintext access to the underlying confidential trade secrets or proprietary text.

**Milestone 118** introduces **Platform Battery #33: `zkp_vector_attestation`**, combining:
1. **Deterministic Binary Merkle Trees** for indexed document chunks,
2. **Zero-Knowledge Leaf Commitments** ($h_i$) binding chunk indices, tenant ID, and content digests,
3. **Sub-millisecond Merkle Inclusion Authentication Paths** ($\pi_i$),
4. **Ed25519-Signed Grounding Certificates**,
5. **Public Zero-Knowledge Verification Engine** (`POST /v1/zkp/verify`).

---

## 2. Technical Architecture & Cryptographic Foundations

```mermaid
graph TD
    subgraph Ingestion["1. Document Ingestion Phase"]
        Doc[Document D] --> Chunks[Chunks c_1, c_2, ... c_n]
        Chunks --> Leaves[Leaf Commitments h_i = SHA256(tenant || doc || i || chunk_sha256)]
        Leaves --> MerkleTree[Binary Merkle Tree Construction]
        MerkleTree --> Root[Document Root Commitment R_doc]
    end

    subgraph Inference["2. Grounded Inference & Attestation Phase"]
        Query[User Query] --> RAG[Hybrid Search & Retrieval]
        RAG --> Cited[Top-K Retrieved Chunks]
        Cited --> ProofGen[Merkle Inclusion Proof Generation π_i]
        RAG --> LLM[LLM Generation]
        LLM --> Response[Grounded Response]
        Response --> AttestEngine[ZKP Attestation Engine]
        ProofGen --> AttestEngine
        AttestEngine --> Cert[Ed25519 Grounding Certificate Token]
    end

    subgraph Verification["3. Independent Zero-Knowledge Verification"]
        Cert --> PublicVerifier[Public Verifier / POST /v1/zkp/verify]
        Root --> PublicVerifier
        PublicVerifier --> Decision{Cryptographic Validation}
        Decision -->|Valid Merkle Paths + Signature| Green[✅ Verified Grounded (Zero Plaintext Disclosed)]
        Decision -->|Tampered Chunk / Response| Red[❌ Attestation Rejected]
    end
```

### 2.1 Leaf Commitment & Merkle Tree Math
For document $D$ partitioned into chunks $\{c_0, c_1, \dots, c_{n-1}\}$:
- **Leaf Commitment**:
  $$h_i = \text{SHA256}(\text{tenant\_id} \mathbin{\Vert} \text{doc\_id} \mathbin{\Vert} \text{index}_i \mathbin{\Vert} \text{SHA256}(c_i))$$
- **Internal Node**:
  $$N_{\text{parent}} = \text{SHA256}(N_{\text{left}} \mathbin{\Vert} N_{\text{right}})$$
- **Merkle Inclusion Proof** for leaf $h_i$:
  $$\pi_i = [(\text{sibling}_1, \text{dir}_1), (\text{sibling}_2, \text{dir}_2), \dots, (\text{sibling}_k, \text{dir}_k)] \quad \text{where } k = \lceil \log_2 n \rceil$$

### 2.2 Grounding Certificate Schema
```json
{
  "certificate_id": "cert_zkp_9f8a12bc44e1",
  "tenant_id": "tn_enterprise_client",
  "document_id": "doc_enterprise_master_sow",
  "document_merkle_root": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "query_hash": "82a9f4e2b10a1290bb34e120ef93cba4e892c5512bc394a123f491c2840ef412",
  "response_hash": "45f910a34b9e11c8289d0421e48bc894ef192bca1094ea511c9842a84920bfe1",
  "similarity_bound": 0.91,
  "chunk_commitments": [
    {
      "chunk_id": "chk_0",
      "chunk_index": 0,
      "leaf_hash": "9a81bc334e104fe1a8bc49201948ebc12048ef912048ea10948ebc1948e1048e",
      "merkle_proof": [
        { "sibling_hash": "2b9f10a84e...", "direction": "right" },
        { "sibling_hash": "7c1048ebca...", "direction": "left" }
      ],
      "similarity_score": 0.94
    }
  ],
  "issued_at": 1773619200,
  "authority_public_key": "a948e104928fe10498ebc19482019482bc104982a10948ebc10948ea10948ebc",
  "attestation_signature": "e49201948ebc10498ea10948ebc104982a10948ebc10498ea10948ebc..."
}
```

---

## 3. UI/UX Design System 2.0 Invariants (`ZkpAttestationPanel.tsx`)

- **Dual-Theme Parity:** Full contrast and styling support across both **Azure** (cold-press `#FAF9F6` paper, `#FFFFFF` cards, slate blue `#3F6E91`, dark graphite `#2B2B36`) and **Noir** (obsidian glass `#08080a`, glowing cyan `#00f0ff`, neon green `#39ff14`).
- **Semantic CSS Tokens:** Exclusively uses `--color-text`, `--surface-card`, `--surface-elevated`, `--surface-glass-border`, `--badge-active-*`.
- **Sensory Kinetics:** Magnetic CTAs `<MagneticButton strength={0.25}>`, Framer Motion spring tab pills (`tabBtnActive`).
- **3 Dedicated Sub-Views:**
  1. *Merkle Tree Explorer:* Visual binary DAG tree with root commitment, intermediate parent hashes, and interactive chunk leaf nodes displaying exact inclusion path siblings.
  2. *Live Zero-Knowledge Verifier:* Diagnostic verification console with 1-click sample certificate loader, optional query/response input fields, and 4-step real-time validation ledger.
  3. *Compliance Audit Ledger:* Chronological audit log of issued certificates for the tenant with 1-click JSON export and direct Verifier tab loading.

---

## 4. Verification & Testing Standards

- **Pytest Suite:** `apps/api/tests/test_zkp_attestation.py` (10/10 passed).
- **Architecture Boundaries:** `apps/api/tests/test_architecture.py` (5/5 passed).
- **Zero-Toy Invariant Gate:** Authentic SHA-256 binary Merkle DAG and Ed25519 digital signatures (0 violations across 326 production Python files).
- **Decoupled SDK Parity:** TypeScript (`@prat3010/retriever-client`) and Python (`retriever-python`) client libraries.
