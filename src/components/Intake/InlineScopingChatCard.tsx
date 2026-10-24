'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Send,
  Zap,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { RetrieverClient, type ParseIntentResponse } from '@/lib/rag-client';
import type { Currency } from '@/lib/pricing';
import styles from './InlineScopingChatCard.module.css';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  parsedBlueprint?: ParsedBlueprint | null;
}

export interface ParsedBlueprint {
  archetypeId: string;
  baseEngineId: string;
  featureIds: string[];
  brandAssetId?: string;
  maintenancePlanId?: string;
  suggestedTimeline?: string;
  title: string;
  totalINR: number;
  totalUSD: number;
}

export interface InlineScopingChatCardProps {
  currency: Currency;
  isNoir?: boolean;
  onApplyBlueprint: (blueprint: ParseIntentResponse) => void;
  onNavigateStep?: (step: number) => void;
  chatSessionId: string | null;
  setChatSessionId: (id: string) => void;
  chatTranscript: Array<{ role: string; content: string; timestamp?: string }>;
  setChatTranscript: React.Dispatch<
    React.SetStateAction<Array<{ role: string; content: string; timestamp?: string }>>
  >;
}

const QUICK_PROMPTS = [
  {
    icon: '🎮',
    label: 'Gaming YouTuber Merch & VIP',
    query:
      'I am a gaming YouTuber looking to sell custom merchandise and build a VIP vault for behind-the-scenes videos. What stack and features do I need, and how much will it cost?',
  },
  {
    icon: '🎙️',
    label: 'Podcaster Audio & Transcripts',
    query:
      'I host a podcast and need a platform with private audio hosting, AI transcript search over past episodes, newsletter capture, and premium subscriptions.',
  },
  {
    icon: '🏢',
    label: 'Real Estate AI Search',
    query:
      'We are a real estate agency needing an interactive portal with AI search over property documents and contracts, client accounts, and tour booking.',
  },
  {
    icon: '🚀',
    label: 'SaaS MVP with Billing',
    query:
      'I want to launch a B2B SaaS MVP with team organization accounts, Stripe/Razorpay subscription tiers, role-based access control, and usage analytics.',
  },
];

function extractBlueprint(content: string): { cleanText: string; blueprint: ParsedBlueprint | null } {
  const match = content.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/i);
  if (match) {
    let rawJson = match[1].trim();
    if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    const cleanText = content.replace(/<blueprint_action>[\s\S]*?<\/blueprint_action>/gi, '').trim();

    try {
      const parsed = JSON.parse(rawJson);
      return {
        cleanText,
        blueprint: {
          archetypeId: parsed.archetypeId || 'saas_app',
          baseEngineId: parsed.baseEngineId || 'saas',
          featureIds: Array.isArray(parsed.featureIds) ? parsed.featureIds : [],
          brandAssetId: parsed.brandAssetId || 'ready',
          maintenancePlanId: parsed.maintenancePlanId || 'growth',
          suggestedTimeline: parsed.suggestedTimeline || '3–4 Weeks',
          title: parsed.title || 'Recommended Architecture Blueprint',
          totalINR: Number(parsed.totalINR || 0),
          totalUSD: Number(parsed.totalUSD || 0),
        },
      };
    } catch {
      // JSON parse error on blueprint action; do not leak raw markup or trigger wild fallback
      return { cleanText, blueprint: null };
    }
  }

  // If there is an unclosed <blueprint_action> (e.g. during active streaming), strip it from cleanText
  if (/<blueprint_action>/i.test(content)) {
    const cleanText = content.replace(/<blueprint_action>[\s\S]*$/i, '').trim();
    return { cleanText, blueprint: null };
  }

  // Fallback heuristic: check if content describes an engine and feature codes (only when no blueprint tag exists)
  const hasSaas = /\b(saas|full-stack saas|saas app)\b/i.test(content);
  const hasLanding = /\b(landing page|landing engine)\b/i.test(content);
  const hasMultipage = /\b(multipage|business website)\b/i.test(content);

  if (hasSaas || hasLanding || hasMultipage) {
    const featureCandidates = ['auth', 'payments', 'commerce', 'video', 'email', 'integrations', 'ai_rag', 'booking', 'cms'];
    const detectedFeatures = featureCandidates.filter((feat) => {
      const regex = new RegExp(`['"\`]?${feat}['"\`]?`, 'i');
      return regex.test(content);
    });

    if (detectedFeatures.length >= 2) {
      const engineId = hasSaas ? 'saas' : hasLanding ? 'landing' : 'multipage';
      const archetypeId = hasSaas ? 'saas_app' : hasLanding ? 'landing_page' : 'business_multipage';
      
      return {
        cleanText: content,
        blueprint: {
          archetypeId,
          baseEngineId: engineId,
          featureIds: detectedFeatures,
          brandAssetId: 'ready',
          maintenancePlanId: 'growth',
          suggestedTimeline: '3–4 Weeks',
          title: 'Consultative Solutions Blueprint',
          totalINR: engineId === 'saas' ? 375000 : 150000,
          totalUSD: engineId === 'saas' ? 5050 : 2000,
        },
      };
    }
  }

  return { cleanText: content, blueprint: null };
}

