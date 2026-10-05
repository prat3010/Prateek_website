'use client';

import React, { useState } from 'react';
import { Brain, Send, ShieldCheck, Cpu } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sourceDoc?: string;
  cached?: boolean;
}

const PRESET_QUERIES = [
  'What is the Ponytail Principle in Prateek\'s architecture?',
  'Why did Prateek choose pgvector over Pinecone for Retriever?',
  'Explain the ScrollSection containing block bug and ADR 05.',
  'How does local Ollama provide $0 compute cost on Oracle VPS?',
];

export default function PlaygroundNeuralDossier() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'PRATEEQ.AI // NEURAL INTELLIGENCE VAULT\nConnected to Oracle Cloud VPS (130.210.35.134). Ask me about Prateek\'s engineering philosophy, architecture decision records, or production benchmarks.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || isLoading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/playground/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('Failed to query neural intelligence vault');
      const data = await res.json();
      const reply = data.reply || 'No response generated.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          sourceDoc: data.sourceDoc || 'PRATEEQ_KNOWLEDGE_DOSSIER.md',
          cached: data.cached || false,
        },
      ]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error contacting Oracle VPS';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Neural handshake fault: ${errorMsg}. Fallback cognitive subroutines active.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '850px',
      margin: '0 auto',
      padding: '24px',
      background: 'rgba(5, 10, 20, 0.95)',
      borderRadius: '12px',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      height: '520px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
      fontFamily: 'var(--font-jetbrains-mono, monospace)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
          <Brain size={18} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '0.05em' }}>
            SOVEREIGN NEURAL DOSSIER v2.4
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
            <ShieldCheck size={13} /> pgvector RLS Active
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={13} /> OCI ARM Core
          </span>
        </div>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingRight: '6px',
        marginBottom: '16px',
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: m.role === 'user' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
              border: m.role === 'user' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
              color: m.role === 'user' ? '#fff' : '#e2e8f0',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: m.role === 'user' ? '#38bdf8' : '#10b981',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>{m.role === 'user' ? 'GUEST OPERATOR' : 'RETRIEVER KNOWLEDGE CORE'}</span>
              {m.cached && <span style={{ color: '#f59e0b' }}>⚡ Cached (&lt;10ms)</span>}
            </div>
            {m.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ padding: '10px 16px', color: '#38bdf8', fontSize: '0.85rem' }}>
            🧠 Querying vector space & ColBERT MaxSim reranker...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {PRESET_QUERIES.map((preset, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(preset)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '0.72rem',
              color: '#94a3b8',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        style={{ display: 'flex', gap: '8px' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about architecture, ADRs, or benchmarks..."
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: '0 20px',
            background: '#38bdf8',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
          }}
        >
          <Send size={15} />
          <span>Transmit</span>
        </button>
      </form>
    </div>
  );
}
