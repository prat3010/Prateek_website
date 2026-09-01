'use client';

import React, { useState, useMemo } from 'react';


import { X, Sparkles, Sliders, CheckCircle2 } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { DependencyCascadeModal } from '@/components/Intake/DependencyCascadeModal';
import intakeDefaults from '@/data/intakeQuestionnaireDefaults.json';
import {
  calcQuote,
  findDependentFeatures,
  resolveFeatureDependencies,
  formatPricePair,
  type Currency,
  type PromoDiscountInfo,
} from '@/lib/pricing';
import type { FeatureItem } from '@/data/resume';
import type { ClientScope } from '@/lib/clientOrder';
import NumberFlow from '@number-flow/react';
import styles from '@/app/dashboard/dashboard.module.css';

interface ScopeEditorModalProps {
  scope: ClientScope | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft: (updatedScope: ClientScope) => Promise<void>;
  onSubmitChangeOrder: (
    scope: ClientScope,
    addedFeatures: string[],
    removedFeatures: string[],
    deltaINR: number,
    deltaUSD: number
  ) => Promise<void>;
  isSubmittingChangeOrder: boolean;
}

function getInitialEngine(scope: ClientScope): string {
  const matched =
    intakeDefaults.engines.find(
      (e) =>
        e.title.toLowerCase() === scope.base_engine.toLowerCase() ||
        scope.base_engine.toLowerCase().includes(e.title.toLowerCase())
    ) || intakeDefaults.engines[1];
  return matched.id;
}

function getInitialFeatures(scope: ClientScope): string[] {
  return intakeDefaults.features
    .filter((f) =>
      scope.features.some(
        (featStr) =>
          featStr.toLowerCase().includes(f.label.toLowerCase()) ||
          f.label.toLowerCase().includes(featStr.toLowerCase())
      )
    )
    .map((f) => f.id);
}

function getInitialBrand(scope: ClientScope): string {
  const matched =
    intakeDefaults.brandAssets.find((b) =>
      b.label.toLowerCase().includes((scope.brand_asset || '').toLowerCase())
    ) || intakeDefaults.brandAssets[0];
  return matched.id;
}

function getInitialMaintenance(scope: ClientScope): string {
  const matched =
    intakeDefaults.maintenancePlans.find((m) =>
      m.name.toLowerCase().includes((scope.maintenance_plan || '').toLowerCase())
    ) || intakeDefaults.maintenancePlans[0];
  return matched.id;
}

export function ScopeEditorModal(props: ScopeEditorModalProps) {
  if (!props.isOpen || !props.scope) return null;
  return <ScopeEditorModalInner key={props.scope.id} {...props} scope={props.scope} />;
}

