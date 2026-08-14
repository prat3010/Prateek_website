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
  business_kpi?: string;
  payment_structure?: '50/50' | '40/30/30' | string;
  signed_at?: string;
  signed_by_email?: string;
  design_readiness?: string;
  hosting_ownership?: string;
  tax_invoicing_preference?: string;
  inspiration_links?: string;
  onboarding_checklist?: Record<string, boolean | string>;
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

export interface AddressDetails {
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface InvoiceLineItem {
  id?: string;
  name: string;
  description?: string;
  sac_hsn?: string;
  rate: number;
  quantity: number;
  tax_rate?: number;
  tax_type?: 'inclusive' | 'exclusive';
  subtotal: number;
  tax_amount: number;
  total: number;
}

export interface TaxBreakup {
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  total_tax: number;
  is_interstate: boolean;
}

export interface InvoiceEntity {
  id: string;
  invoice_number: string;
  scope_id?: string;
  client_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_gstin?: string;
  billing_address?: AddressDetails;
  shipping_address?: AddressDetails;
  place_of_supply?: string;
  is_gst?: boolean;
  line_items?: InvoiceLineItem[];
  tax_breakup?: TaxBreakup;
  milestone_name: string;
  amount: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | string;
  payment_status: 'draft' | 'pending' | 'issued' | 'paid' | 'cancelled' | 'refunded' | 'expired';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_invoice_id?: string;
  payment_url?: string;
  issue_date?: string;
  due_date?: string;
  expiry_date?: string;
  customer_notes?: string;
  terms_and_conditions?: string;
  allow_partial?: boolean;
  paid_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateInvoiceInput {
  scope_code?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_gstin?: string;
  billing_address?: AddressDetails;
  shipping_address?: AddressDetails;
  place_of_supply?: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | string;
  line_items: {
    name: string;
    description?: string;
    sac_hsn?: string;
    rate: number;
    quantity: number;
    tax_rate?: number;
    tax_type?: 'inclusive' | 'exclusive';
  }[];
  milestone_name?: string;
  customer_notes?: string;
  terms_and_conditions?: string;
  issue_date?: string;
  expiry_date?: string;
  allow_partial?: boolean;
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
  business_kpi?: string;
  payment_structure?: string;
  signed_at?: string;
  signed_by_email?: string;
  design_readiness?: string;
  hosting_ownership?: string;
  tax_invoicing_preference?: string;
  inspiration_links?: string;
  onboarding_checklist?: Record<string, boolean | string> | unknown;
  created_at?: string;
}

export function dbToClientScope(row: ClientOrderRow): ClientScope {
  let checklistParsed: Record<string, boolean | string> = {};
  if (row.onboarding_checklist && typeof row.onboarding_checklist === 'object') {
    checklistParsed = row.onboarding_checklist as Record<string, boolean | string>;
  }

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
    business_kpi: row.business_kpi || '',
    payment_structure: row.payment_structure || '50/50',
    signed_at: row.signed_at || undefined,
    signed_by_email: row.signed_by_email || '',
    design_readiness: row.design_readiness || (checklistParsed.design_readiness as string) || undefined,
    hosting_ownership: row.hosting_ownership || (checklistParsed.hosting_ownership as string) || undefined,
    tax_invoicing_preference: row.tax_invoicing_preference || (checklistParsed.tax_invoicing_preference as string) || undefined,
    inspiration_links: row.inspiration_links || (checklistParsed.inspiration_links as string) || undefined,
    onboarding_checklist: checklistParsed,
    created_at: row.created_at || new Date().toISOString(),
  };
}
