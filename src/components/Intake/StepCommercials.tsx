import React, { useRef, useEffect, useState } from 'react';
import {
  ShieldCheck,
  Info,
  X,
  Wrench,
  Clock,
  FileText,
  Cloud,
  Receipt,
  FileCode,
  Globe,
  Building2,
  Sparkles,
  Lock,
  Code2,
  Scale,
  Mail,
  Phone,
} from 'lucide-react';
import NumberFlow from '@number-flow/react';
import Portal from '@/components/ui/Portal';
import type { BaseEngineItem, MaintenancePlanOption } from '@/data/resume';
import { formatPricePair, type Currency, type PromoDiscountInfo } from '@/lib/pricing';
import type { User } from '@supabase/supabase-js';
import styles from './IntakeForm.module.css';

interface StepCommercialsProps {
  selectedEngine: BaseEngineItem;
  totalCost: {
    totalINR: number;
    totalUSD: number;
    featuresINR: number;
    featuresUSD: number;
    brandOpt: { label: string; priceINR: number; priceUSD: number };
    bundleDiscountPercent?: number;
    bundleDiscountAmountINR?: number;
    bundleDiscountAmountUSD?: number;
    promoDiscount?: PromoDiscountInfo | null;
    promoDiscountAmountINR?: number;
    promoDiscountAmountUSD?: number;
    depositINR?: number;
    depositUSD?: number;
    balanceINR?: number;
    balanceUSD?: number;
  };
  maintenancePlans: MaintenancePlanOption[];
  formData: {
    selectedFeatures: string[];
    selectedMaintenanceId: string;
    timeline: string;
    additionalNotes: string;
    hostingOwnership: 'client_owned' | 'needs_setup';
    taxInvoicingPreference: 'standard' | 'corporate_gst';
    agreedToTerms: boolean;
    contactEmail?: string;
    contactPhone?: string;
  };
  autoMaintenancePlanId: string;
  activePopoverId: string | null;
  setActivePopoverId: (id: string | null) => void;
  popoverAnchor: { x: number; y: number } | null;
  setPopoverAnchor: (anchor: { x: number; y: number } | null) => void;
  currency: Currency;
  priceInCurrency: (inr: number, usd: number) => string;
  timelineOptions: string[];
  termsList: string[];
  togglePopover: (e: React.MouseEvent, id: string) => void;
  onChangeField: (field: string, value: string | boolean) => void;
  agreedToTermsError?: boolean;
  stepHeadingRef?: React.RefObject<HTMLDivElement | null>;
  user?: User | null;
}

