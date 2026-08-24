---
id: Lib_rag_client
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
file_path: src/lib/rag-client.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/rag-client.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/rag-client.ts"
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
  - platform/website
downstream:
  - ../24_RAG_App_Studio_PRD
  - Route_rag_app
  - Retriever_API_v1_chat
  - Engine_Dogfooding_Tenant_prateeq_scoping
---

# Lib: `rag-client.ts` (Retriever Backend Bridge)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/rag-client.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/rag-client.ts)**

#lib #rag #api #stream #retriever

> **TypeScript Client SDK communicating with FastAPI Cognitive Backend (`rag.prateeq.in`).**

- **Path:** `src/lib/rag-client.ts`
- **Methods:**
  - `streamChat(message, tenantId, options)`: Server-Sent Events (SSE) streaming chat.
  - `searchDocuments(query, tenantId, filters)`: Hybrid dense+sparse search.
  - `submitFeedback(messageId, score)`: 👍/👎 telemetry collection.
  - `getDownloadUrl(documentId)`: Presigned S3 citation downloads.

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Route: /rag/app](Route_rag_app.md)
- [Retriever_API: v1/chat](Retriever_API_v1_chat.md)
- [Engine: Dogfooding Tenant prateeq_scoping](Engine_Dogfooding_Tenant_prateeq_scoping.md)
