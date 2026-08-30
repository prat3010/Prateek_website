'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, X, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Portal from '@/components/ui/Portal';
import styles from './ClientProjectCopilot.module.css';

interface Citation {
  id: string;
  label: string;
  type: 'sow' | 'milestone' | 'change_order' | 'sla';
}

interface CopilotMessage {
  sender: 'user' | 'copilot';
  text: string;
  citations?: Citation[];
  scopeCode?: string;
  deliveryStage?: string;
}

const SUGGESTED_PROMPTS = [
  'What features are in my scope?',
  'What is the current milestone status?',
  'What is the total cost & payment structure?',
  'Explain our warranty & support SLA',
];

export default function ClientProjectCopilot() {
  const { getAccessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      sender: 'copilot',
      text: '👋 Hi! I am your Project Copilot, connected to your active project scope, SOW contract baseline, and milestone delivery stream. Ask me anything about your project deliverables, timeline, or SLAs!',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSend = async (customQuery?: string) => {
    const query = (customQuery || inputQuery).trim();
    if (!query || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    if (!customQuery) {
      setInputQuery('');
    }
    setLoading(true);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/client/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (res.ok && data.answer) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'copilot',
            text: data.answer,
            citations: data.citations || [],
            scopeCode: data.scope_code,
            deliveryStage: data.delivery_stage,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'copilot',
            text: data.error || 'Could not retrieve project context. Please try again.',
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: 'Network error contacting Project Copilot. Please check your connection.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Client Project Copilot"
          className={styles.toggleButton}
        >
          <Sparkles size={17} />
          <span>Project Copilot</span>
          <span className={styles.pulseDot} />
        </button>
      )}

      {/* Copilot Modal escaped via Portal */}
      {isOpen && (
        <Portal>
          <div className={styles.backdropOverlay} onClick={() => setIsOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Client Project Copilot"
              className={styles.copilotDialog}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={styles.copilotHeader}>
                <div className={styles.headerTitleGroup}>
                  <div className={styles.botIconWrapper}>
                    <Bot size={18} className={styles.botIcon} />
                  </div>
                  <div>
                    <div className={styles.headerTitle}>Client Project Copilot</div>
                    <div className={styles.headerSubtitle}>Grounded in SOW Contract & Sprint Feeds</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close Project Copilot"
                  className={styles.closeButton}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Messages Container */}
              <div className={styles.messagesList}>
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={m.sender === 'user' ? styles.userMessageWrapper : styles.copilotMessageWrapper}
                  >
                    {m.sender === 'copilot' && (
                      <div className={styles.avatarMini}>
                        <Bot size={14} />
                      </div>
                    )}
                    <div className={m.sender === 'user' ? styles.userMessage : styles.copilotMessage}>
                      <div className={styles.messageText}>{m.text}</div>

                      {/* Grounded Citation Badges */}
                      {m.citations && m.citations.length > 0 && (
                        <div className={styles.citationContainer}>
                          <span className={styles.citationHeading}>Sources & Contracts:</span>
                          <div className={styles.citationGrid}>
                            {m.citations.map((c) => (
                              <span key={c.id} className={styles.citationBadge}>
                                {c.type === 'sow' && <FileText size={11} />}
                                {c.type === 'change_order' && <RefreshCw size={11} />}
                                {c.type === 'milestone' && <CheckCircle2 size={11} />}
                                {c.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className={styles.copilotMessageWrapper}>
                    <div className={styles.avatarMini}>
                      <Bot size={14} />
                    </div>
                    <div className={styles.loadingMessage}>
                      <span className={styles.loadingSpinner} />
                      <span>Copilot synthesizing grounded contract & sprint context...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Prompt Suggestions */}
              {messages.length <= 2 && (
                <div className={styles.suggestionsArea}>
                  <div className={styles.suggestionsLabel}>Suggested Questions:</div>
                  <div className={styles.suggestionsList}>
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={styles.suggestionChip}
                        onClick={() => handleSend(prompt)}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className={styles.inputArea}>
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about deliverables, SLAs, sprint status..."
                  aria-label="Ask Project Copilot about deliverables, SLAs, sprint status..."
                  className={styles.textInput}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !inputQuery.trim()}
                  aria-label="Send message to Project Copilot"
                  className={styles.sendButton}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
