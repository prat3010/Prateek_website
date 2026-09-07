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
  sow_hash?: string;
  retriever_tenant_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ScopeChangeOrderEntity {
  id: string;
  scope_id: string;
  change_order_number: string;
  requested_by_email: string;
  added_features: string[];
  removed_features: string[];
  price_delta_inr: number;
  price_delta_usd: number;
  timeline_impact?: string;
  status: 'pending' | 'approved' | 'rejected' | 'invoiced' | 'paid';
  invoice_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
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
  sow_hash?: string;
  retriever_tenant_id?: string;
  metadata?: Record<string, unknown>;
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
    sow_hash: row.sow_hash,
    retriever_tenant_id: row.retriever_tenant_id,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: row.created_at || new Date().toISOString(),
  };
}

// ── Strict Runtime Schema Validation Suite for Client API Routes ──────────────

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  error: {
    message: string;
    issues: Array<{ field: string; message: string }>;
  };
}

export type SafeParseResult<T> = ValidationSuccess<T> | ValidationFailure;

export interface SaveScopePayload {
  scopeCode: string;
  companyName?: string;
  contactPhone?: string;
  baseEngineTitle?: string;
  selectedFeatures?: string[];
  brandAssetOption?: string;
  maintenancePlan?: string;
  totalCostINR?: number;
  totalCostUSD?: number;
  currency?: 'INR' | 'USD';
  timeline?: string;
  businessKPI?: string;
  paymentStructure?: '50/50' | '40/30/30' | string;
  signedAt?: string;
  signedByEmail?: string;
  onboardingChecklist?: Record<string, unknown>;
  sowHash?: string;
  retrieverTenantId?: string;
  metadata?: Record<string, unknown>;
  designReadiness?: string;
  hostingOwnership?: string;
  taxInvoicingPreference?: string;
  inspirationLinks?: string;
}

