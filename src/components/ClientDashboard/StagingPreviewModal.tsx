'use client';

import React, { useState } from 'react';
import { X, Monitor, Smartphone, ExternalLink, CreditCard } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import type { ClientScope } from '@/lib/clientOrder';
import styles from '@/app/dashboard/dashboard.module.css';

interface StagingPreviewModalProps {
  scope: ClientScope | null;
  isOpen: boolean;
  onClose: () => void;
  onPayBalance?: (scope: ClientScope) => void;
}

export function StagingPreviewModal({ scope, isOpen, onClose, onPayBalance }: StagingPreviewModalProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen || !scope) return null;

  const isBalancePaid = Boolean(scope.balance_paid || scope.is_fully_paid);
  const isThreePart = scope.payment_structure === '40/30/30';
  const balanceMultiplier = isThreePart ? 0.3 : 0.5;
  const curr = (scope.currency === 'USD' ? 'USD' : 'INR') as 'USD' | 'INR';
  const totalCost = curr === 'USD' ? Number(scope.total_cost_usd || 0) : Number(scope.total_cost_inr || 0);
  const balanceAmount = Math.round(totalCost * balanceMultiplier);
  const balanceDisplay = curr === 'USD' ? `$${balanceAmount.toLocaleString('en-US')}` : `₹${balanceAmount.toLocaleString('en-IN')}`;

  const stagingUrl =
    scope.deliverables?.staging_url?.trim() ||
    (typeof scope.metadata?.staging_url === 'string' ? scope.metadata.staging_url.trim() : '');

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
          className={`${styles.modalCard} ${styles.stagingPreviewModalCard}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTitle}>
              <Monitor size={20} className={styles.modalIcon} />
              <div>
                <h3>Live Staging Environment Preview</h3>
                <p className={styles.modalSubtitle}>Scope #{scope.scope_code}</p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.stagingControlBar}>
            <div className={styles.stagingViewportToggles}>
              <button
                type="button"
                className={`${styles.stagingViewportBtn} ${viewport === 'desktop' ? styles.stagingViewportBtnActive : ''}`}
                onClick={() => setViewport('desktop')}
              >
                <Monitor size={15} /> Desktop
              </button>
              <button
                type="button"
                className={`${styles.stagingViewportBtn} ${viewport === 'mobile' ? styles.stagingViewportBtnActive : ''}`}
                onClick={() => setViewport('mobile')}
              >
                <Smartphone size={15} /> Mobile
              </button>
            </div>

            <div className={styles.stagingUrlBar}>
              <span className={styles.stagingUrlText}>
                {stagingUrl || 'Staging URL pending provisioning'}
              </span>
              {stagingUrl && (
                <a
                  href={stagingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.stagingExternalLink}
                >
                  <ExternalLink size={14} /> Open in New Tab
                </a>
              )}
            </div>
          </div>

          <div className={styles.stagingFrameWrapper}>
            <div
              className={`${styles.stagingFrameContainer} ${viewport === 'mobile' ? styles.stagingMobileContainer : styles.stagingDesktopContainer}`}
            >
              <div className={styles.stagingMockBrowser}>
                <div className={styles.stagingMockHeader}>
                  <div className={styles.mockDots}>
                    <span className={styles.mockDot} />
                    <span className={styles.mockDot} />
                    <span className={styles.mockDot} />
                  </div>
                  <div className={styles.mockAddressBar}>
                    {stagingUrl || 'Staging URL pending deployment'}
                  </div>
                </div>
                {stagingUrl ? (
                  <iframe
                    src={stagingUrl}
                    title={`Staging preview for ${scope.company_name}`}
                    style={{
                      width: '100%',
                      height: '420px',
                      border: 'none',
                      background: 'var(--surface-card)',
                    }}
                  />
                ) : (
                  <div className={styles.mockContent}>
                    <div className={styles.mockWatermark}>
                      <h4>⏳ Staging Environment Pending Provisioning</h4>
                      <p>Engine: {scope.base_engine}</p>
                      <p>Sprint Stage: {(scope.delivery_stage || 'engineering').toUpperCase()}</p>
                      <p className={styles.mockHint}>
                        Once your staging preview deployment URL is provisioned and linked to your
                        Deliverables Vault, you can inspect and test it live here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Close Preview
            </button>
            {!isBalancePaid && onPayBalance && (
              <button
                type="button"
                className={styles.balanceCtaBtn}
                onClick={() => {
                  onClose();
                  onPayBalance(scope);
                }}
              >
                <CreditCard size={15} /> Approve Staging & Pay Final Balance ({balanceDisplay})
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
