'use client';

import { useState, useCallback, useEffect } from 'react';
import type { InvoiceEntity } from '@/lib/clientOrder';
import { generateInvoicePDF } from '@/utils/pdfGenerator';

interface UseDashboardInvoicesProps {
  userEmail?: string | null;
  getAccessToken: () => Promise<string | null>;
}

export function useDashboardInvoices({
  userEmail,
  getAccessToken,
}: UseDashboardInvoicesProps) {
  const [invoices, setInvoices] = useState<InvoiceEntity[]>([]);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const loadInvoices = useCallback(async () => {
    if (!userEmail) return;
    const accessToken = await getAccessToken();
    if (!accessToken) return;
    setIsInvoiceLoading(true);
    try {
      const res = await fetch('/api/client/get-invoices', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data?.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.warn('Failed to load invoices:', err);
    } finally {
      setIsInvoiceLoading(false);
    }
  }, [userEmail, getAccessToken]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleDownloadInvoicePdf = (inv: InvoiceEntity) => {
    try {
      generateInvoicePDF(inv);
    } catch (err) {
      console.error('Invoice PDF download error:', err);
      alert('Failed to generate Invoice PDF.');
    }
  };

  const handleInvoiceCreated = (newInvoice: InvoiceEntity) => {
    setInvoices((prev) => [newInvoice, ...prev]);
    handleDownloadInvoicePdf(newInvoice);
  };

  return {
    invoices,
    setInvoices,
    isInvoiceLoading,
    showInvoiceModal,
    setShowInvoiceModal,
    loadInvoices,
    handleDownloadInvoicePdf,
    handleInvoiceCreated,
  };
}
