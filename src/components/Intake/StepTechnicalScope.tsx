import React from 'react';
import { SlidersHorizontal, Layers, Info, X, Boxes, Settings, Zap, Sparkles, Rocket, Bot, Lock, Link, Wrench } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import type { GoalArchetype, BaseEngineItem, FeatureItem } from '@/data/resume';
import { formatPricePair, resolveFeatureDependencies, type Currency } from '@/lib/pricing';
import { FEATURE_CATEGORIES } from './IntakeForm';
import styles from './IntakeForm.module.css';

interface StepTechnicalScopeProps {
  engines: BaseEngineItem[];
  features: FeatureItem[];
  currentArchetype: GoalArchetype;
  selectedEngine: BaseEngineItem;
  formData: {
    selectedBaseEngineId: string;
    selectedFeatures: string[];
    projectStartType: 'greenfield' | 'legacy_rebuild';
  };
  showEngineOverride: boolean;
  setShowEngineOverride: (show: boolean) => void;
  activePopoverId: string | null;
  setActivePopoverId: (id: string | null) => void;
  popoverAnchor: { x: number; y: number } | null;
  setPopoverAnchor: (anchor: { x: number; y: number } | null) => void;
  lockedHintId: string | null;
  currency: Currency;
  priceInCurrency: (inr: number, usd: number) => string;
  onEngineSelect: (engineId: string) => void;
  onFeatureToggle: (featureLabel: string) => void;
  onApplySmartPreset: (presetType: 'essential' | 'growth' | 'ai') => void;
  togglePopover: (e: React.MouseEvent, id: string) => void;
  dependsOnMap: Record<string, string[]>;
}

