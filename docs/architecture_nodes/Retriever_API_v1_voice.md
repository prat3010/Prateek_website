---
id: Retriever_API_v1_voice
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/voice.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/voice.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/voice.py"
runbook: docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/fastapi
  - platform/retriever
invariants:
  - "Every query and database record MUST strictly enforce tenant_id isolation."
  - "Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError."
  - "Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys)."
test_suites:
  - apps/api/tests/test_architecture.py
downstream:
  - ../../../retriever/docs/api/voice
  - Engine_Sovereign_Edge_Voice
---

# Retriever API: `apps/api/src/routers/voice.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/voice.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/voice.py)**

#retriever #api #voice #webrtc #whisper #cartesia #m100

> **Sovereign Edge Voice Streaming & Whisper WebRTC Router (Milestone 100).**

- **Endpoints:**
  - `POST /v1/voice/session` — WebRTC session negotiation & SDP exchange
  - `POST /v1/voice/transcribe` — Whisper edge audio transcription
  - `POST /v1/voice/synthesize` — Cartesia neural low-latency TTS stream

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API voice.md](../../../retriever/docs/api/voice.md)
- [Engine: Sovereign Edge Voice](Engine_Sovereign_Edge_Voice.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

