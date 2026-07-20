"use client";

import { useState, useEffect, useRef } from "react";
import { RetrieverClient } from "@/lib/rag-client";
import styles from "./rag.module.css";

export function ChatPanel({ client, hidden }: { client: RetrieverClient | null; hidden: boolean }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ id: number; role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(0);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (hidden) return null;

  async function startSession() {
    if (!client) return;
    setError("");
    try {
      const res = await client.createSession();
      setSessionId(res.sessionId);
      setMessages([{ id: ++msgIdCounter.current, role: "assistant", content: "Session started. Send your first message." }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    }
  }

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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.event === "done") break;
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
        if (last?.role === "assistant") return prev;
        return [...prev, { id: ++msgIdCounter.current, role: "assistant", content: "(empty response)" }];
      });
    } catch (e: unknown) {
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
        <div className={styles.chatMessages}>
          {messages.map((m) => (
            <div key={m.id} className={`${styles.chatMsg} ${m.role === "user" ? styles.chatUser : styles.chatAssistant}`} style={{ whiteSpace: "pre-wrap" }}>
              {(m.role === "assistant" && m === messages[messages.length - 1] && loading)
                ? m.content + " ▌"
                : m.content}
            </div>
          ))}
          <div ref={chatEnd} />
        </div>
      )}

      {sessionId && (
        <div className={styles.chatInput}>
          <input
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
