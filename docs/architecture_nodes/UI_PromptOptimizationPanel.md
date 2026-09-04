---
id: UI_PromptOptimizationPanel
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

# UI Component: `PromptOptimizationPanel`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #dspy #prompt_optimization #teleprompter #m92 #rag

> **DSPy Declarative Prompt Compilation & Optimization Studio Panel (`/rag/app?view=prompts`).**

---

## 1. Overview & Functionality

`PromptOptimizationPanel` provides an interactive cockpit for algorithmic prompt compilation:
- **Optimizer Selection:** Configure `BootstrapFewShot` or `MIPROv2` teleprompters with max demonstration counts and grounding metrics.
- **Score Delta Analytics:** Live cards rendering baseline vs compiled program score lifts ($\Delta > 0$) with statistical significance indicators.
- **Few-Shot Demonstration Drawer:** Formatted display of discovered input questions, chain-of-thought rationales, and ground truth answers.
- **Production Hot-Activation:** 1-click atomic swap between compiled prompt programs and default string templates.

---

## 2. Dependencies & Blast Radius
- **Upstream Router:** `src/app/rag/app/page.tsx` (`Route_rag_app`)
- **Client SDK:** `src/lib/rag-client.ts` (`Lib_rag_client`)
- **Backend API:** `/v1/tenants/{tenantId}/prompts/*` (`Retriever_API_v1_prompts`)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

