'use client';

import React, { useEffect, useRef } from 'react';
import { X, MessageSquare } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import styles from './ScopingChatWidgetDrawer.module.css';

interface ScopingChatWidgetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isNoir?: boolean;
}

export function ScopingChatWidgetDrawer({
  isOpen,
  onClose,
}: ScopingChatWidgetDrawerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const containerId = 'scoping-chat-widget-container';
    const existingContainer = document.getElementById(containerId);
    if (!existingContainer) return;

    // Check if script already injected
    const existingScript = document.getElementById('scoping-widget-script');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    const tenantId = process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_TENANT_ID || '';
    const apiKey = process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_API_KEY || '';
    const userId = process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_USER_ID || '';

    script.setAttribute('data-tenant', tenantId);
    script.setAttribute('data-key', apiKey);
    if (userId) {
      script.setAttribute('data-user-id', userId);
    }
    script.setAttribute('data-color', '#2563eb');
    script.setAttribute('data-title', 'Prateeq Scoping Concierge');
    script.setAttribute('data-container', containerId);
    script.setAttribute('data-api-url', process.env.NEXT_PUBLIC_RETRIEVER_API_URL || 'https://rag.prateeq.in');

    document.body.appendChild(script);

    return () => {
      const s = document.getElementById('scoping-widget-script');
      if (s) s.remove();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="scoping-drawer-title">
        <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <span className={styles.statusDot} />
              <h2 id="scoping-drawer-title" className={styles.title}>
                <MessageSquare size={16} />
                <span>Scoping AI Concierge</span>
              </h2>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close scoping AI concierge drawer"
            >
              <X size={18} />
            </button>
          </div>

          <div
            id="scoping-chat-widget-container"
            ref={containerRef}
            className={styles.widgetHost}
          />

          <div className={styles.badgeFooter}>
            <span>⚡ Powered by Retriever Engine</span>
            <span>🔒 Dogfooding Tenant: prateeq_scoping</span>
          </div>
        </div>
      </div>
    </Portal>
  );
}