export const saveScopeSchema = {
  safeParse(input: unknown): SafeParseResult<SaveScopePayload> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return {
        success: false,
        error: { message: 'Invalid payload: body must be a JSON object.', issues: [{ field: 'body', message: 'Expected object' }] },
      };
    }

    const obj = input as Record<string, unknown>;
    const issues: Array<{ field: string; message: string }> = [];

    const scopeCode = typeof obj.scopeCode === 'string' ? obj.scopeCode.trim() : '';
    if (!scopeCode) {
      issues.push({ field: 'scopeCode', message: 'scopeCode is required and must be a non-empty string.' });
    }

    const currency = obj.currency === 'USD' ? 'USD' : 'INR';
    const totalCostINR = typeof obj.totalCostINR === 'number' ? obj.totalCostINR : Number(obj.totalCostINR) || 0;
    const totalCostUSD = typeof obj.totalCostUSD === 'number' ? obj.totalCostUSD : Number(obj.totalCostUSD) || 0;

    if (totalCostINR < 0 || totalCostUSD < 0) {
      issues.push({ field: 'totalCost', message: 'Total cost figures must not be negative.' });
    }

    let selectedFeatures: string[] = [];
    if (Array.isArray(obj.selectedFeatures)) {
      selectedFeatures = obj.selectedFeatures.filter((f): f is string => typeof f === 'string');
    }

    if (issues.length > 0) {
      return { success: false, error: { message: issues.map((i) => `${i.field}: ${i.message}`).join(', '), issues } };
    }

    return {
      success: true,
      data: {
        scopeCode,
        companyName: typeof obj.companyName === 'string' ? obj.companyName.trim() : undefined,
        contactPhone: typeof obj.contactPhone === 'string' ? obj.contactPhone.trim() : undefined,
        baseEngineTitle: typeof obj.baseEngineTitle === 'string' ? obj.baseEngineTitle : undefined,
        selectedFeatures,
        brandAssetOption: typeof obj.brandAssetOption === 'string' ? obj.brandAssetOption : undefined,
        maintenancePlan: typeof obj.maintenancePlan === 'string' ? obj.maintenancePlan : undefined,
        totalCostINR,
        totalCostUSD,
        currency,
        timeline: typeof obj.timeline === 'string' ? obj.timeline : undefined,
        businessKPI: typeof obj.businessKPI === 'string' ? obj.businessKPI : typeof obj.business_kpi === 'string' ? obj.business_kpi : undefined,
        paymentStructure: typeof obj.paymentStructure === 'string' ? obj.paymentStructure : typeof obj.payment_structure === 'string' ? obj.payment_structure : '50/50',
        signedAt: typeof obj.signedAt === 'string' ? obj.signedAt : typeof obj.signed_at === 'string' ? obj.signed_at : undefined,
        signedByEmail: typeof obj.signedByEmail === 'string' ? obj.signedByEmail : typeof obj.signed_by_email === 'string' ? obj.signed_by_email : undefined,
        onboardingChecklist: typeof obj.onboardingChecklist === 'object' && obj.onboardingChecklist !== null ? (obj.onboardingChecklist as Record<string, unknown>) : typeof obj.onboarding_checklist === 'object' && obj.onboarding_checklist !== null ? (obj.onboarding_checklist as Record<string, unknown>) : {},
        sowHash: typeof obj.sowHash === 'string' ? obj.sowHash : typeof obj.sow_hash === 'string' ? obj.sow_hash : undefined,
        retrieverTenantId: typeof obj.retrieverTenantId === 'string' ? obj.retrieverTenantId : typeof obj.retriever_tenant_id === 'string' ? obj.retriever_tenant_id : undefined,
        metadata: typeof obj.metadata === 'object' && obj.metadata !== null ? (obj.metadata as Record<string, unknown>) : {},
        designReadiness: typeof obj.designReadiness === 'string' ? obj.designReadiness : undefined,
        hostingOwnership: typeof obj.hostingOwnership === 'string' ? obj.hostingOwnership : undefined,
        taxInvoicingPreference: typeof obj.taxInvoicingPreference === 'string' ? obj.taxInvoicingPreference : undefined,
        inspirationLinks: typeof obj.inspirationLinks === 'string' ? obj.inspirationLinks : undefined,
      },
    };
  },
};

export interface IntakeDraftPayload {
  engineId?: string;
  selectedFeatures?: string[];
  companyName?: string;
  contactEmail?: string;
  contactPhone?: string;
  currency?: 'INR' | 'USD';
  totalCostINR?: number;
  totalCostUSD?: number;
  stepIndex?: number;
  brandAssetOption?: string;
  maintenancePlan?: string;
  scopeCode?: string;
  projectGoal?: string;
  targetAudience?: string;
  baseEngineId?: string;
  baseEngineTitle?: string;
  timeline?: string;
  inspirationLinks?: string;
  additionalNotes?: string;
}

