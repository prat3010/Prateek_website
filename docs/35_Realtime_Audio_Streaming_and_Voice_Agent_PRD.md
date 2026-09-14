# PRD 35: Real-Time Audio Streaming & Full-Duplex WebRTC Voice Agent (M114)

**Milestone:** 114  
**Engine Version:** v1.4.0-alpha1  
**Category:** Edge Cognitive Audio & Real-Time Full-Duplex Conversational Streaming  
**Security & Privacy:** Sovereign Edge • Zero Third-Party Audio Egress • Tenant-Isolated  

---

## 1. Executive Summary & Vision

Milestone 114 introduces Retriever's real-time, low-latency, full-duplex conversational voice streaming agent. Designed for mission-critical enterprise environments, sovereign call centers, and hands-free industrial applications, this cognitive capability delivers conversational turnaround times under 300ms (Time-to-First-Audio-Byte) without compromising privacy.

Unlike traditional voice assistants that require manual "push-to-talk" or round-trip HTTP request-response loops with external cloud speech APIs, Milestone 114 operates on a continuous, bidirectional WebSocket streaming channel:
1. **Continuous 20ms Frame Ingestion:** The client streams raw 16kHz mono PCM16 audio frames (640 bytes per 20ms frame).
2. **In-Process RMS & ZCR VAD Endpointing:** Audio frames are continuously classified locally without sending audio to external APIs. Speech pauses exceeding the configured silence threshold (default: 400ms) automatically trigger turn completion.
3. **Conversational Barge-In & Cancellation:** If a user speaks while the agent is generating or streaming synthesized audio, the agent's synthesis task is cancelled within 60ms (3 consecutive speech frames), emitting an `interrupted` event and immediately muting client playback.
4. **Sub-300ms Streaming Speech Synthesis:** Neural vocal timbres stream audio chunks back over the same socket as they are generated.
5. **Zero-Cloud Audio Egress:** All speech recognition, VAD analysis, knowledge retrieval, and audio synthesis run strictly on sovereign edge infrastructure.

---

## 2. System Architecture & Frame Protocol

### 2.1 Full-Duplex WebSocket Pipeline

```text
[ Client Browser / SDK ]
         │
         │ (1) WS Connect: /v1/tenants/{tenantId}/voice/stream/{sessionId}?token=...
         ▼
[ FastAPI WebSocket Stream Router (apps/api/src/routers/voice.py) ]
         │
         │ (2) Authenticate & Register Stream Session
         ▼
[ VoiceStreamService (src/domain/voice/voice_stream_service.py) ]
    ├── [ StreamSessionState ] (Ring Buffer, Energy History, Active Task)
    ├── [ WhisperTranscriptionAdapter ] (RMS Energy VAD & Local Whisper ASR)
    ├── [ Hybrid Search / RAG Copilot ] (Sub-15ms Knowledge Retrieval)
    └── [ SpeechSynthesisAdapter ] (Streaming Neural Audio Chunks)
```

### 2.2 Bidirectional Protocol Specification

The WebSocket endpoint `/v1/tenants/{tenantId}/voice/stream/{sessionId}` (and alias `/ws/{sessionId}`) accepts mixed binary audio frames and JSON control messages:

| Message Type | Direction | Format | Description |
| :--- | :--- | :--- | :--- |
| **Session Ready** | Server → Client | JSON (`session_ready`) | Initial handshake confirming codec (`pcm16`), sample rate (`16000`), channels (`1`), and frame size (`640`). |
| **Audio Frame** | Client → Server | Binary (640 bytes) | Continuous 20ms PCM16 mono audio frame for VAD tracking. |
| **VAD State Event** | Server → Client | JSON (`vad_state`) | Emitted when speech begins (`speech_detected`) or ends (`endpoint_detected`). |
| **Transcript Final** | Server → Client | JSON (`transcript_final`) | Local Whisper transcription result with confidence score and latency profiling. |
| **Agent Thinking** | Server → Client | JSON (`agent_thinking`) | Notifies client that grounded retrieval and cognitive generation have started. |
| **Agent Text Delta** | Server → Client | JSON (`agent_text_delta`) | Streamed textual response delta for UI display. |
| **Audio Chunks** | Server → Client | Binary (PCM16) | Synthesized neural audio chunks streamed directly for real-time playback. |
| **Interrupted Event** | Server → Client | JSON (`interrupted`) | Emitted when user barge-in cancels active agent utterance. |
| **Turn Complete** | Server → Client | JSON (`turn_complete`) | Telemetry summary with TTFAB, transcribe latency, and total turn duration. |
| **Interrupt Control** | Client → Server | JSON (`interrupt`) | Client-initiated manual interruption or mute command. |
| **Ping / Pong** | Bidirectional | JSON (`ping` / `pong`) | Keepalive heartbeat and connection liveness check. |

