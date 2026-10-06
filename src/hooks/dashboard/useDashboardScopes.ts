'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { ClientScope, ScopeChangeOrderEntity } from '@/lib/clientOrder';
import { dbToClientScope } from '@/lib/clientOrder';

interface UseDashboardScopesProps {
  userEmail?: string | null;
  getAccessToken: () => Promise<string | null>;
  setAuthGateError: (err: boolean) => void;
}

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

// Unified reader that extracts a pending scope from storage, cookies, or URL search params
const parsePendingScopeFromStorageOrUrl = (): ClientScope | null => {
  if (typeof window === 'undefined') return null;

  // 1. Storage & Cookie inspection
  const raw = getPendingScopeFromStorage();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const code = parsed.scopeCode || parsed.scope_code || `SCOPE-${Math.floor(10000 + Math.random() * 90000)}`;
      const company = (parsed.companyName || parsed.company_name)?.trim() || 'My Custom Project';
      const phone = parsed.contactPhone || parsed.client_phone || '';
      const engine = parsed.baseEngineTitle || parsed.base_engine || 'Full-Stack Web Engine';
      const features = Array.isArray(parsed.selectedFeatures)
        ? parsed.selectedFeatures
        : Array.isArray(parsed.features)
        ? parsed.features
        : [];
      const brand = parsed.brandAssetOption || parsed.brand_asset || 'Standard';
      const plan = parsed.maintenancePlan || parsed.maintenance_plan || 'Self-Managed (30-Day Warranty)';
      const costInr = Number(parsed.totalCostINR ?? parsed.total_cost_inr) || 175000;
      const costUsd = Number(parsed.totalCostUSD ?? parsed.total_cost_usd) || 2500;
      const curr = parsed.currency === 'USD' ? 'USD' : 'INR';
      const timeline = parsed.timeline || 'Standard Turnaround (2-4 Weeks)';

      return {
        id: `scope-${Date.now()}`,
        scope_code: code,
        company_name: company,
        client_phone: phone,
        base_engine: engine,
        features,
        brand_asset: brand,
        maintenance_plan: plan,
        total_cost_inr: costInr,
        total_cost_usd: costUsd,
        currency: curr,
        timeline,
        status: 'Draft Proposal',
        delivery_stage: 'architecture',
        deposit_paid: false,
        created_at: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('Failed to parse pending scope from storage:', e);
    }
  }

  // 2. URL search parameters fallback (Safari ITP / private browsing / fast-pass)
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('imported') === 'true' || searchParams.get('engine') || searchParams.get('scopeCode')) {
    const engine = searchParams.get('engine') || 'Full-Stack Web Engine';
    const features = searchParams.get('features') ? searchParams.get('features')!.split(',').filter(Boolean) : [];
    const curr = searchParams.get('currency') === 'USD' ? 'USD' : 'INR';
    const code = searchParams.get('scopeCode') || `SCOPE-${Math.floor(10000 + Math.random() * 90000)}`;
    const company = searchParams.get('company')?.trim() || 'My Custom Project';
    const parsedInr = Number(searchParams.get('costINR'));
    const parsedUsd = Number(searchParams.get('costUSD'));
    const brand = searchParams.get('brand') || 'Standard';
    const plan = searchParams.get('plan') || 'Self-Managed (30-Day Warranty)';
    const timeline = searchParams.get('timeline') || 'Standard Turnaround (2-4 Weeks)';

    return {
      id: `scope-${Date.now()}`,
      scope_code: code,
      company_name: company,
      client_phone: '',
      base_engine: engine,
      features,
      brand_asset: brand,
      maintenance_plan: plan,
      total_cost_inr: !isNaN(parsedInr) && parsedInr > 0 ? parsedInr : (curr === 'INR' ? 175000 : 210000),
      total_cost_usd: !isNaN(parsedUsd) && parsedUsd > 0 ? parsedUsd : (curr === 'USD' ? 2500 : 2100),
      currency: curr,
      timeline,
      status: 'Draft Proposal',
      delivery_stage: 'architecture',
      deposit_paid: false,
      created_at: new Date().toISOString(),
    };
  }

  return null;
};

const getInitialScopes = (): ClientScope[] => {
  const pending = parsePendingScopeFromStorageOrUrl();
  return pending ? [pending] : [];
};

