import React from 'react';
import { Palette } from 'lucide-react';
import type { BrandAssetOption } from '@/data/resume';
import { formatPricePair, type Currency } from '@/lib/pricing';
import styles from './IntakeForm.module.css';

interface StepBrandKitProps {
  brandAssets: BrandAssetOption[];
  selectedBrandAssetId: string;
  currency: Currency;
  onSelectBrandAsset: (asset: BrandAssetOption) => void;
  stepHeadingRef?: React.RefObject<HTMLDivElement | null>;
}

export function StepBrandKit({
  brandAssets,
  selectedBrandAssetId,
  currency,
  onSelectBrandAsset,
  stepHeadingRef,
}: StepBrandKitProps) {
  const cardRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const focusedIndex = brandAssets.findIndex((b) => b.id === selectedBrandAssetId);

  const focusCard = (index: number) => {
    const clamped = Math.max(0, Math.min(index, brandAssets.length - 1));
    cardRefs.current[clamped]?.focus();
  };

  return (
    <div className={styles.formStep}>
      <div className={styles.groupTitle} ref={stepHeadingRef} tabIndex={-1}>
        <Palette size={18} />
        <span>STEP 3: BRAND ASSETS &amp; CONTENT READINESS</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          <Palette size={14} className={styles.inlineIcon} />
          Design System &amp; Content Readiness Tier
        </label>
        <p className={styles.fieldHint}>
          Select your current design and brand collateral status. This determines whether design system assets or copywriting support is added to your baseline build.
        </p>
        <div className={styles.checkboxGrid} role="radiogroup" aria-label="Design & Content Readiness">
          {brandAssets.map((b, idx) => {
            const isSelected = selectedBrandAssetId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                ref={(el) => { cardRefs.current[idx] = el; }}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected || focusedIndex === -1 ? 0 : -1}
                className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''} ${styles.cardSelectable}`}
                onClick={() => onSelectBrandAsset(b)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); focusCard(idx + 1); }
                  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); focusCard(idx - 1); }
                  else if (e.key === 'Home') { e.preventDefault(); focusCard(0); }
                  else if (e.key === 'End') { e.preventDefault(); focusCard(brandAssets.length - 1); }
                }}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>{b.label}</span>
                  <span className={`${styles.itemPrice} ${styles.cardPrice}`}>
                    {b.priceINR > 0 ? `+${formatPricePair(b.priceINR, b.priceUSD, currency)}` : 'Included in Base Engine'}
                  </span>
                </div>
                <p className={styles.cardDesc}>{b.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