export function StepCommercials({
  selectedEngine,
  totalCost,
  maintenancePlans,
  formData,
  autoMaintenancePlanId,
  activePopoverId,
  setActivePopoverId,
  popoverAnchor,
  setPopoverAnchor,
  currency,
  priceInCurrency,
  timelineOptions,
  termsList,
  togglePopover,
  onChangeField,
  agreedToTermsError,
  stepHeadingRef,
  user,
}: StepCommercialsProps) {
  const popoverCloseRef = useRef<HTMLButtonElement>(null);
  const [isFullTermsOpen, setIsFullTermsOpen] = useState(false);

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

  const depositINR = totalCost.depositINR ?? Math.round(totalCost.totalINR * 0.5);
  const depositUSD = totalCost.depositUSD ?? Math.round(totalCost.totalUSD * 0.5);
  const balanceINR = totalCost.balanceINR ?? (totalCost.totalINR - depositINR);
  const balanceUSD = totalCost.balanceUSD ?? (totalCost.totalUSD - depositUSD);

  return (
    <div className={styles.formStep}>
      <div className={styles.groupTitle} ref={stepHeadingRef} tabIndex={-1}>
        <ShieldCheck size={18} />
        <span>STEP 4: COMMERCIAL PROPOSAL &amp; MAINTENANCE CARE PLAN</span>
      </div>

      {/* Summary Box with Itemized Volume & Promo Savings */}
      <div className={styles.summaryBox}>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>SELECTED BASE ENGINE</span>
          <span className={styles.summaryAccent}>
            {`${selectedEngine.title} (${priceInCurrency(selectedEngine.priceINR, selectedEngine.priceUSD)})`}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>SELECTED ADD-ON MODULES</span>
          <span className={styles.summaryValue}>
            {`+${priceInCurrency(totalCost.featuresINR, totalCost.featuresUSD)} (${formData.selectedFeatures.length} Modules incl. required deps)`}
          </span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>BRAND KIT ADD-ON</span>
          <span className={styles.summaryValue}>
            {totalCost.brandOpt.priceINR > 0
              ? `+${priceInCurrency(totalCost.brandOpt.priceINR, totalCost.brandOpt.priceUSD)}`
              : 'Included'}
          </span>
        </div>

        {/* Itemized Volume Bundle Savings Line */}
        {totalCost.bundleDiscountPercent && totalCost.bundleDiscountPercent > 0 ? (
          <div className={`${styles.summaryRow} ${styles.summarySavingsRow}`}>
            <span className={styles.summarySavingsLabel}>
              <Sparkles size={13} className={styles.inlineIcon} />
              VOLUME BUNDLE SAVINGS (-{totalCost.bundleDiscountPercent}%)
            </span>
            <span className={styles.summarySavingsValue}>
              -{currency === 'INR' ? (
                <NumberFlow
                  value={totalCost.bundleDiscountAmountINR || 0}
                  locales="en-IN"
                  format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
                />
              ) : (
                <NumberFlow
                  value={totalCost.bundleDiscountAmountUSD || 0}
                  locales="en-US"
                  format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
                />
              )}
            </span>
          </div>
        ) : null}

        {/* Itemized Promo Code Savings Line */}
        {totalCost.promoDiscount && (
          <div className={`${styles.summaryRow} ${styles.summarySavingsRow}`}>
            <span className={styles.summarySavingsLabel}>
              <Sparkles size={13} className={styles.inlineIcon} />
              PROMO CODE SAVINGS ({totalCost.promoDiscount.code || 'APPLIED'})
            </span>
            <span className={styles.summarySavingsValue}>
              -{currency === 'INR' ? (
                <NumberFlow
                  value={totalCost.promoDiscountAmountINR || 0}
                  locales="en-IN"
                  format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
                />
              ) : (
                <NumberFlow
                  value={totalCost.promoDiscountAmountUSD || 0}
                  locales="en-US"
                  format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
                />
              )}
            </span>
          </div>
        )}

        <div className={styles.summaryTotalRow} aria-live="polite" aria-atomic="true">
          <span className={styles.summaryTotalLabel}>TOTAL BUILD INVESTMENT (ESTIMATE)</span>
          <span className={styles.summaryTotalValue}>
            <NumberFlow
              value={currency === 'INR' ? totalCost.totalINR : totalCost.totalUSD}
              locales={currency === 'INR' ? 'en-IN' : 'en-US'}
              format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
            />
          </span>
        </div>
      </div>

      <p className={styles.summaryDisclaimer}>
        Baseline quote. Final formal line-item quotation issued prior to development start.
      </p>

      {/* Maintenance Selector */}
      <div className={styles.field}>
        <label className={styles.label}>
          <Wrench size={14} className={styles.inlineIcon} />
          Select Monthly Maintenance &amp; SLA Care Plan
        </label>
        <div className={styles.careGrid} role="radiogroup" aria-label="Maintenance Care Plan">
          {maintenancePlans.map((p, pIdx) => {
            const isSelected = (formData.selectedMaintenanceId || autoMaintenancePlanId) === p.id;
            const isAutoRecommended = autoMaintenancePlanId === p.id;
            const isPopoverOpen = activePopoverId === p.id;
            return (
              <div
                key={p.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
                className={`${styles.careCard} ${isSelected ? styles.careCardSelected : ''}`}
                onClick={() => onChangeField('selectedMaintenanceId', p.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    onChangeField('selectedMaintenanceId', p.id);
                  } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
                    ev.preventDefault();
                    const next = (pIdx + 1) % maintenancePlans.length;
                    const card = (ev.currentTarget.parentElement?.children[next] as HTMLElement);
                    card?.focus();
                  } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') {
                    ev.preventDefault();
                    const prev = (pIdx - 1 + maintenancePlans.length) % maintenancePlans.length;
                    const card = (ev.currentTarget.parentElement?.children[prev] as HTMLElement);
                    card?.focus();
                  }
                }}
              >
                <div className={styles.careHeader}>
                  <div className={styles.careTitleArea}>
                    <span className={styles.careTitle}>{p.name}</span>
                    {isAutoRecommended && (
                      <span className={styles.recommendedBadge}>Auto-Recommended for Scope</span>
                    )}
                  </div>
                  <div className={styles.carePriceArea}>
                    <span className={styles.carePrice}>
                      {p.priceINR === 0 ? 'Free / Self-Hosted' : formatPricePair(p.priceINR, p.priceUSD, currency)}
                    </span>
                    {p.priceINR > 0 && <span className={styles.carePeriod}>{p.period}</span>}
                    <button
                      type="button"
                      onClick={(ev) => togglePopover(ev, p.id)}
                      className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                      title="Click to view SLA Coverage & Technical Deliverables"
                      aria-label="View SLA Coverage & Technical Deliverables"
                    >
                      <Info size={12} />
                    </button>
                  </div>
                </div>

                <p className={styles.careDesc}>{p.laymanDescription}</p>

                {isPopoverOpen && popoverAnchor && (
                  <Portal>
                    <>
                      <div
                        className={styles.popoverOverlay}
                        onClick={() => {
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
                              SLA TECHNICAL COVERAGE
                            </span>
                            <button
                              ref={popoverCloseRef}
                              type="button"
                              onClick={() => {
                                setActivePopoverId(null);
                                setPopoverAnchor(null);
                              }}
                              className={styles.popoverCloseBtn}
                              aria-label="Close details"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className={styles.popoverContent}>
                            <p className={styles.popoverDesc}>{p.techSpecs}</p>
                            {p.includes && p.includes.length > 0 && (
                              <ul className={styles.popoverList}>
                                {p.includes.map((inc, i) => (
                                  <li key={i}>{inc}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  </Portal>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label}>
            <Clock size={14} className={styles.inlineIcon} />
            Target Delivery Timeline
          </label>
          <select
            className={styles.select}
            value={formData.timeline}
            aria-label="Target Delivery Timeline"
            onChange={(e) => onChangeField('timeline', e.target.value)}
          >
            {timelineOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <FileText size={14} className={styles.inlineIcon} />
            Specific Project Context &amp; Integrations
          </label>
          <input
            type="text"
            className={styles.input}
            aria-label="Specific Project Context & Integrations"
            placeholder="e.g., Stripe, Hubspot, existing Postgres DB..."
            value={formData.additionalNotes}
            onChange={(e) => onChangeField('additionalNotes', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label}>
            <Cloud size={14} className={styles.inlineIcon} />
            Cloud Infrastructure &amp; Domain Hosting
          </label>
          <div className={styles.chipGrid} role="radiogroup" aria-label="Cloud Hosting Setup">
            <button
              type="button"
              role="radio"
              aria-checked={formData.hostingOwnership === 'client_owned'}
              className={`${styles.chipCard} ${formData.hostingOwnership === 'client_owned' ? styles.chipCardActive : ''}`}
              onClick={() => onChangeField('hostingOwnership', 'client_owned')}
            >
              <Globe size={14} className={styles.inlineIcon} />
              Deploy to My Existing Vercel / Cloud Account
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={formData.hostingOwnership === 'needs_setup'}
              className={`${styles.chipCard} ${formData.hostingOwnership === 'needs_setup' ? styles.chipCardActive : ''}`}
              onClick={() => onChangeField('hostingOwnership', 'needs_setup')}
            >
              <Cloud size={14} className={styles.inlineIcon} />
              Set Up Fresh Hosting Infrastructure for Me
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <Receipt size={14} className={styles.inlineIcon} />
            Tax &amp; Procurement Invoicing
          </label>
          <div className={styles.chipGrid} role="radiogroup" aria-label="Tax Invoicing Preference">
            <button
              type="button"
              role="radio"
              aria-checked={formData.taxInvoicingPreference === 'standard'}
              className={`${styles.chipCard} ${formData.taxInvoicingPreference === 'standard' ? styles.chipCardActive : ''}`}
              onClick={() => onChangeField('taxInvoicingPreference', 'standard')}
            >
              <FileCode size={14} className={styles.inlineIcon} />
              Standard Digital Receipt
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={formData.taxInvoicingPreference === 'corporate_gst'}
              className={`${styles.chipCard} ${formData.taxInvoicingPreference === 'corporate_gst' ? styles.chipCardActive : ''}`}
              onClick={() => onChangeField('taxInvoicingPreference', 'corporate_gst')}
            >
              <Building2 size={14} className={styles.inlineIcon} />
              GST / Corporate Invoice Required
            </button>
          </div>
          {formData.taxInvoicingPreference === 'corporate_gst' && (
            <p className={styles.chipHelpText}>
              <Building2 size={12} className={styles.inlineIcon} />
              Baseline estimates reflect developer fees. Applicable 18% GST (with GSTIN input tax credit) will be itemized on formal corporate tax invoices.
            </p>
          )}
        </div>
      </div>

      {/* Deferred Lead Capture: Contact Email & Phone */}
      <div className={styles.field}>
        <label className={styles.label}>
          <Mail size={14} className={styles.inlineIcon} />
          Proposal Delivery &amp; Contact Details
        </label>
        <p className={styles.fieldHint}>
          Specify where you want your formal scope brief, milestone schedule, and proposal saved.
        </p>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label}>
              <Mail size={14} className={styles.inlineIcon} />
              Contact Email {!user && '(Required to save proposal)'}
            </label>
            <input
              type="email"
              inputMode="email"
              className={styles.input}
              aria-label="Contact Email"
              placeholder="e.g., founder@company.com"
              value={formData.contactEmail || ''}
              onChange={(e) => onChangeField('contactEmail', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <Phone size={14} className={styles.inlineIcon} />
              Contact Phone / WhatsApp (Optional)
            </label>
            <input
              type="tel"
              inputMode="tel"
              className={styles.input}
              aria-label="Contact Phone or WhatsApp"
              placeholder="e.g., +91 99107 93616 / +1 (555) 019-2831"
              value={formData.contactPhone || ''}
              onChange={(e) => onChangeField('contactPhone', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Structured Commercial Guarantees + Expandable Full Terms */}
      <div className={styles.field}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <label className={styles.label} style={{ margin: 0 }}>
            <FileCode size={14} className={styles.inlineIcon} />
            Standard Commercial Terms &amp; Guarantees
          </label>
          <button
            type="button"
            className={styles.termsAccordionToggle}
            onClick={() => setIsFullTermsOpen((prev) => !prev)}
            aria-expanded={isFullTermsOpen}
          >
            <span>{isFullTermsOpen ? 'Hide Full Legal Terms (8 Clauses) ▲' : 'View Full Legal Terms (8 Clauses) ▼'}</span>
          </button>
        </div>

        <div className={styles.guaranteesGrid}>
          <div className={styles.guaranteeCard}>
            <div className={styles.guaranteeHeader}>
              <Lock size={15} className={styles.guaranteeIcon} />
              <span>50% Milestone Lock</span>
            </div>
            <p className={styles.guaranteeDesc}>
              Deposit locks your sprint reservation. Final 50% balance is due only upon staging signoff and live handoff.
            </p>
          </div>

          <div className={styles.guaranteeCard}>
            <div className={styles.guaranteeHeader}>
              <ShieldCheck size={15} className={styles.guaranteeIcon} />
              <span>30-Day Post-Launch Warranty</span>
            </div>
            <p className={styles.guaranteeDesc}>
              Comprehensive bug fixes, performance tuning, and cross-browser fixes included at zero extra charge.
            </p>
          </div>

          <div className={styles.guaranteeCard}>
            <div className={styles.guaranteeHeader}>
              <Code2 size={15} className={styles.guaranteeIcon} />
              <span>100% IP Transfer</span>
            </div>
            <p className={styles.guaranteeDesc}>
              Full intellectual property, Git codebase repository, and production deployment credentials transfer to you.
            </p>
          </div>

          <div className={styles.guaranteeCard}>
            <div className={styles.guaranteeHeader}>
              <Scale size={15} className={styles.guaranteeIcon} />
              <span>Capped Commercial Liability</span>
            </div>
            <p className={styles.guaranteeDesc}>
              Professional indemnity capped strictly at developer fees paid; governed under New Delhi jurisdiction.
            </p>
          </div>
        </div>

        {isFullTermsOpen && (
          <div className={styles.termsContentBox}>
            {termsList.map((t, idx) => (
              <p key={idx}>{t}</p>
            ))}
          </div>
        )}
      </div>

      {/* Visual Payment Milestones with Real Computed Cash Figures */}
      <div className={styles.paymentMilestones}>
        <div className={styles.milestoneStep}>
          <span className={styles.milestoneBadge}>50%</span>
          <span className={styles.milestoneTitle}>Upfront Deposit</span>
          <span className={styles.milestoneAmount}>
            {formatPricePair(depositINR, depositUSD, currency)}
          </span>
        </div>
        <div className={styles.milestoneConnector} />
        <div className={styles.milestoneStep}>
          <span className={styles.milestoneBadge}>Build</span>
          <span className={styles.milestoneTitle}>Development &amp; QA</span>
          <span className={styles.milestoneAmount}>Sprint Milestone</span>
        </div>
        <div className={styles.milestoneConnector} />
        <div className={styles.milestoneStep}>
          <span className={styles.milestoneBadge}>50%</span>
          <span className={styles.milestoneTitle}>Final Handoff</span>
          <span className={styles.milestoneAmount}>
            {formatPricePair(balanceINR, balanceUSD, currency)}
          </span>
        </div>
      </div>

      {/* Mandated Pre-submission Agreement Checkbox */}
      <div className={styles.termsCheckboxBox}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            className={styles.checkboxInput}
            checked={formData.agreedToTerms}
            onChange={(e) => onChangeField('agreedToTerms', e.target.checked)}
          />
          <span>
            <strong>I agree to the Master Services Agreement &amp; Standard Commercial Terms</strong> (50% upfront deposit lock, 30-day warranty, liability capped at fees paid, New Delhi jurisdiction, and 100% IP transfer upon final payment).
          </span>
        </label>
        {agreedToTermsError && !formData.agreedToTerms && (
          <p className={`${styles.fieldHint} ${styles.formError}`} role="alert">
            You must accept the terms to submit your scope.
          </p>
        )}
      </div>
    </div>
  );
}
