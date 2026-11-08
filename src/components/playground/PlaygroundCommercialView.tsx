'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  ShoppingBag, 
  ShieldCheck, 
  Download, 
  Zap
} from 'lucide-react';
import type { PlaygroundItem } from '@/data/playgroundItems';
import PlaygroundStageRenderer from '@/components/playground/PlaygroundStageRenderer';
import StickyCommercialBar from '@/components/playground/StickyCommercialBar';
import PlaygroundCheckoutModal from '@/components/playground/PlaygroundCheckoutModal';
import styles from '@/app/playground/[slug]/PlaygroundDetail.module.css';

const GitHubIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface PlaygroundCommercialViewProps {
  item: PlaygroundItem;
}

export default function PlaygroundCommercialView({ item }: PlaygroundCommercialViewProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [selectedTierId, setSelectedTierId] = useState<string>(
    item.pricingTiers?.[0]?.id || 'standard'
  );
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const priceFormatted = currency === 'INR' 
    ? `₹${(item.priceINR || 2499).toLocaleString()}`
    : `$${item.priceUSD || 29}`;

  return (
    <div className={styles.container} style={{ paddingBottom: '120px' }}>
      {/* Back Link */}
      <Link href="/playground" className={styles.backNav}>
        <ArrowLeft size={16} />
        <span>Back to Playground</span>
      </Link>

      {/* Commercial Header */}
      <header className={styles.header}>
        <div className={styles.badgeRow}>
          <span className={styles.kindBadge} style={{ color: 'var(--color-primary)' }}>
            <ShoppingBag size={14} />
            <span>Commercial Micro-SaaS</span>
          </span>
          <span className={styles.statusBadge}>
            {item.metricsBadge || 'FLAGSHIP COMMERCIAL PACK'}
          </span>
          <span 
            className={styles.statusBadge}
            style={{ 
              background: 'rgba(0, 230, 118, 0.12)', 
              color: 'var(--color-primary, #00e676)',
              borderColor: 'rgba(0, 230, 118, 0.3)'
            }}
          >
            {priceFormatted} INR / USD
          </span>
        </div>

        <h1 className={styles.title}>{item.title}</h1>
        <p className={styles.tagline}>{item.tagline}</p>

        {/* Dual Fulfillment Rails Banner */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginTop: '16px',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-muted, rgba(255, 255, 255, 0.1))',
            fontSize: '0.82rem',
            color: 'var(--color-text)',
          }}>
            <Download size={14} style={{ color: 'var(--color-primary)' }} />
            <span>Direct 24h Signed ZIP Download</span>
          </div>

          {item.githubRepoSource && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-muted, rgba(255, 255, 255, 0.1))',
              fontSize: '0.82rem',
              color: 'var(--color-text)',
            }}>
              <GitHubIcon size={14} />
              <span>Automated GitHub Collaborator Access ({item.githubRepoSource})</span>
            </div>
          )}

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-muted, rgba(255, 255, 255, 0.1))',
            fontSize: '0.82rem',
            color: 'var(--color-text)',
          }}>
            <ShieldCheck size={14} style={{ color: 'var(--color-primary)' }} />
            <span>Zero-Rated Export LUT Invoice Included</span>
          </div>
        </div>
      </header>

      {/* Decoupled Interactive Stage (Headless Stage or Custom Component) */}
      <div style={{ marginBottom: '32px' }}>
        <PlaygroundStageRenderer componentName={item.componentName} item={item} slug={item.slug} isCommercial={true} />
      </div>

      {/* Description & Technical Capabilities */}
      <div className={styles.saasCard}>
        <div>
          <div className={styles.sectionLabel}>About This Release</div>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '1rem', marginTop: '6px' }}>
            {item.description}
          </p>
        </div>

        {item.highlights && item.highlights.length > 0 && (
          <div>
            <div className={styles.sectionLabel}>Architectural Highlights & Capabilities</div>
            <ul className={styles.highlightsList} style={{ marginTop: '8px' }}>
              {item.highlights.map((h, i) => (
                <li key={i} className={styles.highlightItem}>
                  <CheckCircle2 size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.techStack && item.techStack.length > 0 && (
          <div>
            <div className={styles.sectionLabel}>Production Tech Stack</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {item.techStack.map((tech) => (
                <span 
                  key={tech} 
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontFamily: 'var(--font-jetbrains-mono, monospace)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text)',
                  }}
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className={styles.ctaRow} style={{ marginTop: '8px' }}>
          <button
            type="button"
            className={styles.primaryCta}
            onClick={() => setIsCheckoutOpen(true)}
            style={{ cursor: 'pointer', border: 'none' }}
          >
            <Zap size={16} />
            <span>Instant Guest Checkout ({priceFormatted})</span>
          </button>

          {item.githubUrl && (
            <a
              href={item.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryCta}
            >
              <GitHubIcon size={16} />
              <span>Explore Open-Core Repository</span>
            </a>
          )}
        </div>
      </div>

      {/* Floating Bottom Sticky Commercial Bar */}
      <StickyCommercialBar
        item={item}
        currency={currency}
        onCurrencyToggle={() => setCurrency((c) => (c === 'INR' ? 'USD' : 'INR'))}
        onOpenCheckout={(tId) => {
          if (tId) setSelectedTierId(tId);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Frictionless Guest Checkout Modal */}
      <PlaygroundCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        item={item}
        initialCurrency={currency}
        selectedTierId={selectedTierId}
      />
    </div>
  );
}
