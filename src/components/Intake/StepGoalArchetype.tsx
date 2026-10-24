import React from 'react';
import {
  Building2,
  Check,
  Target,
  Sprout,
  Wrench,
  UserCheck,
  Mail,
  Phone,
  Zap,
  ShoppingCart,
  Calendar,
  Rocket,
  GraduationCap,
  BarChart3,
  Bot,
  Mic,
  Eye,
  MessageSquare,
  Brain,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { GoalArchetype, BaseEngineItem, FeatureItem } from '@/data/resume';
import { formatPricePair, packageTotalForArchetype, type Currency } from '@/lib/pricing';
import NumberFlow from '@number-flow/react';
import type { ParseIntentResponse } from '@/lib/rag-client';
import { InlineScopingChatCard } from './InlineScopingChatCard';
import { GOAL_CATEGORIES } from './useIntakeFormState';
import TiltCard from '@/components/ui/TiltCard';
import styles from './IntakeForm.module.css';
import type { User } from '@supabase/supabase-js';

const getArchetypeIcon = (id: string): React.ReactNode => {
  switch (id) {
    case 'landing_page':
      return <Zap size={16} className={styles.archetypeTitleIcon} />;
    case 'business_multipage':
      return <Building2 size={16} className={styles.archetypeTitleIcon} />;
    case 'ecommerce':
      return <ShoppingCart size={16} className={styles.archetypeTitleIcon} />;
    case 'booking_appointments':
      return <Calendar size={16} className={styles.archetypeTitleIcon} />;
    case 'saas_app':
      return <Rocket size={16} className={styles.archetypeTitleIcon} />;
    case 'lms_portal':
      return <GraduationCap size={16} className={styles.archetypeTitleIcon} />;
    case 'crm_admin':
      return <BarChart3 size={16} className={styles.archetypeTitleIcon} />;
    case 'ai_rag_app':
    case 'autonomous_agents':
      return <Bot size={16} className={styles.archetypeTitleIcon} />;
    case 'voice_ai_agent_app':
    case 'standalone_voice_bot':
      return <Mic size={16} className={styles.archetypeTitleIcon} />;
    case 'vision_ocr_saas':
      return <Eye size={16} className={styles.archetypeTitleIcon} />;
    case 'standalone_chatbot':
      return <MessageSquare size={16} className={styles.archetypeTitleIcon} />;
    case 'ai_strategy_consulting':
      return <Brain size={16} className={styles.archetypeTitleIcon} />;
    case 'custom':
      return <Settings size={16} className={styles.archetypeTitleIcon} />;
    default:
      return <Target size={16} className={styles.archetypeTitleIcon} />;
  }
};

const cleanArchetypeLabel = (label: string): string => {
  return label
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE00}-\u{FE0F}\u{200D}\s]+/gu, '')
    .trim();
};

const getEngineShortTitle = (engine?: BaseEngineItem): string => {
  if (!engine) return 'Base';
  switch (engine.id) {
    case 'landing':
      return 'Landing Page';
    case 'multipage':
      return 'Multi-Page';
    case 'saas':
      return 'SaaS MVP';
    case 'ai_strategy_audit':
      return 'AI Audit';
    case 'standalone_embed':
      return 'Widget Embed';
    default:
      return engine.title.replace(' Engine', '').replace(' Core', '');
  }
};

