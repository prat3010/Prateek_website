'use client';

import React, { useState } from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';
import type { PlaygroundItem } from '@/data/playgroundItems';
import { calculatePlaygroundPrice } from '@/lib/playgroundCommerce';
import styles from './StickyCommercialBar.module.css';

interface StickyCommercialBarProps {
  item: PlaygroundItem;
  onOpenCheckout: (tierId?: string) => void;
  currency?: 'INR' | 'USD';
  onCurrencyToggle?: () => void;
}

export default function StickyCommercialBar({
  item,
  onOpenCheckout,
  currency = 'INR',
  onCurrencyToggle,
}: StickyCommercialBarProps) {
  const [selectedTierId, setSelectedTierId] = useState<string>(
    item.pricingTiers?.[0]?.id || 'standard'
  );

  const { amount } = calculatePlaygroundPrice(item, selectedTierId, currency);

  return (
    <div className={styles.stickyBar}>
      <div className={styles.stickyContent}>
        {/* Left: Product Info & Meta Badges */}
        <div className={styles.leftInfo}>
          <div>
            <div className={styles.productTitle}>
              <span>{item.title}</span>
              {item.version && (
                <span className={styles.metaBadge}>v{item.version}</span>
              )}
              {item.fileSize && (
                <span className={styles.metaBadge}>{item.fileSize}</span>
              )}
            </div>
            {item.pricingTiers && item.pricingTiers.length > 1 && (
              <div className={styles.tierPills} style={{ marginTop: 4 }}>
                {item.pricingTiers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.tierPillBtn} ${selectedTierId === t.id ? styles.tierPillBtnActive : ''}`}
                    onClick={() => setSelectedTierId(t.id)}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Price & CTA Button */}
        <div className={styles.rightActions}>
          <div className={styles.priceDisplay}>
            <div className={styles.priceAmount}>
              {currency === 'INR' ? `₹${amount.toLocaleString()}` : `$${amount}`}
            </div>
            <div className={styles.priceNote}>
              <span>Zero-Rated LUT Export</span>
              {onCurrencyToggle && (
                <button
                  type="button"
                  onClick={onCurrencyToggle}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    marginLeft: 6,
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    textDecoration: 'underline',
                  }}
                >
                  Switch to {currency === 'INR' ? 'USD' : 'INR'}
                </button>
              )}
            </div>
          </div>

          <MagneticButton strength={0.25}>
            <button
              type="button"
              className={styles.checkoutCtaBtn}
              onClick={() => onOpenCheckout(selectedTierId)}
            >
              <Zap size={15} />
              <span>Instant Guest Checkout</span>
              <ArrowRight size={15} />
            </button>
          </MagneticButton>
        </div>
      </div>
    </div>
  );
}
