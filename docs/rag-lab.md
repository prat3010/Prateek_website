# RAG Lab

**Interactive document search and chat powered by a custom RAG engine.**

RAG Lab is a full-stack Retrieval-Augmented Generation platform. Upload PDFs, search semantically, and get grounded answers with citations. The frontend lives in this portfolio at `/rag` and talks to a FastAPI backend running on an Oracle Cloud VPS. An admin dashboard is available at [`admin.rag.prateeq.in`](https://admin.rag.prateeq.in) for tenant and platform management.

---

## Table of Contents

- [Architecture](#architecture)
- [Features](#features)
  - [Config Tab](#config-tab)
  - [Chat Tab](#chat-tab)
  - [Search Tab](#search-tab)
  - [Documents Tab](#documents-tab)
- [API Surface](#api-surface)
- [RAG Pipeline](#rag-pipeline)
  - [Write Path (Ingestion)](#write-path-ingestion)
  - [Read Path (Search + Generate)](#read-path-search--generate)
- [Auth & Security](#auth--security)
- [Deployment](#deployment)
  - [Frontend (Vercel)](#frontend-vercel)
  - [Backend (Oracle VPS)](#backend-oracle-vps)
- [Production Status](#production-status)
- [Local Development](#local-development)
- [Configuration Reference](#configuration-reference)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│  prateeq.in/rag   admin.rag.prateeq.in                          │
└──────┬──────────────────────────┬───────────────────────────────┘
       │                          │
       ▼                          ▼
┌──────────────────────┐ ┌──────────────────────────────────────┐
│  Vercel (Portfolio)  │ │  Vercel (Admin Dashboard)            │
│  prateeq.in/rag      │ │  admin.rag.prateeq.in                │
│  Next.js             │ │  Next.js · shadcn/ui · React Query   │
│  RagInterface        │ │  Login → tenants/docs/users/keys/…   │
└──────────┬───────────┘ └────────────┬─────────────────────────┘
           │                          │
           │      HTTPS · X-Admin-Master-Key
           │                          │
           ▼                          ▼
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Portfolio (prateeq.in/rag)                                  │ │
│  │  page.tsx → <RagInterface />                                 │ │
│  │                                                               │ │
│  │  Admin Dashboard (admin.rag.prateeq.in)                      │ │
│  │  Next.js app from apps/web/ in retriever repo                │ │
│  │  Login, tenants, documents, users, API keys, prompts,        │ │
│  │  config, audit logs, playground                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  │  ├── ConfigPanel  (localStorage persistence)                 │ │
│  │  ├── ChatPanel    (SSE streaming reader)                    │ │
│  │  ├── SearchPanel  (one-shot hybrid search)                  │ │
│  │  └── DocumentsPanel (upload + list + refresh)               │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │  HTTPS · Bearer token + X-User-ID
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Oracle Cloud VPS (130.210.35.134)                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Nginx (reverse proxy + TLS via Let's Encrypt)               │ │
│  │  rag.prateeq.in:443 → localhost:8000                        │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                          │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │  systemd: retriever-api.service                              │ │
│  │  uvicorn main:app --port 8000                                │ │
│  │  FastAPI · single worker                                     │ │
│  └────┬────────────┬──────────────┬────────────────────────────┘ │
│       │            │              │                               │
│       ▼            ▼              ▼                               │
│  ┌────────┐  ┌──────────┐  ┌────────────┐                       │
│  │ Ollama │  │  Supabase│  │  Local FS  │                       │
│  │native  │  │  Pooler  │  │  /data/    │                       │
│  │process │  │  PG      │  │  docs/     │                       │
│  │nomic-  │  │  +pgvec  │  │            │                       │
│  │embed-  │  │          │  │            │                       │
│  │text    │  │          │  │            │                       │
│  └────────┘  └──────────┘  └────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend (Portfolio)

| File | Purpose |
|------|---------|
| `src/app/rag/page.tsx` | Route entry — renders `<RagInterface />` + Admin button |
| `src/components/rag/RagInterface.tsx` | Main client component — tabs, state, all panels |
| `src/components/rag/rag.module.css` | CSS Modules — 30 class names, uses theme custom properties |
| `src/lib/rag-client.ts` | API client class, config localStorage helpers, TypeScript types |

### Admin Dashboard

A separate Next.js app deployed on Vercel from the `apps/web/` directory of the [retriever repo](https://github.com/prat3010/retriever). Available at `admin.rag.prateeq.in`. Provides a full browser UI for:

- Tenant CRUD (create, view, suspend)
- User management (create, list)
- API key management (create, revoke)
- Document management (upload, delete per tenant)
- Prompt template editor with preview
- Tenant configuration editor
- RAG playground for testing
- Audit log viewer
- Platform-wide stats and system reset

**Auth:** Admin Master Key entered on the login page, stored in `sessionStorage`, sent as `X-Admin-Master-Key` header on every API call.

### Backend

Single FastAPI application in the retriever repo at `apps/api/src/main.py`. No routers — all endpoints are `@app` decorators on the main module. Architecture is modular by concern:

| Layer | Detail |
|-------|--------|
| **Auth** | `middleware/auth.py` — Bearer token validation, tenant isolation enforcement |
| **Documents** | `services/document_processor.py` — Parse, chunk, embed, index |
| **Search** | `services/hybrid_search_service.py` — Hybrid (vector + keyword) retrieval |
| **Chat** | `services/inference_orchestrator.py` — RAG pipeline orchestration, SSE streaming |
| **Storage** | Local filesystem (`/data/`), Supabase PostgreSQL + pgvector |

---

## Features

### Config Tab

The first tab displayed on load. Lets the user enter connection details for the Retriever API.

**Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| API Base URL | `text` | `https://rag.prateeq.in` | Backend URL |
| Tenant ID | `text` | `00000000-0000-0000-0000-000000000000` | UUID of the tenant (system tenant = all zeros) |
| User ID | `text` | `a8b819bb-61bb-450b-9662-62bd06b188d3` | UUID passed as `X-User-ID` header |
| API Key | `password` | — | Bearer token sent as `Authorization: Bearer sk_...` |
| LLM Key | `password` | — | Optional — per-request LLM API key override (sent as `X-LLM-Key`) |
| LLM Provider | `dropdown` | `Tenant default` | Override: Tenant default / OpenAI / Gemini / Anthropic |

**Flow:**
1. User fills in fields and clicks **Save & Connect**
2. Config is persisted to `localStorage` under key `rag_config`
3. A `RetrieverClient` instance is created from the config
4. The tab switches to Chat and the status indicator shows `"Connected: {tenantId prefix}…"`
5. Clicking **Disconnect** clears localStorage and nullifies the client

### Chat Tab

Only available when a client is connected.

**Session lifecycle:**
1. Click **Start Session** → `POST /v1/tenants/{tenantId}/chat/sessions` → receives `sessionId`
2. A session badge shows the first 8 chars of the session ID with an **End** button
3. Type a message and press Enter or click **Send**
4. Response streams in via Server-Sent Events (SSE)
5. Click **End** to reset the session (no server-side deletion)

**Message rendering:**
- User messages: right-aligned blue bubbles
- Assistant messages: left-aligned gray bubbles
- Loading state: `"Thinking…"` indicator
- Errors: red text in the message area
- Auto-scroll to bottom on each new token

**SSE stream format** (parsed client-side from `ReadableStream`):

```
data: {"event": "token", "delta": "The"}
data: {"event": "token", "delta": " capital"}
data: {"event": "token", "delta": " of"}
data: {"event": "done", "usage": {"input_tokens": 321, "output_tokens": 42, "total_tokens": 363}, "latency_ms": 2340}
```

The client accumulates `delta` fields from `token` events until a `done` event signals completion.

### Search Tab

One-shot semantic/hybrid search across indexed documents.

**Flow:**
1. Enter a query and press Enter or click **Search**
2. `POST /v1/tenants/{tenantId}/search` with `{ query, top_k: 5 }`
3. Results render as cards showing:
   - Rank number (#1, #2, …)
   - Relevance score (4 decimal places)
   - Content text snippet
4. Loading state: `"Searching…"`

Documents must be indexed before they appear in search results.

### Documents Tab

Manage the document corpus for the connected tenant.

**Operations:**

| Action | Method | Description |
|--------|--------|-------------|
| **Refresh** | `GET /v1/tenants/{tenantId}/documents` | Reload the document list |
| **Upload** | `POST /v1/tenants/{tenantId}/documents` | Multipart file upload (`.pdf`, `.txt`, `.md`, `.docx`) |

**Document list:** Each entry shows the filename and current status (`processed`, `processing`, `failed`, `pending`). After upload, the list auto-refreshes.

**Empty state:** "No documents yet."

---

## API Surface

All endpoints the frontend interacts with. The backend exposes a much larger surface for admin operations (tenants, API keys, prompts, evaluations, audit logs) — see the full API reference in `retriever/docs/architecture.md`.

### Client-Facing Endpoints

| Method | Path | Purpose | Rate Limit |
|--------|------|---------|------------|
| `POST` | `/v1/tenants/{tenantId}/search` | Hybrid search (vector + keyword) | 120/min |
| `GET` | `/v1/tenants/{tenantId}/documents` | List indexed documents | — |
| `POST` | `/v1/tenants/{tenantId}/documents` | Upload document (async) | — |
| `POST` | `/v1/tenants/{tenantId}/chat/sessions` | Create chat session | — |
| `POST` | `/v1/tenants/{tenantId}/chat/sessions/{sessionId}/messages` | Send message (SSE streaming) | 30/min |
| `POST` | `/v1/tenants/{tenantId}/chat/sessions/{sessionId}/messages/{messageId}/feedback` | Submit thumbs up/down | — |
| `GET` | `/v1/tenants/{tenantId}/chat/sessions/{sessionId}/messages` | Get message history | — |

### Auth Headers (sent on every request)

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer {apiKey}` | Yes |
| `X-User-ID` | `{userId}` | Yes |
| `X-LLM-Key` | `{llmKey}` | Only for chat (optional override) |
| `X-LLM-Provider` | `{provider}` | Only for chat (optional override) |

### Request/Response Shapes

**Search Request:**
```json
{
  "query": "string",
  "top_k": 5
}
```

**Search Response:**
```json
[
  {
    "content": "chunk text…",
    "score": 0.9234,
    "metadata": { "document_id": "uuid", "page": 3 }
  }
]
```

**Upload Document:** Multipart form with field name `file`. Returns `202 Accepted` with document metadata. Processing happens asynchronously via Celery (or inline if no broker is configured).

**Chat Session Creation:**
```json
{
  "user_id": "uuid"
}
```
Returns `{ "session_id": "uuid" }`.

**Chat Message Request:**
```json
{
  "query": "string",
  "stream": true
}
```
Response is an SSE stream (see [Chat Tab](#chat-tab) for format).

---

## RAG Pipeline

### Write Path (Ingestion)

```
Upload → SHA-256 dedup → Save to /data/ (local FS or S3)
  → DB record (status=PENDING)
  → Async worker (Celery or inline):
      ├── 1. Parse binary → extracted text
      │     (PDF · DOCX · HTML · Markdown · plaintext · Images via vision LLM)
      ├── 2. Chunk text
      │     (strategy per tenant config: semantic / recursive / sliding window)
      ├── 3. Generate embeddings via Ollama (nomic-embed-text)
      ├── 4. Upsert vectors to pgvector
      └── 5. Update document status=INDEXED
```

### Read Path (Search + Generate)

```
User Query
  │
  ├── 1. Auth + tenant isolation + scope check
  ├── 2. Load tenant config from DB/Redis
  ├── 3. Hybrid Search:
  │     ├── Query intent classification
  │     ├── Self-query parsing (NL → metadata filters)
  │     ├── Optional HyDE query rewriting
  │     ├── Embed query (Ollama nomic-embed-text)
  │     ├── Semantic cache check (cosine > 0.99)
  │     ├── Parallel fan-out:
  │     │     ├── pgvector similarity search (HNSW index)
  │     │     └── PostgreSQL keyword search (ts_rank_cd / GIN index)
  │     ├── Reciprocal Rank Fusion (RRF) merge
  │     ├── BM25 reranking
  │     ├── Cross-encoder reranking (Cohere rerank-v3.5)
  │     ├── MMR diversity sampling
  │     └── Web search fallback (Tavily/Brave) if top score < threshold
  │
  ├── 4. Prompt Construction:
  │     ├── Fetch session history (compress if > summarize_after_turns)
  │     ├── Load tenant-specific system prompt from DB
  │     ├── Pack context chunks + history + user query
  │     └── Validate token budget (compress if > 95% of limit)
  │
  ├── 5. LLM Generation (SSE stream):
  │     ├── Try primary provider (OpenAI / Anthropic per tenant config)
  │     ├── Retry primary (exponential backoff, 2 attempts)
  │     ├── Fallback to secondary provider
  │     ├── Stream tokens with inline citation validation
  │     └── Strip invalid citations
  │
  └── 6. Post-generation:
        ├── Persist messages (user + assistant)
        ├── Calculate cost (token pricing lookup)
        ├── Record inference log
        ├── Emit Prometheus metrics
        └── Check budget thresholds → alert if exceeded
```

---

## Auth & Security

### Credential Types

| Credential | Where | What It Grants |
|------------|-------|----------------|
| **Admin Master Key** | `X-Admin-Master-Key` header | Full system-wide CRUD (not used by the frontend) |
| **Client API Key** | `Authorization: Bearer sk_...` | Scoped to one tenant. Validated via SHA-256 hash against DB. Roles: `admin` or `client`. |
| **OIDC JWT** | `Authorization: Bearer <jwt>` | Optional — validated via JWKS endpoint if configured |

### Auth Flow (per request)

1. **Token extraction** — Bearer token from `Authorization` header
2. **Tenant isolation check** — path `{tenantId}` must match the token's tenant. Mismatch = immediate key revocation and `CRITICAL_SECURITY_BREACH` audit log
3. **Scope enforcement** — RBAC scopes (`document:read`, `document:write`). Admin keys bypass.
4. **User ID validation** — `X-User-ID` must be a valid UUID (for client keys)

### LLM Key Resolution (priority order)

1. `X-LLM-Key` request header — per-request override (used by RAG Lab Config tab)
2. `llm_api_key` in tenant config — AES-256-GCM encrypted in DB
3. `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` env var — deployment-wide fallback

### Encryption

LLM API keys stored in the tenant `configurations` table are encrypted at rest using AES-256-GCM. The encryption key is derived from the `ENCRYPTION_KEY` environment variable.

---

## Deployment

### Frontend (Vercel)

**RAG Lab UI**
- **Repo:** `github.com/prat3010/Prateek_website`
- **Branch:** `main` — auto-deploys on push
- **Route:** `prateeq.in/rag`
- **Framework:** Next.js App Router (`src/app/rag/page.tsx`)
- **Client component:** `RagInterface` — rendered on the client after initial page load
- **Config:** No API keys are hardcoded; all credentials entered by the user and stored in `localStorage`

**Admin Dashboard**
- **Repo:** `github.com/prat3010/retriever` (subdirectory `apps/web/`)
- **URL:** `admin.rag.prateeq.in`
- **Deployment:** Manual or auto-deploy on push via Vercel (root directory: `apps/web`)
- **Env:** `NEXT_PUBLIC_API_URL=https://rag.prateeq.in`
- **Framework:** Next.js App Router (shadcn/ui, Tailwind, React Query, Zustand)
- **Auth:** Admin Master Key login form

### Backend (Oracle VPS)

- **Host:** `130.210.35.134` — Oracle Cloud VM.Standard.E2.1.Micro (1 OCPU, 1GB RAM, Ubuntu 24.04)
- **Domain:** `rag.prateeq.in` — A record from GoDaddy pointing to the Oracle IP
- **Reverse proxy:** Nginx with Let's Encrypt TLS (auto-renewal)
- **Process manager:** systemd unit `retriever-api.service`
- **Port:** `8000` (internal) → `443` (external via Nginx)
- **Startup:** `systemctl restart retriever-api` after code updates

#### Components

| Component | Status | Details |
|-----------|--------|---------|
| FastAPI (uvicorn) | Running | Single worker (no gunicorn) |
| Ollama | Running | Native process on Oracle, model: `nomic-embed-text` |
| PostgreSQL | Supabase pooler | `aws-1-us-west-2.pooler.supabase.com:5432` |
| pgvector | Enabled | HNSW index on embedding column |
| Redis | Not deployed | Tenant config fetched from DB on every request |
| Celery | Not deployed | Document processing blocks the API process |
| File storage | Local `/data/` | Not durable (no S3) |

#### SSH Access

```bash
ssh -i ~/.ssh/oracle_rsa ubuntu@130.210.35.134
```

#### Key Commands

```bash
sudo systemctl status retriever-api          # Check service health
sudo systemctl restart retriever-api         # Restart after code update
sudo journalctl -u retriever-api -n 50 -f    # Live logs
sudo certbot renew                           # Renew TLS cert
```

---

## Production Status

### ✅ Working

- **Search** — Hybrid search (vector + keyword) across indexed documents. Returns results with scores.
- **Document upload** — PDF, TXT, Markdown, DOCX upload and processing. Status tracking (pending → processing → indexed).
- **Auth** — Bearer token validation, tenant isolation, scope enforcement.
- **Configuration** — Tenant-level config (LLM provider, chunking strategy, prompt templates).
- **Admin API** — Tenant CRUD, API key management, prompt templates, evaluation datasets.
- **Health endpoints** — `/health/liveness`, `/health/readiness`, `/metrics` (Prometheus).
- **Domain + TLS** — `rag.prateeq.in` with Let's Encrypt auto-renewal.

### ❌ Blocked / Not Working

- **Chat** — Both Gemini and OpenAI API keys have exhausted their free quota. The Smart Model Failover (M19) correctly routes but has no healthy provider. Returns `500: All providers unavailable`.
- **Rate limiting** — Redis rate limiter exists in code but Redis is not deployed on the VPS. No abuse protection.

### ⚠️ Known Limitations

| Area | Gap | Impact |
|------|-----|--------|
| **Secrets management** | LLM keys in server `.env`; rotation is manual SSH + restart | Key rotation = 2+ min downtime |
| **Observability** | Sentry DSN not configured; no `/metrics` scraping; no uptime monitor | Outages undetected |
| **Backups** | No automated Supabase DB snapshot | Data loss risk |
| **CI/CD** | Manual `git pull && systemctl restart` | Human error risk |
| **LLM key lifecycle** | No quota monitoring | Chat breaks silently |
| **Concurrency** | Single uvicorn worker | One slow request blocks all |
| **File storage** | Local filesystem (not S3/MinIO) | Not durable; data lost on VPS failure |
| **Document processing** | No Celery/RabbitMQ — upload blocks the API | Timeouts on large files |

---

## Local Development

### Frontend

```bash
# From Prateek_website root
npm run dev         # → http://localhost:3000
open http://localhost:3000/rag
```

The RAG Lab UI is served by Next.js dev server. Point it at the production backend (`https://rag.prateeq.in`) or a local backend instance.

### Backend

```bash
# From retriever root
cd apps/api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# .env setup (see .env.example)
echo "
DATABASE_URL=postgresql+asyncpg://...
OLLAMA_BASE_URL=http://localhost:11434
ENCRYPTION_KEY=dev-mode-insecure-key-change-in-prod
ADMIN_MASTER_KEY=dev-master-key-change-in-prod
"> .env

uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger)
```

### Ollama (for embeddings)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull nomic-embed-text
ollama serve
```

---

## Configuration Reference

### localStorage Schema

Key: `rag_config`

```json
{
  "apiUrl": "https://rag.prateeq.in",
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "apiKey": "sk_live_...",
  "userId": "a8b819bb-61bb-450b-9662-62bd06b188d3",
  "llmKey": "sk-...",
  "llmProvider": "openai"
}
```

### Backend Env Vars

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase pooler URL (asyncpg) |
| `OLLAMA_BASE_URL` | Yes | `http://localhost:11434` |
| `ENCRYPTION_KEY` | Yes | 32-byte key for AES-256-GCM |
| `ADMIN_MASTER_KEY` | Yes | Secret admin API key |
| `OPENAI_API_KEY` | No | Fallback LLM provider |
| `ANTHROPIC_API_KEY` | No | Fallback LLM provider |
| `GOOGLE_API_KEY` | No | Gemini provider |
| `SENTRY_DSN` | No | Error tracking |
| `REDIS_URL` | No | Rate limiting + cache |
| `CELERY_BROKER_URL` | No | Async document processing |
| `STORAGE_BACKEND` | No | `local` (default) or `s3` |
| `S3_ENDPOINT` | No | S3/MinIO endpoint |
| `S3_BUCKET` | No | S3 bucket name |
| `TAVILY_API_KEY` | No | Web search fallback |
| `BRAVE_API_KEY` | No | Web search fallback |

### Tenant Config (DB)

Stored in the `configurations` table per tenant. Key fields editable via `PUT /v1/tenants/{tenantId}/config`:

| Field | Type | Description |
|-------|------|-------------|
| `llm_provider` | string | `openai`, `anthropic`, `gemini` |
| `llm_api_key` | string | Encrypted at rest (AES-256-GCM) |
| `chunk_strategy` | string | `semantic`, `recursive`, `sliding_window` |
| `chunk_size` | integer | Target chunk size in tokens |
| `chunk_overlap` | integer | Overlap between chunks |
| `top_k` | integer | Default retrieval count |
| `reranker` | string | `cohere`, `bm25`, or null |
| `hyde_enabled` | boolean | Hypothetical Document Embeddings |
| `web_fallback` | boolean | Tavily/Brave fallback on low scores |
| `system_prompt` | string | Custom system prompt template |
| `summarize_after_turns` | integer | Compress history after N turns |
| `budget_limit_monthly` | float | Monthly LLM spend cap in USD |