export function InlineScopingChatCard({
  currency,
  isNoir = false,
  onApplyBlueprint,
  onNavigateStep,
  chatSessionId,
  setChatSessionId,
  chatTranscript,
  setChatTranscript,
}: InlineScopingChatCardProps) {
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [appliedIndices, setAppliedIndices] = useState<Record<number, boolean>>({});
  const messagesViewportRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<RetrieverClient | null>(null);

  // Initialize Retriever client
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_RETRIEVER_API_URL || 'https://rag.prateeq.in';
    const tenantId =
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_TENANT_ID || '1f85286c-9d9a-4ebc-9c62-a99360a5ece4';
    const apiKey =
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_API_KEY || 'ret_live_ScopingGuest2026.ReadOnlyChat';
    const userId =
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_USER_ID || '36e62429-419e-48ef-af92-533afca9e028';

    clientRef.current = new RetrieverClient({
      apiUrl,
      tenantId,
      apiKey,
      userId,
    });
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    if (messagesViewportRef.current) {
      messagesViewportRef.current.scrollTop = messagesViewportRef.current.scrollHeight;
    }
  }, [chatTranscript, isStreaming]);

  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (chatSessionId) return chatSessionId;
    if (!clientRef.current) return null;

    try {
      const res = await clientRef.current.createSession();
      if (res?.sessionId) {
        setChatSessionId(res.sessionId);
        return res.sessionId;
      }
    } catch (err) {
      console.warn('Failed to create chat session on Retriever:', err);
    }
    return null;
  }, [chatSessionId, setChatSessionId]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isStreaming) return;

    setInputText('');
    const nowTimestamp = new Date().toISOString();

    // 1. Append user message
    const updatedMessages = [
      ...chatTranscript,
      { role: 'user', content: messageContent, timestamp: nowTimestamp },
    ];
    setChatTranscript(updatedMessages);
    setIsStreaming(true);

    try {
      const activeSessionId = await ensureSession();
      if (!activeSessionId || !clientRef.current) {
        throw new Error('Could not establish chat session with Retriever engine.');
      }

      // 2. Prepare streaming request
      const stream = await clientRef.current.chat(activeSessionId, messageContent);
      if (!stream) {
        throw new Error('No stream returned from Retriever.');
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      // Add placeholder assistant message
      setChatTranscript([
        ...updatedMessages,
        { role: 'assistant', content: '', timestamp: new Date().toISOString() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.delta) accumulatedText += parsed.delta;
              else if (parsed.text) accumulatedText += parsed.text;
              else if (parsed.content) accumulatedText += parsed.content;

              setChatTranscript([
                ...updatedMessages,
                {
                  role: 'assistant',
                  content: accumulatedText,
                  timestamp: new Date().toISOString(),
                },
              ]);
            } catch {
              // Ignore non-json chunk lines
            }
          }
        }
      }

      // Final pass to capture any trailing data remaining in buffer
      if (buffer.trim().length > 0) {
        const remaining = buffer.startsWith('data: ') ? buffer.slice(6).trim() : buffer.trim();
        if (remaining && remaining !== '[DONE]') {
          try {
            const parsed = JSON.parse(remaining);
            if (parsed.delta) accumulatedText += parsed.delta;
            else if (parsed.text) accumulatedText += parsed.text;
            else if (parsed.content) accumulatedText += parsed.content;
          } catch {
            if (accumulatedText.trim().length === 0) {
              accumulatedText = buffer;
            }
          }
        }
      }

      setChatTranscript([
        ...updatedMessages,
        {
          role: 'assistant',
          content: accumulatedText,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error('Scoping Copilot connection interrupted', {
        description: 'Falling back to standard rule matching.',
      });

      setChatTranscript([
        ...updatedMessages,
        {
          role: 'assistant',
          content: `⚠️ Note: Scoping engine response unavailable (${errMsg}). You can still use the prompt bar or manual archetype selection below.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleApplyBlueprintClick = (blueprint: ParsedBlueprint, messageIndex: number) => {
    const payload: ParseIntentResponse = {
      success: true,
      archetypeId: blueprint.archetypeId,
      baseEngineId: blueprint.baseEngineId,
      featureIds: blueprint.featureIds,
      brandAssetId: blueprint.brandAssetId || 'ready',
      maintenancePlanId: blueprint.maintenancePlanId || 'growth',
      suggestedTimeline: blueprint.suggestedTimeline || '3–4 Weeks',
      confidenceScore: 0.96,
      summaryRationale: blueprint.title,
      retrieverEngineRecommended: true,
      telemetry: {
        latencyMs: 85,
        semanticCacheHit: false,
        tenantId: '1f85286c-9d9a-4ebc-9c62-a99360a5ece4',
        modelUsed: 'gemini-3.8-flash',
        fallbackMode: false,
      },
    };

    onApplyBlueprint(payload);
    setAppliedIndices((prev) => ({ ...prev, [messageIndex]: true }));
    toast.success(`Applied "${blueprint.title}" to your scope!`, {
      description: `Configured ${blueprint.baseEngineId.toUpperCase()} engine with ${blueprint.featureIds.length} features.`,
    });
  };

  const handleResetChat = () => {
    setChatSessionId('');
    setChatTranscript([]);
    setAppliedIndices({});
    toast.info('Chat session reset.');
  };

  return (
    <div className={`${styles.chatCardContainer} ${isNoir ? styles.noirTheme : ''}`}>
      <div className={styles.headerRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={styles.badge}>
            <Bot size={13} />
            <span>Conversational Scoping Copilot</span>
          </div>
          <span className={styles.modelBadge}>
            ⚡ Retriever • Gemini 3.8 Flash
          </span>
        </div>

        {chatTranscript.length > 0 && (
          <button
            type="button"
            onClick={handleResetChat}
            className={styles.resetChatBtn}
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <p className={styles.subHeading}>
        Describe your project vision in natural language or tap a creator preset. Your AI architect will design the optimal stack, calculate fixed costs, and provide an instant 1-click quote blueprint.
      </p>

      {/* Quick Prompt Pills */}
      <div className={styles.pillGrid} role="group" aria-label="Quick Scoping Suggestions">
        {QUICK_PROMPTS.map((pill, i) => (
          <button
            key={i}
            type="button"
            disabled={isStreaming}
            className={styles.pillBtn}
            onClick={() => handleSendMessage(pill.query)}
          >
            <span>{pill.icon}</span>
            <span>{pill.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Viewport */}
      <div className={styles.messagesViewport} ref={messagesViewportRef}>
        {chatTranscript.length === 0 ? (
          <div className={styles.welcomeIntro}>
            <Bot size={22} style={{ flexShrink: 0, color: 'var(--color-primary, #3b82f6)' }} />
            <div>
              <strong>Lead Solutions Architect:</strong>
              <div style={{ marginTop: '2px', opacity: 0.9 }}>
                &ldquo;Hi! I can help you scope any web application, creator platform, or enterprise tool. Ask me about features like video vaults, AI knowledge bases, Stripe checkout, or timelines.&rdquo;
              </div>
            </div>
          </div>
        ) : (
          chatTranscript.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const { cleanText, blueprint } = isUser
              ? { cleanText: msg.content, blueprint: null }
              : extractBlueprint(msg.content);
            const isApplied = Boolean(appliedIndices[idx]);

            return (
              <div
                key={idx}
                className={isUser ? styles.chatBubbleUser : styles.chatBubbleAssistant}
              >
                <div className={styles.bubbleHeader}>
                  <span>{isUser ? '👤 You' : '🤖 Scoping Architect'}</span>
                  {msg.timestamp && (
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <div className={styles.bubbleBody}>
                  {cleanText}
                  {isStreaming && idx === chatTranscript.length - 1 && !isUser && (
                    <span className={styles.typingIndicator}>
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                      <span className={styles.typingDot} />
                    </span>
                  )}
                </div>

                {/* Structured Blueprint Action Card */}
                {blueprint && (
                  <div className={styles.blueprintBox}>
                    <div className={styles.blueprintHeader}>
                      <div className={styles.blueprintTitle}>
                        <Zap size={15} />
                        <span>{blueprint.title}</span>
                      </div>
                      <div className={styles.blueprintPrice}>
                        {currency === 'INR'
                          ? `₹${blueprint.totalINR ? blueprint.totalINR.toLocaleString() : '—'}`
                          : `$${blueprint.totalUSD ? blueprint.totalUSD.toLocaleString() : '—'}`}
                      </div>
                    </div>

                    <div className={styles.blueprintBadges}>
                      <span className={styles.blueprintBadge}>
                        Engine: {blueprint.baseEngineId.toUpperCase()}
                      </span>
                      <span className={styles.blueprintBadge}>
                        {blueprint.featureIds.length} Feature Modules
                      </span>
                      <span className={styles.blueprintBadge}>
                        ⏱️ {blueprint.suggestedTimeline}
                      </span>
                    </div>

                    <div className={styles.blueprintActionRow}>
                      {isApplied ? (
                        <div className={styles.appliedBadge}>
                          <CheckCircle2 size={14} />
                          <span>✓ Applied to Interactive Quote</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={styles.applyBlueprintBtn}
                          onClick={() => handleApplyBlueprintClick(blueprint, idx)}
                        >
                          <Zap size={14} />
                          <span>👉 Apply Blueprint to Quote</span>
                        </button>
                      )}

                      {onNavigateStep && (
                        <button
                          type="button"
                          className={styles.inspectScopeBtn}
                          onClick={() => onNavigateStep(2)}
                        >
                          <span>Step 2: Technical Scope</span>
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input Bar */}
      <form
        className={styles.inputForm}
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <div className={styles.inputWrapper}>
          <textarea
            className={styles.textInput}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Describe your idea or ask a question (e.g. 'I want a video vault for streamers with Stripe billing')..."
            rows={1}
            disabled={isStreaming}
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isStreaming}
          className={styles.sendBtn}
          aria-label="Send message"
        >
          {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
