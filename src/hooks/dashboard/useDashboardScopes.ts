'use client';

import { useState, useEffect, useCallback } from 'react';
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

const getInitialScopes = (): ClientScope[] => {
  const raw = getPendingScopeFromStorage();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return [{
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
    }];
  } catch (e) {
    console.warn('Failed to parse pending scope:', e);
    return [];
  }
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
    async (updatedScope: ClientScope) => {
      if (!userEmail) return;
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setAuthGateError(true);
        return;
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
      } catch (err) {
        console.warn('Failed to save scope to database:', err);
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

        setScopes((prev) => {
          const existingCodes = new Set(dbScopes.map((s) => s.scope_code));
          const unpersistedLocal = prev.filter((s) => !existingCodes.has(s.scope_code));
          const merged = [...unpersistedLocal, ...dbScopes];

          unpersistedLocal.forEach((scopeToPersist) => {
            saveScopeToDatabase(scopeToPersist);
          });
          clearPendingScopeFromStorage();

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
    if (!confirm('Are you sure you want to delete this draft scope?')) return;
    const accessToken = await getAccessToken();
    if (!accessToken) return;

    setScopes((prev) => prev.filter((s) => s.scope_code !== scopeCode));

    try {
      await fetch(`/api/client/delete-scope?scopeCode=${encodeURIComponent(scopeCode)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (err) {
      console.warn('Delete scope failed:', err);
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
