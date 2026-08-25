import React from 'react';
import { Zap, ShoppingCart, Sparkles } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import type { BaseEngineItem } from '@/data/resume';
import type { Currency, PromoDiscountInfo } from '@/lib/pricing';
import styles from './IntakeForm.module.css';

interface StickyPriceBarProps {
  selectedEngine: BaseEngineItem;
  totalCost: {
    totalINR: number;
    totalUSD: number;
    featuresINR: number;
    featuresUSD: number;
    brandPriceINR: number;
    brandPriceUSD: number;
    bundleDiscountPercent?: number;
    promoDiscount?: PromoDiscountInfo | null;
  };
  currency: Currency;
  priceInCurrency: (inr: number, usd: number) => string;
  showMobileFormula: boolean;
  setShowMobileFormula: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenCart?: () => void;
  itemCount?: number;
}

export function StickyPriceBar({
  selectedEngine,
  totalCost,
  currency,
  priceInCurrency,
  showMobileFormula,
  setShowMobileFormula,
  onOpenCart,
  itemCount,
}: StickyPriceBarProps) {
  const hasDiscount = (totalCost.bundleDiscountPercent && totalCost.bundleDiscountPercent > 0) || totalCost.promoDiscount;

  return (
    <div className={styles.stickyBar} style={{ marginTop: '1.5rem' }}>
      <div className={styles.stickyLeft}>
        <div className={styles.stickyTitleRow}>
          <span className={styles.stickyTitle}>
            <Zap size={14} className={styles.inlineIcon} />
            Live Pure Additive Arithmetic Formula
          </span>
          {hasDiscount ? (
            <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <Sparkles size={11} />
              {totalCost.bundleDiscountPercent && totalCost.bundleDiscountPercent > 0 ? `${totalCost.bundleDiscountPercent}% Bundle Active` : 'Promo Active'}
            </span>
          ) : null}
          <button
            type="button"
            className={styles.mobileFormulaToggle}
            onClick={() => setShowMobileFormula((prev) => !prev)}
          >
            {showMobileFormula ? 'Hide Formula' : 'Show Formula'}
          </button>
        </div>
        <span className={`${styles.stickyBreakdown} ${showMobileFormula ? styles.stickyBreakdownMobileShow : ''}`}>
          {`Base (${selectedEngine.title}: ${priceInCurrency(selectedEngine.priceINR, selectedEngine.priceUSD)})` +
            ` + Add-ons (${priceInCurrency(totalCost.featuresINR, totalCost.featuresUSD)})` +
            (totalCost.brandPriceINR > 0
              ? ` + Brand Collateral (${priceInCurrency(totalCost.brandPriceINR, totalCost.brandPriceUSD)})`
              : '')}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <div className={styles.stickyTotal} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>Estimated Total: </span>
          {currency === 'INR' ? (
            <>
              <NumberFlow value={totalCost.totalINR} locales="en-IN" format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} />
              <span style={{ opacity: 0.55, margin: '0 2px' }}>/</span>
              <span style={{ opacity: 0.72, fontSize: '0.92em' }}>
                <NumberFlow value={totalCost.totalUSD} locales="en-US" format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} />
              </span>
            </>
          ) : (
            <>
              <NumberFlow value={totalCost.totalUSD} locales="en-US" format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }} />
              <span style={{ opacity: 0.55, margin: '0 2px' }}>/</span>
              <span style={{ opacity: 0.72, fontSize: '0.92em' }}>
                <NumberFlow value={totalCost.totalINR} locales="en-IN" format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} />
              </span>
            </>
          )}
        </div>
        {onOpenCart ? (
          <button
            type="button"
            onClick={onOpenCart}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 10px rgba(37, 99, 235, 0.3)',
              transition: 'background 0.15s ease',
            }}
          >
            <ShoppingCart size={15} />
            <span>Architecture Cart</span>
            {itemCount !== undefined ? (
              <span style={{ background: 'rgba(255, 255, 255, 0.25)', borderRadius: '9999px', padding: '0.1rem 0.4rem', fontSize: '0.72rem' }}>
                {itemCount}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}

