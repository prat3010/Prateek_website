---
id: API_rag_telemetry
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/api/rag/telemetry/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/telemetry/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/telemetry/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/public
  - domain/rag
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../24_RAG_App_Studio_PRD
  - Schema_retriever_inference_logs
---

# API: `GET /api/rag/telemetry`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/telemetry/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/telemetry/route.ts)**

#api #rag #telemetry #tokens

> **SaaS Studio Token Consumption, Query Latency & Cost Analytics.**

- **Endpoint:** `GET /api/rag/telemetry`
- **Path:** `src/app/api/rag/telemetry/route.ts`
- **Metrics:** Queries per second, token usage breakdown, semantic cache hit ratios.

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Schema: retriever_inference_logs](Schema_retriever_inference_logs.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

