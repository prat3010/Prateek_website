---
id: UI_TopologyMap
tier: 2_discovery_commerce
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/2_discovery_commerce
  - security/public
  - domain/scoping
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - UI_ArchitectureCartDrawer
  - Engine_GraphRAG_Topology
  - ../25_SOTA_Scoping_Engine_PRD
---

# UI: `TopologyMap.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #frontend #graph #visualization

> **Dynamic Architecture SVG Circuit Blueprint displaying selected system architecture.**

---

## 🔗 Related Architecture & Cross-References
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [Engine: GraphRAG Topology](Engine_GraphRAG_Topology.md)
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

