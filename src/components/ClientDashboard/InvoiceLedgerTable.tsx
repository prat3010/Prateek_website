'use client';

import React, { useState } from 'react';
import { CreditCard, Download, Plus, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrencyAmount } from '@/lib/invoicing';
import type { InvoiceEntity } from '@/lib/clientOrder';
import styles from '@/app/dashboard/dashboard.module.css';

interface InvoiceLedgerTableProps {
  invoices: InvoiceEntity[];
  isLoading: boolean;
  onOpenCreateModal: () => void;
  onDownloadPdf: (invoice: InvoiceEntity) => void;
  onPayInvoice: (invoice: InvoiceEntity) => void;
  onRefresh: () => void;
}

export function InvoiceLedgerTable({
  invoices,
  isLoading,
  onOpenCreateModal,
  onDownloadPdf,
  onPayInvoice,
  onRefresh,
}: InvoiceLedgerTableProps) {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return inv.payment_status === 'paid';
    if (filter === 'unpaid') return inv.payment_status === 'pending' || inv.payment_status === 'issued' || inv.payment_status === 'draft';
    return true;
  });

  return (
    <div className={styles.invoicesTabContainer}>
      <div className={styles.invoicesHeaderRow}>
        <div>
          <h3 className={styles.tabHeading}>Commercial Invoices & Payment Ledger</h3>
          <p className={styles.tabSubheading}>
            Track GST-compliant tax invoices, payment receipts, and settlement ledger.
          </p>
        </div>
        <div className={styles.invoicesHeaderActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Invoices"
          >
            <RefreshCw size={15} className={isLoading ? styles.spinning : ''} />
          </button>
          <button
            type="button"
            className={styles.createInvoiceBtn}
            onClick={onOpenCreateModal}
          >
            <Plus size={15} /> Create Invoice
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.categoryPills}>
        <button
          type="button"
          className={`${styles.categoryPill} ${filter === 'all' ? styles.categoryPillActive : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({invoices.length})
        </button>
        <button
          type="button"
          className={`${styles.categoryPill} ${filter === 'unpaid' ? styles.categoryPillActive : ''}`}
          onClick={() => setFilter('unpaid')}
        >
          Pending / Unpaid ({invoices.filter((i) => i.payment_status !== 'paid').length})
        </button>
        <button
          type="button"
          className={`${styles.categoryPill} ${filter === 'paid' ? styles.categoryPillActive : ''}`}
          onClick={() => setFilter('paid')}
        >
          Settled / Paid ({invoices.filter((i) => i.payment_status === 'paid').length})
        </button>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className={styles.emptyInvoicesBox}>
          <CreditCard size={36} className={styles.emptyIcon} />
          <h4>No Invoices Found</h4>
          <p>
            {filter === 'all'
              ? 'No commercial invoices have been issued for your active scopes yet.'
              : `No ${filter} invoices found.`}
          </p>
        </div>
      ) : (
        <div className={styles.invoicesTableWrapper}>
          <table className={styles.invoicesTable}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Description / Scope</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const isPaid = inv.payment_status === 'paid';
                const invoiceDate = inv.issue_date || inv.created_at || new Date().toISOString();
                return (
                  <tr key={inv.id}>
                    <td className={styles.invNumberCell}>
                      <span className={styles.invNumberText}>{inv.invoice_number}</span>
                    </td>
                    <td>{new Date(invoiceDate).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.invScopeText}>
                        {inv.customer_name || 'Client Project'}
                      </div>
                      {inv.line_items?.[0] && (
                        <div className={styles.invSubText}>
                          {inv.line_items[0].name} {inv.line_items.length > 1 ? `(+${inv.line_items.length - 1} more)` : ''}
                        </div>
                      )}
                    </td>
                    <td className={styles.invAmountCell}>
                      {formatCurrencyAmount(inv.amount, inv.currency || 'INR')}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${isPaid ? styles.statusBadgeLive : styles.statusBadgeArch}`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 size={12} /> Paid
                          </>
                        ) : (
                          <>
                            <Clock size={12} /> Due
                          </>
                        )}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className={styles.tableActionButtons}>
                        <button
                          type="button"
                          className={styles.pdfDownloadMiniBtn}
                          onClick={() => onDownloadPdf(inv)}
                          title="Download PDF"
                        >
                          <Download size={14} /> PDF
                        </button>
                        {!isPaid && (
                          <button
                            type="button"
                            className={styles.payMiniBtn}
                            onClick={() => onPayInvoice(inv)}
                          >
                            <CreditCard size={14} /> Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
