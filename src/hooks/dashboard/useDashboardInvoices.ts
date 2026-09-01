'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let isMounted = true;
    if (userEmail) {
      Promise.resolve().then(async () => {
        if (!isMounted) return;
        setIsInvoiceLoading(true);
        const accessToken = await getAccessToken();
        if (!accessToken || !isMounted) {
          if (isMounted) setIsInvoiceLoading(false);
          return;
        }
        try {
          const res = await fetch('/api/client/get-invoices', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          if (data?.invoices && isMounted) {
            setInvoices(data.invoices);
          }
        } catch (err) {
          console.warn('Failed to load invoices:', err);
        } finally {
          if (isMounted) setIsInvoiceLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [userEmail, getAccessToken]);

  const loadInvoices = async () => {
    if (!userEmail) return;
    setIsInvoiceLoading(true);
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setIsInvoiceLoading(false);
      return;
    }
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
  };
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
