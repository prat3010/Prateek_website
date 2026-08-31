'use client';

import React from 'react';
import { X, FileText, Download, Sparkles } from 'lucide-react';
import Portal from '@/components/ui/Portal';
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
  if (!isOpen || !scope) return null;

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTitle}>
              <FileText size={20} className={styles.modalIcon} />
              <div>
                <h3>Export Commercial Proposal Suite</h3>
                <p className={styles.modalSubtitle}>Scope #{scope.scope_code}</p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalContent}>
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
            <button className={styles.cancelBtn} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
