'use client';

import React, { useState } from 'react';
import { UserCheck, Save } from 'lucide-react';
import { generateOnboardingChecklist, calcOnboardingReadiness } from '@/lib/onboardingChecklist';
import type { ClientScope } from '@/lib/clientOrder';
import styles from '@/app/dashboard/dashboard.module.css';

interface OnboardingChecklistWidgetProps {
  scopes: ClientScope[];
  activeScope: ClientScope | null;
  onUpdateScope: (updated: ClientScope) => Promise<void>;
}

export function OnboardingChecklistWidget({
  scopes,
  activeScope,
  onUpdateScope,
}: OnboardingChecklistWidgetProps) {
  const [selectedScopeCode, setSelectedScopeCode] = useState<string>(
    activeScope?.scope_code || scopes[0]?.scope_code || ''
  );
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'all' | 'financial' | 'technical' | 'design' | 'governance'
  >('all');
  const [companyInputs, setCompanyInputs] = useState<Record<string, string>>({});
  const [phoneInputs, setPhoneInputs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const currentScope =
    scopes.find((s) => s.scope_code === selectedScopeCode) || activeScope || scopes[0];

  if (!currentScope) {
    return (
      <div className={styles.emptyScopeState}>
        <UserCheck size={36} className={styles.emptyIcon} />
        <h4>No Active Scope Selected</h4>
        <p>Please configure a project scope first to generate your onboarding checklist.</p>
      </div>
    );
  }

  const checklistItems = generateOnboardingChecklist(currentScope);

  const checklistState = (currentScope.onboarding_checklist || {}) as Record<string, boolean | string>;
  const readiness = calcOnboardingReadiness(currentScope);

  const filteredItems = checklistItems.filter((item) => {
    if (activeCategoryFilter === 'all') return true;
    return item.category === activeCategoryFilter;
  });

  const handleToggleItem = async (itemId: string, value: boolean | string) => {
    const updatedChecklist = { ...checklistState, [itemId]: value };
    const updatedScope: ClientScope = {
      ...currentScope,
      onboarding_checklist: updatedChecklist,
    };
    await onUpdateScope(updatedScope);
  };

  const handleSaveCompanyPhone = async () => {
    const newCompany = companyInputs[currentScope.scope_code] ?? currentScope.company_name;
    const newPhone = phoneInputs[currentScope.scope_code] ?? currentScope.client_phone ?? '';

    setIsSaving(true);
    try {
      const updatedScope: ClientScope = {
        ...currentScope,
        company_name: newCompany,
        client_phone: newPhone,
      };
      await onUpdateScope(updatedScope);
      alert('✅ Client Profile details saved!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.onboardingContainer}>
      <div className={styles.onboardingHeaderRow}>
        <div>
          <h3 className={styles.tabHeading}>Client Onboarding & Project Readiness</h3>
          <p className={styles.tabSubheading}>
            Complete key prerequisites, access credentials, and technical assets to unlock kickoff.
          </p>
        </div>

        {scopes.length > 1 && (
          <select
            value={currentScope.scope_code}
            onChange={(e) => setSelectedScopeCode(e.target.value)}
            className={styles.scopeSelectDropdown}
          >
            {scopes.map((s) => (
              <option key={s.scope_code} value={s.scope_code}>
                {s.company_name || s.scope_code} (#{s.scope_code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Progress & Readiness Bar */}
      <div className={styles.readinessCard}>
        <div className={styles.readinessScoreRow}>
          <div>
            <span className={styles.readinessLabel}>Onboarding Readiness Score</span>
            <h4 className={styles.readinessScoreText}>{readiness.percent}% Completed</h4>
          </div>
          <div className={styles.readinessCounts}>
            <span>
              {readiness.completed} of {readiness.total} Items Completed
            </span>
          </div>
        </div>
        <div className={styles.readinessProgressBar}>
          <div
            className={styles.readinessProgressFill}
            style={{ width: `${readiness.percent}%` }}
          />
        </div>
      </div>

      {/* Profile & Business Input Box */}
      <div className={styles.onboardingProfileBox}>
        <h4 className={styles.sectionHeading}>Client & Organization Details</h4>
        <div className={styles.profileInputsRow}>
          <div className={styles.profileInputGroup}>
            <label>Company / Project Name</label>
            <input
              type="text"
              value={companyInputs[currentScope.scope_code] ?? currentScope.company_name ?? ''}
              onChange={(e) =>
                setCompanyInputs((prev) => ({
                  ...prev,
                  [currentScope.scope_code]: e.target.value,
                }))
              }
              placeholder="e.g. Acme Corporation"
            />
          </div>
          <div className={styles.profileInputGroup}>
            <label>Contact Phone (WhatsApp / Signal)</label>
            <input
              type="tel"
              value={phoneInputs[currentScope.scope_code] ?? currentScope.client_phone ?? ''}
              onChange={(e) =>
                setPhoneInputs((prev) => ({
                  ...prev,
                  [currentScope.scope_code]: e.target.value,
                }))
              }
              placeholder="+91 98765 43210"
            />
          </div>
          <button
            type="button"
            className={styles.saveProfileBtn}
            onClick={handleSaveCompanyPhone}
            disabled={isSaving}
          >
            <Save size={15} /> Save Details
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className={styles.categoryPills}>
        {(['all', 'financial', 'technical', 'design', 'governance'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`${styles.categoryPill} ${activeCategoryFilter === cat ? styles.categoryPillActive : ''}`}
            onClick={() => setActiveCategoryFilter(cat)}
          >
            {cat === 'all'
              ? 'All Items'
              : cat === 'financial'
              ? '💳 Financial'
              : cat === 'technical'
              ? '⚡ Technical & APIs'
              : cat === 'design'
              ? '🎨 Design & Assets'
              : '⚖️ Governance'}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div className={styles.checklistList}>
        {filteredItems.map((item) => {
          const isDone = Boolean(checklistState[item.id]);
          return (
            <div
              key={item.id}
              className={`${styles.checklistItemCard} ${isDone ? styles.checklistItemCardDone : ''}`}
            >
              <label className={styles.checklistItemLabel}>
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                  className={styles.checklistCheckbox}
                />
                <div className={styles.checklistItemInfo}>
                  <div className={styles.checklistItemHeader}>
                    <span className={styles.checklistItemTitle}>{item.title}</span>
                    {item.isMandatory && (
                      <span className={styles.requiredBadge}>Required for Kickoff</span>
                    )}
                  </div>
                  <p className={styles.checklistItemDesc}>{item.description}</p>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
