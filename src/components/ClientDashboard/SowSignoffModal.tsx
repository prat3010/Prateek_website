'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import Portal from '@/components/ui/Portal';
import { useLenis } from 'lenis/react';
import type { ClientScope } from '@/lib/clientOrder';
import styles from '@/app/dashboard/dashboard.module.css';

interface SowSignoffModalProps {
  scope: ClientScope | null;
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
  onConfirmAndPay: (scope: ClientScope, paymentStructure: '50/50' | '40/30/30') => Promise<void>;
}

export function SowSignoffModal({
  scope,
  isOpen,
  userEmail,
  onClose,
  onConfirmAndPay,
}: SowSignoffModalProps) {
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [paymentStructure, setPaymentStructure] = useState<'50/50' | '40/30/30'>('50/50');
  const [isProcessing, setIsProcessing] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const lenis = useLenis();

  // Prevent background scrolling while modal is open and isolate from Lenis
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

  // Focus trapping and Escape key management (WCAG 2.1 AA)
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

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
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

  if (!isOpen || !scope) return null;

  const handleConfirm = async () => {
    if (!termsAgreed) {
      toast.error('Please confirm that you agree to the commercial scoping specifications & engagement terms.');
      return;
    }
    setIsProcessing(true);
    try {
      await onConfirmAndPay(scope, paymentStructure);
    } finally {
      setIsProcessing(false);
    }
  };

  const depositINR = Math.round(scope.total_cost_inr * (paymentStructure === '50/50' ? 0.5 : 0.4));
  const depositUSD = Math.round(scope.total_cost_usd * (paymentStructure === '50/50' ? 0.5 : 0.4));

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose} role="presentation">
        <div
          ref={modalRef}
          className={styles.modalCard}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sow-signoff-modal-title"
          data-lenis-prevent
        >
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTitle}>
              <Lock size={20} className={styles.modalIcon} />
              <div>
                <h3 id="sow-signoff-modal-title">Digital SOW Proposal Sign-Off & Escrow Deposit</h3>
                <p className={styles.modalSubtitle}>Scope #{scope.scope_code}</p>
              </div>
            </div>
            <button
              ref={closeBtnRef}
              className={styles.closeBtn}
              onClick={onClose}
              type="button"
              aria-label="Close statement of work sign-off modal"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalContent} data-lenis-prevent>
            <div className={styles.signoffScopeSummary}>
              <div className={styles.signoffSummaryRow}>
                <span className={styles.summaryLabel}>Client Signee:</span>
                <span className={styles.summaryValue}>{userEmail}</span>
              </div>
              <div className={styles.signoffSummaryRow}>
                <span className={styles.summaryLabel}>Project / Company:</span>
                <span className={styles.summaryValue}>
                  {scope.company_name || 'My Custom Project'}
                </span>
              </div>
              <div className={styles.signoffSummaryRow}>
                <span className={styles.summaryLabel}>Base Architecture:</span>
                <span className={styles.summaryValue}>{scope.base_engine}</span>
              </div>
              <div className={styles.signoffSummaryRow}>
                <span className={styles.summaryLabel}>Total Commercial Scope:</span>
                <span className={styles.summaryValue}>
                  {scope.currency === 'USD'
                    ? `$${scope.total_cost_usd.toLocaleString('en-US')}`
                    : `₹${scope.total_cost_inr.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            <div className={styles.paymentStructureSection}>
              <h4 className={styles.sectionHeading}>Select Payment Structure</h4>
              <div className={styles.paymentOptionsGrid}>
                <label
                  className={`${styles.paymentOptionCard} ${paymentStructure === '50/50' ? styles.paymentOptionCardActive : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentStructure"
                    value="50/50"
                    checked={paymentStructure === '50/50'}
                    onChange={() => setPaymentStructure('50/50')}
                    className={styles.radioInput}
                  />
                  <div className={styles.paymentOptionInfo}>
                    <span className={styles.paymentOptionTitle}>50% Upfront / 50% on Launch</span>
                    <span className={styles.paymentOptionDesc}>
                      Standard structure. 50% deposit to kick off sprint; 50% upon final acceptance
                      sign-off.
                    </span>
                  </div>
                </label>

                <label
                  className={`${styles.paymentOptionCard} ${paymentStructure === '40/30/30' ? styles.paymentOptionCardActive : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentStructure"
                    value="40/30/30"
                    checked={paymentStructure === '40/30/30'}
                    onChange={() => setPaymentStructure('40/30/30')}
                    className={styles.radioInput}
                  />
                  <div className={styles.paymentOptionInfo}>
                    <span className={styles.paymentOptionTitle}>
                      40% Kickoff / 30% Staging / 30% Live
                    </span>
                    <span className={styles.paymentOptionDesc}>
                      Milestone-based. 40% upfront deposit; 30% on staging delivery QA; 30% on live
                      production launch.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className={styles.dueDepositBox}>
              <span>Upfront Deposit Due Now:</span>
              <span className={styles.dueDepositAmount}>
                {scope.currency === 'USD'
                  ? `$${depositUSD.toLocaleString('en-US')}`
                  : `₹${depositINR.toLocaleString('en-IN')}`}
              </span>
            </div>

            <div className={styles.termsAgreementBox}>
              <label className={styles.termsCheckboxLabel}>
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className={styles.termsCheckbox}
                />
                <span className={styles.termsText}>
                  I confirm acceptance of this Scope of Work (SOW) &amp; Master Services Agreement (MSA) terms (capped liability to fees paid, 30-day warranty, New Delhi jurisdiction, 100% IP transfer on final payment), agree to the payment structure selected above, and authorize the upfront sprint deposit.
                </span>
              </label>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isProcessing}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={!termsAgreed || isProcessing}
            >
              {isProcessing ? (
                'Processing Checkout...'
              ) : (
                <>
                  <CreditCard size={16} /> Confirm & Pay Deposit
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
