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
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import MagneticButton from '@/components/ui/MagneticButton';
import NumberFlow from '@number-flow/react';
import { toast } from 'sonner';
import type { FeatureItem } from '@/data/resume';
import { formatMoney, type Currency, type QuoteResult, type PromoDiscountInfo } from '@/lib/pricing';
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
}: ArchitectureCartDrawerProps) {
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');

  // Close drawer on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Volume bundle progress meter calculation
  const featureCount = quote.features.length;
  const bundlePercent = quote.bundleDiscountPercent;
  let progressWidth = 0;
  let meterHint = '';

  if (featureCount === 0) {
    progressWidth = 10;
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
    toast(`Removed ${feature.label}`, {
      action: {
        label: 'Undo',
        onClick: () => onAddFeature(feature.id),
      },
      duration: 5000,
    });
  };

  if (!isOpen) return null;

  const totalItems = (quote.engine ? 1 : 0) + quote.features.length + (quote.brandAsset && quote.brandAsset.priceINR > 0 ? 1 : 0);

  return (
    <Portal>
      <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <ShoppingCart size={20} className={styles.cartIcon} />
              <h2 id="cart-title" className={styles.title}>Architecture Cart</h2>
              <span className={styles.itemBadge}>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close cart drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className={styles.content}>
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
              <div className={styles.meterBarTrack}>
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
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleRemoveFeatureWithToast(f)}
                            title={`Remove ${f.label}`}
                            aria-label={`Remove ${f.label}`}
                          >
                            <Trash2 size={15} />
                          </button>
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
                        : `-${formatMoney(promoCode.discountValue, currency)}`}
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
              {promoError ? <div className={styles.promoError}>{promoError}</div> : null}
            </div>
          </div>

          {/* Footer & CPQ Math */}
          <div className={styles.footer}>
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
                  className={styles.secondaryActionBtn}
                  onClick={onExportPdf}
                  title="Export PDF Brief"
                >
                  <Download size={15} />
                  <span>PDF Brief</span>
                </button>
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
