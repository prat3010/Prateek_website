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
}

export function StepBrandKit({
  brandAssets,
  selectedBrandAssetId,
  currency,
  onSelectBrandAsset,
}: StepBrandKitProps) {
  return (
    <div className={styles.formStep}>
      <div className={styles.groupTitle}>
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
          {brandAssets.map((b) => {
            const isSelected = selectedBrandAssetId === b.id;
            return (
              <label
                key={b.id}
                className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''} ${styles.cardSelectable}`}
                onClick={() => onSelectBrandAsset(b)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>{b.label}</span>
                  <span className={`${styles.itemPrice} ${styles.cardPrice}`}>
                    {b.priceINR > 0 ? `+${formatPricePair(b.priceINR, b.priceUSD, currency)}` : 'Included in Base Engine'}
                  </span>
                </div>
                <p className={styles.cardDesc}>{b.description}</p>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
