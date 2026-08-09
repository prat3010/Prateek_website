'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { universalStorage } from '@/lib/auth';
import { 
  LogOut, 
  ShieldCheck, 
  Download, 
  Zap, 
  Layers, 
  CreditCard, 
  CheckCircle2, 
  Edit3, 
  Plus, 
  Trash2, 
  UserCheck, 
  Save,
  Clock,
  Compass,
  FileCheck
} from 'lucide-react';
import { generateQuestionnairePDF } from '@/utils/pdfGenerator';
import { dbToClientScope, type ClientScope } from '@/lib/clientOrder';
import resumeData from '@/data/resume.json';
import intakeDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { calcQuote, type Currency } from '@/lib/pricing';
import type { ResumeData } from '@/data/resume';
import styles from './dashboard.module.css';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function recalculateScopeTotals(
  baseEngineTitle: string,
  featureList: string[],
  brandAssetOption: string,
  maintenancePlanOption: string
) {
  const engine = intakeDefaults.engines.find(
    (e) => e.title === baseEngineTitle || baseEngineTitle.includes(e.title) || e.title.includes(baseEngineTitle)
  ) || intakeDefaults.engines[2];

  const matchedFeatureIds = intakeDefaults.features
    .filter((f) =>
      featureList.some(
        (featStr) => featStr.toLowerCase().includes(f.label.toLowerCase()) || f.label.toLowerCase().includes(featStr.toLowerCase())
      )
    )
    .map((f) => f.id);

  const brandAsset = intakeDefaults.brandAssets.find(
    (b) => b.label.toLowerCase().includes(brandAssetOption.toLowerCase()) || brandAssetOption.toLowerCase().includes(b.label.toLowerCase())
  ) || intakeDefaults.brandAssets[0];

  const maintenancePlan = intakeDefaults.maintenancePlans.find(
    (m) => m.name.toLowerCase().includes(maintenancePlanOption.toLowerCase()) || maintenancePlanOption.toLowerCase().includes(m.name.toLowerCase())
  ) || intakeDefaults.maintenancePlans[0];

  const quoteINR = calcQuote(
    intakeDefaults.engines,
    intakeDefaults.features,
    intakeDefaults.brandAssets,
    intakeDefaults.maintenancePlans,
    {
      engineId: engine.id,
      featureIds: matchedFeatureIds,
      brandAssetId: brandAsset.id,
      maintenancePlanId: maintenancePlan.id,
    },
    'INR'
  );

  return {
    totalINR: quoteINR.totalINR,
    totalUSD: quoteINR.totalUSD,
  };
}

