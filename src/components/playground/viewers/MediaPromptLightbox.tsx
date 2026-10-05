'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { X, Copy, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Portal from '@/components/ui/Portal';
import type { GenerativeMediaPlaygroundItem } from '@/data/playgroundItems';
import styles from './MediaPromptLightbox.module.css';

interface MediaPromptLightboxProps {
  item: GenerativeMediaPlaygroundItem | null;
  onClose: () => void;
}

export default function MediaPromptLightbox({ item, onClose }: MediaPromptLightboxProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const handleCopyPrompt = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(item.prompt).then(() => {
        setCopied(true);
        toast.success('Prompt Copied to Clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast.error('Failed to copy prompt');
      });
    }
  };

  return (
    <Portal>
      <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={item.title}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
              <h3 className={styles.modalTitle}>{item.title}</h3>
            </div>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close Lightbox">
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.imageContainer}>
              <Image
                src={item.mediaUrl}
                alt={item.title}
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 60vw"
                className={styles.lightboxImage}
              />
            </div>

            <div className={styles.metaContainer}>
              <div>
                <div className={styles.sectionLabel}>Model & Engine</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {item.model}
                </div>
              </div>

              <div>
                <div className={styles.sectionLabel}>Positive Generation Prompt</div>
                <div className={styles.promptBox}>
                  <button
                    type="button"
                    className={styles.copyPromptFloatingBtn}
                    onClick={handleCopyPrompt}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  {item.prompt}
                </div>
              </div>

              {item.negativePrompt && (
                <div>
                  <div className={styles.sectionLabel}>Negative Prompt</div>
                  <div className={styles.promptBox} style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                    {item.negativePrompt}
                  </div>
                </div>
              )}

              {item.parameters && (
                <div>
                  <div className={styles.sectionLabel}>Synthesis Parameters</div>
                  <div className={styles.paramsGrid}>
                    {item.parameters.aspectRatio && (
                      <div className={styles.paramItem}>
                        <div className={styles.paramKey}>Aspect Ratio</div>
                        <div className={styles.paramVal}>{item.parameters.aspectRatio}</div>
                      </div>
                    )}
                    {item.parameters.seed && (
                      <div className={styles.paramItem}>
                        <div className={styles.paramKey}>Seed</div>
                        <div className={styles.paramVal}>{item.parameters.seed}</div>
                      </div>
                    )}
                    {item.parameters.cfgScale && (
                      <div className={styles.paramItem}>
                        <div className={styles.paramKey}>CFG Scale</div>
                        <div className={styles.paramVal}>{item.parameters.cfgScale}</div>
                      </div>
                    )}
                    {item.parameters.steps && (
                      <div className={styles.paramItem}>
                        <div className={styles.paramKey}>Steps</div>
                        <div className={styles.paramVal}>{item.parameters.steps}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