export const intakeDraftSchema = {
  safeParse(input: unknown): SafeParseResult<IntakeDraftPayload> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return {
        success: false,
        error: { message: 'Invalid payload: body must be a JSON object.', issues: [{ field: 'body', message: 'Expected object' }] },
      };
    }

    const obj = input as Record<string, unknown>;
    const engineId = typeof obj.engineId === 'string' && obj.engineId ? obj.engineId : 'multipage';
    const selectedFeatures = Array.isArray(obj.selectedFeatures)
      ? obj.selectedFeatures.filter((f): f is string => typeof f === 'string')
      : [];

    return {
      success: true,
      data: {
        engineId,
        selectedFeatures,
        companyName: typeof obj.companyName === 'string' ? obj.companyName.trim() : undefined,
        contactEmail: typeof obj.contactEmail === 'string' ? obj.contactEmail.trim().toLowerCase() : undefined,
        contactPhone: typeof obj.contactPhone === 'string' ? obj.contactPhone.trim() : undefined,
        currency: obj.currency === 'USD' ? 'USD' : 'INR',
        totalCostINR: typeof obj.totalCostINR === 'number' ? obj.totalCostINR : Number(obj.totalCostINR) || 0,
        totalCostUSD: typeof obj.totalCostUSD === 'number' ? obj.totalCostUSD : Number(obj.totalCostUSD) || 0,
        stepIndex: typeof obj.stepIndex === 'number' ? obj.stepIndex : Number(obj.stepIndex) || 0,
        brandAssetOption: typeof obj.brandAssetOption === 'string' ? obj.brandAssetOption : undefined,
        maintenancePlan: typeof obj.maintenancePlan === 'string' ? obj.maintenancePlan : undefined,
        scopeCode: typeof obj.scopeCode === 'string' ? obj.scopeCode.trim() : undefined,
        projectGoal: typeof obj.projectGoal === 'string' ? obj.projectGoal.trim() : undefined,
        targetAudience: typeof obj.targetAudience === 'string' ? obj.targetAudience.trim() : undefined,
        baseEngineId: typeof obj.baseEngineId === 'string' ? obj.baseEngineId.trim() : undefined,
        baseEngineTitle: typeof obj.baseEngineTitle === 'string' ? obj.baseEngineTitle.trim() : undefined,
        timeline: typeof obj.timeline === 'string' ? obj.timeline.trim() : undefined,
        inspirationLinks: typeof obj.inspirationLinks === 'string' ? obj.inspirationLinks.trim() : undefined,
        additionalNotes: typeof obj.additionalNotes === 'string' ? obj.additionalNotes.trim() : undefined,
      },
    };
  },
};


export interface CreateRazorpayOrderPayload {
  scopeCode: string;
  amount?: number;
  currency?: 'INR' | 'USD';
  invoiceId?: string;
  milestoneStage?: string;
}

export const createRazorpayOrderSchema = {
  safeParse(input: unknown): SafeParseResult<CreateRazorpayOrderPayload> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return {
        success: false,
        error: { message: 'Invalid payload: body must be a JSON object.', issues: [{ field: 'body', message: 'Expected object' }] },
      };
    }

    const obj = input as Record<string, unknown>;
    const issues: Array<{ field: string; message: string }> = [];

    const scopeCode = typeof obj.scopeCode === 'string' ? obj.scopeCode.trim() : '';
    if (!scopeCode) {
      issues.push({ field: 'scopeCode', message: 'scopeCode is required.' });
    }

    let amount: number | undefined;
    if (obj.amount !== undefined) {
      amount = typeof obj.amount === 'number' ? obj.amount : Number(obj.amount);
      if (isNaN(amount) || amount <= 0) {
        issues.push({ field: 'amount', message: 'amount must be a positive number greater than 0.' });
      }
    }

    if (issues.length > 0) {
      return { success: false, error: { message: issues.map((i) => `${i.field}: ${i.message}`).join(', '), issues } };
    }

    return {
      success: true,
      data: {
        scopeCode,
        amount,
        currency: obj.currency === 'USD' ? 'USD' : 'INR',
        invoiceId: typeof obj.invoiceId === 'string' ? obj.invoiceId : undefined,
        milestoneStage: typeof obj.milestoneStage === 'string' ? obj.milestoneStage : undefined,
      },
    };
  },
};

export interface CopilotQueryPayload {
  query: string;
  scopeCode?: string;
}

export const copilotQuerySchema = {
  safeParse(input: unknown): SafeParseResult<CopilotQueryPayload> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return {
        success: false,
        error: { message: 'Invalid payload: body must be a JSON object.', issues: [{ field: 'body', message: 'Expected object' }] },
      };
    }

    const obj = input as Record<string, unknown>;
    const query = typeof obj.query === 'string' ? obj.query.trim() : '';

    if (!query) {
      return {
        success: false,
        error: { message: 'query parameter is required and cannot be empty.', issues: [{ field: 'query', message: 'Query cannot be empty' }] },
      };
    }

    return {
      success: true,
      data: {
        query,
        scopeCode: typeof obj.scopeCode === 'string' ? obj.scopeCode.trim() : undefined,
      },
    };
  },
};
