import { Zap, ShoppingCart, Sparkles, Bot } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import type { BaseEngineItem } from '@/data/resume';
import type { Currency, PromoDiscountInfo } from '@/lib/pricing';
import MagneticButton from '@/components/ui/MagneticButton';
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
  onOpenCopilot?: () => void;
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
  onOpenCopilot,
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
            <span className={styles.discountBadge}>
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
        {onOpenCopilot ? (
          <MagneticButton strength={0.25}>
            <button
              type="button"
              onClick={onOpenCopilot}
              className={styles.cartBtn}
              style={{
                borderColor: 'var(--border-accent, rgba(59, 130, 246, 0.4))',
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--color-text, #ffffff)',
              }}
              aria-label="Open Scope Copilot"
            >
              <Bot size={15} style={{ color: '#60a5fa' }} />
              <span>Scope Copilot</span>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
            </button>
          </MagneticButton>
        ) : null}
        {onOpenCart ? (
          <MagneticButton strength={0.25}>
            <button
              type="button"
              onClick={onOpenCart}
              className={styles.cartBtn}
              aria-label="Open Architecture Cart"
            >
              <ShoppingCart size={15} />
              <span>Architecture Cart</span>
              {itemCount !== undefined ? (
                <span className={styles.cartBadge}>
                  {itemCount}
                </span>
              ) : null}
            </button>
          </MagneticButton>
        ) : null}
      </div>
    </div>
  );
}

