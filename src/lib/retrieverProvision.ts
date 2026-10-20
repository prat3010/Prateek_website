import crypto from 'crypto';
import { supabase } from '@/data/supabase';

function mapPlanTierToEngineTier(planTier: string): 'standard' | 'premium' | 'enterprise' {
  const normalized = (planTier || 'starter').toLowerCase().trim();
  if (normalized === 'business' || normalized === 'enterprise') {
    return 'enterprise';
  }
  if (normalized === 'pro' || normalized === 'growth') {
    return 'premium';
  }
  return 'standard';
}

export interface EnsureRetrieverTenantOptions {
  existingTenantId?: string | null;
  existingApiKey?: string | null;
  workspaceName: string;
  planTier: string;
}

export interface EnsureRetrieverTenantResult {
  tenantId: string;
  apiKey: string;
  apiKeyHash: string;
  provisionedOnEngine: boolean;
}

/**
 * Ensures that a tenant exists on the Retriever OCI backend (rag.prateeq.in),
 * has an active workspace API key (`ret_live_...`), and reconciles `rag_tenants`
 * and `rag_subscriptions` in Supabase if an unprovisioned UUID was replaced.
 */
export async function ensureRetrieverEngineTenant(
  options: EnsureRetrieverTenantOptions
): Promise<EnsureRetrieverTenantResult> {
  const { existingTenantId, existingApiKey, workspaceName, planTier } = options;
  const engineTier = mapPlanTierToEngineTier(planTier);
  const retrieverApiUrl = (process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');
  const adminKey = process.env.RETRIEVER_ADMIN_KEY || process.env.ADMIN_MASTER_KEY;

  const isLegacySyntheticId = Boolean(existingTenantId?.startsWith('tenant_'));
  let resolvedTenantId =
    existingTenantId && !isLegacySyntheticId ? existingTenantId : crypto.randomUUID();
  let resolvedApiKey = existingApiKey?.trim() || '';
  let provisionedOnEngine = false;

  if (adminKey) {
    try {
      // 1. If we already have an existing ID, check if it exists on the OCI engine
      let existsOnEngine = false;
      if (existingTenantId && !isLegacySyntheticId) {
        const checkRes = await fetch(`${retrieverApiUrl}/v1/admin/tenants/${existingTenantId}`, {
          method: 'GET',
          headers: { 'X-Admin-Master-Key': adminKey },
        });
        existsOnEngine = checkRes.ok;

        if (existsOnEngine) {
          provisionedOnEngine = true;
          // Sync tier (best-effort; ignores 405 if older engine is deployed)
          await fetch(`${retrieverApiUrl}/v1/admin/tenants/${existingTenantId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-Admin-Master-Key': adminKey,
            },
            body: JSON.stringify({ tier: engineTier, is_active: true }),
          }).catch(() => {});
        }
      }

      // 2. If tenant does not exist on OCI engine yet, provision it via POST /v1/tenants
      if (!existsOnEngine) {
        const provRes = await fetch(`${retrieverApiUrl}/v1/tenants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Master-Key': adminKey,
          },
          body: JSON.stringify({
            name: workspaceName,
            tier: engineTier,
            isolation_level: 'logical',
          }),
        });

        if (provRes.ok) {
          const provData = await provRes.json();
          const newEngineId = provData?.tenantId || provData?.tenant?.id;
          if (newEngineId) {
            resolvedTenantId = newEngineId;
          }
          if (provData?.raw_api_key || provData?.apiKey) {
            resolvedApiKey = provData.raw_api_key || provData.apiKey;
          }
          provisionedOnEngine = true;
        }
      }

      // 3. If the tenant is now on the OCI engine and we don't have a stored raw API key, mint one
      if (provisionedOnEngine && !resolvedApiKey) {
        const keyRes = await fetch(`${retrieverApiUrl}/v1/admin/tenants/${resolvedTenantId}/api-keys`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Master-Key': adminKey,
          },
          body: JSON.stringify({
            name: 'Default Workspace Key',
            role: 'admin',
          }),
        });
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (keyData?.apiKey) {
            resolvedApiKey = keyData.apiKey;
          }
        }
      }
    } catch (err) {
      console.warn('Retriever OCI engine provisioning/reconciliation warning:', err);
    }
  }

  if (!resolvedApiKey) {
    resolvedApiKey = `ret_live_${crypto.randomBytes(16).toString('hex')}`;
  }

  const apiKeyHash = crypto.createHash('sha256').update(resolvedApiKey).digest('hex');

  // If an existing Supabase tenant row had a synthetic UUID or missing api_key, reconcile it in Supabase
  if (supabase && existingTenantId) {
    try {
      const updates: Record<string, unknown> = {
        api_key: resolvedApiKey,
        api_key_hash: apiKeyHash,
        plan_tier: planTier,
        updated_at: new Date().toISOString(),
      };
      if (resolvedTenantId !== existingTenantId) {
        updates.tenant_id = resolvedTenantId;
      }
      const tenantsTable = supabase.from('rag_tenants') as unknown as {
        update?: (u: Record<string, unknown>) => { eq?: (col: string, val: string) => Promise<unknown> };
      };
      await tenantsTable.update?.(updates)?.eq?.('tenant_id', existingTenantId);

      if (resolvedTenantId !== existingTenantId) {
        const subsTable = supabase.from('rag_subscriptions') as unknown as {
          update?: (u: Record<string, unknown>) => { eq?: (col: string, val: string) => Promise<unknown> };
        };
        await subsTable
          .update?.({ tenant_id: resolvedTenantId, updated_at: new Date().toISOString() })
          ?.eq?.('tenant_id', existingTenantId);
      }
    } catch (dbErr) {
      console.warn('Supabase tenant reconciliation warning:', dbErr);
    }
  }

  return {
    tenantId: resolvedTenantId,
    apiKey: resolvedApiKey,
    apiKeyHash,
    provisionedOnEngine,
  };
}
