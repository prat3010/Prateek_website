'use client';

import React from 'react';
import { X, Rocket } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import IntakeForm from '@/components/Intake/IntakeForm';
import type { ResumeData } from '@/data/resume';
import styles from './ScopingBriefModal.module.css';

interface ScopingBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData?: ResumeData | null;
}

export default function ScopingBriefModal({
  isOpen,
  onClose,
  resumeData,
}: ScopingBriefModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose}>
        <div
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className={styles.modalHeader}>
            <div className={styles.brandBadge}>
              <Rocket size={14} />
              <span>PRATEEQ.IN | PROJECT SCOPING LAB & INSTANT QUOTE</span>
            </div>

            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          {/* Body Content with Lenis Scroll Prevention */}
          <div
            className={styles.modalBody}
            data-lenis-prevent
            data-lenis-prevent-touch
            data-lenis-prevent-wheel
          >
            <IntakeForm resumeData={resumeData} />
          </div>
        </div>
      </div>
    </Portal>
  );
}
