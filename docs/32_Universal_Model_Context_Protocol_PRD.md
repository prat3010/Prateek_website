# 32. Universal Model Context Protocol (MCP) Center & 1-Click Agent Integration PRD

## 1. Executive Summary & Problem Statement

### 1.1 Context
Prior to Milestone 102, Retriever exposed its cognitive batteries and knowledge retrieval subsystems via REST endpoints and web dashboard GUIs. While human developers could inspect and configure search, embeddings, graph triples, and workflows inside the Retriever Studio (`/rag/app`), external autonomous coding agents (such as Cursor Composer, Claude Desktop, and VS Code Cline / Roo Code) had no native, zero-config mechanism to tap into Retriever as a peripheral memory and execution brain.

### 1.2 Objective
Implement an authentic, production-grade **Model Context Protocol (MCP)** server (conforming to the official 2024-11-05 MCP specification) directly inside the Retriever platform (`/v1/mcp/*` and `packages/retriever-mcp`). External AI coding agents can discover and execute Retriever's canonical **33 platform batteries** as native tools over standard transports with 1-click configuration snippets.

---

## 2. Architectural Design & Hexagonal Boundaries

### 2.1 Component Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        External AI Coding Agent                        │
│         (Cursor Composer / Claude Desktop / VS Code Cline)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (JSON-RPC 2.0 over SSE / HTTP POST)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Retriever MCP Router (apps/api/src/routers/mcp.py)       │
│  - GET /v1/mcp/sse (Persistent session queue & endpoint event)        │
│  - POST /v1/mcp/messages (JSON-RPC method dispatcher)                  │
│  - GET /v1/mcp/config (1-click client configuration generator)        │
│  - GET /v1/mcp/tools (Direct REST registry inspect)                   │
│  - POST /v1/mcp/test-tool (In-dashboard diagnostic probe)              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│   Battery MCP Adapter (apps/api/src/adapters/mcp/battery_mcp_adapter.py│
│  - Bridges Retriever platform batteries & tool registry into MCP spec  │
│  - Formats JSONSchema input contracts & risk profiles                 │
│  - Resolves tenant-isolated execution results                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌─────────────────────────┐┌───────────────────┐┌────────────────────────┐
│ Platform Batteries #1-4 ││ Batteries #5-8     ││ Batteries #9-20        │
│ Dense HNSW / BM25 /     ││ RLM REPL Sandbox / ││ Llama Guard 3 /        │
│ ColBERT MaxSim / Docling││ Neo4j Graph /      ││ LongLLMLingua / Voice /│
│ Layout OCR              ││ HDBSCAN Clustering ││ Sovereign Edge Sync    │
└─────────────────────────┘└───────────────────┘└────────────────────────┘
```

### 2.2 Hexagonal Invariants
- **Domain Abstractions (`src/domain/abstractions/mcp.py`):** Pure Pydantic models with zero external framework imports. Verified by automated AST inspection in `test_mcp_hexagonal_architecture`.
- **Adapter Layer (`src/adapters/mcp/battery_mcp_adapter.py`):** Bridges domain abstractions with application container services without leaking HTTP or FastAPI concepts into domain logic.
- **Router Layer (`src/routers/mcp.py`):** Handles protocol negotiation, SSE lifecycle management, and JSON-RPC 2.0 error formatting.

---

## 3. Protocol Specification & Method Contracts

### 3.1 Session Lifecycle & Handshake Flow

1. **SSE Handshake (`GET /v1/mcp/sse?token=<api_key>`):**
   - Client initiates persistent HTTP GET connection.
   - Server authenticates token and assigns unique `sessionId`.
   - Server immediately yields the `endpoint` announcement event:
     ```http
     event: endpoint
     data: /v1/mcp/messages?sessionId=e5b8e97f0a4...
     ```
   - Server maintains connection with periodic keepalive `: ping\r\n\r\n` comments.

2. **Client Initialization (`POST /v1/mcp/messages?sessionId=...`):**
   - Client sends JSON-RPC `initialize` request:
     ```json
     {
       "jsonrpc": "2.0",
       "id": 1,
       "method": "initialize",
       "params": {
         "protocolVersion": "2024-11-05",
         "capabilities": {},
         "clientInfo": { "name": "cursor", "version": "0.45.0" }
       }
     }
     ```
   - Server returns negotiated protocol version and capabilities:
     ```json
     {
       "jsonrpc": "2.0",
       "id": 1,
       "result": {
         "protocolVersion": "2024-11-05",
         "capabilities": {
           "tools": { "listChanged": false }
         },
         "serverInfo": {
           "name": "retriever-mcp-server",
           "version": "1.0.0"
         }
       }
     }
     ```

3. **Tool Discovery (`tools/list`):**
   - Dispatches tool list with input JSON Schemas.
4. **Tool Execution (`tools/call`):**
   - Executes requested battery and formats result into `{"content": [{"type": "text", "text": "..."}], "isError": false}`.

---

## 4. Exposed Battery Tools

| Tool Name | Underlying Battery | Category | Risk Level | Description |
|---|---|---|---|---|
| `hybrid_search` | `dense_vector_hnsw` + `bm25` | Retrieval | Low | Dense-sparse hybrid search with HNSW vector ranking. |
| `document_reader` | `docling_ocr_parser` | Retrieval | Low | Full-text document retrieval and chunk span reading. |
| `graph_query` | `graphrag_topology` / `neo4j` | Computation Graph | Low | Multi-hop knowledge graph entity and triple traversals. |
| `rlm_execute` | `rlm_repl_sandbox` | Computation Graph | Medium | Sandboxed deterministic Python REPL code execution. |
| `calculator` | Platform Tool Registry | Computation Graph | Low | Safe mathematical expression evaluation. |
| `system_metrics` | `edge_token_shield` | System | Low | Real-time token quota, daily spend, and health check. |
| `guardrail_check` | `llama_guard_safety` | Safety Defense | Low | Llama Guard 3 prompt safety and jailbreak evaluation. |
| `summarize_context`| `longllmlingua_compressor` | Retrieval | Low | Perplexity-directed context token compression. |
| `list_batteries` | `battery_service` | System | Low | Inventory of all 33 canonical platform batteries and milestones. |
| `battery_inspect` | `battery_service` | System | Low | Operational specs, parameters, and benchmark latency. |

---

## 5. Web Application & Agent Integration (`Prateek_website` & `retriever-mcp`)

### 5.1 Agent Configuration Surface (Planned UI vs. Live Integrations)
> **Implementation Status:** Standalone `McpPanel.tsx` / `McpPanel.test.tsx` do not exist in `Prateek_website/src/components/rag/`. Live `/rag/app` surfaces integration setup in `IntegrationsPanel.tsx` and API snippets in `DeveloperApiSection.tsx`, while MCP tool serving runs via `apps/api/src/routers/mcp.py` (`/v1/mcp/tools`, `/v1/mcp/call`) and the standalone `packages/retriever-mcp` server.

- **Dual-Theme Design System 2.0 Parity:** Full support for both Azure (warm graphite, `#FAF9F6`) and Noir (obsidian glass, cyan `#00F0FF`).
- **1-Click Agent Setup Snippets:**
  - **Cursor IDE (`.cursor/mcp.json`)**: Pre-populated MCP server entry using `packages/retriever-mcp`.
  - **Claude Desktop (`claude_desktop_config.json`)**: Stdio / MCP launch command.
  - **VS Code / Cline (`cline_mcp_settings.json`)**: Cline settings JSON configuration.
  - **Python / LangChain (`agent_mcp.py`)**: `MultiServerMCPClient` boilerplate.

### 5.2 Studio Workspace Wiring (`src/app/rag/app/page.tsx`)
- `/rag/app` exposes 13 active tabs (`overview`, `chat`, `upload`, `search`, `cache`, `config`, `keys`, `team`, `visualizer`, `workflows`, `integrations`, `gateway`, `guardrails`); external MCP access is managed via API keys in `ApiKeysPanel.tsx` and integrations in `IntegrationsPanel.tsx`.

---

## 6. Security, Isolation, and Quality Standards

1. **Zero-Mock Production Invariant:** All MCP handlers execute live domain services or real battery algorithms. No synthetic mock returns.
2. **Tenant Isolation Invariant:** Execution requests derive `tenant_id` exclusively from validated tokens. Cross-tenant data inspection is physically impossible.
3. **Local Embedding Model Invariant:** Embeddings are generated exclusively via VPS-hosted `nomic-embed-text` to protect client API quotas.
4. **Test Verification Suite:** Complete Pytest test suite (`apps/api/tests/test_mcp.py`, `apps/api/tests/test_batteries.py`) and Vitest suite across active studio panels.
