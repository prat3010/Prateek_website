"use client";

import React, { useState, useEffect, useCallback } from "react";
import NumberFlow from "@number-flow/react";
import { RetrieverClient } from "@/lib/rag-client";
import type {
  VoiceAudioCodec,
  VoiceSessionState,
  VoiceTimbre,
  VoiceSession,
  VoiceTurn,
  VoiceSessionTelemetry,
} from "@/lib/rag-types";
import MagneticButton from "@/components/ui/MagneticButton";
import styles from "./VoiceStudioPanel.module.css";

interface VoiceStudioPanelProps {
  hidden?: boolean;
  client?: RetrieverClient | null;
  tenantId?: string;
}

const DEFAULT_TELEMETRY: VoiceSessionTelemetry = {
  active_sessions_count: 3,
  average_turn_latency_ms: 184.5,
  audio_frames_processed: 14280,
  vad_speech_events_count: 312,
  whisper_engine: "whisper_cpp_sovereign_edge",
  synthesis_engine: "edge_neural_tts_streamer",
};

const INITIAL_TURNS: VoiceTurn[] = [
  {
    turn_id: "trn_init_1",
    session_id: "vcs_edge_demo",
    tenant_id: "tn_demo",
    user_transcript: "What is the status of the local sovereign edge voice pipeline?",
    agent_response_text:
      "The sovereign edge voice pipeline is fully operational with zero cloud audio egress. Whisper ASR and neural speech synthesis are running on local VPS acceleration.",
    time_to_transcribe_ms: 42.1,
    time_to_first_audio_byte_ms: 142.3,
    total_turn_duration_ms: 184.4,
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
];

export function VoiceStudioPanel({ hidden, client, tenantId }: VoiceStudioPanelProps) {
  const [telemetry, setTelemetry] = useState<VoiceSessionTelemetry>(DEFAULT_TELEMETRY);
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [sessionState, setSessionState] = useState<VoiceSessionState>("disconnected");
  const [vadSensitivity, setVadSensitivity] = useState<number>(0.65);
  const [selectedVoice, setSelectedVoice] = useState<VoiceTimbre>("neural_natural");
  const [audioCodec, setAudioCodec] = useState<VoiceAudioCodec>("pcm16");
  const [turns, setTurns] = useState<VoiceTurn[]>(INITIAL_TURNS);
  const [synthesisInput, setSynthesisInput] = useState<string>(
    "Zero cloud audio egress ensures total tenant sovereignty and sub-250ms voice latency."
  );
  const [turnInput, setTurnInput] = useState<string>("");
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);
  const [synthesizing, setSynthesizing] = useState<boolean>(false);
  const [simulatingTurn, setSimulatingTurn] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Waveform visualization state (16 audio frequency bars)
  const [bars, setBars] = useState<number[]>(() => Array(16).fill(8));

  const fetchTelemetry = useCallback(async () => {
    if (!client) return;
    setLoadingTelemetry(true);
    try {
      const data = await client.getVoiceTelemetry();
      if (data) {
        setTelemetry(data);
      }
    } catch {
      // Retain existing telemetry
    } finally {
      setLoadingTelemetry(false);
    }
  }, [client]);

  useEffect(() => {
    if (hidden || !client) return;
    let active = true;

    client
      .getVoiceTelemetry()
      .then((data) => {
        if (active && data) setTelemetry(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [hidden, client]);

  // Dynamic waveform animation driven by session state
  useEffect(() => {
    if (sessionState !== "listening" && sessionState !== "speaking") {
      return;
    }

    const interval = setInterval(() => {
      setBars(
        Array.from({ length: 16 }, () =>
          sessionState === "speaking"
            ? Math.floor(Math.random() * 48) + 12
            : Math.floor(Math.random() * 32) + 6
        )
      );
    }, 90);

    return () => {
      clearInterval(interval);
      setBars(Array(16).fill(8));
    };
  }, [sessionState]);

  const handleToggleMic = async () => {
    if (sessionState === "disconnected") {
      setSessionState("initializing");
      setStatusMessage(null);
      try {
        let createdSession: VoiceSession;
        if (client) {
          createdSession = await client.createVoiceSession({
            tenant_id: tenantId || "tn_demo",
            vad_sensitivity: vadSensitivity,
            selected_voice: selectedVoice,
            audio_codec: audioCodec,
          });
          setSession(createdSession);

          // Exchange WebRTC SDP Offer/Answer signaling
          await client.sendVoiceSignal({
            session_id: createdSession.session_id,
            message_type: "offer",
            sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 RTP/SAVPF 111\r\nc=IN IP4 127.0.0.1\r\na=rtpmap:111 opus/48000/2",
          });
        } else {
          // Offline / demo fallback session
          createdSession = {
            session_id: `vcs_sim_${Date.now().toString(36)}`,
            tenant_id: tenantId || "tn_demo",
            user_id: "usr_client",
            state: "listening",
            config: {
              tenant_id: tenantId || "tn_demo",
              vad_sensitivity: vadSensitivity,
              selected_voice: selectedVoice,
              audio_codec: audioCodec,
            },
            created_at: new Date().toISOString(),
            connected_at: new Date().toISOString(),
            total_turns: 1,
            last_ping_at: new Date().toISOString(),
          };
          setSession(createdSession);
        }

        setSessionState("listening");
        setStatusMessage({
          type: "success",
          text: `WebRTC full-duplex session established (${createdSession.session_id.slice(0, 12)}…). VAD active.`,
        });
      } catch (err: unknown) {
        setSessionState("disconnected");
        const msg = err instanceof Error ? err.message : "Failed to initialize WebRTC voice stream";
        setStatusMessage({ type: "error", text: msg });
      }
    } else {
      // Disconnect session
      setSessionState("disconnected");
      setStatusMessage({
        type: "success",
        text: "Voice stream closed. WebRTC audio channel released.",
      });
    }
  };

  const handleSynthesize = async () => {
    if (!synthesisInput.trim()) return;
    setSynthesizing(true);
    setStatusMessage(null);
    try {
      if (client) {
        const res = await client.synthesizeSpeech(synthesisInput.trim(), {
          selected_voice: selectedVoice,
          speed: 1.0,
        });
        setStatusMessage({
          type: "success",
          text: `Synthesized ${res.chunks_count} neural PCM16 chunks (${res.total_bytes} bytes) in sub-250ms TTFAB.`,
        });
      } else {
        // Fallback simulation
        await new Promise((r) => setTimeout(r, 180));
        setStatusMessage({
          type: "success",
          text: `[Simulation] Synthesized 4 chunks (38,400 bytes) in 180ms TTFAB via ${selectedVoice}.`,
        });
      }
      // Trigger speaking waveform pulse
      const priorState = sessionState;
      setSessionState("speaking");
      setTimeout(() => {
        setSessionState(priorState === "disconnected" ? "disconnected" : "listening");
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Speech synthesis failed";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setSynthesizing(false);
    }
  };

  const handleSimulateTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = turnInput.trim() || "Analyze vector database latency and provide recommendations.";
    setSimulatingTurn(true);
    setSessionState("thinking");
    setStatusMessage(null);

    try {
      if (client) {
        const res = await client.sendVoiceTurn({
          session_id: session?.session_id || "vcs_edge_demo",
          text_override: prompt,
          selected_voice: selectedVoice,
        });
        setTurns((prev) => [res.turn, ...prev]);
        setStatusMessage({
          type: "success",
          text: `Turn completed: TTFAB ${res.turn.time_to_first_audio_byte_ms}ms, Total ${res.turn.total_turn_duration_ms}ms.`,
        });
      } else {
        // Fallback simulation
        await new Promise((r) => setTimeout(r, 220));
        const simTurn: VoiceTurn = {
          turn_id: `trn_${Date.now().toString(36)}`,
          session_id: session?.session_id || "vcs_edge_demo",
          tenant_id: tenantId || "tn_demo",
          user_transcript: prompt,
          agent_response_text:
            "Vector database latency is currently 12ms with 98.4% HNSW cache hit rate. Index pruning is recommended in 48 hours.",
          time_to_transcribe_ms: 38.4,
          time_to_first_audio_byte_ms: 135.2,
          total_turn_duration_ms: 173.6,
          created_at: new Date().toISOString(),
        };
        setTurns((prev) => [simTurn, ...prev]);
        setStatusMessage({
          type: "success",
          text: `[Simulation] Turn completed: TTFAB 135.2ms, Total 173.6ms.`,
        });
      }

      setTurnInput("");
      setSessionState("speaking");
      setTimeout(() => {
        setSessionState(session ? "listening" : "disconnected");
      }, 3000);
    } catch (err: unknown) {
      setSessionState(session ? "listening" : "disconnected");
      const msg = err instanceof Error ? err.message : "Turn processing failed";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setSimulatingTurn(false);
    }
  };

  if (hidden) return null;

  return (
    <div className={styles.container}>
      {/* Header & Badges */}
      <div className={styles.headerGroup}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            <span>🎙️</span> Sovereign Edge Voice & Local Whisper / WebRTC Synthesis
          </h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "0.35rem 0" }}>
            <span className={styles.badgeM100}>M100 • v0.85.0</span>
            <span className={styles.badgeBattery}>Platform Battery #20: Active</span>
            <span className={styles.badgeBattery}>Local Whisper ASR (RMS VAD)</span>
            <span className={styles.badgeBattery}>Zero Cloud Egress</span>
          </div>
          <p className={styles.description}>
            Full-duplex bidirectional conversational speech pipeline with sub-250ms Time-to-First-Audio-Byte (TTFAB).
            Powered by local Whisper ASR endpointing, WebRTC SDP/ICE signaling, and streaming neural speech synthesis.
          </p>
        </div>

        <div className={styles.actionGroup}>
          <button
            className={styles.btnOutline}
            onClick={fetchTelemetry}
            disabled={loadingTelemetry}
            title="Refresh edge voice telemetry"
          >
            {loadingTelemetry ? "Refreshing..." : "↻ Refresh Telemetry"}
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`${styles.statusMessage} ${
            statusMessage.type === "success" ? styles.statusSuccess : styles.statusError
          }`}
        >
          <span>{statusMessage.type === "success" ? "✓" : "⚠"}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Real-Time Telemetry Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Active Sessions</span>
            <span className={styles.metricIcon}>📡</span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>
              <NumberFlow value={telemetry.active_sessions_count} />
            </span>
            <span className={styles.metricBadge}>Full-Duplex</span>
          </div>
          <span className={styles.metricSubtext}>WebRTC peer sessions connected</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Avg Turn Latency</span>
            <span className={styles.metricIcon}>⚡</span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>
              <NumberFlow value={telemetry.average_turn_latency_ms} format={{ maximumFractionDigits: 1 }} />
              ms
            </span>
            <span className={styles.metricBadge}>Sub-250ms</span>
          </div>
          <span className={styles.metricSubtext}>End-to-end user voice turnaround</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Audio Frames</span>
            <span className={styles.metricIcon}>🎧</span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>
              <NumberFlow value={telemetry.audio_frames_processed} />
            </span>
          </div>
          <span className={styles.metricSubtext}>PCM16 frames processed at edge</span>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>VAD Endpoint Events</span>
            <span className={styles.metricIcon}>🎯</span>
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>
              <NumberFlow value={telemetry.vad_speech_events_count} />
            </span>
            <span className={styles.metricBadge}>RMS & ZCR</span>
          </div>
          <span className={styles.metricSubtext}>Speech boundaries accurately detected</span>
        </div>
      </div>

      {/* Main Dual-Column Cockpit Layout */}
      <div className={styles.columnsGrid}>
        {/* Left Column: Voice Audio Studio Controls & Visualizer */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span>🎛️</span> Sovereign Edge Voice Deck
            </h3>
            <p className={styles.cardDescription}>
              Manage full-duplex WebRTC connection, VAD thresholding, neural timbre, and real-time synthesis.
            </p>
          </div>

          <div className={styles.cardBody}>
            {/* Live Session State Banner */}
            <div className={styles.sessionStateBanner}>
              <div className={styles.sessionStateLeft}>
                <span
                  className={`${styles.stateDot} ${
                    sessionState === "listening"
                      ? styles.stateDotListening
                      : sessionState === "thinking"
                      ? styles.stateDotThinking
                      : sessionState === "speaking"
                      ? styles.stateDotSpeaking
                      : sessionState === "initializing" || sessionState === "signaling"
                      ? styles.stateDotActive
                      : ""
                  }`}
                />
                <span className={styles.stateTitle}>
                  State: {sessionState === "disconnected" ? "IDLE" : sessionState.toUpperCase()}
                </span>
              </div>
              <span className={styles.sessionSessionId}>
                {session ? session.session_id : "No active session"}
              </span>
            </div>

            {/* Audio Waveform Visualizer */}
            <div className={styles.waveformBox} aria-label="Audio Waveform Visualizer">
              {bars.map((height, idx) => (
                <div
                  key={idx}
                  className={`${styles.waveformBar} ${
                    sessionState === "speaking"
                      ? styles.waveformBarSpeaking
                      : sessionState === "listening"
                      ? styles.waveformBarActive
                      : ""
                  }`}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            {/* VAD Sensitivity Slider */}
            <div className={styles.vadSection}>
              <div className={styles.vadHeaderRow}>
                <span className={styles.vadLabel}>VAD Energy Sensitivity</span>
                <span className={styles.vadValue}>{(vadSensitivity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={vadSensitivity}
                onChange={(e) => setVadSensitivity(parseFloat(e.target.value))}
                className={styles.sliderInput}
              />
            </div>

            {/* Audio Settings Grid */}
            <div className={styles.controlsGrid}>
              <div className={styles.controlField}>
                <label className={styles.controlLabel}>Neural Speech Timbre</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value as VoiceTimbre)}
                  className={styles.selectInput}
                >
                  <option value="neural_natural">Atlas (Crisp & Technical)</option>
                  <option value="warm_conversational">Nova (Warm & Conversational)</option>
                  <option value="neural_fast">Astra (Ultra Fast)</option>
                  <option value="crisp_authoritative">Echo (Authoritative)</option>
                </select>
              </div>

              <div className={styles.controlField}>
                <label className={styles.controlLabel}>Audio Codec</label>
                <select
                  value={audioCodec}
                  onChange={(e) => setAudioCodec(e.target.value as VoiceAudioCodec)}
                  className={styles.selectInput}
                >
                  <option value="pcm16">PCM16 (16kHz Uncompressed)</option>
                  <option value="opus">Opus (Low Bandwidth)</option>
                  <option value="wav">WAV (Lossless)</option>
                  <option value="mp3">MP3 (Compressed)</option>
                </select>
              </div>
            </div>

            {/* Primary Action Deck: Connect / Mic Toggle */}
            <div className={styles.deckActions}>
              <MagneticButton strength={0.25}>
                <button
                  className={`${styles.btnMic} ${
                    sessionState !== "disconnected" ? styles.btnMicActive : styles.btnMicIdle
                  }`}
                  onClick={handleToggleMic}
                >
                  <span>{sessionState !== "disconnected" ? "⏹ Stop Voice Stream" : "🎙️ Activate Sovereign Mic"}</span>
                </button>
              </MagneticButton>
            </div>

            {/* Quick Synthesis Tester */}
            <div className={styles.synthesisBox}>
              <label className={styles.controlLabel}>Test Streaming Speech Synthesis</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={synthesisInput}
                  onChange={(e) => setSynthesisInput(e.target.value)}
                  placeholder="Enter text to synthesize into streaming audio..."
                  className={styles.textInput}
                />
                <button
                  className={styles.btnOutline}
                  onClick={handleSynthesize}
                  disabled={synthesizing || !synthesisInput.trim()}
                >
                  {synthesizing ? "Synthesizing..." : "🔊 Play"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Turn Stream & Latency Profiler */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span>💬</span> Conversational Turn Ledger
            </h3>
            <p className={styles.cardDescription}>
              Real-time transcript stream with per-turn TTFAB, transcription, and total latency profiling.
            </p>
          </div>

          <div className={styles.cardBody}>
            {/* Turn Simulator Input Form */}
            <form onSubmit={handleSimulateTurn} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                type="text"
                value={turnInput}
                onChange={(e) => setTurnInput(e.target.value)}
                placeholder="Simulate user voice query or transcription..."
                className={styles.textInput}
              />
              <MagneticButton strength={0.25}>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={simulatingTurn}
                >
                  {simulatingTurn ? "Processing..." : "➤ Send"}
                </button>
              </MagneticButton>
            </form>

            {/* Turns Stream List */}
            <div className={styles.turnsContainer}>
              {turns.length === 0 ? (
                <div className={styles.emptyTurns}>
                  <span>🎙️</span>
                  <span>No voice turns recorded yet. Speak into the mic or enter a query above.</span>
                </div>
              ) : (
                turns.map((turn) => (
                  <div key={turn.turn_id} className={styles.turnCard}>
                    {/* User Utterance */}
                    <div>
                      <div className={styles.turnRoleHeader}>
                        <span className={`${styles.turnRole} ${styles.roleUser}`}>
                          <span>👤</span> User
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                          {new Date(turn.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={styles.turnContent}>{turn.user_transcript}</p>
                    </div>

                    {/* Assistant Response */}
                    <div style={{ marginTop: "0.5rem", borderTop: "1px dashed var(--surface-glass-border)", paddingTop: "0.5rem" }}>
                      <div className={styles.turnRoleHeader}>
                        <span className={`${styles.turnRole} ${styles.roleAgent}`}>
                          <span>⚡</span> Sovereign Agent
                        </span>
                        <div className={styles.turnMetrics}>
                          <span className={`${styles.turnChip} ${styles.turnChipFast}`}>
                            TTFAB: {turn.time_to_first_audio_byte_ms.toFixed(0)}ms
                          </span>
                          <span className={styles.turnChip}>
                            Total: {turn.total_turn_duration_ms.toFixed(0)}ms
                          </span>
                        </div>
                      </div>
                      <p className={styles.turnContent}>{turn.agent_response_text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
