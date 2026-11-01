import React from 'react';
import { Palette, Check } from 'lucide-react';
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

const BRAND_DELIVERABLES: Record<string, { chips: string[]; tag: string }> = {
  ready: {
    tag: 'Included in Base',
    chips: ['Client Figma Spec Ingestion', '100% Component Parity', 'Zero Scope Bloat'],
  },
  copy: {
    tag: 'Copywriting Add-On',
    chips: ['Technical Storytelling', 'Conversion Copy', 'Up to 5 Pages Copy', '1 Revision Round'],
  },
  scratch: {
    tag: 'Full Brand & Content',
    chips: ['3 Logo Concepts', 'Color & Type System', 'Component Guidelines', 'Copywriting & SEO', '2 Revision Rounds'],
  },
};

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
            const deliverableConfig = BRAND_DELIVERABLES[b.id] || {
              tag: b.priceINR > 0 ? 'Add-on Tier' : 'Included in Base',
              chips: ['Component System', 'Layout Specs'],
            };

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
                  <div className={styles.brandTitleCol}>
                    <span className={styles.cardTitle}>{b.label}</span>
                    <span className={b.priceINR > 0 ? styles.brandScopeTagAddon : styles.brandScopeTagIncluded}>
                      {deliverableConfig.tag}
                    </span>
                  </div>
                  <span className={`${styles.itemPrice} ${styles.cardPrice}`}>
                    {b.priceINR > 0 ? `+${formatPricePair(b.priceINR, b.priceUSD, currency)}` : 'Included in Base'}
                  </span>
                </div>
                <p className={styles.cardDesc}>{b.description}</p>
                <div className={styles.brandDeliverablesRow}>
                  {deliverableConfig.chips.map((chip, cIdx) => (
                    <span key={cIdx} className={styles.brandDeliverableChip}>
                      <Check size={11} className={styles.inlineIcon} />
                      {chip}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
