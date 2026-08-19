'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0066FF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 102, 255, 0.3)',
            zIndex: 9999,
          }}
        >
          <Sparkles size={18} />
          <span>Project Copilot</span>
        </button>
      )}

      {/* Copilot Drawer / Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '380px',
            maxHeight: '520px',
            height: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', fontWeight: 600 }}>
              <Bot size={20} color="#0066FF" />
              <span>Client Project Copilot</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: m.sender === 'user' ? '#0066FF' : '#1E293B',
                  color: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  maxWidth: '85%',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', color: '#94A3B8', fontSize: '12px' }}>
                Copilot searching active scope in Supabase...
              </div>
            )}
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#1E293B',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about deliverables, SLAs, timeline..."
              style={{
                flex: 1,
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#FFFFFF',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              style={{
                backgroundColor: '#0066FF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
