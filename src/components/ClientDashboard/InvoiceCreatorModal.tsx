'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, FileCheck } from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { calculateInvoiceTotals, SUPPORTED_CURRENCIES, formatCurrencyAmount } from '@/lib/invoicing';
import type { InvoiceEntity } from '@/lib/clientOrder';
import styles from '@/app/dashboard/dashboard.module.css';

interface InvoiceCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  getAccessToken: () => Promise<string | null>;
  onInvoiceCreated: (invoice: InvoiceEntity) => void;
}

export function InvoiceCreatorModal({
  isOpen,
  onClose,
  getAccessToken,
  onInvoiceCreated,
}: InvoiceCreatorModalProps) {
  const [invCustomerName, setInvCustomerName] = useState('');
  const [invCustomerEmail, setInvCustomerEmail] = useState('');
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
      tax_rate: number;
      tax_type: 'inclusive' | 'exclusive';
    }[]
  >([
    {
      name: 'Web Application Engineering Services',
      description: 'Phase 1 Core Engineering & Architecture Build',
      sac_hsn: '998314',
      rate: 87500,
      quantity: 1,
      tax_rate: 18,
      tax_type: 'exclusive',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        tax_rate: 18,
        tax_type: 'exclusive',
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setInvLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (index: number, field: string, value: string | number) => {
    setInvLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const calculatedTotals = calculateInvoiceTotals({
    currency: invCurrency,
    place_of_supply: invPlaceOfSupply || 'Delhi',
    line_items: invLineItems.map((item) => ({
      name: item.name || 'Untitled Line Item',
      description: item.description,
      sac_hsn: item.sac_hsn,
      rate: Number(item.rate) || 0,
      quantity: Number(item.quantity) || 1,
      tax_rate: Number(item.tax_rate) || 0,
      tax_type: item.tax_type,
    })),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomerName || !invCustomerEmail) {
      alert('Please provide customer name and email.');
      return;
    }
    if (invLineItems.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch('/api/client/create-razorpay-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
          },
          place_of_supply: invPlaceOfSupply,
          currency: invCurrency,
          line_items: invLineItems.map((item) => ({
            name: item.name || 'Services',
            description: item.description,
            sac_hsn: item.sac_hsn,
            rate: Number(item.rate) || 0,
            quantity: Number(item.quantity) || 1,
            tax_rate: Number(item.tax_rate) || 18,
            tax_type: item.tax_type,
          })),
          notes: invNotes,
          terms: invTerms,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.invoice) {
        onInvoiceCreated(data.invoice);
        onClose();
      } else {
        alert(`Invoice Error: ${data.error || 'Failed to create invoice'}`);
      }
    } catch (err) {
      console.error('Invoice creation error:', err);
      alert('Failed to submit invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
          className={`${styles.modalCard} ${styles.invoiceModalCard}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderTitle}>
              <FileCheck size={20} className={styles.modalIcon} />
              <div>
                <h3>Create GST-Compliant Commercial Invoice</h3>
                <p className={styles.modalSubtitle}>
                  Generate tax invoice with Razorpay payment link & PDF export
                </p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.invoiceForm}>
            <div className={styles.invoiceFormGrid}>
              {/* Customer Details */}
              <div className={styles.formSection}>
                <h4 className={styles.formSectionTitle}>1. Customer & Billing Entity</h4>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Customer / Company Name *</label>
                    <input
                      type="text"
                      required
                      value={invCustomerName}
                      onChange={(e) => setInvCustomerName(e.target.value)}
                      placeholder="e.g. Acme Corp Inc."
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Customer Email *</label>
                    <input
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
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={invCustomerPhone}
                      onChange={(e) => setInvCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={invCustomerGstin}
                      onChange={(e) => setInvCustomerGstin(e.target.value)}
                      placeholder="07AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Billing Street</label>
                    <input
                      type="text"
                      value={invStreet}
                      onChange={(e) => setInvStreet(e.target.value)}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>City, State & Pincode</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={invCity}
                        onChange={(e) => setInvCity(e.target.value)}
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={invState}
                        onChange={(e) => setInvState(e.target.value)}
                        placeholder="State"
                      />
                      <input
                        type="text"
                        value={invPincode}
                        onChange={(e) => setInvPincode(e.target.value)}
                        placeholder="Pincode"
                        style={{ width: '110px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>


              {/* Currency & Tax Place */}
              <div className={styles.formSection}>
                <h4 className={styles.formSectionTitle}>2. Currency & Place of Supply</h4>
                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label>Currency</label>
                    <select
                      value={invCurrency}
                      onChange={(e) => setInvCurrency(e.target.value)}
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Place of Supply (State)</label>
                    <input
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
                        />
                        <input
                          type="text"
                          placeholder="Details / Specifications"
                          value={item.description}
                          onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                        />
                      </div>
                      <div className={styles.lineItemFieldSmall}>
                        <input
                          type="text"
                          placeholder="SAC/HSN"
                          value={item.sac_hsn}
                          onChange={(e) => handleUpdateLineItem(idx, 'sac_hsn', e.target.value)}
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
                        />
                      </div>
                      {invLineItems.length > 1 && (
                        <button
                          type="button"
                          className={styles.removeLineItemBtn}
                          onClick={() => handleRemoveLineItem(idx)}
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
                    <label>Invoice Notes</label>
                    <input
                      type="text"
                      value={invNotes}
                      onChange={(e) => setInvNotes(e.target.value)}
                      placeholder="Thank you for choosing Prateeq Studio"
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Payment Terms</label>
                    <input
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
