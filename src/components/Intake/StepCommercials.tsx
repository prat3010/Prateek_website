import React, { useRef, useEffect } from 'react';
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
} from 'lucide-react';
import NumberFlow from '@number-flow/react';
import Portal from '@/components/ui/Portal';
import type { BaseEngineItem, MaintenancePlanOption } from '@/data/resume';
import { type Currency } from '@/lib/pricing';
import styles from './IntakeForm.module.css';

interface StepCommercialsProps {
  selectedEngine: BaseEngineItem;
  totalCost: {
    totalINR: number;
    totalUSD: number;
    featuresINR: number;
    featuresUSD: number;
    brandOpt: { label: string; priceINR: number; priceUSD: number };
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
}: StepCommercialsProps) {
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
    <div className={styles.formStep}>
      <div className={styles.groupTitle} ref={stepHeadingRef} tabIndex={-1}>
        <ShieldCheck size={18} />
        <span>STEP 4: COMMERCIAL PROPOSAL &amp; MAINTENANCE CARE PLAN</span>
      </div>

      {/* Summary Box */}
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
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {isAutoRecommended && <div className={styles.careCardBadge}>{p.badge}</div>}
                    <div className={styles.careCardTitle}>
                      {p.name}
                      <button
                        type="button"
                        onClick={(ev) => togglePopover(ev, p.id)}
                        className={`${styles.infoBtn} ${isPopoverOpen ? styles.infoBtnActive : ''}`}
                        title="Click to view Technical SLA Specs"
                        aria-label="View Technical SLA Specs"
                      >
                        <Info size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.careCardPrice}>
                  {p.priceINR > 0
                    ? `${priceInCurrency(p.priceINR, p.priceUSD)}${p.period}`
                    : 'Included (30-Day Warranty)'}
                </div>
                <p className={styles.careCardDesc}>
                  {p.laymanDescription}
                </p>

                <ul className={styles.careCardList}>
                  {p.includes.map((inc, iIdx) => (
                    <li key={iIdx}>{inc}</li>
                  ))}
                </ul>

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
                              TECHNICAL SLA SPECS
                            </span>
                            <button
                                type="button"
                                ref={popoverCloseRef}
                                className={styles.popoverCloseBtn}
                                aria-label="Close"
                                onClick={() => {
                                  setActivePopoverId(null);
                                  setPopoverAnchor(null);
                                }}
                              >
                                <X size={12} />
                              </button>
                          </div>
                          <p className={styles.popoverTechText}>{p.techSpecs}</p>
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
            Target Launch Timeline
          </label>
          <select
            className={styles.select}
            value={formData.timeline}
            onChange={(e) => onChangeField('timeline', e.target.value)}
          >
            {timelineOptions.map((tl) => (
              <option key={tl} value={tl}>
                {tl}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <FileText size={14} className={styles.inlineIcon} />
            Additional Scope Notes (Optional)
          </label>
          <input
            type="text"
            className={styles.input}
            placeholder="Special constraints, legacy data to migrate..."
            value={formData.additionalNotes}
            onChange={(e) => onChangeField('additionalNotes', e.target.value)}
          />
        </div>
      </div>

      <div className={`${styles.fieldGrid} ${styles.fieldMarginTop}`}>
        <div className={styles.field}>
          <label className={styles.label}>
            <Cloud size={14} className={styles.inlineIcon} />
            Cloud Infrastructure Ownership
          </label>
          <div className={styles.chipGrid} role="radiogroup" aria-label="Cloud Infrastructure Ownership">
            <button
              type="button"
              role="radio"
              aria-checked={formData.hostingOwnership === 'client_owned'}
              className={`${styles.chipCard} ${formData.hostingOwnership === 'client_owned' ? styles.chipCardActive : ''}`}
              onClick={() => onChangeField('hostingOwnership', 'client_owned')}
            >
              <Globe size={14} className={styles.inlineIcon} />
              Client-Owned Accounts
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={formData.hostingOwnership === 'needs_setup'}
              className={`${styles.chipCard} ${formData.hostingOwnership === 'needs_setup' ? styles.chipCardActive : ''}`}
              onClick={() => onChangeField('hostingOwnership', 'needs_setup')}
            >
              <Wrench size={14} className={styles.inlineIcon} />
              Setup Support Required
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
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          <FileCode size={14} className={styles.inlineIcon} />
          Standard Commercial Terms (T&amp;Cs) Summary
        </label>
        <div className={styles.termsContentBox}>
          {termsList.map((t, idx) => (
            <p key={idx}>{t}</p>
          ))}
        </div>
      </div>

      {/* Visual Payment Milestones (Issue 3.1) */}
      <div className={styles.paymentMilestones}>
        <div className={styles.milestoneStep}>
          <span className={styles.milestoneBadge}>50%</span>
          <span>Upfront Deposit</span>
        </div>
        <div className={styles.milestoneConnector} />
        <div className={styles.milestoneStep}>
          <span className={styles.milestoneBadge}>Build</span>
          <span>Development &amp; QA</span>
        </div>
        <div className={styles.milestoneConnector} />
        <div className={styles.milestoneStep}>
          <span className={styles.milestoneBadge}>50%</span>
          <span>Final Handoff</span>
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
            <strong>I agree to the Standard Commercial Terms</strong> (50% upfront deposit to initiate development, 50% upon final delivery prior to source code transfer &amp; deployment handoff).
          </span>
        </label>
        {agreedToTermsError && !formData.agreedToTerms && (
          <p className={styles.fieldHint} role="alert">
            You must accept the terms to submit your scope.
          </p>
        )}
      </div>
    </div>
  );
}
