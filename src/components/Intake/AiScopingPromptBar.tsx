'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  FileUp,
  MessageSquare,
  Activity,
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
}: AiScopingPromptBarProps) {
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [isRfpModalOpen, setIsRfpModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<ScopingTelemetry>({
    latencyMs: 380,
    semanticCacheHit: true,
    tenantId: 'prateeq_scoping',
    modelUsed: 'Retriever M42/M22 Intent Classifier',
  });

  const handleAnalyze = async (overridePrompt?: string) => {
    const textToAnalyze = (overridePrompt || promptText).trim();
    if (!textToAnalyze) {
      toast.error('Please enter a project description or select a prompt pill.');
      return;
    }

    setIsLoading(true);
    setProgressStep('1/3 Analyzing requirements & NLP intent...');

    const timer1 = setTimeout(() => {
      setProgressStep('2/3 Synthesizing CPQ Architecture blueprint...');
    }, 180);

    const timer2 = setTimeout(() => {
      setProgressStep('3/3 Applying configuration & dependencies...');
    }, 320);

    try {
      const res = await fetch('/api/scoping/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToAnalyze,
          currency,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to parse project intent');
      }

      const data: ParseIntentResponse = await res.json();
      if (data.telemetry) {
        setTelemetry(data.telemetry);
      }

      onApplyBlueprint(data);
      toast.success(
        `🎯 ${Math.round(data.confidenceScore * 100)}% Match: ${data.summaryRationale}`,
        { duration: 5000 }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Intent parsing failed: ${message}`);
    } finally {
      setIsLoading(false);
      setProgressStep(null);
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
    onApplyBlueprint(blueprint);
    toast.success(
      `📄 RFP Parsed (${Math.round(blueprint.confidenceScore * 100)}% Confidence): ${blueprint.summaryRationale}`,
      { duration: 6000 }
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

      {progressStep && (
        <div className={styles.progressContainer}>
          <div className={styles.spinner} />
          <span>{progressStep}</span>
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

      <div className={styles.telemetryRow}>
        <div className={styles.telemetryBadge}>
          <Activity size={13} />
          <span>⚡ Powered by Retriever Multi-Tenant Engine (prateeq-scoping-live)</span>
        </div>
        <div className={styles.telemetryDetails}>
          <span>Latency: {telemetry.latencyMs}ms</span>
          <span>
            • ⚡ Semantic Cache:{' '}
            {telemetry.semanticCacheHit ? 'Active (HNSW pgvector)' : 'Warm'}
          </span>
          <span>• Tenant: {telemetry.tenantId}</span>
        </div>
      </div>

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
