import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Wrench,
  Building2,
  Check,
  ArrowRight,
  ArrowLeft,
  Download,
  Info,
  X,
  Rocket,
  Send,
  Globe,
  FileText,
  Clock,
  MessageSquare,
  Mic,
  Eye,
  Brain,
  Mail,
  Phone,
  CreditCard,
  Link,
  Zap,
  Search,
  ShieldCheck,
  Smartphone,
  BarChart,
  Database,
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import type { QuickServiceItem } from '@/data/resume';
import { formatPricePair, type Currency } from '@/lib/pricing';
import { QUICK_CATEGORIES } from './useIntakeFormState';
import styles from './intakeStyles';
import type { User } from '@supabase/supabase-js';

const getQuickServiceIcon = (id: string): React.ReactNode => {
  switch (id) {
    case 'chatbot':
      return <MessageSquare size={16} className={styles.inlineIcon} />;
    case 'voice_ai_setup':
    case 'voice_bot':
      return <Mic size={16} className={styles.inlineIcon} />;
    case 'vision_ocr_setup':
    case 'ocr':
      return <Eye size={16} className={styles.inlineIcon} />;
    case 'rag_knowledge_base':
    case 'rag':
      return <Brain size={16} className={styles.inlineIcon} />;
    case 'transactional_email':
    case 'email':
      return <Mail size={16} className={styles.inlineIcon} />;
    case 'payment_gateway':
    case 'payments':
      return <CreditCard size={16} className={styles.inlineIcon} />;
    case 'api_integration':
    case 'integrations':
      return <Link size={16} className={styles.inlineIcon} />;
    case 'speed_optimization':
    case 'cwv':
      return <Zap size={16} className={styles.inlineIcon} />;
    case 'seo_audit':
    case 'seo':
      return <Search size={16} className={styles.inlineIcon} />;
    case 'accessibility_audit':
    case 'a11y':
      return <ShieldCheck size={16} className={styles.inlineIcon} />;
    case 'i18n_setup':
    case 'i18n':
      return <Globe size={16} className={styles.inlineIcon} />;
    case 'pwa_conversion':
    case 'pwa':
      return <Smartphone size={16} className={styles.inlineIcon} />;
    case 'analytics_setup':
    case 'analytics':
      return <BarChart size={16} className={styles.inlineIcon} />;
    case 'data_migration':
    case 'migration':
      return <Database size={16} className={styles.inlineIcon} />;
    default:
      return <Wrench size={16} className={styles.inlineIcon} />;
  }
};

const cleanSvcLabel = (label: string): string => {
  return label
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u{FE00}-\u{FE0F}\u{200D}\s]+/gu, '')
    .trim();
};

export interface QuickServiceFormData {
  companyName: string;
  contactEmail?: string;
  contactPhone?: string;
  siteUrl: string;
  additionalNotes: string;
  agreedToTerms: boolean;
}

interface QuickServiceFlowProps {
  quickServices: QuickServiceItem[];
  selectedQuickServices: string[];
  setSelectedQuickServices: React.Dispatch<React.SetStateAction<string[]>>;
  quickStep: number;
  setQuickStep: (step: number) => void;
  quickFormData: QuickServiceFormData;
  setQuickFormData: React.Dispatch<React.SetStateAction<{
    companyName: string;
    contactEmail: string;
    contactPhone: string;
    siteUrl: string;
    additionalNotes: string;
    agreedToTerms: boolean;
  }>>;
  selectedQuickCategory: 'all' | 'ai' | 'integration' | 'performance';
  setSelectedQuickCategory: (cat: 'all' | 'ai' | 'integration' | 'performance') => void;
  quickQuote: { totalINR: number; totalUSD: number };
  currency: Currency;
  user: User | null;
  submitting: boolean;
  generatingPdf: boolean;
  errorMsg: string;
  activePopoverId: string | null;
  setActivePopoverId: (id: string | null) => void;
  popoverAnchor: { x: number; y: number } | null;
  setPopoverAnchor: (anchor: { x: number; y: number } | null) => void;
  onResetServiceType: () => void;
  onQuickSubmit: () => void;
  onQuickFastPass: () => Promise<void>;
  onDownloadPDF: () => void;
  onClearError?: () => void;
  togglePopover: (e: React.MouseEvent, id: string) => void;
}

