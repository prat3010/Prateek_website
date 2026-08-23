import React from 'react';
import { Zap } from 'lucide-react';
import NumberFlow from '@number-flow/react';
import type { BaseEngineItem } from '@/data/resume';
import type { Currency } from '@/lib/pricing';
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
  };
  currency: Currency;
  priceInCurrency: (inr: number, usd: number) => string;
  showMobileFormula: boolean;
  setShowMobileFormula: React.Dispatch<React.SetStateAction<boolean>>;
}

export function StickyPriceBar({
  selectedEngine,
  totalCost,
  currency,
  priceInCurrency,
  showMobileFormula,
  setShowMobileFormula,
}: StickyPriceBarProps) {
  return (
    <div className={styles.stickyBar} style={{ marginTop: '1.5rem' }}>
      <div className={styles.stickyLeft}>
        <div className={styles.stickyTitleRow}>
          <span className={styles.stickyTitle}>
            <Zap size={14} className={styles.inlineIcon} />
            Live Pure Additive Arithmetic Formula
          </span>
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
    </div>
  );
}
