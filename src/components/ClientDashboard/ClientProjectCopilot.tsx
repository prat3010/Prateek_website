'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './ClientProjectCopilot.module.css';

export default function ClientProjectCopilot() {
  const { getAccessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'copilot'; text: string }>>([
    {
      sender: 'copilot',
      text: "👋 Hi! I am your Project Copilot. Ask me anything about your project scope, features, deliverables, payment terms, or maintenance SLAs!",
    },
  ]);

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

  const handleSend = async () => {
    const query = inputQuery.trim();
    if (!query || loading) return;

    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setInputQuery('');
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
        setMessages(prev => [...prev, { sender: 'copilot', text: data.answer }]);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'copilot', text: data.error || 'Could not retrieve scope context. Please try again.' },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { sender: 'copilot', text: 'Network error contacting Project Copilot. Please check your connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Client Project Copilot"
          className={styles.toggleButton}
        >
          <Sparkles size={18} />
          <span>Project Copilot</span>
        </button>
      )}

      {/* Copilot Drawer / Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Client Project Copilot"
          className={styles.copilotDialog}
        >
          {/* Header */}
          <div className={styles.copilotHeader}>
            <div className={styles.headerTitleGroup}>
              <Bot size={20} className={styles.botIcon} />
              <span>Client Project Copilot</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close Project Copilot"
              className={styles.closeButton}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div className={styles.messagesList}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={m.sender === 'user' ? styles.userMessage : styles.copilotMessage}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className={styles.loadingIndicator}>
                Copilot searching active scope in Supabase...
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className={styles.inputArea}>
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about deliverables, SLAs, timeline..."
              aria-label="Ask Project Copilot about deliverables, SLAs, timeline..."
              className={styles.textInput}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              aria-label="Send message to Project Copilot"
              className={styles.sendButton}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
