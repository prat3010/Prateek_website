import React, { useRef, useEffect } from 'react';
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
import { QUICK_CATEGORIES } from './IntakeForm';
import styles from './IntakeForm.module.css';
import type { User } from '@supabase/supabase-js';
import { signInWithGoogle } from '@/lib/auth';

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

interface QuickServiceFlowProps {
  quickServices: QuickServiceItem[];
  selectedQuickServices: string[];
  setSelectedQuickServices: React.Dispatch<React.SetStateAction<string[]>>;
  quickStep: number;
  setQuickStep: (step: number) => void;
  quickFormData: {
    companyName: string;
    siteUrl: string;
    additionalNotes: string;
    agreedToTerms: boolean;
  };
  setQuickFormData: React.Dispatch<React.SetStateAction<{
    companyName: string;
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
  onDownloadPDF: () => void;
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
  onDownloadPDF,
  togglePopover,
}: QuickServiceFlowProps) {
  const popoverCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activePopoverId && popoverAnchor) {
      popoverCloseRef.current?.focus();
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setActivePopoverId(null);
          setPopoverAnchor(null);
        }
      };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [activePopoverId, popoverAnchor, setActivePopoverId, setPopoverAnchor]);
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
                  role="tab"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  className={`${styles.categoryTabBtn} ${isSelected ? styles.categoryTabBtnActive : ''}`}
                  onClick={() => setSelectedQuickCategory(cat.id as 'all' | 'ai' | 'integration' | 'performance')}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      const next = (catIdx + 1) % QUICK_CATEGORIES.length;
                      const tabs = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
                      (tabs?.[next] as HTMLElement)?.focus();
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const prev = (catIdx - 1 + QUICK_CATEGORIES.length) % QUICK_CATEGORIES.length;
                      const tabs = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
                      (tabs?.[prev] as HTMLElement)?.focus();
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      const tabs = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
                      (tabs?.[0] as HTMLElement)?.focus();
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      const tabs = e.currentTarget.parentElement?.querySelectorAll('[role="tab"]');
                      (tabs?.[tabs.length - 1] as HTMLElement)?.focus();
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
            {(selectedQuickCategory === 'all'
              ? quickServices
              : quickServices.filter((s) => {
                  const cat = QUICK_CATEGORIES.find((c) => c.id === selectedQuickCategory);
                  return cat?.categories.includes(s.category || '');
                })
            ).map((svc, svcIdx) => {
              const isSelected = selectedQuickServices.includes(svc.id);
              const isPopoverOpen = activePopoverId === `qs-${svc.id}`;
              const allVisible = (selectedQuickCategory === 'all'
                ? quickServices
                : quickServices.filter((s) => {
                    const cat = QUICK_CATEGORIES.find((c) => c.id === selectedQuickCategory);
                    return cat?.categories.includes(s.category || '');
                  })
              );
              return (
                <div
                  key={svc.id}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={svcIdx === 0 ? 0 : -1}
                  className={`${styles.checkboxCard} ${isSelected ? styles.checkboxCardSelected : ''} ${styles.cardSelectable}`}
                  onClick={() => {
                    setSelectedQuickServices((prev) =>
                      prev.includes(svc.id) ? prev.filter((id) => id !== svc.id) : [...prev, svc.id]
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedQuickServices((prev) =>
                        prev.includes(svc.id) ? prev.filter((id) => id !== svc.id) : [...prev, svc.id]
                      );
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                      e.preventDefault();
                      const next = (svcIdx + 1) % allVisible.length;
                      const card = (e.currentTarget.parentElement?.children[next] as HTMLElement);
                      card?.focus();
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const prev = (svcIdx - 1 + allVisible.length) % allVisible.length;
                      const card = (e.currentTarget.parentElement?.children[prev] as HTMLElement);
                      card?.focus();
                    } else if (e.key === 'Home') {
                      e.preventDefault();
                      const card = (e.currentTarget.parentElement?.children[0] as HTMLElement);
                      card?.focus();
                    } else if (e.key === 'End') {
                      e.preventDefault();
                      const card = (e.currentTarget.parentElement?.children[allVisible.length - 1] as HTMLElement);
                      card?.focus();
                    }
                  }}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>
                      {getQuickServiceIcon(svc.id)}
                      <span>{cleanSvcLabel(svc.label)}</span>
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
                        togglePopover(e, `qs-${svc.id}`);
                      }}
                      title="Click to view Technical Stack & Deliverables Specs"
                      aria-label={`Details for ${svc.label}`}
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
                            setActivePopoverId(null);
                            setPopoverAnchor(null);
                          }}
                        />
                        <div
                          className={styles.popoverPortal}
                          style={{ left: popoverAnchor.x, top: popoverAnchor.y }}
                          onClick={(ev) => ev.stopPropagation()}
                        >
                          <div className={`${styles.popoverBox} ${styles.popoverStatic}`}>
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
                                    setActivePopoverId(null);
                                    setPopoverAnchor(null);
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
            <label className={styles.label}>
              <Building2 size={14} className={styles.inlineIcon} />
              Company / Brand Name
            </label>
            <input
              type="text"
              className={styles.input}
              placeholder="Your company or brand name"
              value={quickFormData.companyName}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, companyName: e.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              <Globe size={14} className={styles.inlineIcon} />
              Existing Website URL
            </label>
            <input
              type="url"
              className={styles.input}
              placeholder="https://your-existing-site.com"
              value={quickFormData.siteUrl}
              onChange={(e) => setQuickFormData((prev) => ({ ...prev, siteUrl: e.target.value }))}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              <FileText size={14} className={styles.inlineIcon} />
              Additional Notes
            </label>
            <textarea
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
                      <td>{svc.label}</td>
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
                  onClick={() => signInWithGoogle('/dashboard?imported=true')}
                  className={`${styles.btn} ${styles.googleFastPassBtn}`}
                  title="Fast-pass: Sign in with Google to automatically save your scope"
                >
                  <Rocket size={16} />
                  <span>1-CLICK GOOGLE FAST-PASS</span>
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