export default function ClientDashboardPage() {
  const { user, loading, logout, loginWithGoogle, getAccessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'scopes' | 'invoices'>('scopes');
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [authGateError, setAuthGateError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Profile setup state for pre-fetched Google details
  const [companyInputs, setCompanyInputs] = useState<Record<string, string>>({});
  const [phoneInputs, setPhoneInputs] = useState<Record<string, string>>({});

  // Storage & Cookie Fallback Reader for Safari ITP protection
  const getPendingScopeFromStorage = (): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const fromLocal = localStorage.getItem('prateeq_pending_scope');
      if (fromLocal) return fromLocal;
    } catch {}
    const match = document.cookie.match(new RegExp('(?:^|; )' + encodeURIComponent('prateeq_pending_scope') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  };

  const clearPendingScopeFromStorage = (): void => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem('prateeq_pending_scope'); } catch {}
    document.cookie = 'prateeq_pending_scope=; path=/; max-age=0; SameSite=Lax;';
  };

  // Lazy state initialization for local pending scopes
  const [scopes, setScopes] = useState<ClientScope[]>(() => {
    const pendingScopeRaw = getPendingScopeFromStorage();
    if (!pendingScopeRaw) return [];

    try {
      const parsed = JSON.parse(pendingScopeRaw);
      const importedScope: ClientScope = {
        id: `scope-${Date.now()}`,
        scope_code: parsed.scopeCode || `SCOPE-${Math.floor(10000 + Math.random() * 90000)}`,
        company_name: parsed.companyName?.trim() || '',
        client_phone: parsed.contactPhone || '',
        base_engine: parsed.baseEngineTitle || 'Full-Stack Web Engine',
        features: parsed.selectedFeatures || [],
        brand_asset: parsed.brandAssetOption || 'Standard',
        maintenance_plan: parsed.maintenancePlan || 'Self-Managed (30-Day Warranty)',
        total_cost_inr: parsed.totalCostINR || 175000,
        total_cost_usd: parsed.totalCostUSD || 2500,
        currency: parsed.currency || 'INR',
        timeline: parsed.timeline || 'Standard Turnaround (2-4 Weeks)',
        status: 'Draft Proposal',
        delivery_stage: 'architecture',
        deposit_paid: false,
        created_at: new Date().toISOString(),
      };

      return [importedScope];
    } catch (err) {
      console.warn('Failed to parse pending scope:', err);
      return [];
    }
  });

  const saveScopeToDatabase = React.useCallback(
    async (updatedScope: ClientScope) => {
      if (!user?.email) return;
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setAuthGateError(true);
        return;
      }
      fetch('/api/client/save-scope', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          scopeCode: updatedScope.scope_code,
          companyName: updatedScope.company_name || 'My Custom Project',
          contactPhone: updatedScope.client_phone || '',
          baseEngineTitle: updatedScope.base_engine,
          selectedFeatures: updatedScope.features,
          brandAssetOption: updatedScope.brand_asset,
          maintenancePlan: updatedScope.maintenance_plan,
          totalCostINR: updatedScope.total_cost_inr,
          totalCostUSD: updatedScope.total_cost_usd,
          currency: updatedScope.currency,
          timeline: updatedScope.timeline,
        }),
      })
        .then((res) => {
          if (res.status === 401) setAuthGateError(true);
        })
        .catch((err) => console.warn('Save scope DB warning:', err));
    },
    [user?.email, getAccessToken]
  );

  // Fetch client's persisted scopes from Supabase multi-device DB
  React.useEffect(() => {
    if (!user?.email) return;

    let mounted = true;

    const loadScopes = async () => {
      const accessToken = await getAccessToken();
      if (!mounted) return;
      if (!accessToken) {
        setAuthGateError(true);
        return;
      }

      fetch('/api/client/get-scopes', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(async (res) => {
          if (res.status === 401) {
            if (mounted) setAuthGateError(true);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!mounted || !data?.scopes) return;

          const dbScopes: ClientScope[] = data.scopes.map(dbToClientScope);

          setScopes((prev) => {
            // Merge db scopes with any local pending scope not yet in DB
            const existingCodes = new Set(dbScopes.map((s) => s.scope_code));
            const unpersistedLocal = prev.filter((s) => !existingCodes.has(s.scope_code));

            // Auto-persist imported/pending scopes to Supabase DB now that user is logged in
            unpersistedLocal.forEach((scopeToPersist) => {
              saveScopeToDatabase(scopeToPersist);
            });
            clearPendingScopeFromStorage();

            return [...unpersistedLocal, ...dbScopes];
          });
        })
        .catch((err) => console.warn('Failed to fetch client scopes from Supabase:', err));
    };

    loadScopes();

    return () => {
      mounted = false;
    };
  }, [user?.email, getAccessToken, saveScopeToDatabase]);

  const handleSaveProfile = (scopeId: string) => {
    const compName = companyInputs[scopeId]?.trim() || user?.user_metadata?.full_name || 'My Custom Project';
    const phone = phoneInputs[scopeId]?.trim() || '';

    setScopes((prev) =>
      prev.map((s) => {
        if (s.id !== scopeId) return s;
        const updated = { ...s, company_name: compName, client_phone: phone };
        saveScopeToDatabase(updated);
        return updated;
      })
    );
  };

  const handleDownloadPDF = async (scope: ClientScope) => {
    try {
      const isNoir = true;
      const currency = (scope.currency === 'USD' ? 'USD' : 'INR') as 'INR' | 'USD';
      await generateQuestionnairePDF(
        resumeData as unknown as ResumeData,
        {
          companyName: scope.company_name || user?.user_metadata?.full_name || 'Client Scope',
          contactEmail: user?.email || '',
          projectGoal: `${scope.base_engine} Custom Architecture`,
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
    } catch (pdfErr) {
      console.error('PDF export error:', pdfErr);
      alert('Could not generate PDF. Please try again.');
    }
  };

  const handleCreateLiveTestScope = async () => {
    if (!user?.email) return;
    const testCode = `SCOPE-TEST-${Date.now().toString().slice(-4)}`;
    const testScopeObj: ClientScope = {
      id: `scope-${testCode}`,
      scope_code: testCode,
      company_name: 'Live Gateway Test',
      client_phone: '+91 99999 99999',
      base_engine: 'High-Conversion Landing Page (Live Test)',
      features: ['auth', 'payments'],
      brand_asset: 'none',
      maintenance_plan: 'none',
      total_cost_inr: 2,
      total_cost_usd: 1,
      currency: 'INR',
      timeline: 'Immediate Live Test',
      status: 'Draft Proposal',
      delivery_stage: 'architecture',
      deposit_paid: false,
      created_at: new Date().toISOString(),
    };

    setScopes((prev) => [testScopeObj, ...prev]);
    await saveScopeToDatabase(testScopeObj);
    alert(`⚡ Live Test Scope (${testCode}) created for ₹2.00 (50% Deposit = ₹1.00)! Click "Pay 50% Scope Deposit (Razorpay)" on the card below.`);
  };

  const [payingScopeId, setPayingScopeId] = useState<string | null>(null);

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
      setPayingScopeId(scope.id);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Could not load Razorpay checkout SDK. Please check your network connection.');
        setPayingScopeId(null);
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
        setPayingScopeId(null);
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
                razorpaySignature: 'test_signature_mock_fallback',
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setScopes((prev) =>
                prev.map((s) =>
                  s.scope_code === scope.scope_code
                    ? {
                        ...s,
                        deposit_paid: true,
                        delivery_stage: 'engineering',
                        status: 'Deposit Paid — In Development',
                      }
                    : s
                )
              );
              alert('✅ Deposit Locked! Scope has advanced to Phase 2 (Core Engineering).');
            } else {
              alert(`Verification failed: ${verifyData.error || 'Unknown error'}`);
            }
          } catch (simErr) {
            console.error('Simulated payment error:', simErr);
          } finally {
            setPayingScopeId(null);
          }
        } else {
          setPayingScopeId(null);
        }
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Prateek Sharma Engineering',
        description: `50% Deposit for Scope ${scope.scope_code}`,
        order_id: orderData.orderId,
        prefill: {
          name: scope.company_name || user?.user_metadata?.full_name || '',
          email: user?.email || '',
          contact: scope.client_phone || '',
        },
        theme: {
          color: '#00E676',
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
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
                razorpayOrderId: response.razorpay_order_id || orderData.orderId,
                razorpayPaymentId: response.razorpay_payment_id || `pay_test_${Date.now()}`,
                razorpaySignature: response.razorpay_signature || 'test_signature',
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setScopes((prev) =>
                prev.map((s) =>
                  s.scope_code === scope.scope_code
                    ? {
                        ...s,
                        deposit_paid: true,
                        delivery_stage: 'engineering',
                        status: 'Deposit Paid — In Development',
                      }
                    : s
                )
              );
              alert('✅ Payment Verified! Your 50% deposit has been locked and development has moved to Phase 2 (Core Engineering).');
            } else {
              alert(`Payment verification failed: ${verifyData.error || 'Unknown error'}`);
            }
          } catch (verifyErr) {
            console.error('Payment verification handler error:', verifyErr);
            alert('Verification request failed. Please refresh your dashboard.');
          } finally {
            setPayingScopeId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setPayingScopeId(null);
          },
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      console.error('Razorpay checkout error:', err);
      alert('An error occurred while launching payment. Please try again.');
      setPayingScopeId(null);
    }
  };

  const handleAddFeature = (scopeId: string) => {
    if (!newFeatureInput.trim()) return;
    setScopes((prev) =>
      prev.map((s) => {
        if (s.id !== scopeId) return s;
        const updatedFeatures = [...s.features, newFeatureInput.trim()];
        const totals = recalculateScopeTotals(
          s.base_engine,
          updatedFeatures,
          s.brand_asset,
          s.maintenance_plan
        );
        const updated = {
          ...s,
          features: updatedFeatures,
          total_cost_inr: totals.totalINR,
          total_cost_usd: totals.totalUSD,
        };
        saveScopeToDatabase(updated);
        return updated;
      })
    );
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (scopeId: string, featureIndex: number) => {
    setScopes((prev) =>
      prev.map((s) => {
        if (s.id !== scopeId) return s;
        const updatedFeatures = s.features.filter((_, idx) => idx !== featureIndex);
        const totals = recalculateScopeTotals(
          s.base_engine,
          updatedFeatures,
          s.brand_asset,
          s.maintenance_plan
        );
        const updated = {
          ...s,
          features: updatedFeatures,
          total_cost_inr: totals.totalINR,
          total_cost_usd: totals.totalUSD,
        };
        saveScopeToDatabase(updated);
        return updated;
      })
    );
  };

  const handleDeleteScope = async (scopeCode: string, depositPaid: boolean) => {
    if (depositPaid) {
      alert('Paid scopes in active engineering cannot be deleted. Please contact engineering for scope cancellation/refund queries.');
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete Scope proposal ${scopeCode}?\n\nThis will remove the draft proposal so you can submit fresh project requirements.`);
    if (!confirmed) return;

    try {
      const accessToken = await getAccessToken();
      const res = await fetch(`/api/client/delete-scope?scopeCode=${encodeURIComponent(scopeCode)}`, {
        method: 'DELETE',
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        clearPendingScopeFromStorage();
        setScopes((prev) => prev.filter((s) => s.scope_code !== scopeCode));
        alert(`✅ Scope proposal ${scopeCode} deleted successfully.`);
      } else {
        alert(`Delete error: ${data.error || 'Failed to delete scope.'}`);
      }
    } catch (err) {
      console.error('Delete scope request failed:', err);
      alert('Failed to delete scope. Please check network connection.');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading client workspace session...</p>
      </div>
    );
  }

  const handleDemoSignIn = () => {
    const demoUser = {
      id: 'demo-client-uuid-2026',
      email: 'client.demo@prateeq.in',
      user_metadata: {
        full_name: 'Interactive Client Demo',
        avatar_url: '',
      },
      app_metadata: { provider: 'demo' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      universalStorage.setItem('prateeq_active_user', JSON.stringify(demoUser));
    }
    window.location.reload();
  };

  if (!user) {
    return (
      <div className={styles.authPromptContainer}>
        <div className={styles.authCard}>
          <ShieldCheck size={48} className={styles.authIcon} />
          <h1>Client Portal Workspace</h1>
          <p>Access your active project scopes, PDF briefs, payment portal, and managed AI services.</p>
          <button className="comic-btn comic-btn-blue" style={{ width: '100%', marginBottom: '1rem' }} onClick={() => loginWithGoogle('/dashboard')}>
            Sign In with Google
          </button>
          <button className="comic-btn comic-btn-outline" style={{ width: '100%' }} onClick={handleDemoSignIn}>
            🚀 Instant Client Demo Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardShell}>
      {authGateError && (
        <div className={styles.authGateBanner}>
          <ShieldCheck size={16} />
          <span>Your session could not be verified. Please sign in again to sync your scopes.</span>
          <button type="button" className="comic-btn comic-btn-blue" onClick={() => loginWithGoogle('/dashboard')}>
            Sign In Again
          </button>
        </div>
      )}

      {/* Workspace Header */}
      <header className={styles.header}>
        <div className={styles.userInfo}>
          {user.user_metadata?.avatar_url && !avatarError ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt="Profile"
              width={48}
              height={48}
              className={styles.avatar}
              unoptimized
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className={styles.avatarFallback}>{(user.email || 'C')[0].toUpperCase()}</div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 className={styles.userName}>{user.user_metadata?.full_name || 'Client Workspace'}</h1>
              <span className={styles.verifiedBadge}>● Verified Client</span>
            </div>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href="/scoping"
            className="comic-btn comic-btn-blue"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={14} /> Commission New Project
          </a>
          <button className="comic-btn comic-btn-outline" onClick={logout}>
            <LogOut size={14} style={{ marginRight: '0.4rem' }} /> Sign Out
          </button>
        </div>
      </header>

      {/* Workspace Tabs */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'scopes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('scopes')}
        >
          <Layers size={16} /> Active Scopes ({scopes.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <CreditCard size={16} /> Invoices & Receipts
        </button>
      </div>

      {/* Workspace Body */}
      <div className={styles.contentBody}>
        {activeTab === 'scopes' && (
          <div className={styles.sectionGrid}>
            {(user?.email === 'pointyrocket@gmail.com' ||
              user?.email === 'prateeqsharma@gmail.com' ||
              user?.email === '3010prateeksharma@gmail.com') && (
              <div
                style={{
                  gridColumn: '1 / -1',
                  marginBottom: '1rem',
                  padding: '1rem 1.2rem',
                  background: 'rgba(255, 215, 0, 0.12)',
                  border: '1px dashed #ffd700',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <strong style={{ color: '#ffd700', fontSize: '0.95rem' }}>
                    🧪 Live Payment Test Launcher ({user.email})
                  </strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9, color: '#fff' }}>
                    Generate a live test scope for ₹2.00 (50% deposit = <strong>₹1.00</strong>). Perform a live UPI/Card payment on prateeq.in to verify real Razorpay gateway capture.
                  </p>
                </div>
                <button
                  type="button"
                  className="comic-btn comic-btn-blue"
                  onClick={handleCreateLiveTestScope}
                  style={{ fontSize: '0.85rem' }}
                >
                  ⚡ Create ₹1.00 Live Test Scope
                </button>
              </div>
            )}
            {scopes.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No active project scopes found. Configure your architecture in our Instant Scoping Lab!</p>
                <a href="/scoping" className="comic-btn comic-btn-blue" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  Open Scoping Lab
                </a>
              </div>
            ) : (
              scopes.map((s) => {
                const totalAmount = s.currency === 'INR' ? s.total_cost_inr : s.total_cost_usd;
                const depositAmount = Math.round(totalAmount * 0.5);
                const isEditing = editingScopeId === s.id;
                const needsProfileConfirmation = !s.company_name || s.company_name === 'My Custom Project';

                return (
                  <div key={s.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div>
                        <span className={styles.scopeBadge}>{s.scope_code}</span>
                        <h3 className={styles.companyName}>
                          {s.company_name || user.user_metadata?.full_name || 'My Custom Project'}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`${styles.statusBadge} ${s.deposit_paid ? styles.statusPaid : styles.statusDraft}`}>
                          {s.deposit_paid ? 'DEPOSIT PAID (50%)' : 'DRAFT PROPOSAL'}
                        </span>
                        <button
                          type="button"
                          className="comic-btn comic-btn-outline"
                          title={s.deposit_paid ? 'Paid scopes in active engineering cannot be deleted.' : 'Delete unpaid draft proposal'}
                          disabled={s.deposit_paid}
                          onClick={() => handleDeleteScope(s.scope_code, s.deposit_paid)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            opacity: s.deposit_paid ? 0.4 : 1,
                            cursor: s.deposit_paid ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Trash2 size={14} color={s.deposit_paid ? '#888' : '#ff4444'} />
                        </button>
                      </div>
                    </div>

                    {/* Pre-fetched Profile Confirmation Banner */}
                    {needsProfileConfirmation && (
                      <div className={styles.profileConfirmBox}>
                        <div className={styles.profileConfirmHeader}>
                          <UserCheck size={18} />
                          <span>Confirm Client Details (Prefetched from Google Auth)</span>
                        </div>
                        <div className={styles.profileGrid}>
                          <div>
                            <label className={styles.inputLabel}>Name (Google Auth)</label>
                            <input
                              type="text"
                              disabled
                              readOnly
                              value={user.user_metadata?.full_name || 'Prefetched Client'}
                              className={styles.readOnlyInput}
                            />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>Email (Google Auth)</label>
                            <input
                              type="email"
                              disabled
                              readOnly
                              value={user.email || ''}
                              className={styles.readOnlyInput}
                            />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>Company / Project Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Acme Tech Labs"
                              value={companyInputs[s.id] ?? (s.company_name === 'My Custom Project' ? '' : s.company_name)}
                              onChange={(e) => setCompanyInputs({ ...companyInputs, [s.id]: e.target.value })}
                              className={styles.profileInput}
                            />
                          </div>
                          <div>
                            <label className={styles.inputLabel}>Phone / WhatsApp (Optional)</label>
                            <input
                              type="tel"
                              placeholder="+91 98765 43210"
                              value={phoneInputs[s.id] ?? (s.client_phone || '')}
                              onChange={(e) => setPhoneInputs({ ...phoneInputs, [s.id]: e.target.value })}
                              className={styles.profileInput}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          className="comic-btn comic-btn-blue"
                          style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                          onClick={() => handleSaveProfile(s.id)}
                        >
                          <Save size={14} style={{ marginRight: '0.4rem' }} /> Confirm & Save Details
                        </button>
                      </div>
                    )}

                    {/* Dynamic Connected Milestone Progress Bar */}
                    {(() => {
                      const stageLevels: Record<string, number> = {
                        architecture: 1,
                        engineering: 2,
                        staging: 3,
                        live: 4,
                      };
                      const currentLevel = stageLevels[s.delivery_stage || 'architecture'] || (s.deposit_paid ? 2 : 1);
                      const progressPercentage = ((currentLevel - 1) / 3) * 100;

                      return (
                        <div className={styles.milestoneSection}>
                          <div className={styles.milestoneHeader}>
                            <div className={styles.milestoneHeaderLeft}>
                              <Compass size={16} />
                              <span>Development Milestone Tracker</span>
                            </div>
                            <span className={styles.phaseBadge}>
                              {s.delivery_stage === 'live' ? '🚀 PHASE 4: PRODUCTION LAUNCH' :
                               s.delivery_stage === 'staging' ? '🧪 PHASE 3: STAGING & QA' :
                               s.delivery_stage === 'engineering' ? '⚡ PHASE 2: CORE ENGINEERING' :
                               '📐 PHASE 1: ARCHITECTURE & SPECS'}
                            </span>
                          </div>

                          <div className={styles.milestonePipeline}>
                            <div className={styles.pipelineTrackBackdrop} />
                            <div
                              className={styles.pipelineTrackProgress}
                              style={{ width: `${progressPercentage}%` }}
                            />
                            <div className={styles.milestoneSteps}>
                              <div className={`${styles.milestoneStep} ${currentLevel >= 1 ? styles.stepActive : ''}`}>
                                <span className={styles.stepDot}>1</span>
                                <span>Architecture & Specs</span>
                              </div>
                              <div className={`${styles.milestoneStep} ${currentLevel >= 2 ? styles.stepActive : ''}`}>
                                <span className={styles.stepDot}>2</span>
                                <span>Core Engineering</span>
                              </div>
                              <div className={`${styles.milestoneStep} ${currentLevel >= 3 ? styles.stepActive : ''}`}>
                                <span className={styles.stepDot}>3</span>
                                <span>Staging & QA</span>
                              </div>
                              <div className={`${styles.milestoneStep} ${currentLevel >= 4 ? styles.stepActive : ''}`}>
                                <span className={styles.stepDot}>4</span>
                                <span>Production Launch</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className={styles.orderDetails}>
                      <p className={styles.engineName}>
                        <strong>Base Engine Tier:</strong> {s.base_engine}
                      </p>
                      <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.2rem' }}>
                        <Clock size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                        Target Timeline: {s.timeline}
                      </p>

                      <div className={styles.featuresSection}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Scope Features & Modules ({s.features.length}):</strong>
                          <button
                            type="button"
                            className={styles.editToggleBtn}
                            onClick={() => setEditingScopeId(isEditing ? null : s.id)}
                          >
                            <Edit3 size={14} /> {isEditing ? 'Done Editing' : 'Customize Features'}
                          </button>
                        </div>

                        {isEditing ? (
                          <div className={styles.editableFeaturesList}>
                            {s.features.map((feat, idx) => (
                              <div key={idx} className={styles.featureItemRow}>
                                <span>• {feat}</span>
                                <button
                                  type="button"
                                  className={styles.removeFeatureBtn}
                                  onClick={() => handleRemoveFeature(s.id, idx)}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                            <div className={styles.addFeatureRow}>
                              <input
                                type="text"
                                className={styles.addFeatureInput}
                                placeholder="Add custom feature..."
                                value={newFeatureInput}
                                onChange={(e) => setNewFeatureInput(e.target.value)}
                              />
                              <button
                                type="button"
                                className={styles.addFeatureBtn}
                                onClick={() => handleAddFeature(s.id)}
                              >
                                <Plus size={14} /> Add
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.featureBadgeGrid}>
                            {s.features.map((f, i) => (
                              <span key={i} className={styles.featureBadgeTag}>
                                <CheckCircle2 size={13} className={styles.featureBadgeIcon} />
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={styles.costSummary}>
                        <div>
                          Total Investment: <strong>{s.currency === 'INR' ? `₹${s.total_cost_inr.toLocaleString('en-IN')}` : `$${s.total_cost_usd.toLocaleString('en-US')}`}</strong>
                        </div>
                        <div>
                          50% Scope Deposit: <strong className={styles.paidText}>{s.currency === 'INR' ? `₹${depositAmount.toLocaleString('en-IN')}` : `$${depositAmount.toLocaleString('en-US')}`}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className="comic-btn comic-btn-outline"
                        onClick={() => handleDownloadPDF(s)}
                      >
                        <Download size={15} style={{ marginRight: '0.4rem' }} /> PDF Brief
                      </button>

                      {s.deposit_paid ? (
                        <div className={styles.paidNotice}>
                          <CheckCircle2 size={16} /> 50% Deposit Locked — Development In Core Engineering
                        </div>
                      ) : (
                        <div className={styles.paymentContainer} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                          <button
                            type="button"
                            className="comic-btn comic-btn-blue"
                            disabled={payingScopeId === s.id}
                            onClick={() => handleRazorpayCheckout(s)}
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Zap size={15} style={{ marginRight: '0.4rem' }} />
                            {payingScopeId === s.id ? 'Initializing Razorpay...' : 'Pay 50% Scope Deposit (Razorpay)'}
                          </button>
                          <p className={styles.testModeTip}>
                            💡 <strong>Razorpay Test Mode Tip:</strong> Razorpay accounts block international test cards by default. For card payments, use official Indian Domestic Test Cards: <strong>Visa Debit</strong> <code>4100 2800 0000 1007</code> or <strong>Mastercard</strong> <code>5555 5100 0008 1006</code> (Expiry: <code>12/30</code>, CVV: <code>123</code>). For Netbanking, select any bank and click <strong>[ Success ]</strong> on the prompt.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className={styles.sectionGrid}>
            <div className={styles.tableCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FileCheck size={20} />
                <h3 style={{ margin: 0 }}>Itemized Invoices & Payment Ledger</h3>
              </div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Scope Ref</th>
                    <th>Deposit Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scopes.map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td><code>{s.scope_code}</code></td>
                      <td><strong>{s.currency === 'INR' ? `₹${Math.round(s.total_cost_inr * 0.5).toLocaleString('en-IN')}` : `$${Math.round(s.total_cost_usd * 0.5)}`}</strong></td>
                      <td>
                        <span className={s.deposit_paid ? styles.paidBadge : styles.pendingBadge}>
                          {s.deposit_paid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