export function QuickServiceFlow({
  quickServices,
  selectedQuickServices,
  setSelectedQuickServices,
  quickStep,
  setQuickStep,
  quickFormData,
  setQuickFormData,
  selectedQuickCategory,
  setSelectedQuickCategory,
  quickQuote,
  currency,
  user,
  submitting,
  generatingPdf,
  errorMsg,
  activePopoverId,
  setActivePopoverId,
  popoverAnchor,
  setPopoverAnchor,
  onResetServiceType,
  onQuickSubmit,
  onQuickFastPass,
  onDownloadPDF,
  onClearError,
  togglePopover,
}: QuickServiceFlowProps) {
  const popoverCloseRef = useRef<HTMLButtonElement>(null);
  const popoverTriggerRef = useRef<HTMLButtonElement | null>(null);
  const quickTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const quickCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [focusedServiceIdx, setFocusedServiceIdx] = useState(0);

  const visibleQuickServices =
    selectedQuickCategory === 'all'
      ? quickServices
      : quickServices.filter((s) => {
          const cat = QUICK_CATEGORIES.find((c) => c.id === selectedQuickCategory);
          return cat?.categories.includes(s.category || '');
        });

  const activeFocusIdx =
    focusedServiceIdx < visibleQuickServices.length ? focusedServiceIdx : 0;

  const focusQuickTab = (index: number) => {
    const clamped = Math.max(0, Math.min(index, QUICK_CATEGORIES.length - 1));
    quickTabRefs.current[clamped]?.focus();
  };

  const focusQuickCard = (index: number) => {
    if (visibleQuickServices.length === 0) return;
    const clamped = Math.max(0, Math.min(index, visibleQuickServices.length - 1));
    setFocusedServiceIdx(clamped);
    quickCardRefs.current[clamped]?.focus();
  };

  const closePopover = useCallback(
    (restoreFocus = true) => {
      setActivePopoverId(null);
      setPopoverAnchor(null);
      if (restoreFocus) {
        const trigger = popoverTriggerRef.current;
        if (trigger && trigger.isConnected) {
          requestAnimationFrame(() => trigger.focus());
        }
      }
    },
    [setActivePopoverId, setPopoverAnchor]
  );

  useEffect(() => {
    if (activePopoverId && popoverAnchor) {
      popoverCloseRef.current?.focus();
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closePopover(true);
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [activePopoverId, popoverAnchor, closePopover]);
  return (
    <div>
      {quickStep === 1 ? (
        <div className={styles.formStep}>
          <div className={styles.groupTitle}>
            <Wrench size={18} />
            <span>SELECT QUICK SERVICES</span>
            <button
              type="button"
              className={styles.backToStep0}
              onClick={onResetServiceType}
            >
              ← Change service type
            </button>
          </div>
          <p className={styles.fieldHint}>
            Select one or more standalone service packages for your existing site or app.
          </p>

          {/* Quick Service Category Filter Tabs */}
          <div className={styles.categoryTabs} role="tablist" aria-label="Quick Service Categories">
            {QUICK_CATEGORIES.map((cat, catIdx) => {
              const isSelected = selectedQuickCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? quickServices.length
                  : quickServices.filter((s) => cat.categories.includes(s.category || '')).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  ref={(el) => { quickTabRefs.current[catIdx] = el; }}
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  className={`${styles.categoryTabBtn} ${isSelected ? styles.categoryTabBtnActive : ''}`}
                  onClick={() => {
                    setSelectedQuickCategory(cat.id as 'all' | 'ai' | 'integration' | 'performance');
                    setFocusedServiceIdx(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      focusQuickTab((catIdx + 1) % QUICK_CATEGORIES.length);
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      focusQuickTab((catIdx - 1 + QUICK_CATEGORIES.length) % QUICK_CATEGORIES.length);
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      focusQuickTab(0);
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      focusQuickTab(QUICK_CATEGORIES.length - 1);
                    }
                  }}
                >
                  <span>{cat.label}</span>
                  <span className={styles.categoryTabBadge}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.checkboxGrid} role="group" aria-label="Quick Services">
            {visibleQuickServices.map((svc, svcIdx) => {
              const isSelected = selectedQuickServices.includes(svc.id);
              const isPopoverOpen = activePopoverId === `qs-${svc.id}`;
              const cleanTitle = cleanSvcLabel(svc.label);
              return (
                <div
                  key={svc.id}
                  ref={(el) => { quickCardRefs.current[svcIdx] = el; }}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={svcIdx === activeFocusIdx ? 0 : -1}
                  className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''} ${styles.cardSelectable}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    setFocusedServiceIdx(svcIdx);
                    setSelectedQuickServices((prev) =>
                      prev.includes(svc.id) ? prev.filter((id) => id !== svc.id) : [...prev, svc.id]
                    );
                  }}
                  onKeyDown={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFocusedServiceIdx(svcIdx);
                      setSelectedQuickServices((prev) =>
                        prev.includes(svc.id) ? prev.filter((id) => id !== svc.id) : [...prev, svc.id]
                      );
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      focusQuickCard((svcIdx + 1) % visibleQuickServices.length);
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      focusQuickCard((svcIdx - 1 + visibleQuickServices.length) % visibleQuickServices.length);
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      focusQuickCard(0);
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      focusQuickCard(visibleQuickServices.length - 1);
                    }
                  }}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                      {getQuickServiceIcon(svc.id)}
                      <span>{cleanTitle}</span>
                    </span>
                    <span className={`${styles.itemPrice} ${styles.cardPrice}`}>
                      {formatPricePair(svc.priceINR, svc.priceUSD, currency)}
                    </span>
                  </div>
                  <p className={styles.cardDescShort}>{svc.laymanDescription}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardTurnaround}>
                      <Clock size={12} className={styles.inlineIcon} />
                      {svc.turnaround}
                    </span>
                    <button
                      type="button"
                      className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        popoverTriggerRef.current = e.currentTarget;
                        togglePopover(e, `qs-${svc.id}`);
                      }}
                      title="Click to view Technical Stack & Deliverables Specs"
                      aria-label={`Details for ${cleanTitle}`}
                      aria-haspopup="dialog"
                      aria-expanded={isPopoverOpen}
                    >
                      <Info size={14} />
                    </button>
                  </div>
                  {isSelected && (
                    <div className={styles.checkMark}>
                      <Check size={14} />
                    </div>
                  )}

                    {isPopoverOpen && popoverAnchor && (
                    <Portal>
                      <>
                        <div
                          className={styles.popoverOverlay}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            closePopover(true);
                          }}
                        />
                        <div
                          className={styles.popoverPortal}
                          style={{
                            left: typeof window !== 'undefined'
                              ? Math.max(12, Math.min(popoverAnchor.x, Math.max(12, window.innerWidth - 332)))
                              : popoverAnchor.x,
                            top: popoverAnchor.y,
                          }}
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <div
                            role="dialog"
                            aria-label={`${cleanTitle} Technical Specifications`}
                            className={`${styles.popoverBox} ${styles.popoverStatic}`}
                          >
                            <div className={styles.popoverHeader}>
                              <span>
                                <Wrench size={12} className={styles.inlineIcon} />
                                TECHNICAL STACK &amp; DELIVERABLES
                              </span>
                              <button
                                  type="button"
                                  ref={popoverCloseRef}
                                  className={styles.popoverCloseBtn}
                                  aria-label="Close"
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    closePopover(true);
                                  }}
                                >
                                  <X size={12} />
                                </button>
                            </div>
                            <p className={styles.popoverTechText}>{svc.techSpecs}</p>
                          </div>
                        </div>
                      </>
                    </Portal>
                  )}
                </div>
              );
            })}
          </div>

          {selectedQuickServices.length > 0 && (
            <div className={`${styles.quoteSummaryCompact} ${styles.fieldMarginSm}`}>
              <span className={styles.quickSummaryLabel}>
                {selectedQuickServices.length} service{selectedQuickServices.length > 1 ? 's' : ''} selected
              </span>
              <span className={styles.quickSummaryTotal}>
                {formatPricePair(quickQuote.totalINR, quickQuote.totalUSD, currency)}
              </span>
            </div>
          )}

          <div className={styles.navigationRow}>
            <button
              type="button"
              disabled={selectedQuickServices.length === 0}
              onClick={() => setQuickStep(2)}
              className={`${styles.btn} ${styles.btnPrimary} ${selectedQuickServices.length === 0 ? styles.btnDisabled : ''}`}
            >
              <span>NEXT: YOUR DETAILS</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.formStep}>
          <div className={styles.groupTitle}>
            <Building2 size={18} />
            <span>YOUR DETAILS &amp; QUOTE</span>
          </div>
          <div className={styles.field}>
            <label htmlFor="quick-company-name" className={styles.label}>
              <Building2 size={14} className={styles.inlineIcon} />
              Company / Brand Name
            </label>
            <input
              id="quick-company-name"
              type="text"
              className={styles.input}
              placeholder="Your company or brand name"
              value={quickFormData.companyName}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, companyName: e.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="quick-site-url" className={styles.label}>
              <Globe size={14} className={styles.inlineIcon} />
              Existing Website URL
            </label>
            <input
              id="quick-site-url"
              type="url"
              className={styles.input}
              placeholder="https://your-existing-site.com"
              value={quickFormData.siteUrl}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, siteUrl: e.target.value }))}
            />
          </div>

          {!user && (
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="quick-contact-email" className={styles.label}>
                  <Mail size={14} className={styles.inlineIcon} />
                  Contact Email (Required for email submission){' '}
                  <span className={styles.requiredIndicator} aria-hidden="true">*</span>
                </label>
                <input
                  id="quick-contact-email"
                  type="email"
                  inputMode="email"
                  aria-required="true"
                  aria-invalid={Boolean(errorMsg && errorMsg.toLowerCase().includes('email'))}
                  className={`${styles.input} ${
                    errorMsg && errorMsg.toLowerCase().includes('email') ? styles.inputError : ''
                  }`}
                  placeholder="e.g., founder@company.com"
                  value={quickFormData.contactEmail || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuickFormData((prev) => ({ ...prev, contactEmail: val }));
                    if (errorMsg && errorMsg.toLowerCase().includes('email')) {
                      onClearError?.();
                    }
                  }}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="quick-contact-phone" className={styles.label}>
                  <Phone size={14} className={styles.inlineIcon} />
                  Contact Phone / WhatsApp (Optional)
                </label>
                <input
                  id="quick-contact-phone"
                  type="tel"
                  inputMode="tel"
                  className={styles.input}
                  placeholder="e.g., +91 99107 93616 / +1 (555) 019-2831"
                  value={quickFormData.contactPhone || ''}
                  onChange={(e) => setQuickFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="quick-additional-notes" className={styles.label}>
              <FileText size={14} className={styles.inlineIcon} />
              Additional Notes
            </label>
            <textarea
              id="quick-additional-notes"
              className={styles.textarea}
              rows={3}
              placeholder="Any specifics about what you need..."
              value={quickFormData.additionalNotes}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, additionalNotes: e.target.value }))}
            />
          </div>

          <div className={styles.quoteSummary}>
            <h4 className={styles.quoteTitle}>Quick Service Quote</h4>
            <table className={styles.quoteTable}>
              <thead className="sr-only">
                <tr>
                  <th>Service</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {quickServices
                  .filter((s) => selectedQuickServices.includes(s.id))
                  .map((svc) => (
                    <tr key={svc.id} className={styles.quoteRow}>
                      <td>{cleanSvcLabel(svc.label)}</td>
                      <td className={styles.itemPrice}>{formatPricePair(svc.priceINR, svc.priceUSD, currency)}</td>
                    </tr>
                  ))}
                <tr className={`${styles.quoteRow} ${styles.quoteRowTotal}`}>
                  <td><strong>TOTAL</strong></td>
                  <td className={styles.totalPrice}>
                    <strong>{formatPricePair(quickQuote.totalINR, quickQuote.totalUSD, currency)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className={styles.fieldMarginTop}>
              <button
                type="button"
                onClick={onDownloadPDF}
                disabled={generatingPdf}
                className={`${styles.btn} ${styles.btnSecondary} ${generatingPdf ? styles.btnDisabled : ''} ${styles.quickPdfBtn}`}
                title="Open Canva-grade PDF proposal preview"
              >
                <Download size={16} />
                <span>{generatingPdf ? 'GENERATING PDF...' : 'OPEN PROPOSAL PDF'}</span>
              </button>
            </div>
            <p className={styles.quickDisclaimer}>
              Includes 30-day post-delivery warranty. Baseline quote &mdash; formal quotation issued prior to development.
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.termsCheckbox}>
              <input
                type="checkbox"
                checked={quickFormData.agreedToTerms}
                onChange={(e) => setQuickFormData((prev) => ({ ...prev, agreedToTerms: e.target.checked }))}
              />
              <span>I agree to the fixed-scope commercial terms, 50/50 milestone payments, and 30-day warranty.</span>
            </label>
          </div>

          {errorMsg && (
            <p role="alert" aria-live="assertive" className={styles.formError}>{errorMsg}</p>
          )}

          <div className={styles.submitWrapper}>
            <div className={`${styles.navigationRow} ${styles.submitRow}`}>
              <button
                type="button"
                onClick={() => setQuickStep(1)}
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                <ArrowLeft size={16} />
                <span>BACK</span>
              </button>

              {!user && (
                <button
                  type="button"
                  onClick={onQuickFastPass}
                  disabled={submitting || !quickFormData.agreedToTerms}
                  className={`${styles.btn} ${styles.googleFastPassBtn} ${submitting || !quickFormData.agreedToTerms ? styles.btnDisabled : ''}`}
                  title={!quickFormData.agreedToTerms ? 'Accept commercial terms to use Google Fast-Pass' : 'Fast-pass: Sign in with Google to automatically save your scope'}
                >
                  <Rocket size={16} />
                  <span>{submitting ? 'CONNECTING...' : '1-CLICK GOOGLE FAST-PASS'}</span>
                </button>
              )}

              <button
                type="button"
                disabled={submitting || !quickFormData.agreedToTerms}
                onClick={onQuickSubmit}
                className={`${styles.btn} ${styles.btnPrimary} ${!quickFormData.agreedToTerms ? styles.btnDisabled : ''}`}
              >
                <span>{submitting ? 'SAVING SCOPE...' : 'SAVE QUICK SERVICE SCOPE'}</span>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
