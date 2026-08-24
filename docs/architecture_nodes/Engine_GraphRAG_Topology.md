---
id: Engine_GraphRAG_Topology
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
  - UI_TopologyMap
  - ../25_SOTA_Scoping_Engine_PRD
---

# Engine: GraphRAG Knowledge Graph & Dynamic Topology

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #graph #graphrag #retriever #m46

> **Entity-Relation Extraction & Dynamic Architecture Graph Generation.**

- **Implementation:** `PgGraphRepository` & Neo4j Cypher Adapters in `apps/api/src/adapters/graph/`
- **Role:** Maps high-level functional features into concrete architectural nodes (Postgres, Redis, Celery, Vector Store, CDN) for the live `TopologyMap.tsx`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [UI: TopologyMap](UI_TopologyMap.md)
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
