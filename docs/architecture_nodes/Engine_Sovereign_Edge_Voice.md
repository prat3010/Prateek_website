---
id: Engine_Sovereign_Edge_Voice
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/domain/abstractions/voice.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/voice.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/voice.py"
runbook: docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/cognitive_engine
  - platform/retriever
invariants:
  - "Every query and database record MUST strictly enforce tenant_id isolation."
  - "Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError."
  - "Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys)."
test_suites:
  - apps/api/tests/test_architecture.py
downstream:
  - ../../../retriever/docs/api/voice
  - Retriever_API_v1_voice
  - ../99_DECISIONS
---

# Engine: Sovereign Edge Voice Streaming & WebRTC (Milestone 100)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/voice.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/voice.py)**

#engine #voice #webrtc #whisper #cartesia #vad #m100

> **Sub-300ms Real-Time Voice Assistant Pipeline with On-Device Whisper & Neural TTS.**

- **Domain Core:** `apps/api/src/domain/abstractions/voice.py` (`AudioStreamFrame`, `VoiceSessionConfig`, `VadState`)
- **Adapters:** `apps/api/src/adapters/voice/webrtc_stream_adapter.py`
- **Role:** Orchestrates WebRTC peer-to-peer audio channels, local Silero VAD, Whisper edge transcription, and streaming Cartesia voice synthesis.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API voice.md](../../../retriever/docs/api/voice.md)
- [Retriever_API: v1/voice](Retriever_API_v1_voice.md)
- [99_DECISIONS (ADR 37)](../99_DECISIONS.md#adr-37-sovereign-edge-voice-streaming-sub-300ms-webrtc-audio-pipelines)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

