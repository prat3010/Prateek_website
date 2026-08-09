export type ClientDeliveryStage = 'architecture' | 'engineering' | 'staging' | 'live';

export interface ClientScope {
  id: string;
  scope_code: string;
  company_name: string;
  client_phone?: string;
  base_engine: string;
  features: string[];
  brand_asset: string;
  maintenance_plan: string;
  total_cost_inr: number;
  total_cost_usd: number;
  currency: string;
  timeline: string;
  status: string;
  delivery_stage?: ClientDeliveryStage;
  deposit_paid: boolean;
  created_at: string;
}

export interface ClientEntity {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  tax_id_gst?: string;
  country?: string;
  created_at: string;
}

export interface InvoiceEntity {
  id: string;
  invoice_number: string;
  scope_id?: string;
  client_id?: string;
  milestone_name: string;
  amount: number;
  currency: 'INR' | 'USD';
  payment_status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
}

export interface DeliverableEntity {
  id: string;
  scope_id: string;
  staging_url?: string;
  production_url?: string;
  github_repo?: string;
  figma_url?: string;
  signoff_pdf_url?: string;
  environment_variables?: Record<string, string>;
  created_at: string;
}

export interface RagSubscriptionEntity {
  id: string;
  client_id: string;
  tenant_id: string;
  plan_tier: string;
  monthly_token_limit: number;
  tokens_used_this_month: number;
  api_key_hash?: string;
  is_active: boolean;
  current_period_end?: string;
  created_at: string;
}

export interface ClientOrderRow {
  id?: string;
  scope_code: string;
  client_id?: string;
  client_email?: string;
  company_name: string;
  client_phone?: string;
  base_engine: string;
  features?: string[] | unknown;
  brand_asset: string;
  maintenance_plan: string;
  total_cost_inr?: number | string;
  total_cost_usd?: number | string;
  currency?: string;
  timeline?: string;
  status?: string;
  delivery_stage?: ClientDeliveryStage;
  deposit_paid?: boolean;
  created_at?: string;
}

export function dbToClientScope(row: ClientOrderRow): ClientScope {
  return {
    id: row.id || `scope-${row.scope_code}`,
    scope_code: row.scope_code,
    company_name: row.company_name,
    client_phone: row.client_phone,
    base_engine: row.base_engine,
    features: Array.isArray(row.features) ? row.features : [],
    brand_asset: row.brand_asset,
    maintenance_plan: row.maintenance_plan,
    total_cost_inr: Number(row.total_cost_inr) || 0,
    total_cost_usd: Number(row.total_cost_usd) || 0,
    currency: row.currency || 'INR',
    timeline: row.timeline || 'Standard Turnaround',
    status: row.status || 'Draft Proposal',
    delivery_stage: row.delivery_stage || 'architecture',
    deposit_paid: Boolean(row.deposit_paid),
    created_at: row.created_at || new Date().toISOString(),
  };
}
