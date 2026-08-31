'use client';

import React, { useState } from 'react';
import { X, Monitor, Smartphone, ExternalLink } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import type { ClientScope } from '@/lib/clientOrder';
import styles from '@/app/dashboard/dashboard.module.css';

interface StagingPreviewModalProps {
  scope: ClientScope | null;
  isOpen: boolean;
  onClose: () => void;
}

export function StagingPreviewModal({ scope, isOpen, onClose }: StagingPreviewModalProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');

  if (!isOpen || !scope) return null;

  const stagingUrl =
    (scope.metadata?.staging_url as string) ||
    `https://staging-${scope.scope_code.toLowerCase()}.prateeq.in`;

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
              <span className={styles.stagingUrlText}>{stagingUrl}</span>
              <a
                href={stagingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.stagingExternalLink}
              >
                <ExternalLink size={14} /> Open in New Tab
              </a>
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
                  <div className={styles.mockAddressBar}>{stagingUrl}</div>
                </div>
                <div className={styles.mockContent}>
                  <div className={styles.mockWatermark}>
                    <h4>🚀 Staging Preview Build</h4>
                    <p>Engine: {scope.base_engine}</p>
                    <p>Sprint Stage: {(scope.delivery_stage || 'engineering').toUpperCase()}</p>
                    <p className={styles.mockHint}>
                      Live sprint artifacts and pull-request builds are continuously deployed to
                      this preview sandbox.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={onClose}>
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