interface StepGoalArchetypeProps {
  goals: GoalArchetype[];
  engines: BaseEngineItem[];
  features: FeatureItem[];
  formData: {
    projectGoal: string;
    companyName: string;
    targetAudience: string;
    contactEmail: string;
    contactPhone: string;
    projectStartType: 'greenfield' | 'legacy_rebuild';
  };
  selectedGoalCategory: 'all' | 'websites' | 'saas' | 'ai_widgets';
  setSelectedGoalCategory: (cat: 'all' | 'websites' | 'saas' | 'ai_widgets') => void;
  currency: Currency;
  user: User | null;
  onGoalChange: (label: string) => void;
  onScopeStartTypeChange: (type: 'greenfield' | 'legacy_rebuild') => void;
  onResetServiceType: () => void;
  onChangeField: (field: string, value: string) => void;
  onApplyBlueprint?: (blueprint: ParseIntentResponse) => void;
  onNavigateStep?: (step: number) => void;
  isNoir?: boolean;
  stepHeadingRef?: React.RefObject<HTMLDivElement | null>;
  chatSessionId?: string | null;
  setChatSessionId?: (id: string) => void;
  chatTranscript?: Array<{ role: string; content: string; timestamp?: string }>;
  setChatTranscript?: React.Dispatch<
    React.SetStateAction<Array<{ role: string; content: string; timestamp?: string }>>
  >;
}

