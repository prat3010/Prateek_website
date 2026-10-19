'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  FileUp,
  MessageSquare,
  Activity,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Currency } from '@/lib/pricing';
import type { ParseIntentResponse, ScopingTelemetry } from '@/lib/rag-client';
import { RfpUploaderModal } from './RfpUploaderModal';
import { ScopingChatWidgetDrawer } from './ScopingChatWidgetDrawer';
import MagneticButton from '@/components/ui/MagneticButton';
import styles from './AiScopingPromptBar.module.css';

interface AiScopingPromptBarProps {
  onApplyBlueprint: (blueprint: ParseIntentResponse) => void;
  currency: Currency;
  isNoir?: boolean;
  onNavigateStep?: (step: number) => void;
}

const ARCHETYPE_NAMES: Record<string, string> = {
  landing_page: 'High-Converting Landing Page',
  business_multipage: 'Multi-Page Business Website',
  ecommerce: 'E-commerce & Digital Store',
  booking_appointments: 'Booking & Appointments Portal',
  saas_app: 'Full-Stack SaaS MVP Core',
  lms_portal: 'Online Course & LMS Portal',
  crm_admin: 'Internal CRM & Operations Portal',
  ai_rag_app: 'AI Knowledge Base / RAG Copilot',
  autonomous_agents: 'Autonomous AI Agents & Workflows',
  voice_ai_agent_app: 'Real-Time Voice AI Agent',
  vision_ocr_saas: 'Multimodal Vision & Document OCR',
  standalone_voice_bot: 'Standalone Voice Bot',
  standalone_chatbot: 'Standalone AI Chatbot',
  ai_strategy_consulting: 'AI Architecture Advisory',
  custom: 'Custom Engineering Architecture',
};

const ENGINE_NAMES: Record<string, string> = {
  landing: 'Landing Core Engine',
  multipage: 'Multi-Page Core Engine',
  saas: 'Full-Stack SaaS Core Engine',
};

