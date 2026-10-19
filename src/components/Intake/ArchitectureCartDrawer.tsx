'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Download,
  Tag,
  Clock,
  AlertCircle,
  Lock,
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import MagneticButton from '@/components/ui/MagneticButton';
import NumberFlow from '@number-flow/react';
import { toast } from 'sonner';
import { useLenis } from 'lenis/react';
import type { FeatureItem } from '@/data/resume';
import {
  formatMoney,
  type Currency,
  type QuoteResult,
  type PromoDiscountInfo,
  estimateScopeTimeline,
  type TimelineEstimateResult,
} from '@/lib/pricing';
import styles from './ArchitectureCartDrawer.module.css';

interface ArchitectureCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteResult;
  currency: Currency;
  allFeatures: FeatureItem[];
  onRemoveFeature: (featureId: string) => void;
  onAddFeature: (featureId: string) => void;
  onSwitchEngine: () => void;
  promoCode: PromoDiscountInfo | null;
  onApplyPromo: (code: string) => Promise<boolean>;
  onRemovePromo: () => void;
  onProceed: () => void;
  onExportPdf: () => void;
  isNoir?: boolean;
  lockedFeatureIds?: string[];
  generatingPdf?: boolean;
}

export function ArchitectureCartDrawer({
  isOpen,
  onClose,
  quote,
  currency,
  allFeatures,
  onRemoveFeature,
  onAddFeature,
  onSwitchEngine,
  promoCode,
  onApplyPromo,
  onRemovePromo,
  onProceed,
  onExportPdf,
  lockedFeatureIds = [],
  generatingPdf = false,
}: ArchitectureCartDrawerProps) {
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  const drawerRef = React.useRef<HTMLDivElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = React.useRef<HTMLElement | null>(null);

  // Stable feature IDs key to prevent redundant timeline network re-fetches on currency switches
  const featureIdsKey = useMemo(
    () => quote.features.map((f) => f.id).sort().join(','),
    [quote.features]
  );

  // Milestone 84: ML Sprint Delivery Confidence & Complexity Estimation
  const localTimeline = useMemo(() => {
    return estimateScopeTimeline(
      {
        engineId: quote.engine?.id || 'saas',
        featureIds: quote.features.map((f) => f.id),
        brandAssetId: quote.brandAsset?.id,
        maintenancePlanId: quote.maintenancePlan?.id,
      },
      allFeatures
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- guarded by primitive featureIdsKey to prevent redundant recomputations on currency toggle
  }, [quote.engine?.id, featureIdsKey, quote.brandAsset?.id, quote.maintenancePlan?.id, allFeatures]);

  const [mlTimeline, setMlTimeline] = useState<TimelineEstimateResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/scoping/estimate-timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engineId: quote.engine?.id || 'saas',
        featureIds: quote.features.map((f) => f.id),
        brandAssetId: quote.brandAsset?.id,
        maintenancePlanId: quote.maintenancePlan?.id,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted) {
          if (data && !data.isFallback) {
            setMlTimeline(data);
          } else {
            setMlTimeline(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setMlTimeline(null);
        }
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- guarded by primitive featureIdsKey to prevent redundant network fetches on currency toggle
  }, [quote.engine?.id, featureIdsKey, quote.brandAsset?.id, quote.maintenancePlan?.id]);

  const activeTimeline = mlTimeline || localTimeline;
  const lenis = useLenis();

  // Prevent background scrolling while cart drawer is open and isolate scroll from Lenis
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    lenis?.stop();

    return () => {
      document.body.style.overflow = originalOverflow;
      lenis?.start();
    };
  }, [isOpen, lenis]);

  // Focus trapping and keyboard management (WCAG 2.1 AA)
  useEffect(() => {
    if (!isOpen) return;

    lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      lastActiveElementRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  // Volume bundle progress meter calculation
  const featureCount = quote.features.length;
  const bundlePercent = quote.bundleDiscountPercent;
  let progressWidth = 0;
  let meterHint = '';

  if (featureCount === 0) {
    progressWidth = 0;
    meterHint = 'Add 3 feature modules to unlock the 5% Growth Stack discount!';
  } else if (featureCount < 3) {
    progressWidth = (featureCount / 3) * 50;
    const needed = 3 - featureCount;
    meterHint = `Add ${needed} more feature${needed > 1 ? 's' : ''} to unlock 5% Growth Stack discount!`;
  } else if (featureCount < 6) {
    progressWidth = 50 + ((featureCount - 3) / 3) * 50;
    const needed = 6 - featureCount;
    meterHint = `🎉 5% Growth Stack active! Add ${needed} more for 10% Full Suite discount.`;
  } else {
    progressWidth = 100;
    meterHint = '🔥 Maximum 10% Full Suite volume discount unlocked!';
  }

  // GraphRAG Frequently Built Together Intelligent Upsells
  const upsellRecommendations = useMemo(() => {
    const selectedIds = new Set(quote.features.map((f) => f.id));
    const recs: { feature: FeatureItem; reason: string }[] = [];

    if (selectedIds.has('auth') && !selectedIds.has('admin')) {
      const admin = allFeatures.find((f) => f.id === 'admin');
      if (admin) recs.push({ feature: admin, reason: '92% of SaaS platforms pair User Auth with Role-Based Admin' });
    }

    if (selectedIds.has('payments') && !selectedIds.has('email')) {
      const email = allFeatures.find((f) => f.id === 'email');
      if (email) recs.push({ feature: email, reason: 'Automate instant transactional receipts & customer confirmations' });
    }

    if (selectedIds.has('ai_rag') && !selectedIds.has('ai_agents')) {
      const agents = allFeatures.find((f) => f.id === 'ai_agents');
      if (agents) recs.push({ feature: agents, reason: 'Upgrade knowledge search into autonomous workflow agents' });
    }

    if ((selectedIds.has('commerce') || selectedIds.has('booking')) && !selectedIds.has('crm')) {
      const crm = allFeatures.find((f) => f.id === 'crm');
      if (crm) recs.push({ feature: crm, reason: 'Track high-intent leads and order pipeline in a unified CRM' });
    }

    if (!selectedIds.has('pwa') && quote.engine?.id !== 'standalone_embed') {
      const pwa = allFeatures.find((f) => f.id === 'pwa');
      if (pwa && recs.length < 2) {
        recs.push({ feature: pwa, reason: 'Enable installable offline PWA experience for mobile users' });
      }
    }

    return recs.slice(0, 2);
  }, [quote.features, quote.engine, allFeatures]);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const success = await onApplyPromo(promoInput.trim());
      if (success) {
        setPromoInput('');
        toast.success(`Promo code applied successfully!`);
      } else {
        setPromoError('Invalid or expired promo code.');
      }
    } catch {
      setPromoError('Failed to validate promo code.');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemoveFeatureWithToast = (feature: FeatureItem) => {
    onRemoveFeature(feature.id);
  };

  if (!isOpen) return null;

  const totalItems = (quote.engine ? 1 : 0) + quote.features.length + (quote.brandAsset && quote.brandAsset.priceINR > 0 ? 1 : 0);

  return (
    <Portal>
      <div
        className={styles.backdrop}
        onClick={onClose}
        data-lenis-prevent
      >
        <div
          ref={drawerRef}
          className={styles.drawer}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <ShoppingCart size={20} className={styles.cartIcon} />
              <h2 id="cart-title" className={styles.title}>Architecture Cart</h2>
              <span className={styles.itemBadge}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close cart drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div
            className={styles.content}
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
          >
            {/* Volume Bundle Discount Meter */}
            <div className={styles.bundleMeterCard}>
              <div className={styles.meterHeader}>
                <span className={styles.meterLabel}>
                  <TrendingUp size={14} className={styles.cartIcon} />
                  Volume Bundle Discount Meter
                </span>
                <span className={styles.meterActiveTier}>
                  {bundlePercent > 0 ? `${bundlePercent}% Off Features` : 'Standard CPQ'}
                </span>
              </div>
              <div
                className={styles.meterBarTrack}
                role="progressbar"
                aria-valuenow={Math.round(progressWidth)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Volume Bundle Discount Progress"
              >
                <div className={styles.meterBarFill} style={{ width: `${progressWidth}%` }} />
              </div>
              <div className={styles.meterTicks}>
                <span>1-2 (0%)</span>
                <span>3-5 (5% Growth)</span>
                <span>6+ (10% Suite)</span>
              </div>
              <div className={styles.meterHint}>
                <Sparkles size={13} />
                <span>{meterHint}</span>
              </div>
            </div>

            {/* Base Engine Section */}
            <div>
              <div className={styles.sectionTitle}>
                <span>Core System Engine</span>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchEngine();
                    onClose();
                  }}
                  className={styles.changeEngineBtn}
                >
                  Change Engine
                </button>
              </div>
              {quote.engine ? (
                <div className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <div className={styles.itemTitleRow}>
                      <span className={styles.itemEngineBadge}>{quote.engine.tier}</span>
                      <span className={styles.itemTitle}>{quote.engine.title}</span>
                    </div>
                  </div>
                  <div className={styles.itemPriceArea}>
                    <span className={styles.itemPrice}>{formatMoney(quote.enginePrice, currency)}</span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Selected Feature Modules */}
            <div>
              <div className={styles.sectionTitle}>
                <span>Selected Feature Modules ({quote.features.length})</span>
              </div>
              <div className={styles.itemList}>
                {quote.features.length === 0 ? (
                  <div className={styles.emptyCart}>
                    <p>No add-on modules selected yet.</p>
                  </div>
                ) : (
                  quote.features.map((f) => {
                    const price = currency === 'INR' ? f.priceINR : f.priceUSD;
                    const isLocked = lockedFeatureIds.includes(f.id);
                    return (
                      <div key={f.id} className={styles.itemCard}>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemTitleRow}>
                            <span className={styles.itemTitle}>{f.label}</span>
                          </div>
                          {f.dependsOn && f.dependsOn.length > 0 ? (
                            <span className={styles.itemDepBadge}>
                              Requires: {f.dependsOn.join(', ')}
                            </span>
                          ) : null}
                        </div>
                        <div className={styles.itemPriceArea}>
                          <span className={styles.itemPrice}>{formatMoney(price, currency)}</span>
                          {isLocked ? (
                            <span
                              className={styles.lockedBadge}
                              title="Required by selected goal archetype"
                              aria-label="Required by selected goal archetype"
                            >
                              <Lock size={15} />
                            </span>
                          ) : (
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              onClick={() => handleRemoveFeatureWithToast(f)}
                              title={`Remove ${f.label}`}
                              aria-label={`Remove ${f.label}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Brand Collateral & Cloud Care */}
            {quote.brandAsset && quote.brandAsset.priceINR > 0 ? (
              <div>
                <div className={styles.sectionTitle}>
                  <span>Brand Collateral</span>
                </div>
                <div className={styles.itemCard}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{quote.brandAsset.label}</span>
                  </div>
                  <div className={styles.itemPriceArea}>
                    <span className={styles.itemPrice}>{formatMoney(quote.brandPrice, currency)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* GraphRAG Frequently Built Together Upsells */}
            {upsellRecommendations.length > 0 ? (
              <div className={styles.upsellSection}>
                <div className={styles.upsellTitle}>
                  <Sparkles size={15} />
                  <span>GraphRAG Intelligent Upsells (Frequently Built Together)</span>
                </div>
                <div className={styles.upsellGrid}>
                  {upsellRecommendations.map(({ feature, reason }) => {
                    const price = currency === 'INR' ? feature.priceINR : feature.priceUSD;
                    return (
                      <div key={feature.id} className={styles.upsellCard}>
                        <div className={styles.upsellInfo}>
                          <div className={styles.upsellName}>{feature.label}</div>
                          <div className={styles.upsellReason}>{reason}</div>
                        </div>
                        <button
                          type="button"
                          className={styles.upsellAddBtn}
                          aria-label={`+ Add ${feature.label} (${formatMoney(price, currency)})`}
                          onClick={() => {
                            onAddFeature(feature.id);
                            toast.success(`Added ${feature.label} (+${formatMoney(price, currency)})`);
                          }}
                        >
                          + Add {formatMoney(price, currency)}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Promo Code Box */}
            <div className={styles.promoSection}>
              <div className={styles.sectionTitle}>
                <span>Promo Code / Partner Referral</span>
              </div>
              {promoCode ? (
                <div className={styles.promoBadgeActive}>
                  <div className={styles.promoBadgeText}>
                    <Tag size={14} />
                    <span>
                      {promoCode.code} applied (
                      {promoCode.discountType === 'percentage'
                        ? `-${promoCode.discountValue}%`
                        : `-${formatMoney(currency === 'INR' ? promoCode.discountAmountINR : promoCode.discountAmountUSD, currency)}`}
                      )
                    </span>
                  </div>
                  <button type="button" className={styles.promoRemoveBtn} onClick={onRemovePromo}>
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className={styles.promoForm}>
                  <input
                    type="text"
                    className={styles.promoInput}
                    aria-label="Promo code or partner referral"
                    placeholder="ENTER PROMO CODE (e.g. PRATEEQ10)"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoError('');
                    }}
                  />
                  <button
                    type="submit"
                    className={styles.promoApplyBtn}
                    disabled={promoLoading || !promoInput.trim()}
                  >
                    {promoLoading ? 'Checking...' : 'Apply'}
                  </button>
                </form>
              )}
              {promoError ? <div className={styles.promoError} role="alert">{promoError}</div> : null}
            </div>

            {/* Milestone 84: ML Sprint Delivery Confidence & Complexity Meter */}
            <div className={styles.sprintMeterCard}>
              <div className={styles.sprintHeader}>
                <div className={styles.sprintTitle}>
                  <Clock size={15} />
                  <span>Sprint Effort & Delivery Timeline</span>
                </div>
                <span className={styles.sprintConfidenceBadge}>
                  {activeTimeline.isFallback ? 'Deterministic Model' : 'ML Gradient Boosted (P50/P90)'}
                </span>
              </div>

              <div className={styles.sprintStatsGrid}>
                <div className={styles.sprintStatItem}>
                  <span className={styles.sprintStatLabel}>Estimated Sprint Hours</span>
                  <span className={styles.sprintStatValue}>
                    {activeTimeline.hoursP50}h <span className={styles.sprintP90}>({activeTimeline.hoursP90}h buffer)</span>
                  </span>
                </div>

                <div className={styles.sprintStatItem}>
                  <span className={styles.sprintStatLabel}>Delivery Turnaround</span>
                  <span className={styles.sprintStatValue}>
                    {activeTimeline.calendarDaysMin}–{activeTimeline.calendarDaysMax} Days
                  </span>
                </div>

                <div className={styles.sprintStatItem}>
                  <span className={styles.sprintStatLabel}>Architecture Complexity</span>
                  <span className={styles.sprintStatValue}>
                    <span className={styles.complexityScore}>{activeTimeline.complexityIndex.toFixed(1)}</span> / 5.0
                  </span>
                </div>
              </div>

              {activeTimeline.riskFactors && activeTimeline.riskFactors.length > 0 ? (
                <div className={styles.sprintRiskArea}>
                  {activeTimeline.riskFactors.map((rf, idx) => (
                    <div key={idx} className={styles.sprintRiskItem}>
                      <AlertCircle size={12} className={styles.sprintRiskIcon} />
                      <span>{rf}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer & CPQ Math */}
          <div
            className={styles.footer}
            data-lenis-prevent
            data-lenis-prevent-wheel
            data-lenis-prevent-touch
          >
            <div className={styles.mathBreakdown}>
              <div className={styles.mathRow}>
                <span>Gross Architecture Subtotal:</span>
                <span>
                  <NumberFlow
                    value={quote.grossTotal}
                    locales={currency === 'INR' ? 'en-IN' : 'en-US'}
                    format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                  />
                </span>
              </div>

              {quote.bundleDiscountPercent > 0 ? (
                <div className={`${styles.mathRow} ${styles.mathDiscount}`}>
                  <span>Volume Bundle Discount ({quote.bundleDiscountPercent}%):</span>
                  <span>
                    -
                    <NumberFlow
                      value={currency === 'INR' ? quote.bundleDiscountAmountINR : quote.bundleDiscountAmountUSD}
                      locales={currency === 'INR' ? 'en-IN' : 'en-US'}
                      format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                    />
                  </span>
                </div>
              ) : null}

              {quote.promoDiscount ? (
                <div className={`${styles.mathRow} ${styles.mathDiscount}`}>
                  <span>Promo Code ({quote.promoDiscount.code}):</span>
                  <span>
                    -
                    <NumberFlow
                      value={currency === 'INR' ? quote.promoDiscountAmountINR : quote.promoDiscountAmountUSD}
                      locales={currency === 'INR' ? 'en-IN' : 'en-US'}
                      format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                    />
                  </span>
                </div>
              ) : null}

              <div className={styles.mathTotalRow}>
                <span>Estimated Net Investment:</span>
                <div>
                  {quote.bundleDiscountPercent > 0 || quote.promoDiscount ? (
                    <span className={styles.strikethroughPrice}>
                      {formatMoney(quote.grossTotal, currency)}
                    </span>
                  ) : null}
                  <span>
                    <NumberFlow
                      value={quote.netTotal}
                      locales={currency === 'INR' ? 'en-IN' : 'en-US'}
                      format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                    />
                  </span>
                </div>
              </div>
            </div>

            {/* 50% Deposit Split */}
            <div className={styles.depositSplitCard}>
              <div className={styles.depositCol}>
                <span className={styles.depositLabel}>50% Upfront Deposit (SOW Sign-off)</span>
                <span className={styles.depositValue}>
                  <NumberFlow
                    value={currency === 'INR' ? quote.depositINR : quote.depositUSD}
                    locales={currency === 'INR' ? 'en-IN' : 'en-US'}
                    format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                  />
                </span>
              </div>
              <div className={styles.depositColRight}>
                <span className={styles.depositLabel}>50% Milestone Balance (Delivery)</span>
                <span className={styles.depositValue}>
                  <NumberFlow
                    value={currency === 'INR' ? quote.balanceINR : quote.balanceUSD}
                    locales={currency === 'INR' ? 'en-IN' : 'en-US'}
                    format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                  />
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionRow}>
              <MagneticButton strength={0.25} style={{ flex: 1 }}>
                <button
                  type="button"
                  className={styles.primaryActionBtn}
                  onClick={() => {
                    onProceed();
                    onClose();
                  }}
                  style={{ width: '100%' }}
                >
                  <span>Proceed to Proposal & SOW</span>
                  <ArrowRight size={16} />
                </button>
              </MagneticButton>
              <MagneticButton strength={0.25}>
                <button
                  type="button"
                  className={`${styles.secondaryActionBtn} ${generatingPdf ? styles.btnDisabled : ''}`}
                  onClick={onExportPdf}
                  disabled={generatingPdf}
                  title={generatingPdf ? 'Generating PDF...' : 'Export PDF Brief'}
                  aria-label={generatingPdf ? 'Generating PDF...' : 'Export PDF Brief'}
                >
                  <Download size={15} />
                  <span>{generatingPdf ? 'Generating...' : 'PDF Brief'}</span>
                </button>
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