export function StepGoalArchetype({
  goals,
  engines,
  features,
  formData,
  selectedGoalCategory,
  setSelectedGoalCategory,
  currency,
  user,
  onGoalChange,
  onScopeStartTypeChange,
  onResetServiceType,
  onChangeField,
  onApplyBlueprint,
  onNavigateStep,
  isNoir = false,
  stepHeadingRef,
  chatSessionId,
  setChatSessionId,
  chatTranscript,
  setChatTranscript,
}: StepGoalArchetypeProps) {
  const archetypeCardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const categoryTabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const filteredGoals = (selectedGoalCategory === 'all'
    ? goals
    : goals.filter((g) => {
        const cat = GOAL_CATEGORIES.find((c) => c.id === selectedGoalCategory);
        return cat?.ids.includes(g.id);
      })
  );

  const selectedArchetypeIndex = filteredGoals.findIndex((g) => formData.projectGoal === g.label);

  const focusArchetype = (index: number) => {
    const clamped = Math.max(0, Math.min(index, filteredGoals.length - 1));
    archetypeCardRefs.current[clamped]?.focus();
  };

  const focusCategoryTab = (index: number) => {
    const clamped = Math.max(0, Math.min(index, GOAL_CATEGORIES.length - 1));
    categoryTabRefs.current[clamped]?.focus();
  };

  return (
    <div className={styles.formStep}>
      <div className={styles.groupTitle} ref={stepHeadingRef} tabIndex={-1}>
        <Building2 size={18} />
        <span>STEP 1: PROJECT GOAL &amp; TARGET AUDIENCE</span>
        <button
          type="button"
          className={styles.backToStep0}
          onClick={onResetServiceType}
        >
          ← Change service type
        </button>
      </div>

      {/* Conversational Scoping Copilot Card (Retriever-Native) */}
      <InlineScopingChatCard
        currency={currency}
        isNoir={isNoir}
        onApplyBlueprint={onApplyBlueprint || (() => {})}
        onNavigateStep={onNavigateStep}
        chatSessionId={chatSessionId || null}
        setChatSessionId={setChatSessionId || (() => {})}
        chatTranscript={chatTranscript || []}
        setChatTranscript={setChatTranscript || (() => {})}
      />

      {/* Low-Risk Paid Discovery Wedge */}
      {(() => {
        const auditGoal = goals.find((g) => g.id === 'ai_strategy_consulting' || g.recommendedEngineId === 'ai_strategy_audit');
        const auditLabel = auditGoal ? auditGoal.label : '🧠 AI Strategy & Solutioning Audit';
        const isAuditSelected = formData.projectGoal === auditLabel || formData.projectGoal === 'ai_strategy_consulting';
        return (
          <div className={styles.discoveryWedgeBox}>
            <div className={styles.discoveryWedgeBadge}>
              <Sparkles size={13} />
              <span>PAID DISCOVERY WEDGE</span>
            </div>
            <div className={styles.discoveryWedgeContent}>
              <div className={styles.discoveryWedgeText}>
                <h3 className={styles.discoveryWedgeTitle}>
                  🧠 AI Strategy &amp; Architecture Audit
                </h3>
                <p className={styles.discoveryWedgeDescription}>
                  Not ready for a full multi-week build? Start with a 60-minute deep-dive operational workflow audit. We analyze your tech bottlenecks, model AI ROI, and deliver an actionable 3-page custom AI Architecture Blueprint PDF.
                </p>
              </div>
              <div className={styles.discoveryWedgeActions}>
                <div className={styles.discoveryWedgePrice}>
                  <span className={styles.discoveryWedgePriceTag}>
                    {currency === 'INR' ? '₹20,000' : '$300'}
                  </span>
                  <span className={styles.discoveryWedgeDuration}>/ 1-Week Sprint</span>
                </div>
                <button
                  type="button"
                  className={`${styles.discoveryWedgeBtn} ${
                    isAuditSelected ? styles.discoveryWedgeBtnActive : ''
                  }`}
                  onClick={() => onGoalChange(auditLabel)}
                >
                  {isAuditSelected ? (
                    <>
                      <Check size={14} />
                      <span>ACTIVE WEDGE</span>
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      <span>SELECT DISCOVERY WEDGE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className={`${styles.field} ${styles.fieldMarginSm}`}>
        <label className={styles.label}>
          <Target size={14} className={styles.inlineIcon} />
          Or Manually Select Primary Goal Archetype
        </label>
        <p className={styles.fieldHint}>
          Choosing an archetype automatically configures your recommended engine tier, primary business outcome, and compulsory core module dependencies.
        </p>

        {/* Goal Category Filter Tabs */}
        <div className={styles.categoryTabs} role="tablist" aria-label="Goal Archetype Categories">
          {GOAL_CATEGORIES.map((cat, catIdx) => {
            const isSelected = selectedGoalCategory === cat.id;
            const count =
              cat.id === 'all' ? goals.length : goals.filter((g) => cat.ids.includes(g.id)).length;
            return (
              <button
                key={cat.id}
                type="button"
                ref={(el) => { categoryTabRefs.current[catIdx] = el; }}
                role="tab"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                className={`${styles.categoryTabBtn} ${isSelected ? styles.categoryTabBtnActive : ''}`}
                onClick={() => setSelectedGoalCategory(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') { e.preventDefault(); focusCategoryTab(catIdx + 1); }
                  else if (e.key === 'ArrowLeft') { e.preventDefault(); focusCategoryTab(catIdx - 1); }
                  else if (e.key === 'Home') { e.preventDefault(); focusCategoryTab(0); }
                  else if (e.key === 'End') { e.preventDefault(); focusCategoryTab(GOAL_CATEGORIES.length - 1); }
                }}
              >
                <span>{cat.label}</span>
                <span className={styles.categoryTabBadge}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.archetypeGrid} role="radiogroup" aria-label="Primary Project Archetype">
          {filteredGoals.map((g, idx) => {
            const isSelected = formData.projectGoal === g.label;
            const recommendedEngine = engines.find((e) => e.id === g.recommendedEngineId);
            return (
              <TiltCard key={g.id} maxAngle={2} glare={false} className={styles.archetypeTilt}>
                <div
                  ref={(el) => { archetypeCardRefs.current[idx] = el; }}
                  tabIndex={isSelected || selectedArchetypeIndex === -1 ? 0 : -1}
                  role="radio"
                  aria-checked={isSelected}
                  className={`${styles.archetypeCard} ${isSelected ? styles.archetypeCardSelected : ''}`}
                  onClick={() => onGoalChange(g.label)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onGoalChange(g.label);
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      focusArchetype(idx + 1);
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      focusArchetype(idx - 1);
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      focusArchetype(0);
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      focusArchetype(filteredGoals.length - 1);
                    }
                  }}
                >
                  <div className={styles.archetypeHeader}>
                    <span className={styles.archetypeLabel}>
                      {getArchetypeIcon(g.id)}
                      <span>{cleanArchetypeLabel(g.label)}</span>
                    </span>
                    {g.id === 'business_multipage' && !isSelected && (
                      <span className={styles.popularBadge}>POPULAR CHOICE</span>
                    )}
                    {isSelected && (
                      <span className={styles.selectedBadge}>
                        <Check size={12} /> SELECTED
                      </span>
                    )}
                  </div>
                  <p className={styles.archetypeDesc}>{g.description}</p>
                  <div className={styles.archetypeFooter}>
                    <div className={styles.archetypeMetaRow}>
                      <span className={styles.engineTag}>
                        {`Engine: ${getEngineShortTitle(recommendedEngine)}`}
                      </span>
                      <span className={styles.featureCountTag}>
                        {`${g.compulsoryFeatureLabels.length} Core Module${g.compulsoryFeatureLabels.length === 1 ? '' : 's'}`}
                      </span>
                    </div>
                    <div className={styles.archetypePriceRow}>
                      <span className={styles.archetypePriceBadge}>
                        Starts at{' '}
                        <NumberFlow
                          value={packageTotalForArchetype(g, engines, features, currency)}
                          locales={currency === 'INR' ? 'en-IN' : 'en-US'}
                          format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          <Sprout size={14} className={styles.inlineIcon} />
          Project Scope Starting Point
        </label>
        <div className={styles.chipGrid} role="radiogroup" aria-label="Project Scope Starting Point">
          <button
            type="button"
            role="radio"
            aria-checked={formData.projectStartType === 'greenfield'}
            className={`${styles.chipCard} ${formData.projectStartType === 'greenfield' ? styles.chipCardActive : ''}`}
            onClick={() => onScopeStartTypeChange('greenfield')}
          >
            <Sprout size={14} className={styles.inlineIcon} />
            Greenfield Build (From Scratch)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={formData.projectStartType === 'legacy_rebuild'}
            className={`${styles.chipCard} ${formData.projectStartType === 'legacy_rebuild' ? styles.chipCardActive : ''}`}
            onClick={() => onScopeStartTypeChange('legacy_rebuild')}
          >
            <Wrench size={14} className={styles.inlineIcon} />
            Legacy Refactor / Rebuild
          </button>
        </div>
        {formData.projectStartType === 'legacy_rebuild' && (
          <p className={styles.chipHelpText}>
            <Wrench size={12} className={styles.inlineIcon} />
            Selecting Legacy Refactor auto-includes the Legacy Data Migration module (+{formatPricePair(30000, 400, currency)}).
          </p>
        )}
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label}>
            <Building2 size={14} className={styles.inlineIcon} />
            Project / Company Name (Optional)
          </label>
          <input
            type="text"
            className={styles.input}
            aria-label="Project or Company Name"
            placeholder="e.g., Acme SaaS Engine / Stealth Startup"
            value={formData.companyName}
            onChange={(e) => onChangeField('companyName', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <UserCheck size={14} className={styles.inlineIcon} />
            Target Audience Persona &amp; Industry
          </label>
          <input
            type="text"
            className={styles.input}
            aria-label="Target Audience Persona & Industry"
            placeholder="e.g., B2B Tech Founders, Healthcare SMBs, E-Commerce Buyers"
            value={formData.targetAudience}
            onChange={(e) => onChangeField('targetAudience', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <Mail size={14} className={styles.inlineIcon} />
            Contact Email {!user && '(Required for Guest Scoping)'}
          </label>
          <input
            type="email"
            inputMode="email"
            className={styles.input}
            aria-label="Contact Email"
            placeholder="e.g., founder@company.com"
            value={formData.contactEmail}
            onChange={(e) => onChangeField('contactEmail', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <Phone size={14} className={styles.inlineIcon} />
            Contact Phone / WhatsApp (Optional)
          </label>
          <input
            type="tel"
            inputMode="tel"
            className={styles.input}
            aria-label="Contact Phone or WhatsApp"
            placeholder="e.g., +91 99107 93616 / +1 (555) 019-2831"
            value={formData.contactPhone}
            onChange={(e) => onChangeField('contactPhone', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
