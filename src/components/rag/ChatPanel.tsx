"use client";

import { useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import { GroundingDiffResponse, ClaimClassification, ReActTraceStep } from "@/lib/rag-types";
import Portal from "@/components/ui/Portal";
import styles from "./rag.module.css";

interface ChatMessageItem {
  id: number;
  role: string;
  content: string;
  backendMessageId?: string;
  cached?: boolean;
  latencyMs?: number;
  feedback?: "up" | "down";
  reactTraces?: ReActTraceStep[];
}

export function ChatPanel({ client, hidden, isExpired }: { client: RetrieverClient | null; hidden: boolean; isExpired?: boolean }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<ChatMessageItem>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAgenticMode, setIsAgenticMode] = useState(false);
  const [error, setError] = useState("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [showJumpBottom, setShowJumpBottom] = useState(false);

  // Grounding Inspector state
  const [activeGroundingMsgId, setActiveGroundingMsgId] = useState<number | null>(null);
  const [groundingDiffs, setGroundingDiffs] = useState<Record<number, GroundingDiffResponse>>({});
  const [loadingGroundingId, setLoadingGroundingId] = useState<number | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<ClaimClassification | null>(null);

  // Feedback modal state
  const [feedbackModalMsg, setFeedbackModalMsg] = useState<{ msgId: number; backendMessageId?: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Visual Citation Lightbox modal state (Milestone 113 / Battery #29)
  interface VisualCitationData {
    diagramTitle: string;
    elementLabel?: string;
    box?: [number, number, number, number];
    snippet?: string;
  }
  const [activeVisualCitation, setActiveVisualCitation] = useState<VisualCitationData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUserScrolledUp = useRef(false);
  const msgIdCounter = useRef(0);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    isUserScrolledUp.current = !isAtBottom;
    setShowJumpBottom(!isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    isUserScrolledUp.current = false;
    setShowJumpBottom(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!isUserScrolledUp.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    el.addEventListener("wheel", handleWheel, { passive: true });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [messages.length]);

  const startSession = useCallback(async () => {
    if (!client || isStartingSession) return;
    setError("");
    setIsStartingSession(true);
    try {
      const res = await client.createSession();
      setSessionId(res.sessionId);
      setMessages([{ id: ++msgIdCounter.current, role: "assistant", content: "Session started. Send your first message." }]);
      isUserScrolledUp.current = false;
      setShowJumpBottom(false);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    } finally {
      setIsStartingSession(false);
    }
  }, [client, isStartingSession]);

  useEffect(() => {
    let active = true;
    if (client && !sessionId && !loading && !hidden && messages.length === 0) {
      Promise.resolve().then(() => {
        if (active) {
          startSession();
        }
      });
    }
    return () => {
      active = false;
    };
  }, [client, sessionId, loading, hidden, messages.length, startSession]);

  function stopGeneration() {
    abortController?.abort();
    setAbortController(null);
  }

  const handleFeedback = useCallback(
    async (msgId: number, backendMessageId: string | undefined, rating: "up" | "down") => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedback: rating } : m))
      );

      if (rating === "down") {
        setFeedbackModalMsg({ msgId, backendMessageId });
        setFeedbackText("");
      } else if (client && sessionId) {
        try {
          const targetId = backendMessageId || String(msgId);
          await client.submitFeedback(sessionId, targetId, rating);
        } catch (err) {
          console.warn("[Feedback] Failed to submit positive feedback:", err);
        }
      }
    },
    [client, sessionId]
  );

  const submitModalFeedback = async () => {
    if (!feedbackModalMsg) return;
    setFeedbackSubmitting(true);
    try {
      if (client && sessionId) {
        const targetId = feedbackModalMsg.backendMessageId || String(feedbackModalMsg.msgId);
        await client.submitFeedback(sessionId, targetId, "down", feedbackText);
      }
    } catch (err) {
      console.warn("[Feedback] Failed to submit negative feedback text:", err);
    } finally {
      setFeedbackSubmitting(false);
      setFeedbackModalMsg(null);
      setFeedbackText("");
    }
  };

  const handleCitationDownload = useCallback(
    async (docIdOrName: string) => {
      if (!client) return;
      try {
        const res = await client.getDownloadUrl(docIdOrName);
        if (res?.downloadUrl) {
          window.open(res.downloadUrl, "_blank");
        }
      } catch (err) {
        console.warn("[Download] Failed to get presigned URL:", err);
        setError(err instanceof Error ? err.message : "Download failed");
      }
    },
    [client]
  );

  const toggleGroundingInspector = useCallback(
    async (msgId: number, content: string) => {
      if (activeGroundingMsgId === msgId) {
        setActiveGroundingMsgId(null);
        setSelectedClaim(null);
        return;
      }

      if (groundingDiffs[msgId]) {
        setActiveGroundingMsgId(msgId);
        setSelectedClaim(groundingDiffs[msgId].claims[0] || null);
        return;
      }

      if (!client) return;
      setLoadingGroundingId(msgId);
      try {
        const diff = await client.computeGroundingDiff(content);
        setGroundingDiffs((prev) => ({ ...prev, [msgId]: diff }));
        setActiveGroundingMsgId(msgId);
        setSelectedClaim(diff.claims[0] || null);
      } catch (err) {
        console.warn("[Grounding] Failed to compute grounding diff:", err);
      } finally {
        setLoadingGroundingId(null);
      }
    },
    [activeGroundingMsgId, groundingDiffs, client]
  );

  async function sendMessage() {
    if (!client || !sessionId || !input.trim() || loading) return;
    const msg = input;
    setInput("");
    setError("");
    const userMsgId = ++msgIdCounter.current;
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: msg }]);
    setLoading(true);
    isUserScrolledUp.current = false;
    setShowJumpBottom(false);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const assistantId = ++msgIdCounter.current;
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      if (isAgenticMode) {
        const traceStepsByIndex: Record<number, ReActTraceStep> = {};

        const updateAssistantState = (finalAns?: string) => {
          const traces = Object.values(traceStepsByIndex).sort((a, b) => a.stepIndex - b.stepIndex);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.id === assistantId) {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: finalAns !== undefined ? finalAns : last.content,
                  reactTraces: traces,
                },
              ];
            }
            return prev;
          });
        };

        const onEvent = (ev: import("@/lib/rag-types").ReActStreamEvent) => {
          const step = ev.step_index ?? 0;
          traceStepsByIndex[step] = traceStepsByIndex[step] || { stepIndex: step };

          if (ev.event_type === "thought") {
            traceStepsByIndex[step].thought = ev.data?.thought || "";
            updateAssistantState();
          } else if (ev.event_type === "tool_start") {
            traceStepsByIndex[step].toolCall = {
              toolName: ev.data?.tool_name || "tool",
              arguments: ev.data?.arguments || {},
            };
            updateAssistantState();
          } else if (ev.event_type === "tool_done") {
            traceStepsByIndex[step].toolResult = {
              toolName: ev.data?.tool_name || "tool",
              output: ev.data?.output || "",
              isError: Boolean(ev.data?.is_error),
              latencyMs: ev.data?.latency_ms,
            };
            updateAssistantState();
          } else if (ev.event_type === "self_healing") {
            if (traceStepsByIndex[step].toolResult) {
              traceStepsByIndex[step].toolResult!.selfHealingApplied = true;
            }
            traceStepsByIndex[step].selfHealing = {
              toolName: ev.data?.tool_name || "",
              error: ev.data?.error || "",
              recoveryAction: ev.data?.recovery_action || "",
            };
            updateAssistantState();
          } else if (ev.event_type === "circuit_breaker") {
            traceStepsByIndex[step].circuitBreaker = {
              toolName: ev.data?.tool_name || "",
              warning: ev.data?.warning || "Execution loop detected",
            };
            updateAssistantState();
          } else if (ev.event_type === "model_escalation") {
            traceStepsByIndex[step].modelEscalation = {
              fromModel: ev.data?.from_model || "mid_tier",
              toModel: ev.data?.to_model || "frontier",
              reason: ev.data?.reason || "step_count_threshold",
              details: ev.data?.details || "",
            };
            updateAssistantState();
          } else if (ev.event_type === "final_answer") {
            const ans = ev.data?.final_answer || "";
            updateAssistantState(ans);
          } else if (ev.event_type === "error") {
            const errMsg = ev.data?.error || "Agentic execution error";
            setError(`Agent Error: ${errMsg}`);
          }
        };

        const finalResult = await client.streamAgenticWorkflow(msg, onEvent, controller.signal);
        if (finalResult) {
          updateAssistantState(finalResult);
        }

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === assistantId) {
            const traces = Object.values(traceStepsByIndex).sort((a, b) => a.stepIndex - b.stepIndex);
            const content = last.content.trim() || (traces.length > 0 ? "Agentic task completed." : "No response received from agent.");
            return [...prev.slice(0, -1), { ...last, content, reactTraces: traces }];
          }
          return prev;
        });
      } else {
        const runStreamAttempt = async (currentEventId?: string): Promise<{ done: boolean; lastId?: string }> => {
          const body = await client.chat(sessionId, msg, controller.signal, currentEventId);
          if (!body) {
            return { done: true, lastId: currentEventId };
          }

          const reader = body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = "";
          let streamDone = false;
          let latestId = currentEventId;

          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;
            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split("\n");
            sseBuffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("id: ")) {
                latestId = trimmed.slice(4).trim();
              } else if (trimmed.startsWith("data: ")) {
                const data = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.id) latestId = String(parsed.id);
                  if (parsed.event === "done") {
                    streamDone = true;
                    break;
                  }
                  if (parsed.event === "error") {
                    const errMsg = parsed.message || parsed.error || parsed.detail || "Server error during chat stream";
                    setError(`Stream Error: ${errMsg}`);
                    streamDone = true;
                    break;
                  }
                  if (parsed.message_id || parsed.cached !== undefined || parsed.latency_ms) {
                    setMessages((prev) => {
                      const last = prev[prev.length - 1];
                      if (last?.role === "assistant" && last.id === assistantId) {
                        return [
                          ...prev.slice(0, -1),
                          {
                            ...last,
                            backendMessageId: parsed.message_id || last.backendMessageId,
                            cached: parsed.cached ?? last.cached,
                            latencyMs: parsed.latency_ms ?? last.latencyMs,
                          },
                        ];
                      }
                      return prev;
                    });
                  }
                  const delta = parsed.content ?? parsed.delta ?? "";
                  if (delta) {
                    setMessages((prev) => {
                      const last = prev[prev.length - 1];
                      if (last?.role === "assistant" && last.id === assistantId) {
                        return [...prev.slice(0, -1), { ...last, content: last.content + delta }];
                      }
                      return prev;
                    });
                  }
                } catch (parseErr) {
                  console.warn("[SSE] Failed to parse event line:", data, parseErr);
                }
              }
            }
          }
          return { done: streamDone, lastId: latestId };
        };

        let lastEventId: string | undefined = undefined;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await runStreamAttempt(lastEventId);
            lastEventId = result.lastId;
            if (result.done) break;
          } catch (streamErr) {
            if (controller.signal.aborted) throw streamErr;
            if (attempt < 3) {
              console.warn(`[SSE] Stream disconnected. Reconnecting with Last-Event-ID (${lastEventId || 'none'}), attempt ${attempt}/3...`);
              await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
            } else {
              throw streamErr;
            }
          }
        }

        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.id === assistantId) {
            if (!last.content.trim()) {
              return [...prev.slice(0, -1), { ...last, content: "No response received from model stream. Please try again." }];
            }
          }
          return prev;
        });
      }
    } catch (e: unknown) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content.trim()) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      if (e instanceof DOMException && e.name === "AbortError") {
        setMessages((prev) => [...prev, { id: ++msgIdCounter.current, role: "assistant", content: "(stopped)" }]);
      } else {
        setError(e instanceof Error ? e.message : "Chat failed");
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }

  function renderFormattedContent(
    content: string,
    onDownloadCitation: (docId: string) => void
  ): ReactNode {
    const citationRegex = /\[(?:(Doc|Source|Schematic|Diagram):\s*([^\]]+)|(\d+))\]/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(content)) !== null) {
      const fullMatch = match[0];
      const kind = match[1]; // "Doc" | "Source" | "Schematic" | "Diagram" | undefined
      const isNamed = Boolean(kind || match[2]);
      const rawDocIdentifier = isNamed ? match[2] : `Reference ${match[3]}`;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }

      if (isNamed) {
        if (kind === "Schematic" || kind === "Diagram") {
          // Parse format: [Schematic: title | Box: ymin,xmin,ymax,xmax | "element label"]
          const segments = rawDocIdentifier.split("|").map((s) => s.trim());
          const diagramTitle = segments[0] || "Architecture Schematic";
          let elementLabel = "";
          let boundingBox: [number, number, number, number] | undefined;

          for (let i = 1; i < segments.length; i++) {
            const seg = segments[i];
            if (seg.toLowerCase().startsWith("box:")) {
              const coordsStr = seg.substring(4).trim();
              const coords = coordsStr.split(",").map((c) => parseFloat(c.trim()));
              if (coords.length === 4 && coords.every((n) => !isNaN(n))) {
                boundingBox = [coords[0], coords[1], coords[2], coords[3]];
              }
            } else if (seg.startsWith('"') && seg.endsWith('"')) {
              elementLabel = seg.slice(1, -1);
            } else if (!elementLabel) {
              elementLabel = seg;
            }
          }

          parts.push(
            <button
              key={`visual-citation-${matchIndex}`}
              className={styles.schematicBadge}
              onClick={(e) => {
                e.preventDefault();
                setActiveVisualCitation({
                  diagramTitle,
                  elementLabel: elementLabel || undefined,
                  box: boundingBox,
                  snippet: elementLabel ? `Visual element: ${elementLabel}` : undefined,
                });
              }}
              title={`🔍 View Architectural Schematic: ${diagramTitle}${elementLabel ? ` → [${elementLabel}]` : ""}`}
            >
              📐 {diagramTitle} {elementLabel ? `[${elementLabel}]` : ""}
            </button>
          );
        } else {
          // Check if citation carries explicit exact span quote: e.g. filename.pdf | "exact text snippet"
          const pipeIndex = rawDocIdentifier.indexOf("|");
          let docName = rawDocIdentifier.trim();
          let quoteSnippet = "";

          if (pipeIndex !== -1) {
            docName = rawDocIdentifier.substring(0, pipeIndex).trim();
            quoteSnippet = rawDocIdentifier.substring(pipeIndex + 1).replace(/^[\s"]+|[\s"]+$/g, "");
          }

          if (quoteSnippet) {
            parts.push(
              <span key={`quote-${matchIndex}`} className={styles.groundedHighlight} title="Verified Exact String Span Context Match">
                “{quoteSnippet}”
              </span>
            );
          }

          parts.push(
            <button
              key={`citation-${matchIndex}`}
              className={styles.citationBadge}
              onClick={(e) => {
                e.preventDefault();
                onDownloadCitation(docName);
              }}
              title={`✓ Grounded in Document: ${docName}. Click to download source file.`}
            >
              ✓ 📥 {docName}
            </button>
          );
        }
      } else {
        const indexNum = match[3];
        parts.push(
          <button
            key={`citation-idx-${matchIndex}`}
            className={styles.citationBadge}
            onClick={(e) => {
              e.preventDefault();
              onDownloadCitation(indexNum);
            }}
            title={`✓ Grounded in Verified Source Reference [${indexNum}]`}
          >
            ✓ [{indexNum}]
          </button>
        );
      }

      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  }

  useEffect(() => {
    if (!feedbackModalMsg && !activeVisualCitation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFeedbackModalMsg(null);
        setActiveVisualCitation(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedbackModalMsg, activeVisualCitation]);

  if (hidden) return null;

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>Chat</h2>
      <p className={styles.panelDesc}>Streaming RAG chat with your documents.</p>

      {!sessionId && messages.length === 0 && (
        <p className={styles.empty}>Start a session to begin chatting with your documents.</p>
      )}

      <div className={styles.chatControls}>
        {!sessionId ? (
          <button
            className="comic-btn comic-btn-blue"
            onClick={startSession}
            disabled={isStartingSession}
          >
            {isStartingSession ? "Starting Session…" : "Start Session"}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span className={styles.sessionBadge}>
              Session: {sessionId.slice(0, 8)}…
              <button className="comic-btn comic-btn-outline" style={{ marginLeft: "0.5rem" }} onClick={() => { setSessionId(null); setMessages([]); }}>End</button>
            </span>
            <button
              type="button"
              className={`${styles.modeToggleBtn} ${isAgenticMode ? styles.modeToggleActive : ""}`}
              onClick={() => setIsAgenticMode(!isAgenticMode)}
              title={isAgenticMode ? "Switch to standard Direct RAG" : "Switch to Autonomous ReAct Agent Loop"}
            >
              {isAgenticMode ? "⚡ ReAct Agent" : "💬 Direct RAG"}
            </button>
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className={styles.chatContainer}>
          <div
            className={styles.chatMessages}
            ref={containerRef}
            onScroll={handleScroll}
            data-lenis-prevent
            data-lenis-prevent-touch
            data-lenis-prevent-wheel
          >
            {messages.map((m, index) => {
              const isLast = index === messages.length - 1;
              const isStreamingAssistant = m.role === "assistant" && isLast && loading;
              const hasTraces = Boolean(m.reactTraces && m.reactTraces.length > 0);
              const isWaitingFirstToken = isStreamingAssistant && !m.content && !hasTraces;

              const hasCitations = /\[(Doc|Source|Schematic|Diagram):|\[\d+\]/.test(m.content);
              const hasUngroundedWarning = m.content.includes("ungrounded") || m.content.includes("unverified");

              return (
                <div key={m.id} className={`${styles.chatMsg} ${m.role === "user" ? styles.chatUser : styles.chatAssistant}`}>
                  {isWaitingFirstToken ? (
                    <div className={styles.typingIndicator}>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  ) : (
                    <>
                      {m.role === "assistant" && (m.cached || m.latencyMs) && (
                        <div style={{ marginBottom: "0.35rem" }}>
                          {m.cached ? (
                            <span className={styles.telemetryBadge}>⚡ Cached</span>
                          ) : m.latencyMs ? (
                            <span className={styles.telemetryBadge}>⏱️ {(m.latencyMs / 1000).toFixed(2)}s</span>
                          ) : null}
                        </div>
                      )}

                      {m.role === "assistant" && m.reactTraces && m.reactTraces.length > 0 && (
                        <div className={styles.reactTraceContainer}>
                          <details className={styles.reactTraceDetails} open={isStreamingAssistant}>
                            <summary className={styles.reactTraceSummary}>
                              <span>⚡ ReAct Trace ({m.reactTraces.length} {m.reactTraces.length === 1 ? "step" : "steps"})</span>
                              {m.reactTraces.some((t) => t.modelEscalation) && (
                                <span className={styles.badgeEscalation}>⚡ Frontier Escalation</span>
                              )}
                              {m.reactTraces.some((t) => t.selfHealing || t.toolResult?.selfHealingApplied) && (
                                <span className={styles.badgeSelfHealing}>🩹 Self-Healed</span>
                              )}
                              {m.reactTraces.some((t) => t.circuitBreaker) && (
                                <span className={styles.badgeCircuitBreaker}>🛡️ Circuit Breaker</span>
                              )}
                            </summary>
                            <div className={styles.reactTraceSteps}>
                              {m.reactTraces.map((trace) => (
                                <div key={trace.stepIndex} className={styles.reactTraceStep}>
                                  {trace.modelEscalation && (
                                    <div className={styles.reactTraceEscalation}>
                                      <span className={styles.badgeEscalation}>⚡ Escalated to Frontier</span>
                                      <span>
                                        {trace.modelEscalation.fromModel} &rarr; {trace.modelEscalation.toModel}
                                        {trace.modelEscalation.details ? `: ${trace.modelEscalation.details}` : ` (${trace.modelEscalation.reason})`}
                                      </span>
                                    </div>
                                  )}
                                  {trace.thought && (
                                    <div className={styles.reactTraceThought}>
                                      <span className={styles.reactTraceIcon}>💭</span>
                                      <span>{trace.thought}</span>
                                    </div>
                                  )}
                                  {trace.toolCall && (
                                    <div className={styles.reactTraceToolCall}>
                                      <span className={styles.reactTraceIcon}>🛠️</span>
                                      <span className={styles.reactTraceToolName}>{trace.toolCall.toolName}</span>
                                      <span className={styles.reactTraceToolArgs}>
                                        {JSON.stringify(trace.toolCall.arguments)}
                                      </span>
                                    </div>
                                  )}
                                  {trace.toolResult && (
                                    <div
                                      className={`${styles.reactTraceToolResult} ${
                                        trace.toolResult.isError ? styles.reactTraceError : ""
                                      }`}
                                    >
                                      <span className={styles.reactTraceIcon}>
                                        {trace.toolResult.isError ? "❌" : "📋"}
                                      </span>
                                      <span>{trace.toolResult.output}</span>
                                      {trace.toolResult.latencyMs !== undefined && (
                                        <span className={styles.reactTraceLatency}>
                                          ⏱️ {trace.toolResult.latencyMs}ms
                                        </span>
                                      )}
                                      {trace.toolResult.selfHealingApplied && (
                                        <span className={styles.badgeSelfHealing} style={{ marginLeft: "auto" }}>
                                          🩹 Self-Healed
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {trace.circuitBreaker && (
                                    <div className={styles.reactTraceCircuitBreaker}>
                                      <span>🛡️ Loop Breaker: {trace.circuitBreaker.warning}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}

                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {m.role === "assistant"
                          ? renderFormattedContent(m.content, handleCitationDownload)
                          : m.content}
                        {isStreamingAssistant && <span className={styles.cursor}>▌</span>}
                      </div>

                      {m.role === "assistant" && !isStreamingAssistant && (
                        <div className={styles.msgFooter}>
                          {hasUngroundedWarning ? (
                            <span className={styles.badgeUngroundedWarning} title="Citations contain unverified or ungrounded claims">
                              ⚠️ Ungrounded Citations
                            </span>
                          ) : hasCitations ? (
                            <span className={styles.badgeGroundedExact} title="Attributions verified against exact document spans">
                              ✓ Grounded (Exact Span)
                            </span>
                          ) : (
                            <span style={{ opacity: 0.6, fontSize: "0.685rem" }}>
                              ✓ RAG Grounded
                            </span>
                          )}
                          <div className={styles.feedbackActions}>
                            <button
                              className={`${styles.groundingDiffBtn} ${activeGroundingMsgId === m.id ? styles.groundingDiffBtnActive : ""}`}
                              onClick={() => toggleGroundingInspector(m.id, m.content)}
                              title="Inspect sentence-level NLI claim grounding"
                              disabled={loadingGroundingId === m.id}
                            >
                              {loadingGroundingId === m.id ? "Analyzing..." : "🔬 Grounding Diff"}
                            </button>
                            <button
                              className={`${styles.feedbackBtn} ${m.feedback === "up" ? styles.feedbackActiveUp : ""}`}
                              onClick={() => handleFeedback(m.id, m.backendMessageId, "up")}
                              title="Helpful response"
                            >
                              👍
                            </button>
                            <button
                              className={`${styles.feedbackBtn} ${m.feedback === "down" ? styles.feedbackActiveDown : ""}`}
                              onClick={() => handleFeedback(m.id, m.backendMessageId, "down")}
                              title="Unhelpful response"
                            >
                              👎
                            </button>
                          </div>
                        </div>
                      )}

                      {/* M78 Inline Claim Grounding Diff Panel */}
                      {m.role === "assistant" && activeGroundingMsgId === m.id && groundingDiffs[m.id] && (
                        <div className={styles.groundingPanel}>
                          <div className={styles.groundingHeader}>
                            <span style={{ fontWeight: 600 }}>Claim-by-Claim Visual Grounding</span>
                            <div className={styles.groundingScorePills}>
                              <span className={`${styles.groundingScorePill} ${styles.pillFaithful}`}>
                                Faithfulness: {(groundingDiffs[m.id].faithfulness_score * 100).toFixed(0)}%
                              </span>
                              <span className={`${styles.groundingScorePill} ${styles.pillHallucination}`}>
                                Hallucination: {(groundingDiffs[m.id].hallucination_index * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          <div>
                            {groundingDiffs[m.id].claims.map((claimItem, cIdx) => {
                              const claimClass =
                                claimItem.status === "entailment"
                                  ? styles.claimEntailed
                                  : claimItem.status === "contradiction"
                                  ? styles.claimContradicted
                                  : styles.claimNeutral;

                              return (
                                <span
                                  key={cIdx}
                                  className={`${styles.groundingClaimSpan} ${claimClass}`}
                                  onClick={() => setSelectedClaim(claimItem)}
                                  title={`Status: ${claimItem.status} (Entailment: ${(claimItem.entailment_prob * 100).toFixed(0)}%)`}
                                >
                                  {claimItem.claim}{" "}
                                  <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>
                                    [{claimItem.status === "entailment" ? "✓" : claimItem.status === "contradiction" ? "✗" : "?"}]
                                  </span>
                                </span>
                              );
                            })}
                          </div>

                          {selectedClaim && (
                            <div className={styles.claimInspectorCard}>
                              <div className={styles.claimInspectorTitle}>
                                <span>Claim Verification Span</span>
                                <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-code)" }}>
                                  {selectedClaim.status === "entailment"
                                    ? "🟢 Entailed (Verified)"
                                    : selectedClaim.status === "contradiction"
                                    ? "🔴 Contradicted (Hallucination)"
                                    : "🟡 Neutral (Unsupported)"}
                                </span>
                              </div>
                              <div style={{ fontStyle: "italic", marginBottom: "0.25rem" }}>&quot;{selectedClaim.claim}&quot;</div>
                              <div className={styles.claimPremiseText}>
                                <strong>Grounding Source:</strong> {selectedClaim.premise || "No direct matching context chunk found in retrieved documents."}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {showJumpBottom && (
            <button className={styles.jumpBottomBtn} onClick={scrollToBottom}>
              ↓ Jump to latest
            </button>
          )}
        </div>
      )}

      {sessionId && (
        <div className={styles.chatInput}>
          <input
            ref={inputRef}
            className={styles.input}
            aria-label="Ask workspace knowledge base"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={isExpired ? "🔒 Trial Expired — Read-only mode active. Please upgrade to chat." : "Type a message..."}
            disabled={loading || isExpired}
          />
          {loading ? (
            <button className="comic-btn comic-btn-outline" onClick={stopGeneration}>
              Stop
            </button>
          ) : (
            <button className="comic-btn comic-btn-blue" onClick={sendMessage} disabled={!input.trim() || isExpired}>
              Send
            </button>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {feedbackModalMsg && (
        <Portal>
          <div
            className={styles.feedbackBackdrop}
            onClick={() => setFeedbackModalMsg(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
          >
            <div className={styles.feedbackModal} onClick={(e) => e.stopPropagation()}>
              <h3 id="feedback-dialog-title" className={styles.feedbackTitle}>Provide Response Feedback</h3>
              <p style={{ fontSize: "0.85rem", opacity: 0.7, margin: 0 }}>
                Help us improve responses by sharing details:
              </p>
              <textarea
                className={styles.feedbackTextarea}
                aria-label="Feedback comments"
                placeholder="Optional: What was incorrect, missing, or unhelpful?"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <div className={styles.modalButtons}>
                <button className="comic-btn comic-btn-outline" onClick={() => setFeedbackModalMsg(null)}>
                  Cancel
                </button>
                <button className="comic-btn comic-btn-blue" disabled={feedbackSubmitting} onClick={submitModalFeedback}>
                  {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {activeVisualCitation && (
        <Portal>
          <div
            className={styles.visualLightboxBackdrop}
            onClick={() => setActiveVisualCitation(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="visual-lightbox-title"
          >
            <div className={styles.visualLightboxModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.visualLightboxHeader}>
                <div className={styles.visualLightboxTitleGroup}>
                  <span className={styles.visualBadgeIcon}>📐</span>
                  <div>
                    <h3 id="visual-lightbox-title" className={styles.visualLightboxTitle}>
                      {activeVisualCitation.diagramTitle}
                    </h3>
                    <span className={styles.visualLightboxSubtitle}>
                      Multimodal Vision GraphRAG Provenance (Battery #29)
                    </span>
                  </div>
                </div>
                <button
                  className={styles.visualLightboxCloseBtn}
                  onClick={() => setActiveVisualCitation(null)}
                  aria-label="Close visual inspector"
                >
                  ✕
                </button>
              </div>

              <div className={styles.visualLightboxBody}>
                <div className={styles.visualCanvasViewport}>
                  <div className={styles.visualBlueprintCanvas}>
                    <div className={styles.visualGridOverlay} />
                    {activeVisualCitation.box ? (
                      <div
                        className={styles.visualBoundingBoxHighlight}
                        style={{
                          top: `${activeVisualCitation.box[0] * 100}%`,
                          left: `${activeVisualCitation.box[1] * 100}%`,
                          width: `${Math.max((activeVisualCitation.box[3] - activeVisualCitation.box[1]) * 100, 10)}%`,
                          height: `${Math.max((activeVisualCitation.box[2] - activeVisualCitation.box[0]) * 100, 10)}%`,
                        }}
                      >
                        <span className={styles.visualBoxTag}>
                          {activeVisualCitation.elementLabel || "Target Component"}
                        </span>
                      </div>
                    ) : (
                      <div className={styles.visualGenericTargetBox}>
                        <span>{activeVisualCitation.elementLabel || "Schematic Architecture Node"}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.visualMetaDetails}>
                  <div className={styles.visualMetaRow}>
                    <span className={styles.visualMetaKey}>Diagram:</span>
                    <span className={styles.visualMetaVal}>{activeVisualCitation.diagramTitle}</span>
                  </div>
                  {activeVisualCitation.elementLabel && (
                    <div className={styles.visualMetaRow}>
                      <span className={styles.visualMetaKey}>Referenced Element:</span>
                      <span className={styles.visualMetaValHighlight}>{activeVisualCitation.elementLabel}</span>
                    </div>
                  )}
                  {activeVisualCitation.box && (
                    <div className={styles.visualMetaRow}>
                      <span className={styles.visualMetaKey}>Bounding Box:</span>
                      <code className={styles.visualBoxCode}>
                        [{activeVisualCitation.box.map((c) => c.toFixed(2)).join(", ")}]
                      </code>
                    </div>
                  )}
                  <div className={styles.visualMetaRow}>
                    <span className={styles.visualMetaKey}>Cross-Modal Anchor:</span>
                    <span className={styles.visualMetaBadge}>✓ Verified Graph Grounded</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalButtons}>
                <button
                  className="comic-btn comic-btn-blue"
                  onClick={() => setActiveVisualCitation(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
