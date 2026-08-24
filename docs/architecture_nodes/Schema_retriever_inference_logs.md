---
id: Schema_retriever_inference_logs
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: supabase_schema.sql
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
runbook: docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md
tags:
  - tier/8_persistence
  - security/public
  - domain/database
  - platform/website
invariants:
  - "All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS."
  - "Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies."
  - "Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables."
test_suites:
  - scripts/audit_contracts.py
  - scripts/audit_db.py
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

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_DATABASE_MIGRATION](docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md)

1. **All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS.**
2. **Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies.**
3. **Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables.**

