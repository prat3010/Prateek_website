---
id: UI_McpPanel
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/rag/McpPanel.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/McpPanel.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/McpPanel.tsx"
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
downstream:
  - Retriever_API_v1_mcp
  - ../32_Universal_Model_Context_Protocol_PRD
---

# UI: `McpPanel.tsx` (Universal Model Context Protocol Center)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/McpPanel.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/McpPanel.tsx)**

#ui #mcp #jsonrpc #agents #cursor #claude #cline #retriever

> **Universal Model Context Protocol (MCP) Control Center and 1-Click Agent Integration.**

- **Path:** `src/components/rag/McpPanel.tsx` & `src/components/rag/McpPanel.module.css`
- **Features:**
  - 1-Click Agent Setup Snippets for Cursor IDE (`.cursor/mcp.json`), Claude Desktop (`claude_desktop_config.json`), VS Code Cline (`cline_mcp_settings.json`), and Python LangChain (`agent_mcp.py`).
  - 20-Battery Live Tool Registry Grid exposing hybrid search, RLM execution, graph traversal, and safety guardrails.
  - Interactive in-dashboard JSON-RPC 2.0 test probe.

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/mcp](Retriever_API_v1_mcp.md)
- [32_Universal_Model_Context_Protocol_PRD](../32_Universal_Model_Context_Protocol_PRD.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