function formatArchetypeLabel(id: string): string {
  if (ARCHETYPE_NAMES[id]) return ARCHETYPE_NAMES[id];
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEngineLabel(id: string): string {
  if (ENGINE_NAMES[id]) return ENGINE_NAMES[id];
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const QUICK_SUGGESTIONS = [
  { label: '🚀 Real Estate RAG Portal', prompt: 'Build a real estate portal with private AI knowledge base for property documents, client portal, and lead capture.' },
  { label: '🤖 Healthcare Voice Bot', prompt: 'Create a HIPAA-ready healthcare platform with conversational voice AI agent, appointment booking, and SMS workflows.' },
  { label: '🛍️ Headless E-Commerce', prompt: 'Modern direct-to-consumer e-commerce brand store with product catalog, cart drawer, Razorpay checkout, and analytics.' },
  { label: '📊 SaaS MVP with Billing', prompt: 'Full-stack B2B SaaS platform with user authentication, Stripe subscriptions, role-based admin center, and email alerts.' },
  { label: '🎓 Course LMS Portal', prompt: 'Online learning course academy with student accounts, video lesson player, payment gating, and completion certificates.' },
];

export function AiScopingPromptBar({
  onApplyBlueprint,
  currency,
  isNoir = false,
  onNavigateStep,
}: AiScopingPromptBarProps) {
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRfpModalOpen, setIsRfpModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<ScopingTelemetry | null>(null);
  const [matchedBlueprint, setMatchedBlueprint] = useState<ParseIntentResponse | null>(null);

  const handleAnalyze = async (overridePrompt?: string) => {
    const textToAnalyze = (overridePrompt || promptText).trim();
    if (!textToAnalyze) {
      toast.error('Please enter a project description or select a prompt pill.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/scoping/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToAnalyze,
          currency,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to parse project intent');
      }

      const data: ParseIntentResponse = await res.json();
      if (data.telemetry) {
        setTelemetry(data.telemetry);
      }

      setMatchedBlueprint(data);
      onApplyBlueprint(data);
      toast.success(
        `🎯 ${Math.round(data.confidenceScore * 100)}% Match: ${data.summaryRationale}`,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Intent parsing failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setPromptText(prompt);
    void handleAnalyze(prompt);
  };

  const handleRfpApplied = (blueprint: ParseIntentResponse) => {
    if (blueprint.telemetry) {
      setTelemetry(blueprint.telemetry);
    }
    setMatchedBlueprint(blueprint);
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

  return (
    <div className={styles.promptContainer} data-testid="ai-scoping-prompt-bar">
      <div className={styles.headerRow}>
        <div className={styles.badge}>
          <Sparkles size={13} />
          <span>Multimodal Discovery &amp; Intent Copilot</span>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryActionBtn}
            onClick={() => setIsRfpModalOpen(true)}
            aria-label="Upload RFP or PRD Document"
          >
            <FileUp size={14} />
            <span>Drop RFP / PRD (PDF)</span>
          </button>

          <button
            type="button"
            className={styles.secondaryActionBtn}
            onClick={() => setIsChatDrawerOpen(true)}
            aria-label="Open Scoping AI Chatbot"
          >
            <MessageSquare size={14} />
            <span>Chat with Scoping AI</span>
          </button>
        </div>
      </div>

      <div className={styles.inputWrapper}>
        <Sparkles size={18} className={styles.inputIcon} />
        <input
          type="text"
          className={styles.promptInput}
          placeholder="Describe your project in plain English (e.g. 'Build an AI SaaS platform with pgvector search & Stripe billing')..."
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleAnalyze();
            }
          }}
          disabled={isLoading}
          aria-label="Describe your project in natural language"
        />

        <MagneticButton strength={0.25}>
          <button
            type="button"
            className={styles.analyzeBtn}
            onClick={() => void handleAnalyze()}
            disabled={isLoading || !promptText.trim()}
            aria-label="Analyze Intent"
          >
            {isLoading ? (
              <>
                <div className={styles.spinner} />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap size={15} />
                <span>Analyze Scope</span>
              </>
            )}
          </button>
        </MagneticButton>
      </div>

      {isLoading && (
        <div className={styles.progressContainer}>
          <div className={styles.spinner} />
          <span>Analyzing architecture requirements with Retriever...</span>
        </div>
      )}

      {matchedBlueprint && (
        <div className={styles.matchCard} data-testid="scoping-match-card">
          <div className={styles.matchCardHeader}>
            <div className={styles.matchCardBadge}>
              <CheckCircle2 size={16} className={styles.matchSuccessIcon} />
              <span>Blueprint Matched ({Math.round(matchedBlueprint.confidenceScore * 100)}% Confidence)</span>
            </div>
            {matchedBlueprint.retrieverEngineRecommended && (
              <span className={styles.engineTag}>⚡ Retriever Recommended</span>
            )}
          </div>

          <p className={styles.matchRationale}>
            {matchedBlueprint.summaryRationale}
          </p>

          <div className={styles.matchGrid}>
            <div className={styles.matchItem}>
              <span className={styles.matchItemLabel}>Matched Archetype</span>
              <strong className={styles.matchItemValue}>
                {formatArchetypeLabel(matchedBlueprint.archetypeId)}
              </strong>
            </div>
            <div className={styles.matchItem}>
              <span className={styles.matchItemLabel}>Base Engine</span>
              <strong className={styles.matchItemValue}>
                {formatEngineLabel(matchedBlueprint.baseEngineId)}
              </strong>
            </div>
            <div className={styles.matchItem}>
              <span className={styles.matchItemLabel}>Active Add-Ons</span>
              <strong className={styles.matchItemValue}>
                {(matchedBlueprint.featureIds || []).length}{' '}
                {(matchedBlueprint.featureIds || []).length === 1 ? 'Module' : 'Modules'} Selected
              </strong>
            </div>
            <div className={styles.matchItem}>
              <span className={styles.matchItemLabel}>Est. Timeline</span>
              <strong className={styles.matchItemValue}>
                {matchedBlueprint.suggestedTimeline || '2 to 4 Weeks'}
              </strong>
            </div>
          </div>

          {onNavigateStep && (
            <div className={styles.matchCtaRow}>
              <button
                type="button"
                className={styles.reviewBlueprintBtn}
                onClick={() => onNavigateStep(2)}
                aria-label="Review Architecture Blueprint in Step 2"
              >
                <span>Review Architecture Blueprint (Step 2) →</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className={styles.suggestionsRow}>
        <span className={styles.suggestionLabel}>Quick Blueprints:</span>
        {QUICK_SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={styles.pillBtn}
            onClick={() => handleSuggestionClick(item.prompt)}
            disabled={isLoading}
          >
            {item.label}
          </button>
        ))}
      </div>

      {telemetry && (
        <div className={styles.telemetryRow}>
          <div className={styles.telemetryBadge}>
            <Activity size={13} />
            <span>
              {telemetry.fallbackMode
                ? '⚙️ Catalog Rule-Based Matcher (Offline Fallback)'
                : `⚡ Powered by Retriever (${telemetry.modelUsed || 'Live Engine'})`}
            </span>
          </div>
          <div className={styles.telemetryDetails}>
            <span>Latency: {telemetry.latencyMs}ms</span>
            {!telemetry.fallbackMode && (
              <span>
                • ⚡ Semantic Cache:{' '}
                {telemetry.semanticCacheHit ? 'Active (HNSW pgvector)' : 'Warm'}
              </span>
            )}
            <span>• Tenant: {telemetry.tenantId}</span>
          </div>
        </div>
      )}

      {isRfpModalOpen && (
        <RfpUploaderModal
          isOpen={isRfpModalOpen}
          onClose={() => setIsRfpModalOpen(false)}
          onBlueprintExtracted={handleRfpApplied}
          currency={currency}
          isNoir={isNoir}
        />
      )}

      {isChatDrawerOpen && (
        <ScopingChatWidgetDrawer
          isOpen={isChatDrawerOpen}
          onClose={() => setIsChatDrawerOpen(false)}
          isNoir={isNoir}
        />
      )}
    </div>
  );
}