export function StepTechnicalScope({
  engines,
  features,
  currentArchetype,
  selectedEngine,
  formData,
  showEngineOverride,
  setShowEngineOverride,
  activePopoverId,
  setActivePopoverId,
  popoverAnchor,
  setPopoverAnchor,
  lockedHintId,
  currency,
  priceInCurrency,
  onEngineSelect,
  onFeatureToggle,
  onApplySmartPreset,
  togglePopover,
  dependsOnMap,
}: StepTechnicalScopeProps) {
  return (
    <div className={styles.formStep}>
      <div className={styles.groupTitle}>
        <SlidersHorizontal size={18} />
        <span>STEP 2: TECHNICAL ARCHITECTURE &amp; FEATURE MATRIX</span>
      </div>

      {/* Base Engine Selector */}
      <div className={`${styles.field} ${styles.fieldMarginMd}`}>
        <label className={styles.label}>
          <Layers size={14} className={styles.inlineIcon} />
          Base Platform Foundation Engine
        </label>
        <p className={styles.fieldHelpText}>
          Auto-assigned based on your Step 1 archetype target. Expand to override with a custom foundation tier.
        </p>

        {!showEngineOverride ? (
          <div className={styles.engineSummaryCard}>
            <div className={styles.engineSummaryLeft}>
              <div className={styles.engineSummaryHeader}>
                <span className={styles.engineSummaryTitle}>{selectedEngine.title}</span>
                <span className={styles.engineTierTag}>{selectedEngine.tier}</span>
              </div>
              <p className={styles.engineSummaryDesc}>{selectedEngine.laymanDescription}</p>
            </div>
            <div className={styles.engineSummaryRight}>
              <span className={styles.priceBadge}>
                {formatPricePair(selectedEngine.priceINR, selectedEngine.priceUSD, currency)}
              </span>
              <button
                type="button"
                className={styles.engineOverrideBtn}
                onClick={() => setShowEngineOverride(true)}
                title="Click to select a different base platform engine"
              >
                <span>
                  <Settings size={12} className={styles.inlineIcon} />
                  Change Base Engine
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.engineOverrideBox}>
            <div className={styles.engineOverrideHeader}>
              <span className={styles.engineOverrideNotice}>SELECT PLATFORM FOUNDATION OVERRIDE</span>
              <button
                type="button"
                className={styles.engineCollapseBtn}
                onClick={() => setShowEngineOverride(false)}
              >
                Done Editing
              </button>
            </div>
            <div className={styles.checkboxGrid}>
              {engines.map((e) => {
                const isSelected = formData.selectedBaseEngineId === e.id;
                const isPopoverOpen = activePopoverId === e.id;
                return (
                  <div
                    key={e.id}
                    className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''}`}
                    onClick={() => onEngineSelect(e.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="baseEngine"
                      checked={isSelected}
                      onChange={() => onEngineSelect(e.id)}
                    />
                    <div className={styles.engineCardInner}>
                      <div className={styles.engineCardHeader}>
                        <div className={styles.engineCardTitleRow}>
                          <span className={styles.engineCardTitle}>{`${e.title} (${e.tier})`}</span>
                          <button
                            type="button"
                            onClick={(ev) => togglePopover(ev, e.id)}
                            className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                            title="Click to view Technical Engineering Specs"
                            aria-label="View Technical Engineering Specs"
                          >
                            <Info size={12} />
                          </button>
                        </div>
                        <span className={styles.priceBadge}>
                          {formatPricePair(e.priceINR, e.priceUSD, currency)}
                        </span>
                      </div>
                      <p className={styles.engineCardDesc}>
                        {e.laymanDescription}
                      </p>

                      {isPopoverOpen && popoverAnchor && (
                        <Portal>
                          <>
                            <div
                              className={styles.popoverOverlay}
                              onClick={() => {
                                setActivePopoverId(null);
                                setPopoverAnchor(null);
                              }}
                            />
                            <div
                              className={styles.popoverPortal}
                              style={{ left: popoverAnchor.x, top: popoverAnchor.y }}
                              onClick={(ev) => ev.stopPropagation()}
                            >
                              <div className={`${styles.popoverBox} ${styles.popoverStatic}`}>
                                <div className={styles.popoverHeader}>
                                  <span>
                                    <Wrench size={12} className={styles.inlineIcon} />
                                    TECHNICAL ARCHITECTURE SPECS
                                  </span>
                                  <X
                                    size={12}
                                    className={styles.popoverCloseBtn}
                                    onClick={() => {
                                      setActivePopoverId(null);
                                      setPopoverAnchor(null);
                                    }}
                                  />
                                </div>
                                <p className={styles.popoverTechText}>{e.techSpecs}</p>
                              </div>
                            </div>
                          </>
                        </Portal>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grouped Feature Checkboxes */}
      <div className={styles.field}>
        <label className={styles.label}>
          <Boxes size={14} className={styles.inlineIcon} />
          Select Architecture Add-on Modules (Pure Additive Pricing)
        </label>

        {/* 1-Click Smart Scope Presets */}
        <div className={styles.smartPresetBar}>
          <span className={styles.smartPresetLabel}>
            <Zap size={14} className={styles.inlineIcon} />
            1-Click Scope Presets:
          </span>
          <div className={styles.smartPresetButtons}>
            <button
              type="button"
              className={styles.smartPresetBtn}
              onClick={() => onApplySmartPreset('essential')}
            >
              <Sparkles size={12} className={styles.inlineIcon} />
              Essential MVP
            </button>
            <button
              type="button"
              className={styles.smartPresetBtn}
              onClick={() => onApplySmartPreset('growth')}
            >
              <Rocket size={12} className={styles.inlineIcon} />
              Growth Bundle
            </button>
            <button
              type="button"
              className={styles.smartPresetBtn}
              onClick={() => onApplySmartPreset('ai')}
            >
              <Bot size={12} className={styles.inlineIcon} />
              Full AI Powerhouse
            </button>
          </div>
        </div>

        {FEATURE_CATEGORIES.map((cat) => {
          const categoryFeatures = features.filter((f) => cat.featureIds.includes(f.id));
          if (categoryFeatures.length === 0) return null;
          return (
            <div key={cat.id} className={styles.featureCategoryBlock}>
              <div className={styles.featureCategoryHeader}>
                <h4 className={styles.featureCategoryTitle}>{cat.title}</h4>
                <p className={styles.featureCategoryDesc}>{cat.description}</p>
              </div>
              <div className={styles.checkboxGrid}>
                {categoryFeatures.map((m) => {
                  const isCompulsory = currentArchetype.compulsoryFeatureLabels.includes(m.label);
                  const isLegacyRequired =
                    formData.projectStartType === 'legacy_rebuild' && m.autoIncludeOnLegacy;
                  const isChecked =
                    isCompulsory || isLegacyRequired || formData.selectedFeatures.includes(m.label);
                  const otherSelectedIds = features
                    .filter((f) => formData.selectedFeatures.includes(f.label) && f.id !== m.id)
                    .map((f) => f.id);
                  const isRequiredDependency = new Set(
                    resolveFeatureDependencies(otherSelectedIds, features)
                  ).has(m.id);
                  const dependencyTitle = isRequiredDependency
                    ? (() => {
                        const dependents = features
                          .filter((f) => f.id !== m.id && f.dependsOn?.includes(m.id))
                          .map((f) => f.label)
                          .filter(
                            (label) =>
                              formData.selectedFeatures.includes(label) ||
                              currentArchetype.compulsoryFeatureLabels.includes(label)
                          );
                        return dependents.length
                          ? `Required by selected module${dependents.length > 1 ? 's' : ''}: ${dependents.join(', ')}`
                          : 'This module is required by another selected module';
                      })()
                    : '';
                  const isLocked = isCompulsory || isRequiredDependency || isLegacyRequired;
                  const isPopoverOpen = activePopoverId === m.id;
                  return (
                    <label
                      key={m.id}
                      className={`${styles.checkboxCard} ${isLocked ? styles.lockedCard : ''} ${isChecked ? styles.checkboxCardSelected : ''}`}
                      style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={() => onFeatureToggle(m.label)}
                      />
                      <div className={styles.engineCardInner}>
                        <div className={styles.engineCardHeader}>
                          <div className={styles.engineCardTitleRow}>
                            <span className={styles.engineCardTitle}>{m.label}</span>
                            {isCompulsory ? (
                              <span
                                className={styles.lockedBadge}
                                title={`Required component for ${currentArchetype.shortLabel}`}
                              >
                                <Lock size={10} className={styles.inlineIcon} />
                                REQUIRED
                              </span>
                            ) : isLegacyRequired ? (
                              <span
                                className={styles.lockedBadge}
                                title="Required component for Legacy Refactor scope"
                              >
                                <Lock size={10} className={styles.inlineIcon} />
                                REQUIRED FOR LEGACY REBUILD
                              </span>
                            ) : isRequiredDependency ? (
                              <span className={styles.lockedBadge} title={dependencyTitle}>
                                <Link size={10} className={styles.inlineIcon} />
                                REQUIRED BY SELECTED MODULE
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={(ev) => togglePopover(ev, m.id)}
                              className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                              title="Click to view Technical Engineering Specs"
                              aria-label="View Technical Engineering Specs"
                            >
                              <Info size={12} />
                            </button>
                          </div>
                          <span className={styles.priceBadge}>{`+${priceInCurrency(m.priceINR, m.priceUSD)}`}</span>
                        </div>
                        {dependsOnMap[m.id] &&
                          dependsOnMap[m.id].some((parentLabel) =>
                            formData.selectedFeatures.includes(parentLabel)
                          ) && (
                            <span
                              className={styles.transitiveBadge}
                              title={`Auto-included as prerequisite for ${dependsOnMap[m.id]
                                .filter((p) => formData.selectedFeatures.includes(p))
                                .join(', ')}`}
                            >
                              <Zap size={10} className={styles.inlineIcon} />
                              Required by{' '}
                              {dependsOnMap[m.id].filter((p) => formData.selectedFeatures.includes(p))[0]}
                            </span>
                          )}
                        <p className={styles.engineCardDesc}>
                          {m.laymanDescription}
                        </p>

                        {lockedHintId === m.id && (
                          <div className={styles.lockedNotice}>
                            {isCompulsory
                              ? `Required baseline module for ${currentArchetype.shortLabel}`
                              : isLegacyRequired
                              ? 'Required component for Legacy Refactor scope (switch to Greenfield in Step 1 to remove)'
                              : dependencyTitle || 'Required dependency for another active module'}
                          </div>
                        )}

                        {isPopoverOpen && popoverAnchor && (
                          <Portal>
                            <>
                              <div
                                className={styles.popoverOverlay}
                                onClick={() => {
                                  setActivePopoverId(null);
                                  setPopoverAnchor(null);
                                }}
                              />
                              <div
                                className={styles.popoverPortal}
                                style={{ left: popoverAnchor.x, top: popoverAnchor.y }}
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                <div className={`${styles.popoverBox} ${styles.popoverStatic}`}>
                                  <div className={styles.popoverHeader}>
                                    <span>
                                      <Wrench size={12} className={styles.inlineIcon} />
                                      TECHNICAL ARCHITECTURE SPECS
                                    </span>
                                    <X
                                      size={12}
                                      className={styles.popoverCloseBtn}
                                      onClick={() => {
                                        setActivePopoverId(null);
                                        setPopoverAnchor(null);
                                      }}
                                    />
                                  </div>
                                  <p className={styles.popoverTechText}>{m.techSpecs}</p>
                                </div>
                              </div>
                            </>
                          </Portal>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
