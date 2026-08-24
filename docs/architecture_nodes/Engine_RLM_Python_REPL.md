---
id: Engine_RLM_Python_REPL
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/src/"
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/cognitive_engine
  - platform/retriever
downstream:
  - ../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP
  - API_scoping_parse_intent
  - ../25_SOTA_Scoping_Engine_PRD
---

# Engine: RLM Python REPL Sandbox (Milestone 47)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #repl #sandbox #math #retriever #m47

> **Deterministic Python AST Execution Sandbox for Mathematical CPQ Calculations.**

- **Implementation:** `RestrictedPythonSandboxAdapter` in `apps/api/src/adapters/sandbox/python_sandbox_adapter.py`
- **Security:** Strict AST NodeVisitor blocking prohibited imports, private attributes, and infinite loops.
- **Role:** Verifies pricing tier combinations, transitive dependency formulas, and milestone splits with 0 hallucination.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