function ScopeEditorModalInner({
  scope,
  onClose,
  onSaveDraft,
  onSubmitChangeOrder,
  isSubmittingChangeOrder,
}: ScopeEditorModalProps & { scope: ClientScope }) {
  const [custEngineId, setCustEngineId] = useState<string>(() => getInitialEngine(scope));
  const [custFeatureIds, setCustFeatureIds] = useState<string[]>(() => getInitialFeatures(scope));
  const custBrandId = getInitialBrand(scope);
  const custMaintenanceId = getInitialMaintenance(scope);

  const [custCurrency, setCustCurrency] = useState<Currency>(() => (scope.currency === 'USD' ? 'USD' : 'INR') as Currency);
  const [custPromoCode, setCustPromoCode] = useState<PromoDiscountInfo | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  // Dependency Cascade Modal State
  const [cascadeTarget, setCascadeTarget] = useState<FeatureItem | null>(null);
  const [cascadeDependents, setCascadeDependents] = useState<FeatureItem[]>([]);

  const custQuote = useMemo(() => {
    return calcQuote(
      intakeDefaults.engines,
      intakeDefaults.features,
      intakeDefaults.brandAssets,
      intakeDefaults.maintenancePlans,
      {
        engineId: custEngineId,
        featureIds: custFeatureIds,
        brandAssetId: custBrandId,
        maintenancePlanId: custMaintenanceId,
        promoCode: custPromoCode,
      },
      custCurrency
    );
  }, [custEngineId, custFeatureIds, custBrandId, custMaintenanceId, custPromoCode, custCurrency]);


  const handleToggleCustomizerFeature = (featureId: string) => {
    if (custFeatureIds.includes(featureId)) {
      const dependents = findDependentFeatures(featureId, custFeatureIds, intakeDefaults.features);
      if (dependents.length > 0) {
        const target = intakeDefaults.features.find((f) => f.id === featureId) || null;
        setCascadeTarget(target);
        setCascadeDependents(dependents);
        return;
      }
      setCustFeatureIds((prev) => prev.filter((id) => id !== featureId));
    } else {
      const resolvedExtra = resolveFeatureDependencies([featureId], intakeDefaults.features);
      setCustFeatureIds((prev) => Array.from(new Set([...prev, featureId, ...resolvedExtra])));
    }
  };

  const handleConfirmCascadeRemove = () => {
    if (!cascadeTarget) return;
    const dependentIds = new Set(cascadeDependents.map((d) => d.id));
    dependentIds.add(cascadeTarget.id);
    setCustFeatureIds((prev) => prev.filter((id) => !dependentIds.has(id)));
    setCascadeTarget(null);
    setCascadeDependents([]);
  };

  const handleValidateCustomizerPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const res = await fetch('/api/scoping/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoInput.trim(),
          currency: custCurrency,
        }),
      });
      const data = await res.json();
      if (data.valid && data.promo) {
        setCustPromoCode({
          code: data.promo.code,
          discountType: data.promo.discount_type || 'percentage',
          discountValue: Number(data.promo.discount_value) || 0,
          discountAmountINR: Number(data.promo.discount_amount_inr) || 0,
          discountAmountUSD: Number(data.promo.discount_amount_usd) || 0,
        });
        setPromoMessage(`✅ Promo '${data.promo.code}' applied!`);
      } else {
        setPromoMessage(`❌ ${data.error || 'Invalid promo code'}`);
      }
    } catch {
      setPromoMessage('❌ Failed to validate promo code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSave = async () => {
    if (!scope.deposit_paid) {
      const updatedScope: ClientScope = {
        ...scope,
        base_engine: custQuote.engine?.title || scope.base_engine,
        features: custQuote.features.map((f) => f.label),
        brand_asset: custQuote.brandAsset?.label || scope.brand_asset,
        maintenance_plan: custQuote.maintenancePlan?.name || scope.maintenance_plan,
        total_cost_inr: custQuote.netTotalINR,
        total_cost_usd: custQuote.netTotalUSD,
        currency: custCurrency,
        metadata: {
          ...scope.metadata,
          engineId: custEngineId,
          featureIds: custFeatureIds,
        },
      };
      await onSaveDraft(updatedScope);
      onClose();
    } else {
      const baselineFeatureIds = intakeDefaults.features
        .filter((f) =>
          scope.features.some(
            (featStr) =>
              featStr.toLowerCase().includes(f.label.toLowerCase()) ||
              f.label.toLowerCase().includes(featStr.toLowerCase())
          )
        )
        .map((f) => f.id);

      const addedIds = custFeatureIds.filter((id) => !baselineFeatureIds.includes(id));
      const removedIds = baselineFeatureIds.filter((id) => !custFeatureIds.includes(id));

      const deltaINR = Math.max(0, custQuote.netTotalINR - scope.total_cost_inr);
      const deltaUSD = Math.max(0, custQuote.netTotalUSD - scope.total_cost_usd);

      await onSubmitChangeOrder(
        scope,
        addedIds.map((id) => intakeDefaults.features.find((f) => f.id === id)?.label || id),
        removedIds.map((id) => intakeDefaults.features.find((f) => f.id === id)?.label || id),
        deltaINR,
        deltaUSD
      );
    }
  };

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
          className={`${styles.modalCard} ${styles.customizerModalCard}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTitle}>
              <Sliders size={20} className={styles.modalIcon} />
              <div>
                <h3>
                  {scope.deposit_paid ? 'Submit Scope Change Order' : 'Customize Project Architecture'}
                </h3>
                <p className={styles.modalSubtitle}>
                  {scope.deposit_paid
                    ? 'Modify features on your active sprint. Scope deltas calculate real-time Change Order pricing.'
                    : 'Modify base engine, feature packages, brand assets, and maintenance plans.'}
                </p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.customizerBody}>
            {/* 1. Base Engine */}
            <div className={styles.customizerSection}>
              <h4 className={styles.customizerSectionTitle}>1. Base Architecture Engine</h4>
              <div className={styles.engineGrid}>
                {intakeDefaults.engines.map((eng) => {
                  const isSelected = custEngineId === eng.id;
                  return (
                    <button
                      key={eng.id}
                      type="button"
                      disabled={scope.deposit_paid}
                      className={`${styles.engineOptionCard} ${isSelected ? styles.engineOptionCardActive : ''}`}
                      onClick={() => setCustEngineId(eng.id)}
                    >
                      <div className={styles.engineOptionHeader}>
                        <span className={styles.engineOptionTitle}>{eng.title}</span>
                        <span className={styles.engineOptionPrice}>
                          {formatPricePair(eng.priceINR, eng.priceUSD, custCurrency)}
                        </span>
                      </div>
                      <p className={styles.engineOptionDesc}>{eng.laymanDescription}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Features */}
            <div className={styles.customizerSection}>
              <div className={styles.featuresSectionHeader}>
                <h4 className={styles.customizerSectionTitle}>2. Architecture Feature Modules</h4>
                <div className={styles.currencyToggle}>
                  <button
                    type="button"
                    className={`${styles.currencyBtn} ${custCurrency === 'INR' ? styles.currencyBtnActive : ''}`}
                    onClick={() => setCustCurrency('INR')}
                  >
                    ₹ INR
                  </button>
                  <button
                    type="button"
                    className={`${styles.currencyBtn} ${custCurrency === 'USD' ? styles.currencyBtnActive : ''}`}
                    onClick={() => setCustCurrency('USD')}
                  >
                    $ USD
                  </button>
                </div>
              </div>

              <div className={styles.featuresListGrid}>
                {intakeDefaults.features.map((feat) => {
                  const isChecked = custFeatureIds.includes(feat.id);
                  return (
                    <label
                      key={feat.id}
                      className={`${styles.featureItemRow} ${isChecked ? styles.featureItemRowActive : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCustomizerFeature(feat.id)}
                        className={styles.featureCheckbox}
                      />
                      <div className={styles.featureInfo}>
                        <div className={styles.featureLabelRow}>
                          <span className={styles.featureLabel}>{feat.label}</span>
                        </div>
                        <p className={styles.featureDescription}>{feat.laymanDescription}</p>
                      </div>
                      <span className={styles.featureItemPrice}>
                        +{formatPricePair(feat.priceINR, feat.priceUSD, custCurrency)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Promo Code Engine */}
            <div className={styles.customizerSection}>
              <h4 className={styles.customizerSectionTitle}>3. Promo & Referral Code</h4>
              <div className={styles.promoInputRow}>
                <input
                  type="text"
                  placeholder="e.g. VIP20 or FOUNDER"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className={styles.promoInput}
                />
                <button
                  type="button"
                  onClick={handleValidateCustomizerPromo}
                  disabled={promoLoading || !promoInput.trim()}
                  className={styles.promoApplyBtn}
                >
                  {promoLoading ? 'Checking...' : 'Apply Code'}
                </button>
              </div>
              {promoMessage && <p className={styles.promoFeedbackText}>{promoMessage}</p>}
            </div>

            {/* 4. Live Quote Summary */}
            <div className={styles.quoteSummaryCard}>
              <div className={styles.quoteSummaryRow}>
                <span>Subtotal</span>
                <span>
                  {custCurrency === 'INR' ? '₹' : '$'}
                  <NumberFlow
                    value={custCurrency === 'INR' ? custQuote.grossTotalINR : custQuote.grossTotalUSD}
                  />
                </span>
              </div>
              {custQuote.bundleDiscountPercent > 0 && (
                <div className={`${styles.quoteSummaryRow} ${styles.discountText}`}>
                  <span>Bundle Discount ({custQuote.bundleDiscountPercent}%)</span>
                  <span>
                    -{custCurrency === 'INR' ? '₹' : '$'}
                    <NumberFlow
                      value={
                        custCurrency === 'INR'
                          ? custQuote.bundleDiscountAmountINR
                          : custQuote.bundleDiscountAmountUSD
                      }
                    />
                  </span>
                </div>
              )}
              {custQuote.promoDiscountAmountINR > 0 && (
                <div className={`${styles.quoteSummaryRow} ${styles.discountText}`}>
                  <span>Promo Discount ({custPromoCode?.code})</span>
                  <span>
                    -{custCurrency === 'INR' ? '₹' : '$'}
                    <NumberFlow
                      value={
                        custCurrency === 'INR'
                          ? custQuote.promoDiscountAmountINR
                          : custQuote.promoDiscountAmountUSD
                      }
                    />
                  </span>
                </div>
              )}
              <div className={`${styles.quoteSummaryRow} ${styles.quoteSummaryTotal}`}>
                <span>Total Scope Investment</span>
                <span className={styles.totalValue}>
                  {custCurrency === 'INR' ? '₹' : '$'}
                  <NumberFlow
                    value={custCurrency === 'INR' ? custQuote.netTotalINR : custQuote.netTotalUSD}
                  />
                </span>
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              className={styles.confirmBtn}
              onClick={handleSave}
              disabled={isSubmittingChangeOrder}
            >
              {isSubmittingChangeOrder ? (
                'Submitting Change Order...'
              ) : scope.deposit_paid ? (
                <>
                  <Sparkles size={16} /> Submit Phase 2 Change Order
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} /> Save Updated Architecture
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {cascadeTarget && (
        <DependencyCascadeModal
          isOpen={Boolean(cascadeTarget)}
          targetFeature={cascadeTarget}
          dependentFeatures={cascadeDependents}
          currency={custCurrency}
          onCancel={() => {
            setCascadeTarget(null);
            setCascadeDependents([]);
          }}
          onConfirmRemoveAll={handleConfirmCascadeRemove}
        />
      )}
    </Portal>
  );
}
