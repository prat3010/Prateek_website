---
id: Schema_retriever_inference_logs
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
file_path: supabase_schema.sql
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
tags:
  - tier/8_persistence
  - security/public
  - domain/database
  - platform/website
downstream:
  - ../../../retriever/docs/architecture
  - API_rag_telemetry
---

# Schema: `inference_logs` & `chat_feedback`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)**

#db #retriever #logs #telemetry #feedback

> **Token Consumption, Cost USD, Latency & User Feedback Metrics.**

- **Fields:** `tenant_id`, `prompt_tokens`, `completion_tokens`, `cost_usd`, `latency_ms`, `feedback_score`

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [API: rag/telemetry](API_rag_telemetry.md)
