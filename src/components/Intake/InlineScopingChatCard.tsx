'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Zap,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Loader2,
  FileUp,
  X,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import type { ParseIntentResponse } from '@/lib/rag-client';
import { calcQuote, formatPricePair, type Currency } from '@/lib/pricing';
import type {
  BaseEngineItem,
  FeatureItem,
  BrandAssetOption,
  MaintenancePlanOption,
} from '@/data/resume';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { RfpUploaderModal } from './RfpUploaderModal';
import styles from './InlineScopingChatCard.module.css';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  parsedBlueprint?: ParsedBlueprint | null;
}

export interface PhasedBreakdown {
  phase1: {
    title: string;
    featureIds: string[];
    suggestedTimeline: string;
    totalINR: number;
    totalUSD: number;
    deliverablesSummary: string;
  };
  phase2: {
    title: string;
    featureIds: string[];
    suggestedTimeline: string;
    totalINR: number;
    totalUSD: number;
    deliverablesSummary: string;
  };
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
  phasedBreakdown?: PhasedBreakdown;
}

export interface CurrentScopeContext {
  currentStep: number;
  baseEngineId: string;
  selectedFeatures: string[];
  selectedBrandAssetId?: string;
  selectedMaintenanceId?: string;
  totalINR: number;
  totalUSD: number;
  scopeCode?: string;
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
  currentScope?: CurrentScopeContext | null;
  isDrawerMode?: boolean;
  onCloseDrawer?: () => void;
}

const STEP_2_QUICK_PROMPTS = [
  {
    icon: '📉',
    label: 'Cut $1,000 / ₹75k (Prune to MVP)',
    query: 'How can I cut ~$1,000 / ₹75,000 from this scope without losing core user experience?',
  },
  {
    icon: '⏱️',
    label: 'Delivery Timeline',
    query: 'What is the estimated delivery timeline and sprint milestone breakdown for these exact active modules?',
  },
  {
    icon: '💡',
    label: 'Suggest Lean Phase 1 MVP',
    query: 'Suggest an optimal Phase 1 Lean MVP split for this selection so I can launch fast and defer scale add-ons.',
  },
  {
    icon: '🧩',
    label: 'Architecture Dependencies',
    query: 'Can you explain the technical dependencies between my selected modules and why they are required?',
  },
];

