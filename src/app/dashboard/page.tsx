'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/lib/auth';
import {
  LogOut,
  ShieldCheck,
  Layers,
  CreditCard,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { generateQuestionnairePDF, generateExecutiveBriefPDF } from '@/utils/pdfGenerator';
import type { ClientScope } from '@/lib/clientOrder';

import resumeData from '@/data/resume.json';
import type { ResumeData } from '@/data/resume';
import WorkspaceSwitcher from '@/components/ui/WorkspaceSwitcher';
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

  useEffect(() => {
    if (!loading && user && isAdminEmail(user.email)) {
      router.replace('/admin');
    }
  }, [user, loading, router]);

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

  // Scopes & Invoices Data Hooks
  const {
    scopes,
    setScopes,
    scopeChangeOrders,
    isLoading: isScopesLoading,
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

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayCheckout = async (scope: ClientScope) => {
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Could not load Razorpay checkout SDK. Please check your network connection.');
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
          scopeCode: scope.scope_code,
          totalCostINR: scope.total_cost_inr,
          totalCostUSD: scope.total_cost_usd,
          currency: scope.currency,
          companyName: scope.company_name,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        alert(`Order Creation Error: ${errJson.error || 'Failed to initialize payment'}`);
        return;
      }

      const orderData = await res.json();

      if (orderData.isMock) {
        const depositDisplay =
          scope.currency === 'INR'
            ? `₹${Math.round(scope.total_cost_inr * 0.5).toLocaleString('en-IN')}`
            : `$${Math.round(scope.total_cost_usd * 0.5).toLocaleString('en-US')}`;

        const confirmSimulated = window.confirm(
          `⚡ Razorpay Sandbox Mode (Offline Dev Server):\n\nSimulate successful 50% deposit lock (${depositDisplay}) for Scope ${scope.scope_code}?`
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
                        delivery_stage: 'engineering',
                        status: 'Active Sprint — In Engineering',
                        sow_hash: verifyData.sowHash || s.sow_hash,
                      }
                    : s
                )
              );
              alert('🎉 50% Deposit confirmed! Scope has moved to Core Engineering sprint.');
            }
          } catch (verErr) {
            console.error('Mock verification error:', verErr);
          }
        }
        return;
      }

      if (typeof window === 'undefined' || !window.Razorpay) {
        alert('Payment gateway script failed to load. Please refresh and try again.');
        return;
      }

      const RazorpayClass = window.Razorpay;
      const rzp = new RazorpayClass({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Prateeq Studio',
        description: `50% Milestone Deposit for Scope #${scope.scope_code}`,
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
                        delivery_stage: 'engineering',
                        status: 'Active Sprint — In Engineering',
                        sow_hash: verifyData.sowHash || s.sow_hash,
                      }
                    : s
                )
              );
              alert('🎉 Deposit captured! Sprint milestone is now unlocked.');
            } else {
              alert('Payment signature verification failed. Please contact engineering support.');
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
      });

      rzp.open();
    } catch (err) {
      console.error('Checkout launch error:', err);
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
        alert('✅ Phase 2 Change Order submitted and added to Invoices ledger!');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Change Order Error: ${errData.error || 'Failed to create change order'}`);
      }
    } catch (err) {
      console.error('Change order submit error:', err);
      alert('Failed to submit change order.');
    } finally {
      setIsSubmittingChangeOrder(false);
    }
  };

  // Proposal PDF Suite Downloads
  const handleDownloadExecutiveBrief = async (scope: ClientScope) => {
    try {
      setDownloadingPdfFormat('exec');
      const isNoir = true;
      const currency = (scope.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD';
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
      alert('Could not generate Executive Brief PDF.');
    } finally {
      setDownloadingPdfFormat(null);
    }
  };

  const handleDownloadMasterSOW = async (scope: ClientScope) => {
    try {
      setDownloadingPdfFormat('sow');
      const isNoir = true;
      const currency = (scope.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD';
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
      alert('Could not generate Master SOW PDF.');
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
          <p>Sign in with your verified Google account to view active project scopes, invoices, and sprint progress.</p>
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

      <nav className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'scopes' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('scopes')}
        >
          <Layers size={18} />
          <span>Active Project Scopes ({scopes.length})</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'onboarding' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('onboarding')}
        >
          <UserCheck size={18} />
          <span>Client Onboarding Checklist</span>
        </button>

        <button
          className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <CreditCard size={18} />
          <span>Invoices & Ledger ({invoices.length})</span>
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
              <button
                className={styles.createScopeBtn}
                onClick={() => router.push('/scoping')}
              >
                Go to Scoping Lab <ArrowRight size={16} />
              </button>
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
          onOpenCreateModal={() => setShowInvoiceModal(true)}
          onDownloadPdf={handleDownloadInvoicePdf}
          onPayInvoice={(inv) => alert(`Direct checkout for invoice #${inv.invoice_number} initiated!`)}
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
        onConfirmAndPay={async (s) => {
          setSigningScope(null);
          await handleRazorpayCheckout(s);
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
      />

      <InvoiceCreatorModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        getAccessToken={getAccessToken}
        onInvoiceCreated={handleInvoiceCreated}
      />

      {/* Persistent Client Project Copilot Assistant */}
      <ClientProjectCopilot />
    </div>
  );
}
