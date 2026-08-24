---
id: Engine_LlamaGuard_Guardrails
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
  - Retriever_API_v1_chat
  - ../../../retriever/docs/constitution/master-vision
---

# Engine: Llama Guard 3 Prompt Injection Filter (Milestone 40)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #guardrails #security #retriever #m40

> **Zero-Trust Input & Output Content Moderation and Prompt Injection Defense.**

- **Role:** Filters harmful intent, jailbreak attempts, and PII leaks before reaching cognitive LLMs.

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/chat](Retriever_API_v1_chat.md)
- [Retriever: Constitution](../../../retriever/docs/constitution/master-vision.md)
