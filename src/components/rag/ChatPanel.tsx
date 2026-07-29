"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import styles from "./rag.module.css";

export function ChatPanel({ client, hidden }: { client: RetrieverClient | null; hidden: boolean }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: number; role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showJumpBottom, setShowJumpBottom] = useState(false);

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
    if (!client) return;
    setError("");
    try {
      const res = await client.createSession();
      setSessionId(res.sessionId);
      setMessages([{ id: ++msgIdCounter.current, role: "assistant", content: "Session started. Send your first message." }]);
      isUserScrolledUp.current = false;
      setShowJumpBottom(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    }
  }, [client]);

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
      const body = await client.chat(sessionId, msg, controller.signal);
      if (!body) {
        setMessages((prev) => [...prev, { id: ++msgIdCounter.current, role: "assistant", content: "(empty response)" }]);
        setLoading(false);
        setAbortController(null);
        return;
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      const assistantId = ++msgIdCounter.current;
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      let sseBuffer = "";
      let isDone = false;

      while (!isDone) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const data = trimmed.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.event === "done") {
                isDone = true;
                break;
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

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === assistantId) {
          if (!last.content.trim()) {
            return [...prev.slice(0, -1), { ...last, content: "No response received. Please try again." }];
          }
        }
        return prev;
      });
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
          <button className="comic-btn comic-btn-blue" onClick={startSession}>Start Session</button>
        ) : (
          <span className={styles.sessionBadge}>
            Session: {sessionId.slice(0, 8)}…
            <button className="comic-btn comic-btn-outline" style={{ marginLeft: "0.5rem" }} onClick={() => { setSessionId(null); setMessages([]); }}>End</button>
          </span>
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
              const isWaitingFirstToken = isStreamingAssistant && !m.content;

              return (
                <div key={m.id} className={`${styles.chatMsg} ${m.role === "user" ? styles.chatUser : styles.chatAssistant}`} style={{ whiteSpace: "pre-wrap" }}>
                  {isWaitingFirstToken ? (
                    <div className={styles.typingIndicator}>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </div>
                  ) : (
                    <>
                      {m.content}
                      {isStreamingAssistant && <span className={styles.cursor}>▌</span>}
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            disabled={loading}
          />
          {loading ? (
            <button className="comic-btn comic-btn-outline" onClick={stopGeneration}>
              Stop
            </button>
          ) : (
            <button className="comic-btn comic-btn-blue" onClick={sendMessage} disabled={!input.trim()}>
              Send
            </button>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
