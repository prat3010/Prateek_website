# 🧠 Architecture Runbook: Provisioning a New RAG Tenant & Ingestion

**Objective:** Standard Operating Procedure (SOP) for onboarding a multi-tenant client workspace onto Retriever's cognitive core.

---

## 🏢 Step 1: Tenant Workspace Registration
1. In Supabase, verify or insert record in `rag_tenants`:
   - `tenant_id`: Unique slug or UUID.
   - `plan_tier`: `starter` (250k tokens), `growth` (1.5M tokens), or `enterprise` (10M tokens).
2. Insert owner in `rag_tenant_members`:
   - `email`: Client account email.
   - `role`: `owner`.

---

## 📚 Step 2: Knowledge Ingestion & AST Parsing
1. Call `POST /v1/tenants/{tenantId}/documents` with source files (`.pdf`, `.docx`, `.md`).
2. Verify that Celery/RabbitMQ worker splits text with recursive chunking (chunk size 500, overlap 100).
3. Confirm embedding generation via local embedding model into `pgvector_store` (768-dim cosine HNSW index).

---

## 🛡️ Step 3: Guardrails & Citation Settings
1. Check tenant retrieval settings in `tenant_config`:
   - `citation_template`: `"[Source: {filename}]"`
   - `top_k`: 5 to 10 candidates.
   - `enable_hybrid`: `true` (BM25 + Dense RRF fusion).
2. Enable LlamaGuard 3 safety filters and PII scrubbers if processing confidential data.

---

## 💬 Step 4: Verification & SSE Latency Check
1. In RAG Studio at `/rag/app`, open Chat Studio.
2. Send test query and verify:
   - First token latency $< 900	ext{ms}$.
   - Presigned citation badges render with `✓ 📥 <filename>`.
   - Semantic cache badge (`⚡ Cached`) appears on repeated queries.