export function useDashboardScopes({
  userEmail,
  getAccessToken,
  setAuthGateError,
}: UseDashboardScopesProps) {
  const [scopes, setScopes] = useState<ClientScope[]>(() => getInitialScopes());
  const [scopeChangeOrders, setScopeChangeOrders] = useState<Record<string, ScopeChangeOrderEntity[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const clearPendingScopeFromStorage = (): void => {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem('prateeq_pending_scope'); } catch {}
    document.cookie = 'prateeq_pending_scope=; path=/; max-age=0; SameSite=Lax;';
  };

  const saveScopeToDatabase = useCallback(
    async (updatedScope: ClientScope): Promise<boolean> => {
      if (!userEmail) return false;
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setAuthGateError(true);
        return false;
      }
      try {
        const res = await fetch('/api/client/save-scope', {
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
            sowHash: updatedScope.sow_hash,
            retrieverTenantId: updatedScope.retriever_tenant_id,
            metadata: updatedScope.metadata || {},
          }),
        });
        if (res.status === 401) setAuthGateError(true);
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.scope?.id) {
            setScopes((prev) =>
              prev.map((s) =>
                s.scope_code === updatedScope.scope_code ? { ...s, id: data.scope.id } : s
              )
            );
          }
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Failed to save scope to database:', err);
        return false;
      }
    },
    [userEmail, getAccessToken, setAuthGateError]
  );

  const loadChangeOrders = useCallback(
    async (scopeCode: string) => {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      try {
        const res = await fetch(`/api/client/change-orders?scopeCode=${encodeURIComponent(scopeCode)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (data?.changeOrders) {
          setScopeChangeOrders((prev) => ({ ...prev, [scopeCode]: data.changeOrders }));
        }
      } catch (err) {
        console.warn('Failed to load change orders:', err);
      }
    },
    [getAccessToken]
  );

  // Fetch client's persisted scopes from Supabase DB
  useEffect(() => {
    if (!userEmail) return;

    let mounted = true;

    const loadScopes = async () => {
      setIsLoading(true);
      const accessToken = await getAccessToken();
      if (!mounted || !accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/client/get-scopes', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.status === 401) {
          if (mounted) setAuthGateError(true);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        if (!mounted || !data?.scopes) {
          setIsLoading(false);
          return;
        }

        const dbScopes: ClientScope[] = data.scopes.map(dbToClientScope);

        dbScopes.forEach((s) => {
          loadChangeOrders(s.scope_code);
        });

        const freshPendingScope = parsePendingScopeFromStorageOrUrl();

        setScopes((prev) => {
          const existingCodes = new Set(dbScopes.map((s) => s.scope_code));
          const scopesToPersist: ClientScope[] = [];

          if (freshPendingScope && !existingCodes.has(freshPendingScope.scope_code)) {
            scopesToPersist.push(freshPendingScope);
          }

          prev.forEach((s) => {
            if (!existingCodes.has(s.scope_code) && !scopesToPersist.some((p) => p.scope_code === s.scope_code)) {
              scopesToPersist.push(s);
            }
          });

          const merged = [...scopesToPersist, ...dbScopes];

          scopesToPersist.forEach((scopeToPersist) => {
            void saveScopeToDatabase(scopeToPersist);
          });

          if (scopesToPersist.length > 0 || (freshPendingScope && existingCodes.has(freshPendingScope.scope_code))) {
            clearPendingScopeFromStorage();
          }

          return merged;
        });
      } catch (err) {
        console.warn('Failed to fetch client scopes from Supabase:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadScopes();

    return () => {
      mounted = false;
    };
  }, [userEmail, getAccessToken, saveScopeToDatabase, loadChangeOrders, setAuthGateError]);

  const handleDeleteScope = async (scopeCode: string) => {
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setScopes((prev) => prev.filter((s) => s.scope_code !== scopeCode));

    // Clear pending scope from storage if it matches the deleted scope to prevent zombie resurrection
    try {
      const raw = localStorage.getItem('prateeq_pending_scope');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.scopeCode === scopeCode || parsed.scope_code === scopeCode) {
          clearPendingScopeFromStorage();
        }
      }
    } catch {}

    try {
      const res = await fetch(`/api/client/delete-scope?scopeCode=${encodeURIComponent(scopeCode)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        toast.success(`Draft Scope #${scopeCode} deleted successfully.`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        toast.error(`Delete failed: ${errJson.error || 'Could not delete scope'}`);
      }
    } catch (err) {
      console.warn('Delete scope failed:', err);
      toast.error('Network error while deleting scope.');
    }
  };

  const updateScope = async (updatedScope: ClientScope) => {
    setScopes((prev) => prev.map((s) => (s.id === updatedScope.id ? updatedScope : s)));
    await saveScopeToDatabase(updatedScope);
  };

  return {
    scopes,
    setScopes,
    scopeChangeOrders,
    isLoading,
    saveScopeToDatabase,
    loadChangeOrders,
    handleDeleteScope,
    updateScope,
  };
}
