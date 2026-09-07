'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X, Trash2, ShieldCheck, Box } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import MagneticButton from '@/components/ui/MagneticButton';
import type { FeatureItem } from '@/data/resume';
import { formatPricePair, type Currency } from '@/lib/pricing';
import styles from './DependencyCascadeModal.module.css';

export interface DependencyCascadeModalProps {
  isOpen: boolean;
  targetFeature: FeatureItem | null;
  dependentFeatures: FeatureItem[];
  currency: Currency;
  onConfirmRemoveAll: () => void;
  onCancel: () => void;
}

export function DependencyCascadeModal({
  isOpen,
  targetFeature,
  dependentFeatures,
  currency,
  onConfirmRemoveAll,
  onCancel,
}: DependencyCascadeModalProps) {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management and Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Auto-focus cancel button for safe keyboard default
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen || !targetFeature) return null;

  const allAffected = [targetFeature, ...dependentFeatures];
  const totalSavingsINR = allAffected.reduce((sum, f) => sum + (f.priceINR || 0), 0);
  const totalSavingsUSD = allAffected.reduce((sum, f) => sum + (f.priceUSD || 0), 0);
  const formattedSavings = formatPricePair(totalSavingsINR, totalSavingsUSD, currency);

  return (
    <Portal>
      <div
        className={styles.overlay}
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cascade-modal-title"
        aria-describedby="cascade-modal-desc"
      >
        <div
          className={styles.modalContainer}
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.warningIconWrapper}>
                <AlertTriangle size={16} />
              </div>
              <span id="cascade-modal-title" className={styles.title}>
                Dependency Conflict Detected
              </span>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onCancel}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.body}>
            <p id="cascade-modal-desc" className={styles.description}>
              Disabling <span className={styles.targetHighlight}>{targetFeature.label}</span> will automatically affect{' '}
              <strong>{dependentFeatures.length}</strong> dependent module{dependentFeatures.length > 1 ? 's' : ''} configured in your system architecture:
            </p>

            <div className={styles.dependentsList}>
              {dependentFeatures.map((dep) => (
                <div key={dep.id} className={styles.dependentItem}>
                  <div className={styles.dependentLeft}>
                    <Box size={14} className={styles.dependentIcon} />
                    <span className={styles.dependentLabel}>{dep.label}</span>
                  </div>
                  <span className={styles.dependentPrice}>
                    -{formatPricePair(dep.priceINR, dep.priceUSD, currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Savings Callout */}
            <div className={styles.savingsBox}>
              <span className={styles.savingsLabel}>Total Investment Reduction</span>
              <span className={styles.savingsAmount}>Save {formattedSavings}</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button
              type="button"
              ref={cancelBtnRef}
              className={styles.cancelBtn}
              onClick={onCancel}
            >
              <ShieldCheck size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
              Keep {targetFeature.label.split(' ')[0]}
            </button>
            <MagneticButton strength={0.25}>
              <button
                type="button"
                className={styles.removeAllBtn}
                onClick={onConfirmRemoveAll}
              >
                <Trash2 size={14} />
                Remove All {dependentFeatures.length + 1} Modules
              </button>
            </MagneticButton>
          </div>
        </div>
      </div>
    </Portal>
  );
}