---

## 3. Conversational Barge-In & Endpointing Engine

### 3.1 VAD Classification & Endpointing
- **Sample Rate:** 16,000 Hz, 16-bit Signed Integer (Little-Endian), Mono.
- **Frame Duration:** 20 ms (320 samples = 640 bytes).
- **RMS Energy Threshold:** Dynamically scaled by user sensitivity `[0.10, 0.95]`:
  $$\text{Threshold} = 800 + (1.0 - \text{sensitivity}) \times 3200$$
- **Silence Endpoint:** When `silence_frames >= silence_threshold_frames` (default: 20 frames = 400ms), an endpoint is detected and speech synthesis begins automatically without manual click-to-stop.

### 3.2 Conversational Interruption (Barge-In)
- When the agent is speaking or generating, if the user emits speech for $\ge 3$ consecutive frames (60ms), the engine executes an immediate cancellation:
  1. Calls `state.active_agent_task.cancel()` on the Python `asyncio.Task`.
  2. Clears the server-side audio generation buffer.
  3. Sends an `interrupted` event with `reason: "user_barge_in"` and `cancelled_turn_id`.
  4. The client halts local audio playback buffer immediately and returns to `LISTENING`.

---

## 4. Decoupled SDKs & SaaS Studio Interface

### 4.1 TypeScript SDK (`@prat3010/retriever-client`)
```typescript
const stream = client.createVoiceStream(sessionId, {
  onSessionReady: (config) => console.log("Stream ready:", config),
  onVadState: (state) => console.log("VAD:", state),
  onTranscript: (t) => console.log("Transcript:", t.text),
  onAgentAudioChunk: (chunk) => audioContext.playChunk(chunk),
  onInterrupted: (evt) => audioContext.stopPlayback(),
  onTurnComplete: (turn) => console.log("Turn completed in", turn.total_turn_duration_ms, "ms"),
});

// Stream audio from mic
stream.sendAudioFrame(pcm16Bytes);
// Interrupt
stream.interrupt();
```

### 4.2 Python SDK (`retriever-python`)
```python
url = client.get_voice_stream_url(
    session_id="vcs_prod_01",
    sensitivity=0.75,
    silence_threshold_ms=350,
    voice="warm_conversational",
)
# Connect with websockets or aiohttp
```

### 4.3 Control Plane Studio (`VoiceStudioPanel.tsx`)
- Genuine Web Audio API `AudioContext` + `AnalyserNode` frequency visualizer (32-band FFT mapped to 16 display bars).
- Interactive controls: `Activate Sovereign Mic`, `Stop Voice Stream`, `⚡ Barge-In / Interrupt`, and live VAD sensitivity slider.
- Zero `Math.random()` simulation or fake timeout mocks.

---

## 5. Verification & Quality Gates

| Verification Check | Target | Status |
| :--- | :--- | :--- |
| **Pytest Streaming Suite** | `test_voice_streaming.py` | 6/6 Passed (100%) |
| **Pytest Edge Voice Suite** | `test_edge_voice.py` | 5/5 Passed (100%) |
| **Vitest Studio Suite** | `VoiceStudioPanel.test.tsx` | 8/8 Passed (100%) |
| **Zero-Toy Audit** | `audit_zero_toy.py` | 0 Violations (315 files) |
| **Hexagonal Isolation** | `src/domain/voice/` | Zero DB/Web Framework imports |
| **Type Safety** | `tsc --noEmit` | Clean (0 errors across repos) |
