'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import Portal from '@/components/ui/Portal';
import { useLenis } from 'lenis/react';
import { calculateInvoiceTotals, SUPPORTED_CURRENCIES, formatCurrencyAmount } from '@/lib/invoicing';
import type { InvoiceEntity } from '@/lib/clientOrder';
import styles from '@/app/dashboard/dashboard.module.css';

interface InvoiceCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  getAccessToken: () => Promise<string | null>;
  onInvoiceCreated: (invoice: InvoiceEntity) => void;
  defaultCustomerName?: string;
  defaultCustomerEmail?: string;
}

export function InvoiceCreatorModal({
  isOpen,
  onClose,
  getAccessToken,
  onInvoiceCreated,
  defaultCustomerName = '',
  defaultCustomerEmail = '',
}: InvoiceCreatorModalProps) {
  const [invCustomerName, setInvCustomerName] = useState(() => defaultCustomerName);
  const [invCustomerEmail, setInvCustomerEmail] = useState(() => defaultCustomerEmail);
  const [invCustomerPhone, setInvCustomerPhone] = useState('');
  const [invCustomerGstin, setInvCustomerGstin] = useState('');
  const [invStreet, setInvStreet] = useState('Central Park, CP');
  const [invCity, setInvCity] = useState('New Delhi');
  const [invState, setInvState] = useState('Delhi');
  const [invPincode, setInvPincode] = useState('110001');
  const [invPlaceOfSupply, setInvPlaceOfSupply] = useState('Delhi');
  const [invCurrency, setInvCurrency] = useState('INR');
  const [invNotes, setInvNotes] = useState(
    'Thank you for choosing Prateeq Studio for your engineering build.'
  );
  const [invTerms, setInvTerms] = useState(
    'Payment is due within 14 days of issue. Deliverables strictly subject to acceptance sign-off.'
  );
  const [invLineItems, setInvLineItems] = useState<
    {
      name: string;
      description: string;
      sac_hsn: string;
      rate: number;
      quantity: number;
    }[]
  >([
    {
      name: 'Custom Web Engineering & System Deployment',
      description: 'Milestone delivery as per agreed Statement of Work baseline',
      sac_hsn: '998314',
      rate: 150000,
      quantity: 1,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const lenis = useLenis();

  // Prevent background scrolling while modal is open and isolate from Lenis
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

  // Focus trapping and Escape key management (WCAG 2.1 AA)
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

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
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
      lastActiveElementRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddLineItem = () => {
    setInvLineItems((prev) => [
      ...prev,
      {
        name: '',
        description: '',
        sac_hsn: '998314',
        rate: 0,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveLineItem = (idx: number) => {
    setInvLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateLineItem = (
    idx: number,
    field: 'name' | 'description' | 'sac_hsn' | 'rate' | 'quantity',
    value: string | number
  ) => {
    setInvLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const calculatedTotals = calculateInvoiceTotals({
    line_items: invLineItems.map((li) => ({
      ...li,
      amount: li.rate * li.quantity,
    })),
    currency: invCurrency,
    place_of_supply: invPlaceOfSupply,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomerName.trim() || !invCustomerEmail.trim()) {
      toast.error('Customer name and email are mandatory.');
      return;
    }
    if (invLineItems.some((li) => !li.name.trim() || li.rate <= 0)) {
      toast.error('All line items must have a title and positive rate.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/client/create-razorpay-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customer_name: invCustomerName,
          customer_email: invCustomerEmail,
          customer_phone: invCustomerPhone,
          customer_gstin: invCustomerGstin,
          billing_address: {
            street: invStreet,
            city: invCity,
            state: invState,
            pincode: invPincode,
            country: 'India',
          },
          place_of_supply: invPlaceOfSupply,
          currency: invCurrency,
          line_items: invLineItems,
          notes: invNotes,
          terms_conditions: invTerms,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        toast.error(`Invoice Generation Failed: ${errJson.error || 'Server error'}`);
        return;
      }

      const created = await res.json();
      toast.success(`🎉 Invoice #${created.invoice_number} created successfully!`);
      onInvoiceCreated(created);
      onClose();
    } catch (err) {
      console.error('Invoice creation network failure:', err);
      toast.error('Could not connect to billing server. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose} role="presentation">
        <div
          ref={modalRef}
          className={`${styles.modalCard} ${styles.invoiceCreatorModalCard}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-creator-title"
          data-lenis-prevent
        >
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTitle}>
              <FileCheck size={20} className={styles.modalIcon} />
              <div>
                <h3 id="invoice-creator-title">Create GST-Compliant Commercial Invoice</h3>
                <p className={styles.modalSubtitle}>
                  Generate tax invoice with Razorpay payment link & PDF export
                </p>
              </div>
            </div>
            <button
              ref={closeBtnRef}
              className={styles.closeBtn}
              onClick={onClose}
              type="button"
              aria-label="Close invoice creator modal"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.invoiceForm}>
            <div className={styles.invoiceFormGrid} data-lenis-prevent>
              {/* Customer Details */}
              <div className={styles.formSection}>
                <h4 className={styles.formSectionTitle}>1. Customer & Billing Entity</h4>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-customer-name">Customer / Company Name *</label>
                    <input
                      id="inv-customer-name"
                      type="text"
                      required
                      value={invCustomerName}
                      onChange={(e) => setInvCustomerName(e.target.value)}
                      placeholder="e.g. Acme Corp Inc."
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-customer-email">Customer Email *</label>
                    <input
                      id="inv-customer-email"
                      type="email"
                      required
                      value={invCustomerEmail}
                      onChange={(e) => setInvCustomerEmail(e.target.value)}
                      placeholder="billing@acme.com"
                    />
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-customer-phone">Phone Number</label>
                    <input
                      id="inv-customer-phone"
                      type="tel"
                      value={invCustomerPhone}
                      onChange={(e) => setInvCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-customer-gstin">GSTIN (Optional)</label>
                    <input
                      id="inv-customer-gstin"
                      type="text"
                      value={invCustomerGstin}
                      onChange={(e) => setInvCustomerGstin(e.target.value)}
                      placeholder="07AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-customer-street">Billing Street</label>
                    <input
                      id="inv-customer-street"
                      type="text"
                      value={invStreet}
                      onChange={(e) => setInvStreet(e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-customer-city">City, State & Pincode</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        id="inv-customer-city"
                        type="text"
                        value={invCity}
                        onChange={(e) => setInvCity(e.target.value)}
                        placeholder="City"
                        aria-label="City"
                      />
                      <input
                        id="inv-customer-state"
                        type="text"
                        value={invState}
                        onChange={(e) => setInvState(e.target.value)}
                        placeholder="State"
                        aria-label="State"
                      />
                      <input
                        id="inv-customer-pincode"
                        type="text"
                        value={invPincode}
                        onChange={(e) => setInvPincode(e.target.value)}
                        placeholder="PIN"
                        style={{ maxWidth: '90px' }}
                        aria-label="Postal Pincode"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Taxation & Location */}
              <div className={styles.formSection}>
                <h4 className={styles.formSectionTitle}>2. Currency & Place of Supply</h4>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-currency">Invoice Currency</label>
                    <select
                      id="inv-currency"
                      value={invCurrency}
                      onChange={(e) => setInvCurrency(e.target.value)}
                      aria-label="Invoice Currency"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.symbol} {c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-place-of-supply">Place of Supply (State / Country)</label>
                    <input
                      id="inv-place-of-supply"
                      type="text"
                      value={invPlaceOfSupply}
                      onChange={(e) => setInvPlaceOfSupply(e.target.value)}
                      placeholder="e.g. Delhi or Maharashtra"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className={styles.formSection}>
                <div className={styles.lineItemsHeader}>
                  <h4 className={styles.formSectionTitle}>3. Deliverable Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className={styles.addLineItemBtn}
                  >
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                <div className={styles.lineItemsList}>
                  {invLineItems.map((item, idx) => (
                    <div key={idx} className={styles.lineItemRow}>
                      <div className={styles.lineItemFieldMain}>
                        <input
                          type="text"
                          required
                          placeholder="Item Name / Description"
                          value={item.name}
                          onChange={(e) => handleUpdateLineItem(idx, 'name', e.target.value)}
                          aria-label={`Item ${idx + 1} Name`}
                        />
                        <input
                          type="text"
                          placeholder="Details / Specifications"
                          value={item.description}
                          onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                          aria-label={`Item ${idx + 1} Details`}
                        />
                      </div>
                      <div className={styles.lineItemFieldSmall}>
                        <input
                          type="text"
                          placeholder="SAC/HSN"
                          value={item.sac_hsn}
                          onChange={(e) => handleUpdateLineItem(idx, 'sac_hsn', e.target.value)}
                          aria-label={`Item ${idx + 1} SAC/HSN code`}
                        />
                      </div>
                      <div className={styles.lineItemFieldSmall}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) =>
                            handleUpdateLineItem(idx, 'rate', parseFloat(e.target.value) || 0)
                          }
                          aria-label={`Item ${idx + 1} Rate`}
                        />
                      </div>
                      <div className={styles.lineItemFieldSmall}>
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateLineItem(idx, 'quantity', parseInt(e.target.value) || 1)
                          }
                          aria-label={`Item ${idx + 1} Quantity`}
                        />
                      </div>
                      {invLineItems.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeLineItemBtn}
                          onClick={() => handleRemoveLineItem(idx)}
                          aria-label={`Remove item ${idx + 1}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Terms */}
              <div className={styles.formSection}>
                <h4 className={styles.formSectionTitle}>4. Notes & Terms</h4>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-notes">Invoice Notes</label>
                    <input
                      id="inv-notes"
                      type="text"
                      value={invNotes}
                      onChange={(e) => setInvNotes(e.target.value)}
                      placeholder="Thank you for choosing Prateeq Studio"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="inv-terms">Payment Terms</label>
                    <input
                      id="inv-terms"
                      type="text"
                      value={invTerms}
                      onChange={(e) => setInvTerms(e.target.value)}
                      placeholder="Payment due in 14 days"
                    />
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className={styles.invoiceTotalsSummary}>
                <div className={styles.totalRow}>
                  <span>Taxable Subtotal:</span>
                  <span>{formatCurrencyAmount(calculatedTotals.subtotal, invCurrency)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Total Tax ({calculatedTotals.is_gst ? 'GST' : 'Tax'}):</span>
                  <span>{formatCurrencyAmount(calculatedTotals.tax_breakup.total_tax, invCurrency)}</span>
                </div>
                <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
                  <span>Grand Total:</span>
                  <span>{formatCurrencyAmount(calculatedTotals.grand_total, invCurrency)}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button type="submit" className={styles.confirmBtn} disabled={isSubmitting}>
                {isSubmitting ? (
                  'Creating Invoice...'
                ) : (
                  <>
                    <FileCheck size={16} /> Generate Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
