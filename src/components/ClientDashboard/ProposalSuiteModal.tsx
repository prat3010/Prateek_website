'use client';

import React, { useEffect, useRef } from 'react';
import { X, FileText, Download, Sparkles } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { useLenis } from 'lenis/react';
import type { ClientScope } from '@/lib/clientOrder';
import styles from '@/app/dashboard/dashboard.module.css';

interface ProposalSuiteModalProps {
  scope: ClientScope | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (scope: ClientScope, format: 'exec' | 'sow') => Promise<void>;
  downloadingFormat: 'exec' | 'sow' | null;
}

export function ProposalSuiteModal({
  scope,
  isOpen,
  onClose,
  onDownload,
  downloadingFormat,
}: ProposalSuiteModalProps) {
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

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose} role="presentation">
        <div
          ref={modalRef}
          className={styles.modalCard}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="proposal-suite-modal-title"
          data-lenis-prevent
        >
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTitle}>
              <FileText size={20} className={styles.modalIcon} />
              <div>
                <h3 id="proposal-suite-modal-title">Export Commercial Proposal Suite</h3>
                <p className={styles.modalSubtitle}>Scope #{scope.scope_code}</p>
              </div>
            </div>
            <button
              ref={closeBtnRef}
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close proposal export modal"
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalContent} data-lenis-prevent>
            <p className={styles.proposalSuiteIntro}>
              Choose the export format tailored for your team or leadership review:
            </p>

            <div className={styles.proposalSuiteOptionsGrid}>
              {/* Option 1: Executive Pitch Brief */}
              <div className={styles.proposalOptionCard}>
                <div className={styles.proposalOptionHeader}>
                  <Sparkles size={18} className={styles.proposalOptionIcon} />
                  <div>
                    <h4 className={styles.proposalOptionTitle}>1-Page Executive Pitch Brief</h4>
                    <p className={styles.proposalOptionBadge}>Fast Stakeholder Review</p>
                  </div>
                </div>
                <p className={styles.proposalOptionDesc}>
                  High-level strategic overview featuring architecture engine, key deliverables,
                  turnaround timeline, and total investment breakdown.
                </p>
                <button
                  type="button"
                  className={styles.proposalDownloadBtn}
                  onClick={() => onDownload(scope, 'exec')}
                  disabled={downloadingFormat !== null}
                >
                  <Download size={15} />
                  {downloadingFormat === 'exec' ? 'Generating Brief...' : 'Download Executive Brief (PDF)'}
                </button>
              </div>

              {/* Option 2: Master SOW Contract */}
              <div className={styles.proposalOptionCard}>
                <div className={styles.proposalOptionHeader}>
                  <FileText size={18} className={styles.proposalOptionIcon} />
                  <div>
                    <h4 className={styles.proposalOptionTitle}>3-Page Master SOW Contract</h4>
                    <p className={styles.proposalOptionBadge}>Formal Legal & Technical Baseline</p>
                  </div>
                </div>
                <p className={styles.proposalOptionDesc}>
                  Full Statement of Work including complete feature specifications, cryptographic
                  hash status, payment schedule, change order terms, and SLA guarantee.
                </p>
                <button
                  type="button"
                  className={styles.proposalDownloadBtn}
                  onClick={() => onDownload(scope, 'sow')}
                  disabled={downloadingFormat !== null}
                >
                  <Download size={15} />
                  {downloadingFormat === 'sow' ? 'Generating SOW...' : 'Download Master SOW (PDF)'}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
