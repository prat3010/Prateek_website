'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { isAdminEmail } from '@/lib/auth';
import { recalculateCanonicalScopeQuote } from '@/lib/pricing';
import {
  LogOut,
  ShieldCheck,
  Layers,
  CreditCard,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { generateQuestionnairePDF, generateExecutiveBriefPDF } from '@/utils/pdfGenerator';
import type { ClientScope, InvoiceEntity } from '@/lib/clientOrder';
import { resolveMaintenancePlanKey } from '@/lib/clientOrder';
import { toast } from 'sonner';

import resumeData from '@/data/resume.json';
import type { ResumeData } from '@/data/resume';
import { WorkspaceSwitcher } from '@/components/ui/WorkspaceSwitcher';
import ClientProjectCopilot from '@/components/ClientDashboard/ClientProjectCopilot';
import { ScopeCard } from '@/components/ClientDashboard/ScopeCard';
import { ScopeEditorModal } from '@/components/ClientDashboard/ScopeEditorModal';
import { SowSignoffModal } from '@/components/ClientDashboard/SowSignoffModal';
import { ProposalSuiteModal } from '@/components/ClientDashboard/ProposalSuiteModal';
import { StagingPreviewModal } from '@/components/ClientDashboard/StagingPreviewModal';
import { InvoiceCreatorModal } from '@/components/ClientDashboard/InvoiceCreatorModal';
import { InvoiceLedgerTable } from '@/components/ClientDashboard/InvoiceLedgerTable';
import { OnboardingChecklistWidget } from '@/components/ClientDashboard/OnboardingChecklistWidget';
import { useDashboardScopes } from '@/hooks/dashboard/useDashboardScopes';
import { useDashboardInvoices } from '@/hooks/dashboard/useDashboardInvoices';
import styles from './dashboard.module.css';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const { user, loading, logout, loginWithGoogle, getAccessToken } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!loading && user && isAdminEmail(user.email)) {
      const params =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const hasPreviewOrImport =
        params?.get('preview') === 'client' ||
        params?.get('imported') === 'true' ||
        Boolean(params?.get('scopeCode')) ||
        (typeof window !== 'undefined' && Boolean(localStorage.getItem('prateeq_pending_scope')));
      if (!hasPreviewOrImport) {
        router.replace('/admin');
      }
    }
  }, [user, loading, router]);

  const [pendingScopePreview] = useState<{
    scopeCode?: string;
    companyName?: string;
    baseEngineTitle?: string;
  } | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('prateeq_pending_scope');
      if (raw) return JSON.parse(raw);
    } catch {}
    const match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent('prateeq_pending_scope') + '=([^;]*)'));
    if (match) {
      try { return JSON.parse(decodeURIComponent(match[1])); } catch {}
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('scopeCode') || params.get('engine')) {
      return {
        scopeCode: params.get('scopeCode') || undefined,
        companyName: params.get('company') || undefined,
        baseEngineTitle: params.get('engine') || undefined,
      };
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {

      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        toast.error(`Authentication Notice: ${decodeURIComponent(err)}`);
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
      const imported = params.get('imported');
      if (imported === 'true') {
        const scopeCode = params.get('scopeCode');
        toast.success(scopeCode ? `🎉 Scope ${scopeCode} successfully synced to your workspace!` : '🎉 Scoping brief successfully synced to your workspace!');
        const url = new URL(window.location.href);
        url.searchParams.delete('imported');
        url.searchParams.delete('scopeCode');
        url.searchParams.delete('company');
        url.searchParams.delete('engine');
        url.searchParams.delete('currency');
        url.searchParams.delete('costINR');
        url.searchParams.delete('costUSD');
        url.searchParams.delete('features');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'scopes' | 'onboarding' | 'invoices'>('scopes');
  const [authGateError, setAuthGateError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Modal States
  const [customizingScope, setCustomizingScope] = useState<ClientScope | null>(null);
  const [signingScope, setSigningScope] = useState<ClientScope | null>(null);
  const [proposalSuiteScope, setProposalSuiteScope] = useState<ClientScope | null>(null);
  const [downloadingPdfFormat, setDownloadingPdfFormat] = useState<'exec' | 'sow' | null>(null);
  const [stagingPreviewScope, setStagingPreviewScope] = useState<ClientScope | null>(null);
  const [isSubmittingChangeOrder, setIsSubmittingChangeOrder] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  // Scopes & Invoices Data Hooks
  const {
    scopes,
    setScopes,
    scopeChangeOrders,
    isLoading: isScopesLoading,
    saveScopeToDatabase,
    loadChangeOrders,
    handleDeleteScope,
    updateScope,
  } = useDashboardScopes({
    userEmail: user?.email,
    getAccessToken,
    setAuthGateError,
  });

  const {
    invoices,
    setInvoices,
    isInvoiceLoading,
    showInvoiceModal,
    setShowInvoiceModal,
    loadInvoices,
    handleDownloadInvoicePdf,
    handleInvoiceCreated,
  } = useDashboardInvoices({
    userEmail: user?.email,
    getAccessToken,
  });

  // Razorpay Checkout Integration
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.Razorpay) return resolve(true);

      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayCheckout = async (scope: ClientScope, paymentStructure?: '50/50' | '40/30/30') => {
    try {
      // Ensure scope is persisted to database before initiating payment
      await saveScopeToDatabase(scope);

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Could not load Razorpay checkout SDK. Please check your network connection.');
        return;
      }

      const selectedStructure = paymentStructure || scope.payment_structure || '50/50';
      const isThreePart = selectedStructure === '40/30/30';
      const pct = isThreePart ? 0.4 : 0.5;
      const pctText = isThreePart ? '40%' : '50%';

      const accessToken = await getAccessToken();
      const res = await fetch('/api/client/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          scopeCode: scope.scope_code,
          totalCostINR: scope.total_cost_inr,
          totalCostUSD: scope.total_cost_usd,
          currency: scope.currency,
          companyName: scope.company_name,
          paymentStructure: selectedStructure,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        toast.error(`Order Creation Error: ${errJson.error || 'Failed to initialize payment'}`);
        return;
      }

      const orderData = await res.json();

      if (orderData.isMock) {
        const depositDisplay =
          scope.currency === 'INR'
            ? `₹${Math.round(scope.total_cost_inr * pct).toLocaleString('en-IN')}`
            : `$${Math.round(scope.total_cost_usd * pct).toLocaleString('en-US')}`;

        const confirmSimulated = window.confirm(
          `⚡ Razorpay Sandbox Mode (Offline Dev Server):\n\nSimulate successful ${pctText} deposit lock (${depositDisplay}) for Scope ${scope.scope_code}?`
        );

        if (confirmSimulated) {
          try {
            const token = await getAccessToken();
            const verifyRes = await fetch('/api/client/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                scopeCode: scope.scope_code,
                razorpayOrderId: orderData.orderId,
                razorpayPaymentId: `pay_mock_${Date.now()}`,
                razorpaySignature: 'mock_signature_dev_pass',
              }),
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              setScopes((prev) =>
                prev.map((s) =>
                  s.id === scope.id
                    ? {
                        ...s,
                        deposit_paid: true,
                        payment_structure: selectedStructure,
                        delivery_stage: 'engineering',
                        status: 'Active Sprint — In Engineering',
                        sow_hash: verifyData.sowHash || s.sow_hash,
                      }
                    : s
                )
              );
              await loadInvoices();
              toast.success(`🎉 ${pctText} Deposit confirmed! Scope has moved to Core Engineering sprint.`);
            }
          } catch (verErr) {
            console.error('Mock verification error:', verErr);
          }
        }
        return;
      }

      if (typeof window === 'undefined' || !window.Razorpay) {
        toast.error('Payment gateway script failed to load. Please refresh and try again.');
        return;
      }

      if (orderData.convertedFromUSD) {
        toast.info(
          `International card processing: billed in INR (₹${(orderData.amount / 100).toLocaleString('en-IN')}) via bank conversion.`
        );
      }

      const RazorpayClass = window.Razorpay;
      const rzp = new RazorpayClass({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Prateeq Studio',
        description: `${pctText} Milestone Deposit for Scope #${scope.scope_code}`,
        order_id: orderData.orderId,
        handler: async (response: Record<string, string>) => {
          try {
            const token = await getAccessToken();
            const verifyRes = await fetch('/api/client/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                scopeCode: scope.scope_code,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              setScopes((prev) =>
                prev.map((s) =>
                  s.id === scope.id
                    ? {
                        ...s,
                        deposit_paid: true,
                        payment_structure: selectedStructure,
                        delivery_stage: 'engineering',
                        status: 'Active Sprint — In Engineering',
                        sow_hash: verifyData.sowHash || s.sow_hash,
                      }
                    : s
                )
              );
              await loadInvoices();
              toast.success('🎉 Deposit captured! Sprint milestone is now unlocked.');
            } else {
              toast.error('Payment signature verification failed. Please contact engineering support.');
            }
          } catch (verErr) {
            console.error('Verification network error:', verErr);
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || scope.company_name,
          email: user?.email,
          contact: scope.client_phone || '',
        },
        theme: { color: '#00f0ff' },
        modal: {
          ondismiss: () => {
            toast.info('Deposit payment window closed. Scope remains saved in draft.');
          },
        },
      });

      rzp.open();
    } catch (err) {
      console.error('Checkout launch error:', err);
    }
  };

  const handlePayBalance = async (scope: ClientScope) => {
    if (scope.balance_paid || scope.is_fully_paid) {
      toast.info('The final balance for this scope has already been settled.');
      return;
    }

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Could not load Razorpay checkout SDK. Please check your network connection.');
        return;
      }

      const isThreePart = scope.payment_structure === '40/30/30';
      const pct = isThreePart ? 0.3 : 0.5;
      const pctText = isThreePart ? '30%' : '50%';

      const accessToken = await getAccessToken();
      const res = await fetch('/api/client/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          scopeCode: scope.scope_code,
          isBalancePayment: true,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        toast.error(`Order Creation Error: ${errJson.error || 'Failed to initialize balance payment'}`);
        return;
      }

      const orderData = await res.json();

      if (orderData.isMock) {
        const balanceDisplay =
          scope.currency === 'USD'
            ? `$${Math.round(Number(scope.total_cost_usd || 0) * pct).toLocaleString('en-US')}`
            : `₹${Math.round(Number(scope.total_cost_inr || 0) * pct).toLocaleString('en-IN')}`;

        const confirmSimulated = window.confirm(
          `⚡ Razorpay Sandbox Mode (Offline Dev Server):\n\nSimulate settling ${pctText} final balance (${balanceDisplay}) for Scope ${scope.scope_code}?`
        );

        if (confirmSimulated) {
          try {
            const token = await getAccessToken();
            const verifyRes = await fetch('/api/client/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                scopeCode: scope.scope_code,
                razorpayOrderId: orderData.orderId,
                razorpayPaymentId: `pay_mock_bal_${Date.now()}`,
                razorpaySignature: 'mock_signature_dev_pass',
              }),
            });

            if (verifyRes.ok) {
              setScopes((prev) =>
                prev.map((s) =>
                  s.id === scope.id
                    ? {
                        ...s,
                        balance_paid: true,
                        is_fully_paid: true,
                        delivery_stage: 'live',
                        status: 'Project Settled — Production Live',
                      }
                    : s
                )
              );
              await loadInvoices();
              toast.success(`🎉 ${pctText} Final balance settled! Production deployment unlocked.`);
            }
          } catch (verErr) {
            console.error('Mock verification error:', verErr);
          }
        }
        return;
      }

      if (typeof window === 'undefined' || !window.Razorpay) {
        toast.error('Payment gateway script failed to load. Please refresh and try again.');
        return;
      }

      const RazorpayClass = window.Razorpay;
      const rzp = new RazorpayClass({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Prateeq Studio',
        description: `${pctText} Final Milestone Balance for Scope #${scope.scope_code}`,
        order_id: orderData.orderId,
        handler: async (response: Record<string, string>) => {
          try {
            const token = await getAccessToken();
            const verifyRes = await fetch('/api/client/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                scopeCode: scope.scope_code,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              setScopes((prev) =>
                prev.map((s) =>
                  s.id === scope.id
                    ? {
                        ...s,
                        balance_paid: true,
                        is_fully_paid: true,
                        delivery_stage: 'live',
                        status: 'Project Settled — Production Live',
                      }
                    : s
                )
              );
              await loadInvoices();
              toast.success('🎉 Final balance settled! Your project is fully cleared for production live handover.');
            } else {
              toast.error('Payment signature verification failed. Please contact engineering support.');
            }
          } catch (verErr) {
            console.error('Verification network error:', verErr);
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || scope.company_name,
          email: user?.email,
          contact: scope.client_phone || '',
        },
        theme: { color: '#00f0ff' },
        modal: {
          ondismiss: () => {
            toast.info('Balance settlement window closed.');
          },
        },
      });

      rzp.open();
    } catch (err) {
      console.error('Balance checkout launch error:', err);
    }
  };

  const handleActivateMaintenance = async (scope: ClientScope) => {
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Could not load payment checkout gateway. Please check your network connection.');
        return;
      }

      const token = await getAccessToken();
      const curr = (scope.currency === 'USD' ? 'USD' : 'INR') as 'USD' | 'INR';
      const planId = resolveMaintenancePlanKey(scope.maintenance_plan, curr);

      const res = await fetch('/api/client/create-razorpay-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          planId,
          scopeCode: scope.scope_code,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        toast.error(`Subscription Error: ${errJson.error || 'Failed to initialize care plan subscription'}`);
        return;
      }

      const subData = await res.json();

      if (subData.isMock) {
        const confirmSimulated = window.confirm(
          `⚡ Razorpay Sandbox Mode (Offline Dev Server):\n\nSimulate activating monthly recurring care plan subscription (${planId}) for Scope ${scope.scope_code}?`
        );

        if (confirmSimulated) {
          try {
            const verifyRes = await fetch('/api/client/verify-razorpay-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                scopeCode: scope.scope_code,
                razorpaySubscriptionId: subData.subscriptionId,
                razorpayPaymentId: `pay_mock_care_${Date.now()}`,
                razorpaySignature: 'test_sub_signature_mock',
                planId,
                subscriptionType: 'care_plan',
              }),
            });

            if (verifyRes.ok) {
              const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              setScopes((prev) =>
                prev.map((s) =>
                  s.id === scope.id
                    ? {
                        ...s,
                        maintenance_subscription_id: subData.subscriptionId,
                        maintenance_status: 'active',
                        maintenance_current_period_end: currentPeriodEnd,
                      }
                    : s
                )
              );
              await loadInvoices();
              toast.success('🎉 Monthly maintenance retainer activated! Your SLA guarantee is now active.');
            }
          } catch (verErr) {
            console.error('Mock subscription verification error:', verErr);
          }
        }
        return;
      }

      if (typeof window === 'undefined' || !window.Razorpay) {
        toast.error('Payment gateway script failed to load. Please refresh and try again.');
        return;
      }

      const RazorpayClass = window.Razorpay;
      const rzp = new RazorpayClass({
        key: subData.keyId,
        subscription_id: subData.subscriptionId,
        name: 'Prateeq Studio',
        description: `Monthly Maintenance Care Retainer for Scope #${scope.scope_code}`,
        handler: async (response: Record<string, string>) => {
          try {
            const verifyRes = await fetch('/api/client/verify-razorpay-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                scopeCode: scope.scope_code,
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planId,
                subscriptionType: 'care_plan',
              }),
            });

            if (verifyRes.ok) {
              const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
              setScopes((prev) =>
                prev.map((s) =>
                  s.id === scope.id
                    ? {
                        ...s,
                        maintenance_subscription_id: response.razorpay_subscription_id,
                        maintenance_status: 'active',
                        maintenance_current_period_end: currentPeriodEnd,
                      }
                    : s
                )
              );
              await loadInvoices();
              toast.success('🎉 Monthly maintenance retainer activated! Your SLA guarantee is now active.');
            } else {
              toast.error('Subscription verification failed. Please contact engineering support.');
            }
          } catch (verErr) {
            console.error('Subscription verification network error:', verErr);
          }
        },
        prefill: {
          name: user?.user_metadata?.full_name || scope.company_name,
          email: user?.email,
          contact: scope.client_phone || '',
        },
        theme: { color: '#00f0ff' },
        modal: {
          ondismiss: () => {
            toast.info('Care retainer checkout window closed.');
          },
        },
      });

      rzp.open();
    } catch (err) {
      console.error('Activate maintenance error:', err);
    }
  };

  const handlePayInvoice = async (invoice: InvoiceEntity) => {
    if (invoice.payment_status === 'paid') {
      toast.info('This invoice has already been settled.');
      return;
    }

    if (invoice.payment_url) {
      window.open(invoice.payment_url, '_blank');
      return;
    }

    setPayingInvoiceId(invoice.id);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Could not load Razorpay checkout SDK. Please check your network connection.');
        setPayingInvoiceId(null);
        return;
      }

      const accessToken = await getAccessToken();
      const res = await fetch('/api/client/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        toast.error(`Invoice Checkout Error: ${errJson.error || 'Failed to initialize payment'}`);
        setPayingInvoiceId(null);
        return;
      }

      const orderData = await res.json();

      if (orderData.isMock) {
        try {
          const amountDisplay =
            invoice.currency === 'INR'
              ? `₹${Number(invoice.amount).toLocaleString('en-IN')}`
              : `$${Number(invoice.amount).toLocaleString('en-US')}`;

          const confirmSimulated = window.confirm(
            `⚡ Razorpay Sandbox Mode (Offline Dev Server):\n\nSimulate settling Invoice #${invoice.invoice_number} (${amountDisplay})?`
          );

          if (confirmSimulated) {
            try {
              const token = await getAccessToken();
              const verifyRes = await fetch('/api/client/verify-razorpay-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                  invoiceId: invoice.id,
                  invoiceNumber: invoice.invoice_number,
                  razorpayOrderId: orderData.orderId,
                  razorpayPaymentId: `pay_mock_${Date.now()}`,
                  razorpaySignature: 'mock_signature_dev_pass',
                }),
              });

              if (verifyRes.ok) {
                setInvoices((prev) =>
                  prev.map((inv) =>
                    inv.id === invoice.id || inv.invoice_number === invoice.invoice_number
                      ? { ...inv, payment_status: 'paid' }
                      : inv
                  )
                );
                await loadInvoices();
                toast.success(`🎉 Invoice #${invoice.invoice_number} settled successfully!`);
              } else {
                const err = await verifyRes.json().catch(() => ({}));
                toast.error(`Verification failed: ${err.error || 'Unknown error'}`);
              }
            } catch (verErr) {
              console.error('Mock invoice verification error:', verErr);
            }
          }
        } finally {
          setPayingInvoiceId(null);
        }
        return;
      }

      if (typeof window === 'undefined' || !window.Razorpay) {
        toast.error('Payment gateway script failed to load. Please refresh and try again.');
        setPayingInvoiceId(null);
        return;
      }

      const RazorpayClass = window.Razorpay;
      const rzp = new RazorpayClass({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Prateeq Studio',
        description: `Settlement for Invoice #${invoice.invoice_number}`,
        order_id: orderData.orderId,
        handler: async (response: Record<string, string>) => {
          try {
            const token = await getAccessToken();
            const verifyRes = await fetch('/api/client/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoice_number,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              setInvoices((prev) =>
                prev.map((inv) =>
                  inv.id === invoice.id || inv.invoice_number === invoice.invoice_number
                    ? { ...inv, payment_status: 'paid' }
                    : inv
                )
              );
              await loadInvoices();
              toast.success(`🎉 Invoice #${invoice.invoice_number} paid successfully!`);
            } else {
              toast.error('Payment signature verification failed. Please contact engineering support.');
            }
          } catch (verErr) {
            console.error('Invoice verification network error:', verErr);
          } finally {
            setPayingInvoiceId(null);
          }
        },
        prefill: {
          name: invoice.customer_name || user?.user_metadata?.full_name || '',
          email: invoice.customer_email || user?.email || '',
          contact: invoice.customer_phone || '',
        },
        theme: { color: '#00f0ff' },
        modal: {
          ondismiss: () => {
            setPayingInvoiceId(null);
            toast.info('Invoice payment window closed.');
          },
        },
      });

      rzp.open();
    } catch (checkoutErr) {
      console.error('Invoice payment gateway error:', checkoutErr);
      toast.error('Failed to launch invoice payment gateway.');
      setPayingInvoiceId(null);
    }
  };

  // Change Order Submission
  const handleSubmitChangeOrder = async (
    scope: ClientScope,
    addedFeatures: string[],
    removedFeatures: string[],
    deltaINR: number,
    deltaUSD: number
  ) => {
    setIsSubmittingChangeOrder(true);
    try {
      const accessToken = await getAccessToken();
      const res = await fetch('/api/client/change-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          scopeCode: scope.scope_code,
          addedFeatures,
          removedFeatures,
          priceDeltaINR: deltaINR,
          priceDeltaUSD: deltaUSD,
          timelineImpact: addedFeatures.length > 2 ? '+2 Weeks' : addedFeatures.length > 0 ? '+1 Week' : 'Standard Delivery',
        }),
      });

      if (res.ok) {
        await loadChangeOrders(scope.scope_code);
        await loadInvoices();
        setCustomizingScope(null);
        toast.success('✅ Phase 2 Change Order submitted and added to Invoices ledger!');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(`Change Order Error: ${errData.error || 'Failed to create change order'}`);
      }
    } catch (err) {
      console.error('Change order submit error:', err);
      toast.error('Failed to submit change order.');
    } finally {
      setIsSubmittingChangeOrder(false);
    }
  };

  // Proposal PDF Suite Downloads
  const handleDownloadExecutiveBrief = async (scope: ClientScope) => {
    try {
      setDownloadingPdfFormat('exec');
      const isNoir = theme === 'noir';
      const currency = (scope.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD';
      const canonicalQuote = recalculateCanonicalScopeQuote({
        baseEngineTitle: scope.base_engine,
        selectedFeatures: scope.features,
        brandAssetOption: scope.brand_asset,
        maintenancePlan: scope.maintenance_plan,
      });
      await generateExecutiveBriefPDF(
        resumeData as unknown as ResumeData,
        {
          companyName: scope.company_name || user?.user_metadata?.full_name || 'Client Scope',
          contactEmail: user?.email || '',
          contactPhone: scope.client_phone || '',
          projectGoal: `${scope.base_engine} Custom Architecture`,
          businessKPI: scope.business_kpi,
          targetAudience: 'Global / Enterprise',
          projectCategory: scope.base_engine,
          features: scope.features,
          assetsStatus: scope.brand_asset,
          maintenancePlan: scope.maintenance_plan,
          maintenanceCostINR: canonicalQuote.maintenanceINR,
          maintenanceCostUSD: canonicalQuote.maintenanceUSD,
          totalBuildCostINR: scope.total_cost_inr,
          totalBuildCostUSD: scope.total_cost_usd,
          timeline: scope.timeline,
        },
        isNoir,
        currency
      );
      setProposalSuiteScope(null);
    } catch (pdfErr) {
      console.error('Executive PDF export error:', pdfErr);
      toast.error('Could not generate Executive Brief PDF.');
    } finally {
      setDownloadingPdfFormat(null);
    }
  };

  const handleDownloadMasterSOW = async (scope: ClientScope) => {
    try {
      setDownloadingPdfFormat('sow');
      const isNoir = theme === 'noir';
      const currency = (scope.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD';
      const canonicalQuote = recalculateCanonicalScopeQuote({
        baseEngineTitle: scope.base_engine,
        selectedFeatures: scope.features,
        brandAssetOption: scope.brand_asset,
        maintenancePlan: scope.maintenance_plan,
      });
      await generateQuestionnairePDF(
        resumeData as unknown as ResumeData,
        {
          companyName: scope.company_name || user?.user_metadata?.full_name || 'Client Scope',
          contactEmail: user?.email || '',
          contactPhone: scope.client_phone || '',
          projectGoal: `${scope.base_engine} Custom Architecture`,
          businessKPI: scope.business_kpi,
          targetAudience: 'Global / Enterprise',
          projectCategory: scope.base_engine,
          features: scope.features,
          assetsStatus: scope.brand_asset,
          maintenancePlan: scope.maintenance_plan,
          maintenanceCostINR: canonicalQuote.maintenanceINR,
          maintenanceCostUSD: canonicalQuote.maintenanceUSD,
          totalBuildCostINR: scope.total_cost_inr,
          totalBuildCostUSD: scope.total_cost_usd,
          timeline: scope.timeline,
        },
        isNoir,
        currency
      );
      setProposalSuiteScope(null);
    } catch (pdfErr) {
      console.error('Master SOW PDF export error:', pdfErr);
      toast.error('Could not generate Master SOW PDF.');
    } finally {
      setDownloadingPdfFormat(null);
    }
  };

  const handleProposalSuiteDownload = async (scope: ClientScope, format: 'exec' | 'sow') => {
    if (format === 'exec') {
      await handleDownloadExecutiveBrief(scope);
    } else {
      await handleDownloadMasterSOW(scope);
    }
  };

  // Auth Gate
  if (loading || isScopesLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading your client workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.authPromptContainer}>
        <div className={styles.authCard}>
          <ShieldCheck size={48} className={styles.authIcon} />
          <h2>Client Workspace Authentication</h2>
          {pendingScopePreview ? (
            <div className={styles.pendingScopeNotice}>
              <div className={styles.pendingScopeBadge}>Pending Scope Detected</div>
              <div className={styles.pendingScopeInfo}>
                <span className={styles.pendingScopeCode}>
                  {pendingScopePreview.scopeCode || 'Custom Scope Architecture'}
                </span>
                <span className={styles.pendingScopeDetails}>
                  {pendingScopePreview.companyName || pendingScopePreview.baseEngineTitle || 'Custom Technical Specification'}
                </span>
              </div>
              <p className={styles.pendingScopeHint}>
                Sign in with Google below to securely link and save this scope to your permanent client workspace.
              </p>
            </div>
          ) : (
            <p>Sign in with your verified Google account to view active project scopes, invoices, and sprint progress.</p>
          )}
          <button className={styles.googleSignInBtn} onClick={() => loginWithGoogle()}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link
              href="/login?redirect_to=/dashboard"
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                textDecoration: 'underline',
              }}
            >
              Sign in with Email or Magic Link →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardShell}>
      {/* Workspace Header */}
      <header className={styles.header}>
        <div className={styles.userInfo}>
          {user.user_metadata?.avatar_url && !avatarError ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata?.full_name || 'Client Avatar'}
              width={48}
              height={48}
              className={styles.avatar}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {(user.user_metadata?.full_name || user.email || 'C')[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className={styles.userName}>{user.user_metadata?.full_name || 'Valued Client'}</h1>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <WorkspaceSwitcher active="dashboard" />
          <button className={styles.logoutBtn} onClick={logout} title="Sign Out">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>


      {authGateError && (
        <div style={{ margin: '1rem 0', padding: '0.75rem 1rem', background: '#FF174422', border: '1px solid #FF1744', borderRadius: '8px', color: '#FF1744', fontSize: '0.85rem' }}>
          ⚠️ Authentication session expired or unauthorized. Please sign in again to save scope changes.
        </div>
      )}

      {/* Main Tab Navigation */}

      <nav className={styles.tabNav} role="tablist" aria-label="Dashboard views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'scopes'}
          className={`${styles.tabBtn} ${activeTab === 'scopes' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('scopes')}
        >
          {activeTab === 'scopes' && (
            <motion.span
              layoutId="activeDashboardTabPill"
              className={styles.tabPill}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className={styles.tabLabel}>
            <Layers size={18} />
            <span>Active Project Scopes ({scopes.length})</span>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'onboarding'}
          className={`${styles.tabBtn} ${activeTab === 'onboarding' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('onboarding')}
        >
          {activeTab === 'onboarding' && (
            <motion.span
              layoutId="activeDashboardTabPill"
              className={styles.tabPill}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className={styles.tabLabel}>
            <UserCheck size={18} />
            <span>Client Onboarding Checklist</span>
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'invoices'}
          className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          {activeTab === 'invoices' && (
            <motion.span
              layoutId="activeDashboardTabPill"
              className={styles.tabPill}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className={styles.tabLabel}>
            <CreditCard size={18} />
            <span>Invoices & Ledger ({invoices.length})</span>
          </span>
        </button>
      </nav>

      {/* Active Tab View */}
      {activeTab === 'scopes' && (
        <div className={styles.scopesList}>
          {scopes.length === 0 ? (
            <div className={styles.emptyState}>
              <Layers size={48} className={styles.emptyIcon} />
              <h3>No Project Scopes Found</h3>
              <p>Configure a custom architecture stack in the Scoping Lab to save a baseline proposal.</p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                <button
                  className={styles.createScopeBtn}
                  onClick={() => router.push('/scoping')}
                >
                  Go to Scoping Lab <ArrowRight size={16} />
                </button>
                <button
                  className={styles.createScopeBtn}
                  style={{ background: 'transparent', border: '1px solid #38bdf8', color: '#38bdf8' }}
                  onClick={() => router.push('/rag/app')}
                >
                  ⚡ Open Retriever AI Studio <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            scopes.map((scope) => (
              <ScopeCard
                key={scope.id || scope.scope_code}
                scope={scope}
                changeOrders={scopeChangeOrders[scope.scope_code] || []}
                onOpenCustomizer={(s) => setCustomizingScope(s)}
                onOpenSignoff={(s) => setSigningScope(s)}
                onOpenProposalSuite={(s) => setProposalSuiteScope(s)}
                onOpenStagingPreview={(s) => setStagingPreviewScope(s)}
                onDeleteScope={handleDeleteScope}
                onPayBalance={handlePayBalance}
                onActivateMaintenance={handleActivateMaintenance}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'onboarding' && (
        <OnboardingChecklistWidget
          scopes={scopes}
          activeScope={scopes[0] || null}
          onUpdateScope={updateScope}
        />
      )}

      {activeTab === 'invoices' && (
        <InvoiceLedgerTable
          invoices={invoices}
          isLoading={isInvoiceLoading}
          payingInvoiceId={payingInvoiceId}
          onOpenCreateModal={isAdminEmail(user.email) ? () => setShowInvoiceModal(true) : undefined}
          onDownloadPdf={handleDownloadInvoicePdf}
          onPayInvoice={handlePayInvoice}
          onRefresh={loadInvoices}
        />
      )}

      {/* Modals */}
      <ScopeEditorModal
        scope={customizingScope}
        isOpen={Boolean(customizingScope)}
        onClose={() => setCustomizingScope(null)}
        onSaveDraft={updateScope}
        onSubmitChangeOrder={handleSubmitChangeOrder}
        isSubmittingChangeOrder={isSubmittingChangeOrder}
      />

      <SowSignoffModal
        scope={signingScope}
        isOpen={Boolean(signingScope)}
        userEmail={user.email || ''}
        onClose={() => setSigningScope(null)}
        onConfirmAndPay={async (s, structure) => {
          try {
            const nowIso = new Date().toISOString();
            const signerEmail = user.email || '';
            const signedScope: ClientScope = {
              ...s,
              payment_structure: structure,
              signed_at: nowIso,
              signed_by_email: signerEmail,
              signedAt: nowIso,
              signedByEmail: signerEmail,
              onboarding_checklist: {
                ...(s.onboarding_checklist || {}),
                sow_accepted: true,
                signed_at: nowIso,
                signed_by_email: signerEmail,
              },
            };
            await updateScope(signedScope);
            await handleRazorpayCheckout(signedScope, structure);
          } finally {
            setSigningScope(null);
          }
        }}
      />

      <ProposalSuiteModal
        scope={proposalSuiteScope}
        isOpen={Boolean(proposalSuiteScope)}
        onClose={() => setProposalSuiteScope(null)}
        onDownload={handleProposalSuiteDownload}
        downloadingFormat={downloadingPdfFormat}
      />

      <StagingPreviewModal
        scope={stagingPreviewScope}
        isOpen={Boolean(stagingPreviewScope)}
        onClose={() => setStagingPreviewScope(null)}
        onPayBalance={handlePayBalance}
      />

      <InvoiceCreatorModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        getAccessToken={getAccessToken}
        onInvoiceCreated={handleInvoiceCreated}
        defaultCustomerName={user.user_metadata?.full_name || ''}
        defaultCustomerEmail={user.email || ''}
      />

      {/* Persistent Client Project Copilot Assistant */}
      <ClientProjectCopilot />
    </div>
  );
}
