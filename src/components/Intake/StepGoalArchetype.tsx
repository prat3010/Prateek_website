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
} from 'lucide-react';
import type { GoalArchetype, BaseEngineItem, FeatureItem } from '@/data/resume';
import { formatMoney, packageTotalForArchetype, type Currency } from '@/lib/pricing';
import { GOAL_CATEGORIES } from './IntakeForm';
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
  return label.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();
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
}: StepGoalArchetypeProps) {
  return (
    <div className={styles.formStep}>
      <div className={styles.groupTitle}>
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

      <div className={`${styles.field} ${styles.fieldMarginSm}`}>
        <label className={styles.label}>
          <Target size={14} className={styles.inlineIcon} />
          Select Primary Goal Archetype
        </label>
        <p className={styles.fieldHint}>
          Choosing an archetype automatically configures your recommended engine tier, primary business outcome, and compulsory core module dependencies.
        </p>

        {/* Goal Category Filter Tabs */}
        <div className={styles.categoryTabs} role="tablist" aria-label="Goal Archetype Categories">
          {GOAL_CATEGORIES.map((cat) => {
            const isSelected = selectedGoalCategory === cat.id;
            const count =
              cat.id === 'all' ? goals.length : goals.filter((g) => cat.ids.includes(g.id)).length;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`${styles.categoryTabBtn} ${isSelected ? styles.categoryTabBtnActive : ''}`}
                onClick={() => setSelectedGoalCategory(cat.id)}
              >
                <span>{cat.label}</span>
                <span className={styles.categoryTabBadge}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.archetypeGrid} role="radiogroup" aria-label="Primary Project Archetype">
          {(selectedGoalCategory === 'all'
            ? goals
            : goals.filter((g) => {
                const cat = GOAL_CATEGORIES.find((c) => c.id === selectedGoalCategory);
                return cat?.ids.includes(g.id);
              })
          ).map((g) => {
            const isSelected = formData.projectGoal === g.label;
            const recommendedEngine = engines.find((e) => e.id === g.recommendedEngineId);
            return (
              <div
                key={g.id}
                tabIndex={0}
                role="radio"
                aria-checked={isSelected}
                className={`${styles.archetypeCard} ${isSelected ? styles.archetypeCardSelected : ''}`}
                onClick={() => onGoalChange(g.label)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onGoalChange(g.label);
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
                  <span className={styles.engineTag}>
                    {`Engine: ${recommendedEngine?.title ? recommendedEngine.title.replace(' Engine', '').replace(' Core', '') : 'Base'}`}
                  </span>
                  <span className={styles.featureCountTag}>
                    {`${g.compulsoryFeatureLabels.length} Core Module${g.compulsoryFeatureLabels.length > 1 ? 's' : ''}`}
                  </span>
                  <span className={styles.archetypePriceBadge}>
                    {`Starts at ${formatMoney(packageTotalForArchetype(g, engines, features, currency), currency)}`}
                  </span>
                </div>
              </div>
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
            placeholder="e.g., +91 99107 93616 / +1 (555) 019-2831"
            value={formData.contactPhone}
            onChange={(e) => onChangeField('contactPhone', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
