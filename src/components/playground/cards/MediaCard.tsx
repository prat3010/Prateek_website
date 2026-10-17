'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Copy, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { GenerativeMediaPlaygroundItem } from '@/data/playgroundItems';
import styles from '../PlaygroundGrid.module.css';

interface MediaCardProps {
  item: GenerativeMediaPlaygroundItem;
  onOpenLightbox: (item: GenerativeMediaPlaygroundItem) => void;
}

export default function MediaCard({ item, onOpenLightbox }: MediaCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(item.prompt).then(() => {
        setCopied(true);
        toast.success('Prompt Copied to Clipboard!', {
          description: `Model: ${item.model}`,
        });
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast.error('Failed to copy prompt');
      });
    }
  };

  const isSquare = item.parameters?.aspectRatio === '1:1';

  return (
    <article
      className={`${styles.card} ${styles.cardMedia}`}
      onClick={() => onOpenLightbox(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenLightbox(item);
        }
      }}
    >
      <div className={styles.cardHeader}>
        <span className={`${styles.kindPill} ${styles.kindPillMedia}`}>
          <Sparkles size={13} />
          <span>AI Prompt Studio</span>
        </span>
        <span className={`${styles.statusPill} ${styles.statusPillMedia}`}>
          {item.parameters?.aspectRatio ? `AR ${item.parameters.aspectRatio}` : item.model}
        </span>
      </div>

      <div className={`${styles.mediaPreviewContainer} ${isSquare ? styles.square : ''}`}>
        <Image
          src={item.thumbnailUrl}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.mediaImage}
        />
        <div className={styles.mediaOverlay}>
          <span className={styles.mediaModelPill}>{item.model}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.promptPreviewSnippet}>
          &ldquo;{item.prompt}&rdquo;
        </p>

        <div className={styles.cardFooter}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnFull}`}
            onClick={handleCopyPrompt}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
          </button>
          <button
            type="button"
            className={styles.actionBtnSecondary}
            onClick={(e) => {
              e.stopPropagation();
              onOpenLightbox(item);
            }}
            title="Inspect Full Prompt & Parameters"
            aria-label="Inspect Full Prompt & Parameters"
          >
            <Eye size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
