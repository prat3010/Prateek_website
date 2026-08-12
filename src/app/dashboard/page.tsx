'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
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
  FileCheck,
  FileText,
  X
} from 'lucide-react';
import Portal from '@/components/ui/Portal';
import { generateQuestionnairePDF, generateInvoicePDF } from '@/utils/pdfGenerator';
import { dbToClientScope, type ClientScope, type InvoiceEntity, type CreateInvoiceInput } from '@/lib/clientOrder';
import { generateOnboardingChecklist, calcOnboardingReadiness, type ChecklistItem } from '@/lib/onboardingChecklist';
import { calculateInvoiceTotals, SUPPORTED_CURRENCIES, formatCurrencyAmount } from '@/lib/invoicing';
import resumeData from '@/data/resume.json';
import intakeDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { calcQuote, formatMoney, type Currency } from '@/lib/pricing';
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
  const [activeTab, setActiveTab] = useState<'scopes' | 'onboarding' | 'invoices'>('scopes');
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [authGateError, setAuthGateError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Scope Digital Sign-off & Milestone State
  const [signingScope, setSigningScope] = useState<ClientScope | null>(null);
  const [signoffTermsAgreed, setSignoffTermsAgreed] = useState(false);
  const [signoffPaymentStructure, setSignoffPaymentStructure] = useState<'50/50' | '40/30/30'>('50/50');

  // Dynamic Onboarding Checklist State
  const [onboardingInputs, setOnboardingInputs] = useState<Record<string, Record<string, string>>>({});
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'financial' | 'technical' | 'design' | 'governance'>('all');

  // Invoices & Payment Ledger State
  const [invoices, setInvoices] = useState<InvoiceEntity[]>([]);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Invoice Creator Modal Form State
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
  const [invNotes, setInvNotes] = useState('Thank you for choosing Prateeq Studio for your engineering build.');
  const [invTerms, setInvTerms] = useState('Payment is due within 14 days of issue. Deliverables strictly subject to acceptance sign-off.');
  const [invLineItems, setInvLineItems] = useState<
    { name: string; description: string; sac_hsn: string; rate: number; quantity: number; tax_rate: number; tax_type: 'inclusive' | 'exclusive' }[]
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
          businessKPI: updatedScope.business_kpi || '',
          paymentStructure: updatedScope.payment_structure || '50/50',
          signedAt: updatedScope.signed_at,
          signedByEmail: updatedScope.signed_by_email,
          onboardingChecklist: updatedScope.onboarding_checklist || {},
        }),
      })
        .then((res) => {
          if (res.status === 401) setAuthGateError(true);
        })
    },
    [user?.email, getAccessToken]
  );

  const handleOpenSignoffModal = (scope: ClientScope) => {
    setSigningScope(scope);
    setSignoffTermsAgreed(false);
    setSignoffPaymentStructure((scope.payment_structure as '50/50' | '40/30/30') || '50/50');
  };

  const handleConfirmSignoffAndPay = async () => {
    if (!signingScope || !user?.email) return;
    if (!signoffTermsAgreed) {
      alert('Please confirm that you agree to the commercial scoping specifications & engagement terms.');
      return;
    }

    const updatedScope: ClientScope = {
      ...signingScope,
      signed_at: new Date().toISOString(),
      signed_by_email: user.email,
      payment_structure: signoffPaymentStructure,
      status: 'Proposal Signed — Pending Deposit',
    };

    setScopes((prev) => prev.map((s) => (s.id === signingScope.id ? updatedScope : s)));
    await saveScopeToDatabase(updatedScope);

    const targetScope = updatedScope;
    setSigningScope(null);
    handleRazorpayCheckout(targetScope);
  };

  const handleToggleChecklistItem = (scope: ClientScope, itemId: string, value: boolean | string) => {
    const currentChecklist = scope.onboarding_checklist || {};
    const updatedChecklist = { ...currentChecklist, [itemId]: value };

    setScopes((prev) =>
      prev.map((s) => {
        if (s.id !== scope.id) return s;
        const updated = { ...s, onboarding_checklist: updatedChecklist };
        saveScopeToDatabase(updated);
        return updated;
      })
    );
  };

  // Fetch client's persisted scopes from Supabase multi-device DB
  React.useEffect(() => {
    if (!user?.email) return;

    let mounted = true;

    const loadScopes = async () => {
      const accessToken = await getAccessToken();
      if (!mounted || !accessToken) return;

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
            const merged = [...unpersistedLocal, ...dbScopes];

            // Auto-persist imported/pending scopes to Supabase DB now that user is logged in
            unpersistedLocal.forEach((scopeToPersist) => {
              saveScopeToDatabase(scopeToPersist);
            });
            clearPendingScopeFromStorage();

            return merged;
          });
        })
        .catch((err) => console.warn('Failed to fetch client scopes from Supabase:', err));
    };

    loadScopes();

    return () => {
      mounted = false;
    };
  }, [user?.email, getAccessToken, saveScopeToDatabase]);

  const loadInvoices = React.useCallback(async () => {
    if (!user?.email) return;
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
      console.warn('Fetch invoices error:', err);
    } finally {
      setIsInvoiceLoading(false);
    }
  }, [user?.email, getAccessToken]);

  React.useEffect(() => {
    if (activeTab === 'invoices') {
      let isSubscribed = true;
      (async () => {
        if (!user?.email) return;
        const accessToken = await getAccessToken();
        if (!accessToken || !isSubscribed) return;
        setIsInvoiceLoading(true);
        try {
          const res = await fetch('/api/client/get-invoices', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const data = await res.json();
          if (isSubscribed && data?.invoices) {
            setInvoices(data.invoices);
          }
        } catch (err) {
          console.warn('Fetch invoices error:', err);
        } finally {
          if (isSubscribed) setIsInvoiceLoading(false);
        }
      })();
      return () => {
        isSubscribed = false;
      };
    }
  }, [activeTab, user?.email, getAccessToken]);

  const currentInvoiceCalc = calculateInvoiceTotals({
    currency: invCurrency,
    place_of_supply: invPlaceOfSupply,
    billing_address: { state: invState },
    line_items: invLineItems,
  });

  const handleAddLineItem = () => {
    setInvLineItems((prev) => [
      ...prev,
      {
        name: 'Additional Milestone / Feature',
        description: 'Engineering deliverable',
        sac_hsn: '998314',
        rate: 25000,
        quantity: 1,
        tax_rate: invCurrency === 'INR' ? 18 : 0,
        tax_type: 'exclusive',
      },
    ]);
  };

  const handleRemoveLineItem = (idx: number) => {
    if (invLineItems.length <= 1) return;
    setInvLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setAuthGateError(true);
      return;
    }

    const payload: CreateInvoiceInput = {
      customer_name: invCustomerName || user?.user_metadata?.full_name || 'Valued Client',
      customer_email: invCustomerEmail || user?.email || '',
      customer_phone: invCustomerPhone,
      customer_gstin: invCustomerGstin,
      billing_address: {
        street: invStreet,
        city: invCity,
        state: invState,
        pincode: invPincode,
        country: 'India',
      },
      shipping_address: {
        street: invStreet,
        city: invCity,
        state: invState,
        pincode: invPincode,
        country: 'India',
      },
      place_of_supply: invPlaceOfSupply || invState,
      currency: invCurrency,
      line_items: invLineItems.map((item) => ({
        ...item,
        tax_rate: invCurrency === 'INR' ? item.tax_rate : 0,
      })),
      milestone_name: 'Custom Project Service Invoice',
      customer_notes: invNotes,
      terms_and_conditions: invTerms,
    };

    try {
      const res = await fetch('/api/client/create-razorpay-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowInvoiceModal(false);
        loadInvoices();
      } else {
        alert(data.error || 'Failed to create invoice.');
      }
    } catch (err) {
      console.error('Invoice submit error:', err);
    }
  };

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

  if (!user) {
    return (
      <div className={styles.authPromptContainer}>
        <div className={styles.authCard}>
          <ShieldCheck size={48} className={styles.authIcon} />
          <h1>Client Portal Workspace</h1>
          <p>Access your active project scopes, PDF briefs, payment portal, and managed AI services.</p>
          <button
            className="comic-btn comic-btn-blue"
            style={{ width: '100%' }}
            onClick={async () => {
              try {
                await loginWithGoogle('/dashboard');
              } catch (err: unknown) {
                alert(`Google Sign-In Notice: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
          >
            Sign In with Google
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
          className={`${styles.tabBtn} ${activeTab === 'onboarding' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('onboarding')}
        >
          <CheckCircle2 size={16} /> Onboarding &amp; Kickoff ({scopes.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'invoices' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <CreditCard size={16} /> Invoices &amp; Receipts
        </button>
      </div>

      {/* Workspace Body */}
      <div className={styles.contentBody}>
        {activeTab === 'scopes' && (
          <div className={styles.sectionGrid}>
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

                      <button
                        type="button"
                        className="comic-btn comic-btn-outline"
                        onClick={() => setActiveTab('onboarding')}
                      >
                        <CheckCircle2 size={15} style={{ marginRight: '0.4rem' }} /> View Onboarding Tasks
                      </button>

                      {s.deposit_paid ? (
                        <div className={styles.paidNotice}>
                          <CheckCircle2 size={16} /> Deposit Paid — Engineering In Progress
                        </div>
                      ) : (
                        <div className={styles.paymentContainer} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                          <button
                            type="button"
                            className="comic-btn comic-btn-blue"
                            disabled={payingScopeId === s.id}
                            onClick={() => handleOpenSignoffModal(s)}
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Zap size={15} style={{ marginRight: '0.4rem' }} />
                            {s.signed_at ? 'Pay Deposit & Launch Build' : 'Accept Scope & Sign Terms'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'onboarding' && (
          <div className={styles.sectionGrid}>
            {scopes.length === 0 ? (
              <div className={styles.emptyCard}>
                <p>No active scopes found. Create a project scope in our Scoping Lab to view your tailored onboarding checklist!</p>
                <a href="/scoping" className="comic-btn comic-btn-blue" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  Open Scoping Lab
                </a>
              </div>
            ) : (
              scopes.map((s) => {
                const checklist = generateOnboardingChecklist(s);
                const readiness = calcOnboardingReadiness(s);

                const filteredChecklist = checklist.filter((item) => {
                  if (activeCategoryFilter === 'all') return true;
                  return item.category === activeCategoryFilter;
                });

                return (
                  <div key={s.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div>
                        <span className={styles.scopeBadge}>{s.scope_code}</span>
                        <h3 className={styles.companyName}>{s.company_name || 'My Custom Project'} — Onboarding Checklist</h3>
                      </div>
                      <div className={styles.readinessPill}>
                        <strong>{readiness.percent}% Assets Collected</strong>
                      </div>
                    </div>

                    {/* Onboarding Readiness Meter */}
                    <div className={styles.readinessBox}>
                      <div className={styles.readinessMeta}>
                        <span>📋 Onboarding Readiness Score</span>
                        <span>{readiness.completed} of {readiness.total} Items Completed ({readiness.percent}%)</span>
                      </div>
                      <div className={styles.readinessTrack}>
                        <div className={styles.readinessFill} style={{ width: `${readiness.percent}%` }} />
                      </div>
                    </div>

                    {/* Category Filter Buttons */}
                    <div className={styles.categoryFilterRow}>
                      {[
                        { id: 'all', label: 'All Tasks' },
                        { id: 'financial', label: '💳 Financial' },
                        { id: 'technical', label: '🛠️ Technical Keys' },
                        { id: 'design', label: '🎨 Design Assets' },
                        { id: 'governance', label: '🏛️ Governance' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          className={`${styles.categoryFilterBtn} ${activeCategoryFilter === cat.id ? styles.categoryFilterBtnActive : ''}`}
                          onClick={() => setActiveCategoryFilter(cat.id as 'all' | 'financial' | 'technical' | 'design' | 'governance')}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Checklist Task Items Grid */}
                    <div className={styles.checklistGrid}>
                      {filteredChecklist.map((item) => {
                        const isCompleted = item.id === 'deposit_upfront' ? s.deposit_paid : Boolean(s.onboarding_checklist?.[item.id]);
                        const textVal = typeof s.onboarding_checklist?.[item.id] === 'string' ? (s.onboarding_checklist?.[item.id] as string) : '';

                        return (
                          <div
                            key={item.id}
                            className={`${styles.checklistItemCard} ${isCompleted ? styles.checklistItemCompleted : ''}`}
                          >
                            <div className={styles.checklistItemHeader}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  disabled={item.id === 'deposit_upfront' && s.deposit_paid}
                                  onChange={(e) => handleToggleChecklistItem(s, item.id, e.target.checked)}
                                  className={styles.checklistCheckbox}
                                />
                                <div>
                                  <div className={styles.checklistItemTitle}>
                                    {item.title}
                                    {item.isMandatory && <span className={styles.mandatoryTag}>REQUIRED</span>}
                                  </div>
                                  <p className={styles.checklistItemDesc}>{item.description}</p>
                                </div>
                              </div>
                              <span className={styles.categoryTag}>{item.category.toUpperCase()}</span>
                            </div>

                            {/* Input / Action Area */}
                            {(item.inputType === 'text' || item.inputType === 'link') && (
                              <div className={styles.checklistInputRow}>
                                <input
                                  type="text"
                                  className={styles.checklistInput}
                                  placeholder={item.placeholder || 'Enter value...'}
                                  value={onboardingInputs[s.id]?.[item.id] ?? textVal}
                                  onChange={(e) =>
                                    setOnboardingInputs({
                                      ...onboardingInputs,
                                      [s.id]: { ...(onboardingInputs[s.id] || {}), [item.id]: e.target.value },
                                    })
                                  }
                                />
                                <button
                                  type="button"
                                  className="comic-btn comic-btn-blue"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                  onClick={() => {
                                    const valToSave = onboardingInputs[s.id]?.[item.id] ?? textVal;
                                    handleToggleChecklistItem(s, item.id, valToSave);
                                  }}
                                >
                                  Save
                                </button>
                              </div>
                            )}

                            {item.inputType === 'payment' && !s.deposit_paid && (
                              <div style={{ marginTop: '0.6rem' }}>
                                <button
                                  type="button"
                                  className="comic-btn comic-btn-blue"
                                  onClick={() => handleOpenSignoffModal(s)}
                                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                                >
                                  <Zap size={13} style={{ marginRight: '0.3rem' }} /> {item.actionLabel || 'Pay Deposit'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileCheck size={22} style={{ color: '#2563eb' }} />
                    <h3 style={{ margin: 0 }}>Itemized Invoices & Payment Ledger</h3>
                  </div>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                    GST-Compliant (CGST/SGST/IGST) & International Multi-Currency Invoices
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.createInvoiceBtn}
                  onClick={() => setShowInvoiceModal(true)}
                >
                  <Plus size={16} /> + Create New Invoice
                </button>
              </div>

              {isInvoiceLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>Loading client invoices...</div>
              ) : invoices.length === 0 ? (
                <div>
                  <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 0.75rem 0', fontWeight: 600 }}>No custom issued invoices recorded yet.</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                      You can create GST-compliant or International non-GST invoices for your project scopes below.
                    </p>
                  </div>
                  <h4 style={{ margin: '0 0 0.75rem 0' }}>Scope 50% Deposit Records</h4>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Scope Ref</th>
                        <th>Deposit Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scopes.map((s) => (
                        <tr key={s.id}>
                          <td>{new Date(s.created_at).toLocaleDateString()}</td>
                          <td><code>{s.scope_code}</code></td>
                          <td>
                            <strong>
                              {s.currency === 'INR'
                                ? `₹${Math.round(s.total_cost_inr * 0.5).toLocaleString('en-IN')}`
                                : `$${Math.round(s.total_cost_usd * 0.5).toLocaleString('en-US')}`}
                            </strong>
                          </td>
                          <td>
                            <span className={s.deposit_paid ? styles.paidBadge : styles.pendingBadge}>
                              {s.deposit_paid ? 'PAID' : 'PENDING'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.pdfBtn}
                              onClick={() =>
                                generateInvoicePDF(
                                  {
                                    id: s.id,
                                    invoice_number: `INV-${s.scope_code}`,
                                    customer_name: s.company_name,
                                    customer_email: user?.email || '',
                                    place_of_supply: 'Delhi',
                                    is_gst: s.currency === 'INR',
                                    milestone_name: '50% Scope Deposit',
                                    amount: Math.round(s.currency === 'INR' ? s.total_cost_inr * 0.5 : s.total_cost_usd * 0.5),
                                    currency: s.currency,
                                    payment_status: s.deposit_paid ? 'paid' : 'pending',
                                    created_at: s.created_at,
                                    line_items: [
                                      {
                                        name: `50% Deposit — ${s.base_engine}`,
                                        description: `Project Scope ${s.scope_code}`,
                                        sac_hsn: '998314',
                                        rate: Math.round(s.currency === 'INR' ? s.total_cost_inr * 0.5 : s.total_cost_usd * 0.5),
                                        quantity: 1,
                                        subtotal: Math.round(s.currency === 'INR' ? s.total_cost_inr * 0.5 : s.total_cost_usd * 0.5),
                                        tax_amount: 0,
                                        total: Math.round(s.currency === 'INR' ? s.total_cost_inr * 0.5 : s.total_cost_usd * 0.5),
                                      },
                                    ],
                                  },
                                  true
                                )
                              }
                            >
                              <FileText size={14} /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Issue Date</th>
                      <th>Invoice #</th>
                      <th>Billed Customer</th>
                      <th>Place of Supply</th>
                      <th>Total ({invoices[0]?.currency || 'INR'})</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>{new Date(inv.issue_date || inv.created_at).toLocaleDateString()}</td>
                        <td><code>{inv.invoice_number}</code></td>
                        <td>
                          <strong>{inv.customer_name || 'Client'}</strong>
                          <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>{inv.customer_email}</div>
                        </td>
                        <td>{inv.place_of_supply || 'Delhi'}</td>
                        <td>
                          <strong>{formatCurrencyAmount(inv.amount, inv.currency)}</strong>
                          {inv.is_gst && (
                            <div style={{ fontSize: '0.72rem', color: '#10b981' }}>
                              GST {inv.tax_breakup?.is_interstate ? 'IGST' : 'CGST+SGST'} Included
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={
                              inv.payment_status === 'paid'
                                ? styles.paidBadge
                                : inv.payment_status === 'issued'
                                ? styles.badgeIssued
                                : styles.pendingBadge
                            }
                          >
                            {(inv.payment_status || 'PENDING').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className={styles.pdfBtn}
                              onClick={() => generateInvoicePDF(inv, true)}
                            >
                              <FileText size={14} /> PDF
                            </button>
                            {inv.payment_url && inv.payment_status !== 'paid' && (
                              <a
                                href={inv.payment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="comic-btn comic-btn-blue"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                              >
                                Pay Online
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Create GST / Non-GST Invoice Modal */}
        {showInvoiceModal && (
          <Portal>
            <div className={styles.invoiceModalOverlay} onClick={() => setShowInvoiceModal(false)}>
              <div className={styles.invoiceModalCard} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Create GST / Non-GST Invoice</h3>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', opacity: 0.8 }}>
                      Razorpay Invoice Creation & Itemized Tax Breakdown Engine
                    </p>
                  </div>
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
                    onClick={() => setShowInvoiceModal(false)}
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Customer Information */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#2563eb' }}>1. Billed Customer Details</h4>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Customer Name *</label>
                        <input
                          type="text"
                          required
                          className={styles.formInput}
                          placeholder="e.g. Acme Tech Solutions"
                          value={invCustomerName}
                          onChange={(e) => setInvCustomerName(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Customer Email *</label>
                        <input
                          type="email"
                          required
                          className={styles.formInput}
                          placeholder="billing@acme.com"
                          value={invCustomerEmail}
                          onChange={(e) => setInvCustomerEmail(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Contact Phone</label>
                        <input
                          type="tel"
                          className={styles.formInput}
                          placeholder="+91 98765 43210"
                          value={invCustomerPhone}
                          onChange={(e) => setInvCustomerPhone(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>GSTIN (Optional for Non-GST)</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="07AAAAA0000A1Z5"
                          value={invCustomerGstin}
                          onChange={(e) => setInvCustomerGstin(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address & Place of Supply */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#2563eb' }}>2. Billing Address & Place of Supply</h4>
                    <div className={styles.formGrid}>
                      <div className={styles.formGroup}>
                        <label>Street Address</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="Building, Street"
                          value={invStreet}
                          onChange={(e) => setInvStreet(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>City & Pincode</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            className={styles.formInput}
                            placeholder="City"
                            value={invCity}
                            onChange={(e) => setInvCity(e.target.value)}
                            style={{ flex: 2 }}
                          />
                          <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Pincode"
                            value={invPincode}
                            onChange={(e) => setInvPincode(e.target.value)}
                            style={{ flex: 1 }}
                          />
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label>State / Territory</label>
                        <input
                          type="text"
                          className={styles.formInput}
                          value={invState}
                          onChange={(e) => setInvState(e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Place of Supply (GST Tax Determinant) *</label>
                        <select
                          className={styles.formSelect}
                          value={invPlaceOfSupply}
                          onChange={(e) => setInvPlaceOfSupply(e.target.value)}
                        >
                          <option value="Delhi">Delhi (Intra-State: CGST 9% + SGST 9%)</option>
                          <option value="Karnataka">Karnataka (Inter-State: IGST 18%)</option>
                          <option value="Maharashtra">Maharashtra (Inter-State: IGST 18%)</option>
                          <option value="Tamil Nadu">Tamil Nadu (Inter-State: IGST 18%)</option>
                          <option value="Telangana">Telangana (Inter-State: IGST 18%)</option>
                          <option value="Uttar Pradesh">Uttar Pradesh (Inter-State: IGST 18%)</option>
                          <option value="West Bengal">West Bengal (Inter-State: IGST 18%)</option>
                          <option value="Outside India">Outside India (Export / Non-GST)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#2563eb' }}>3. Invoice Currency</h4>
                    <div className={styles.formGroup}>
                      <select
                        className={styles.formSelect}
                        value={invCurrency}
                        onChange={(e) => setInvCurrency(e.target.value)}
                      >
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.name}
                          </option>
                        ))}
                      </select>
                      {invCurrency !== 'INR' && (
                        <span style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: '0.2rem' }}>
                          ℹ️ International Currency selected: Tax rates are set to 0% (Non-GST invoice) per Razorpay rules.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Line Items */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#2563eb' }}>4. Itemized Line Items</h4>
                      <button
                        type="button"
                        onClick={handleAddLineItem}
                        style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        + Add Line Item
                      </button>
                    </div>

                    <div className={styles.lineItemsContainer}>
                      {invLineItems.map((item, idx) => (
                        <div key={idx} className={styles.lineItemGrid}>
                          <input
                            type="text"
                            className={styles.formInput}
                            placeholder="Item Title"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInvLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, name: val } : it)));
                            }}
                          />
                          <input
                            type="text"
                            className={styles.formInput}
                            placeholder="SAC (998314)"
                            value={item.sac_hsn}
                            onChange={(e) => {
                              const val = e.target.value;
                              setInvLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, sac_hsn: val } : it)));
                            }}
                          />
                          <input
                            type="number"
                            className={styles.formInput}
                            placeholder="Qty"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setInvLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it)));
                            }}
                          />
                          <input
                            type="number"
                            className={styles.formInput}
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setInvLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, rate: val } : it)));
                            }}
                          />
                          {invCurrency === 'INR' ? (
                            <select
                              className={styles.formSelect}
                              value={item.tax_rate}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setInvLineItems((prev) => prev.map((it, i) => (i === idx ? { ...it, tax_rate: val } : it)));
                              }}
                            >
                              <option value={18}>18% GST</option>
                              <option value={12}>12% GST</option>
                              <option value={5}>5% GST</option>
                              <option value={0}>0% Tax</option>
                            </select>
                          ) : (
                            <input type="text" disabled className={styles.formInput} value="0% Tax" />
                          )}
                          <button
                            type="button"
                            disabled={invLineItems.length <= 1}
                            onClick={() => handleRemoveLineItem(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Real-time Tax Preview */}
                  <div className={styles.taxPreviewCard}>
                    <div className={styles.taxRow}>
                      <span>Subtotal:</span>
                      <strong>{formatCurrencyAmount(currentInvoiceCalc.subtotal, invCurrency)}</strong>
                    </div>
                    {currentInvoiceCalc.is_gst && currentInvoiceCalc.tax_breakup.cgst_amount ? (
                      <>
                        <div className={styles.taxRow}>
                          <span>CGST ({currentInvoiceCalc.tax_breakup.cgst_rate}%):</span>
                          <span>{formatCurrencyAmount(currentInvoiceCalc.tax_breakup.cgst_amount || 0, invCurrency)}</span>
                        </div>
                        <div className={styles.taxRow}>
                          <span>SGST ({currentInvoiceCalc.tax_breakup.sgst_rate}%):</span>
                          <span>{formatCurrencyAmount(currentInvoiceCalc.tax_breakup.sgst_amount || 0, invCurrency)}</span>
                        </div>
                      </>
                    ) : null}
                    {currentInvoiceCalc.is_gst && currentInvoiceCalc.tax_breakup.igst_amount ? (
                      <div className={styles.taxRow}>
                        <span>IGST ({currentInvoiceCalc.tax_breakup.igst_rate}%):</span>
                        <span>{formatCurrencyAmount(currentInvoiceCalc.tax_breakup.igst_amount || 0, invCurrency)}</span>
                      </div>
                    ) : null}
                    <div className={styles.taxTotalRow}>
                      <span>Grand Total:</span>
                      <span>{formatCurrencyAmount(currentInvoiceCalc.grand_total, invCurrency)}</span>
                    </div>
                  </div>

                  {/* Notes and Terms */}
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Customer Notes (Max 2048 chars)</label>
                      <textarea
                        rows={2}
                        className={styles.formTextarea}
                        maxLength={2048}
                        value={invNotes}
                        onChange={(e) => setInvNotes(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Terms & Conditions (Max 2048 chars)</label>
                      <textarea
                        rows={2}
                        className={styles.formTextarea}
                        maxLength={2048}
                        value={invTerms}
                        onChange={(e) => setInvTerms(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="comic-btn comic-btn-outline"
                      onClick={() => setShowInvoiceModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="comic-btn comic-btn-blue">
                      <Save size={16} style={{ marginRight: '0.4rem' }} /> Save & Issue Invoice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Portal>
        )}

      {/* Scope Digital Sign-off & Commercial Terms Modal */}
      {signingScope && (
        <Portal>
          <div className={styles.modalOverlay} onClick={() => setSigningScope(null)}>
            <div className={styles.signoffModalBox} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={22} style={{ color: '#2563eb' }} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>COMMERCIAL PROPOSAL SIGN-OFF &amp; TERMS CONFIRMATION</h3>
                </div>
                <X size={18} style={{ cursor: 'pointer' }} onClick={() => setSigningScope(null)} />
              </div>

              <div className={styles.modalBody}>
                <div className={styles.signoffScopeSummary}>
                  <div className={styles.signoffRow}>
                    <span>Scope Ref Code:</span>
                    <strong>{signingScope.scope_code}</strong>
                  </div>
                  <div className={styles.signoffRow}>
                    <span>Client / Company:</span>
                    <strong>{signingScope.company_name || 'My Custom Project'}</strong>
                  </div>
                  <div className={styles.signoffRow}>
                    <span>Architecture Engine:</span>
                    <strong>{signingScope.base_engine}</strong>
                  </div>
                  <div className={styles.signoffRow}>
                    <span>Primary Business Goal / KPI:</span>
                    <strong>{signingScope.business_kpi || '🚀 Increase Lead & Customer Conversion Rate'}</strong>
                  </div>
                  <div className={styles.signoffRow}>
                    <span>Included Scope Modules ({signingScope.features.length}):</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{signingScope.features.join(', ')}</span>
                  </div>
                </div>

                <div style={{ margin: '1.25rem 0' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: '0.6rem' }}>
                    Select Preferred Deposit &amp; Milestone Payment Structure
                  </label>
                  <div className={styles.paymentStructureGrid}>
                    <div
                      className={`${styles.structureCard} ${signoffPaymentStructure === '50/50' ? styles.structureCardSelected : ''}`}
                      onClick={() => setSignoffPaymentStructure('50/50')}
                    >
                      <div className={styles.structureTitle}>50 / 50 Standard Milestone Split</div>
                      <p className={styles.structureDesc}>
                        50% Upfront Development Deposit ({formatMoney(Math.round((signingScope.currency === 'USD' ? signingScope.total_cost_usd : signingScope.total_cost_inr) * 0.5), (signingScope.currency === 'USD' ? 'USD' : 'INR') as Currency)})
                        {' + '}50% Final Balance prior to production handover.
                      </p>
                    </div>

                    <div
                      className={`${styles.structureCard} ${signoffPaymentStructure === '40/30/30' ? styles.structureCardSelected : ''}`}
                      onClick={() => setSignoffPaymentStructure('40/30/30')}
                    >
                      <div className={styles.structureTitle}>40 / 30 / 30 Three-Part Milestone Split</div>
                      <p className={styles.structureDesc}>
                        40% Upfront Deposit ({formatMoney(Math.round((signingScope.currency === 'USD' ? signingScope.total_cost_usd : signingScope.total_cost_inr) * 0.4), (signingScope.currency === 'USD' ? 'USD' : 'INR') as Currency)})
                        {' + '}30% Beta Milestone Sign-off + 30% Final Balance Handover.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={styles.signoffTermsBox}>
                  <label className={styles.termsCheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={signoffTermsAgreed}
                      onChange={(e) => setSignoffTermsAgreed(e.target.checked)}
                      style={{ marginTop: '0.2rem', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      I confirm and approve the itemized scope specification, commercial milestone terms, 2 rounds of layout revisions, and 100% intellectual property transfer upon final payment.
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="comic-btn comic-btn-outline" onClick={() => setSigningScope(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="comic-btn comic-btn-blue"
                  disabled={!signoffTermsAgreed}
                  onClick={handleConfirmSignoffAndPay}
                >
                  <Zap size={16} style={{ marginRight: '0.4rem' }} /> Confirm Signature &amp; Pay Upfront Deposit
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
      </div>
    </div>
  );
}
