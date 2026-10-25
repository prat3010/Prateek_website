'use client';

import React, { useEffect, useRef } from 'react';
import { Bot, X } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { useLenis } from 'lenis/react';
import type { Currency } from '@/lib/pricing';
import type { ParseIntentResponse } from '@/lib/rag-client';
import {
  InlineScopingChatCard,
  type CurrentScopeContext,
} from './InlineScopingChatCard';
import styles from './ScopeCopilotDrawer.module.css';

interface ScopeCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  isNoir?: boolean;
  onApplyBlueprint: (blueprint: ParseIntentResponse) => void;
  onNavigateStep?: (step: number) => void;
  chatSessionId: string | null;
  setChatSessionId: (id: string) => void;
  chatTranscript: Array<{ role: string; content: string; timestamp?: string }>;
  setChatTranscript: React.Dispatch<
    React.SetStateAction<Array<{ role: string; content: string; timestamp?: string }>>
  >;
  currentScope?: CurrentScopeContext | null;
}

export function ScopeCopilotDrawer({
  isOpen,
  onClose,
  currency,
  isNoir = false,
  onApplyBlueprint,
  onNavigateStep,
  chatSessionId,
  setChatSessionId,
  chatTranscript,
  setChatTranscript,
  currentScope = null,
}: ScopeCopilotDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const lenis = useLenis();

  // Prevent background scrolling while drawer is open and isolate from Lenis
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

  // Focus trapping and keyboard management (WCAG 2.1 AA)
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

      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
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
      lastActiveElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className={styles.backdrop}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        role="presentation"
      >
        <div
          ref={drawerRef}
          className={styles.drawer}
          role="dialog"
          aria-modal="true"
          aria-label="Conversational Scope Copilot Drawer"
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleArea}>
              <div className={styles.copilotIconBox}>
                <Bot size={20} />
              </div>
              <div>
                <h3 className={styles.titleText}>Scope Copilot</h3>
                <p className={styles.subtitleText}>
                  <span className={styles.liveDot} />
                  <span>Bidirectional Solutions Architect</span>
                </p>
              </div>
            </div>

            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className={styles.closeBtn}
              aria-label="Close Scope Copilot Drawer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className={styles.body} data-lenis-prevent="true">
            <InlineScopingChatCard
              currency={currency}
              isNoir={isNoir}
              onApplyBlueprint={onApplyBlueprint}
              onNavigateStep={onNavigateStep}
              chatSessionId={chatSessionId}
              setChatSessionId={setChatSessionId}
              chatTranscript={chatTranscript}
              setChatTranscript={setChatTranscript}
              currentScope={currentScope}
              isDrawerMode={true}
              onCloseDrawer={onClose}
            />
          </div>
        </div>
      </div>
    </Portal>
  );
}