const QUICK_PROMPTS = [
  {
    icon: '💡',
    label: 'Sculpt Lean MVP (< $3,000 / ₹2.5L)',
    query:
      'Can we sculpt a lean Phase 1 MVP under $3,000 / ₹2,50,000? What features can we de-scope or defer to v1.1?',
  },
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

function extractBlueprint(content: string, currency: Currency = 'INR'): { cleanText: string; blueprint: ParsedBlueprint | null } {
  const match = content.match(/<blueprint_action>([\s\S]*?)<\/blueprint_action>/i);
  if (match) {
    let rawJson = match[1].trim();
    if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    const cleanText = content.replace(/<blueprint_action>[\s\S]*?<\/blueprint_action>/gi, '').trim();

    try {
      const parsed = JSON.parse(rawJson);
      let phasedBreakdown: PhasedBreakdown | undefined = undefined;

      if (parsed.phasedBreakdown && parsed.phasedBreakdown.phase1) {
        phasedBreakdown = {
          phase1: {
            title: parsed.phasedBreakdown.phase1.title || 'Phase 1: Core Lean MVP',
            featureIds: Array.isArray(parsed.phasedBreakdown.phase1.featureIds)
              ? parsed.phasedBreakdown.phase1.featureIds
              : [],
            suggestedTimeline: parsed.phasedBreakdown.phase1.suggestedTimeline || '2–3 Weeks',
            totalINR: Number(parsed.phasedBreakdown.phase1.totalINR || 0),
            totalUSD: Number(parsed.phasedBreakdown.phase1.totalUSD || 0),
            deliverablesSummary: parsed.phasedBreakdown.phase1.deliverablesSummary || '',
          },
          phase2: {
            title: parsed.phasedBreakdown.phase2?.title || 'Phase 2: Scale & Automation',
            featureIds: Array.isArray(parsed.phasedBreakdown.phase2?.featureIds)
              ? parsed.phasedBreakdown.phase2.featureIds
              : [],
            suggestedTimeline: parsed.phasedBreakdown.phase2?.suggestedTimeline || '1–2 Weeks',
            totalINR: Number(parsed.phasedBreakdown.phase2?.totalINR || 0),
            totalUSD: Number(parsed.phasedBreakdown.phase2?.totalUSD || 0),
            deliverablesSummary: parsed.phasedBreakdown.phase2?.deliverablesSummary || '',
          },
        };
      }

      return {
        cleanText,
        blueprint: {
          archetypeId: parsed.archetypeId || 'saas_app',
          baseEngineId: parsed.baseEngineId || 'saas',
          featureIds: Array.isArray(parsed.featureIds) ? parsed.featureIds : [],
          brandAssetId: parsed.brandAssetId || 'ready',
          maintenancePlanId: parsed.maintenancePlanId || 'standard',
          suggestedTimeline: parsed.suggestedTimeline || '3–4 Weeks',
          title: parsed.title || 'Recommended Architecture Blueprint',
          totalINR: Number(parsed.totalINR || 0),
          totalUSD: Number(parsed.totalUSD || 0),
          phasedBreakdown,
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
      const maintPlan = detectedFeatures.some((f) => f.startsWith('ai_')) ? 'premium' : 'standard';

      const quote = calcQuote(
        questionnaireDefaults.engines as BaseEngineItem[],
        questionnaireDefaults.features as FeatureItem[],
        questionnaireDefaults.brandAssets as BrandAssetOption[],
        questionnaireDefaults.maintenancePlans as MaintenancePlanOption[],
        {
          engineId,
          featureIds: detectedFeatures,
          brandAssetId: 'ready',
          maintenancePlanId: maintPlan,
        },
        currency
      );

      return {
        cleanText: content,
        blueprint: {
          archetypeId,
          baseEngineId: engineId,
          featureIds: detectedFeatures,
          brandAssetId: 'ready',
          maintenancePlanId: maintPlan,
          suggestedTimeline: '3–4 Weeks',
          title: 'Consultative Solutions Blueprint',
          totalINR: quote.netTotalINR,
          totalUSD: quote.netTotalUSD,
        },
      };
    }
  }

  return { cleanText: content, blueprint: null };
}

function setClientCookie(name: string, value: string, maxAge = 2592000) {
  if (typeof document !== 'undefined') {
    try {
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax;`;
    } catch {}
  }
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
  currentScope = null,
  isDrawerMode = false,
  onCloseDrawer,
}: InlineScopingChatCardProps) {
  const { user, loginWithGoogle } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRfpModalOpen, setIsRfpModalOpen] = useState(false);
  const [appliedIndices, setAppliedIndices] = useState<Record<number, boolean>>({});
  const messagesViewportRef = useRef<HTMLDivElement>(null);

  // Soft Freemium Conversational Turn Management
  const ANONYMOUS_TURN_LIMIT = 4;
  const userTurnCount = chatTranscript.filter((m) => m.role === 'user').length;
  const isTurnGated = !user && userTurnCount >= ANONYMOUS_TURN_LIMIT;
  const isNearLimit = !user && userTurnCount === ANONYMOUS_TURN_LIMIT - 1;

  // Auto-scroll messages
  useEffect(() => {
    if (messagesViewportRef.current) {
      messagesViewportRef.current.scrollTop = messagesViewportRef.current.scrollHeight;
    }
  }, [chatTranscript, isStreaming]);

  const handleRfpBlueprintExtracted = (blueprint: ParseIntentResponse) => {
    onApplyBlueprint(blueprint);
    toast.success(
      `📄 RFP Parsed (${Math.round(blueprint.confidenceScore * 100)}% Confidence): ${blueprint.summaryRationale}`,
      {
        action: onNavigateStep
          ? {
              label: 'Review in Step 2 →',
              onClick: () => onNavigateStep(2),
            }
          : undefined,
        duration: 8000,
      }
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isStreaming || isTurnGated) return;

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
      // 2. Add placeholder assistant message
      setChatTranscript([
        ...updatedMessages,
        { role: 'assistant', content: '', timestamp: new Date().toISOString() },
      ]);

      // 3. Request streaming chat from BFF server endpoint
      const res = await fetch('/api/scoping/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          sessionId: chatSessionId || null,
          scopeCode: currentScope?.scopeCode || undefined,
          currency,
          turnIndex: userTurnCount + 1,
          currentScope: currentScope || undefined,
        }),
      });

      const returnedSessionId = res.headers.get('x-session-id');
      if (returnedSessionId) {
        if (returnedSessionId !== chatSessionId) {
          setChatSessionId(returnedSessionId);
        }
        setClientCookie('prateeq_chat_session_id', returnedSessionId);
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No readable stream received from scoping engine.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith('data: ')) {
            const raw = trimmed.slice(6).trim();
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
          } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmed);
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
              // Ignore non-json lines
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
      console.error('Scoping chat error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error('Scoping Copilot connection interrupted', {
        description: 'Unable to stream response from scoping engine.',
      });

      setChatTranscript([
        ...updatedMessages,
        {
          role: 'assistant',
          content: `⚠️ Note: Scoping engine response unavailable (${errMsg}). You can still use the prompt presets or manual archetype selection below.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleApplyBlueprintClick = (
    blueprint: ParsedBlueprint,
    messageIndex: number,
    customFeatureIds?: string[],
    customTitle?: string
  ) => {
    const featureIdsToApply = customFeatureIds || blueprint.featureIds;
    const titleToApply = customTitle || blueprint.title;

    const payload: ParseIntentResponse = {
      success: true,
      archetypeId: blueprint.archetypeId,
      baseEngineId: blueprint.baseEngineId,
      featureIds: featureIdsToApply,
      brandAssetId: blueprint.brandAssetId || 'ready',
      maintenancePlanId: blueprint.maintenancePlanId || 'standard',
      suggestedTimeline: blueprint.suggestedTimeline || '3–4 Weeks',
      confidenceScore: 0.96,
      summaryRationale: titleToApply,
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
    toast.success(`Applied "${titleToApply}" to your scope!`, {
      description: `Configured ${blueprint.baseEngineId.toUpperCase()} engine with ${featureIdsToApply.length} features.`,
    });
  };

  const handleResetChat = () => {
    setChatSessionId('');
    setChatTranscript([]);
    setAppliedIndices({});
    toast.info('Chat session reset.');
  };

  const activeQuickPrompts =
    currentScope && currentScope.currentStep >= 2
      ? STEP_2_QUICK_PROMPTS
      : QUICK_PROMPTS;

  return (
    <div className={`${styles.chatCardContainer} ${isNoir ? styles.noirTheme : ''} ${isDrawerMode ? styles.drawerMode : ''}`}>
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

        <div className={styles.headerActions}>
          {user && (
            <div className={styles.verifiedUserPill} title={`Verified session: ${user.email}`}>
              <span className={styles.verifiedDot} />
              <span>Verified Workspace</span>
            </div>
          )}

          <button
            type="button"
            className={styles.rfpBtn}
            onClick={() => setIsRfpModalOpen(true)}
            aria-label="Upload RFP or PRD Document"
          >
            <FileUp size={14} />
            <span>Drop RFP / PRD (PDF)</span>
          </button>

          {chatTranscript.length > 0 && (
            <button
              type="button"
              onClick={handleResetChat}
              className={styles.resetChatBtn}
              title="Reset conversation"
              aria-label="Reset conversation"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}

          {onCloseDrawer && (
            <button
              type="button"
              onClick={onCloseDrawer}
              className={styles.resetChatBtn}
              title="Close drawer"
              aria-label="Close drawer"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {currentScope && currentScope.selectedFeatures.length > 0 && (
        <div className={styles.scopeSyncBanner}>
          <span className={styles.livePulseDot} />
          <span className={styles.scopeSyncText}>
            🟢 Live Scope Sync: <strong>{currentScope.baseEngineId.toUpperCase()}</strong> •{' '}
            {currentScope.selectedFeatures.length} Modules Active ({formatPricePair(currentScope.totalINR, currentScope.totalUSD, currency)})
          </span>
        </div>
      )}

      <p className={styles.subHeading}>
        {currentScope && currentScope.currentStep >= 2
          ? 'Ask your AI solutions architect to negotiate budgets, optimize modules, or explain technical dependencies in real time.'
          : 'Describe your project vision in natural language or tap a creator preset. Your AI architect will design the optimal stack, calculate fixed costs, and provide an instant 1-click quote blueprint.'}
      </p>

      {/* Quick Prompt Pills */}
      <div className={styles.pillGrid} role="group" aria-label="Quick Scoping Suggestions">
        {activeQuickPrompts.map((pill, i) => (
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
              : extractBlueprint(msg.content, currency);
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

                    {blueprint.phasedBreakdown && (
                      <div className={styles.phasedGrid}>
                        {/* Phase 1 MVP Card */}
                        <div className={styles.phaseCard}>
                          <div className={styles.phaseCardHeader}>
                            <div className={styles.phaseBadge}>Phase 1 (MVP)</div>
                            <div className={styles.phasePrice}>
                              {currency === 'INR'
                                ? `₹${blueprint.phasedBreakdown.phase1.totalINR ? blueprint.phasedBreakdown.phase1.totalINR.toLocaleString() : '—'}`
                                : `$${blueprint.phasedBreakdown.phase1.totalUSD ? blueprint.phasedBreakdown.phase1.totalUSD.toLocaleString() : '—'}`}
                            </div>
                          </div>
                          <div className={styles.phaseCardTitle}>
                            {blueprint.phasedBreakdown.phase1.title}
                          </div>
                          {blueprint.phasedBreakdown.phase1.deliverablesSummary && (
                            <p className={styles.phaseCardSummary}>
                              {blueprint.phasedBreakdown.phase1.deliverablesSummary}
                            </p>
                          )}
                          <div className={styles.phaseMetaRow}>
                            <span>⏱️ {blueprint.phasedBreakdown.phase1.suggestedTimeline}</span>
                            <span>•</span>
                            <span>{blueprint.phasedBreakdown.phase1.featureIds.length} Modules</span>
                          </div>
                          {!isApplied ? (
                            <button
                              type="button"
                              className={styles.applyPhaseBtn}
                              onClick={() =>
                                handleApplyBlueprintClick(
                                  blueprint,
                                  idx,
                                  blueprint.phasedBreakdown!.phase1.featureIds,
                                  blueprint.phasedBreakdown!.phase1.title
                                )
                              }
                            >
                              <Zap size={13} />
                              <span>👉 Apply Phase 1 MVP</span>
                            </button>
                          ) : null}
                        </div>

                        {/* Full Scope Card */}
                        <div className={`${styles.phaseCard} ${styles.phaseCardFull}`}>
                          <div className={styles.phaseCardHeader}>
                            <div className={`${styles.phaseBadge} ${styles.phaseBadgeFull}`}>Full Roadmap</div>
                            <div className={styles.phasePrice}>
                              {currency === 'INR'
                                ? `₹${blueprint.totalINR ? blueprint.totalINR.toLocaleString() : '—'}`
                                : `$${blueprint.totalUSD ? blueprint.totalUSD.toLocaleString() : '—'}`}
                            </div>
                          </div>
                          <div className={styles.phaseCardTitle}>
                            Full Architecture Scope
                          </div>
                          {blueprint.phasedBreakdown.phase2.deliverablesSummary && (
                            <p className={styles.phaseCardSummary}>
                              {blueprint.phasedBreakdown.phase2.deliverablesSummary}
                            </p>
                          )}
                          <div className={styles.phaseMetaRow}>
                            <span>⏱️ {blueprint.suggestedTimeline}</span>
                            <span>•</span>
                            <span>{blueprint.featureIds.length} Total Modules</span>
                          </div>
                          {!isApplied ? (
                            <button
                              type="button"
                              className={styles.applyFullBtn}
                              onClick={() => handleApplyBlueprintClick(blueprint, idx)}
                            >
                              <Zap size={13} />
                              <span>👉 Apply Full Scope</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}

                    <div className={styles.blueprintActionRow}>
                      {isApplied ? (
                        <div className={styles.appliedBadge}>
                          <CheckCircle2 size={14} />
                          <span>✓ Applied to Interactive Quote</span>
                        </div>
                      ) : !blueprint.phasedBreakdown ? (
                        <button
                          type="button"
                          className={styles.applyBlueprintBtn}
                          onClick={() => handleApplyBlueprintClick(blueprint, idx)}
                        >
                          <Zap size={14} />
                          <span>👉 Apply Blueprint to Quote</span>
                        </button>
                      ) : null}

                      {onNavigateStep && (
                        <button
                          type="button"
                          className={styles.inspectScopeBtn}
                          onClick={() => {
                            onNavigateStep(2);
                            if (isDrawerMode && onCloseDrawer) {
                              onCloseDrawer();
                            }
                          }}
                        >
                          <span>🗺️ View in Architecture Topology Map</span>
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

        {isTurnGated && (
          <div className={styles.softGateCard} role="alert">
            <div className={styles.softGateHeader}>
              <div className={styles.softGateIconWrap}>
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className={styles.softGateTitle}>
                  You&apos;ve Explored 4 Custom Architecture Revisions!
                </h4>
                <p className={styles.softGateText}>
                  To continue this deep planning session, generate unlimited blueprint variations, and persist your entire history to your client workspace, connect your Google account in 1-click.
                </p>
              </div>
            </div>
            <div className={styles.softGateActionRow}>
              <button
                type="button"
                className={styles.softGateBtn}
                onClick={() => {
                  loginWithGoogle(
                    typeof window !== 'undefined'
                      ? window.location.pathname + window.location.search
                      : '/scoping'
                  );
                }}
              >
                <Zap size={14} />
                <span>Continue with Google (1-Click Fast Pass)</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Near Limit Alert */}
      {!user && isNearLimit && (
        <div className={styles.nearLimitAlert} role="status">
          <Sparkles size={14} className={styles.nearLimitIcon} />
          <span>
            <strong>1 Free Turn Remaining:</strong> Connect with Google to unlock unlimited turns and auto-save this entire scoping session.
          </span>
        </div>
      )}

      {/* Input Bar */}
      <div className={styles.inputForm}>
        <div className={styles.inputWrapper}>
          <textarea
            className={styles.textInput}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                handleSendMessage();
              }
            }}
            placeholder={
              isTurnGated
                ? 'Turn limit reached for anonymous session. Sign in with Google above to continue.'
                : "Describe your idea or ask a question (e.g. 'I want a video vault for streamers with Stripe billing')..."
            }
            rows={1}
            disabled={isStreaming || isTurnGated}
          />
        </div>

        <button
          type="button"
          disabled={!inputText.trim() || isStreaming || isTurnGated}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSendMessage();
          }}
          className={styles.sendBtn}
          aria-label="Send message"
        >
          {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>Send</span>
        </button>
      </div>

      <RfpUploaderModal
        isOpen={isRfpModalOpen}
        onClose={() => setIsRfpModalOpen(false)}
        onBlueprintExtracted={handleRfpBlueprintExtracted}
        currency={currency}
        isNoir={isNoir}
      />
    </div>
  );
}
