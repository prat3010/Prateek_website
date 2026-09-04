---
id: UI_GatewayPanel
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/ui
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
---

# UI Component: `GatewayPanel`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #gateway #smart_router #litellm #budget_ledger #rag

> **Enterprise LLM Gateway & Smart Router Studio Panel (`/rag/app?view=gateway`).**

---

## 1. Overview & Functionality

`GatewayPanel` provides an interactive cockpit for configuring multi-model routing, fallback cascades, and virtual tenant spending guardrails:
- **Live Latency & Reachability Probes:** Real-time health cards for upstream providers (Gemini, OpenAI, Anthropic, local Ollama).
- **Dynamic Priority Cascade Editor:** Interactive primary model selector, ordered fallback list, latency SLA limits, and cooldown threshold inputs.
- **Virtual Spending Caps & Budget Dials:** Visual monthly and daily budget gauges with usage percentage indicators and zero-downtime breach actions (`downgrade_free_model`, `block`, `warn_only`).
- **Cost Attribution Breakdown:** Per-model spend ledger tracking current monthly token expenditures.

---

## 2. Dependencies & Blast Radius
- **Upstream Router:** `src/app/rag/app/page.tsx` (`Route_rag_app`)
- **Client SDK:** `src/lib/rag-client.ts` (`Lib_rag_client`)
- **Backend API:** `/v1/gateway/*` & `/v1/tenants/{tenantId}/gateway/*` (`Retriever_API_v1_gateway`)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

