import sellerData from '@/data/seller.json';
import { InvoiceLineItem, TaxBreakup, AddressDetails } from './clientOrder';

export const SELLER_CONFIG = {
  name: sellerData?.name || process.env.NEXT_PUBLIC_SELLER_NAME || 'Prateek Sharma',
  company: sellerData?.company || process.env.NEXT_PUBLIC_SELLER_COMPANY || 'Prateeq Studio',
  email: sellerData?.email || process.env.NEXT_PUBLIC_SELLER_EMAIL || process.env.CONTACT_EMAIL_TO || 'prateeqsharma@gmail.com',
  phone: sellerData?.phone || process.env.NEXT_PUBLIC_SELLER_PHONE || '+91 98765 43210',
  gstin: sellerData?.gstin || process.env.NEXT_PUBLIC_SELLER_GSTIN || '07AAAAA0000A1Z5',
  address: {
    street: sellerData?.street || process.env.NEXT_PUBLIC_SELLER_STREET || 'Developer Studio, CP',
    city: sellerData?.city || process.env.NEXT_PUBLIC_SELLER_CITY || 'New Delhi',
    state: sellerData?.state || process.env.NEXT_PUBLIC_SELLER_STATE || 'Delhi',
    pincode: sellerData?.pincode || process.env.NEXT_PUBLIC_SELLER_PINCODE || '110001',
    country: sellerData?.country || process.env.NEXT_PUBLIC_SELLER_COUNTRY || 'India',
  },
  defaultSacCode: sellerData?.defaultSacCode || process.env.NEXT_PUBLIC_DEFAULT_SAC_CODE || '998314', // Information Technology Software Consulting & Development Services
};

export const SUPPORTED_CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (GST Supported)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (Non-GST)' },
  { code: 'EUR', symbol: '€', name: 'Euro (Non-GST)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (Non-GST)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (Non-GST)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (Non-GST)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (Non-GST)' },
];

export interface LineItemInput {
  name: string;
  description?: string;
  sac_hsn?: string;
  rate: number;
  quantity: number;
  tax_rate?: number;
  tax_type?: 'inclusive' | 'exclusive';
}

export interface CalculateInvoiceInput {
  currency: string;
  place_of_supply?: string;
  billing_address?: AddressDetails;
  line_items: LineItemInput[];
}

export interface InvoiceCalculationResult {
  is_gst: boolean;
  currency: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_breakup: TaxBreakup;
  grand_total: number;
}

/**
 * Determines whether a place of supply or state matches the seller state for Intra-State GST.
 */
export function isIntraState(placeOfSupply?: string): boolean {
  if (!placeOfSupply) return true;
  const sellerState = SELLER_CONFIG.address.state.trim().toLowerCase();
  const clientState = placeOfSupply.trim().toLowerCase();
  return sellerState === clientState;
}

/**
 * Calculates itemized totals, subtotal, CGST/SGST/IGST tax breakup, and grand total.
 */
export function calculateInvoiceTotals(input: CalculateInvoiceInput): InvoiceCalculationResult {
  const currency = (input.currency || 'INR').toUpperCase();
  const isINR = currency === 'INR';
  const placeOfSupply = input.place_of_supply || input.billing_address?.state || SELLER_CONFIG.address.state;
  const intraState = isIntraState(placeOfSupply);
  
  // International currencies do not support GST tax rates as per Razorpay spec
  const is_gst = isINR && Boolean(input.place_of_supply || input.billing_address?.state);

  let aggregateSubtotal = 0;
  let aggregateTax = 0;

  const computedLineItems: InvoiceLineItem[] = input.line_items.map((item, index) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const rate = Math.max(0, Number(item.rate) || 0);
    // If not GST (e.g. USD), tax rate is strictly 0
    const rawTaxRate = is_gst ? (Number(item.tax_rate) || 0) : 0;
    const taxType = item.tax_type || 'exclusive';

    let itemSubtotal = 0;
    let itemTaxAmount = 0;
    let itemTotal = 0;

    if (taxType === 'inclusive' && rawTaxRate > 0) {
      itemTotal = rate * qty;
      itemSubtotal = itemTotal / (1 + rawTaxRate / 100);
      itemTaxAmount = itemTotal - itemSubtotal;
    } else {
      itemSubtotal = rate * qty;
      itemTaxAmount = itemSubtotal * (rawTaxRate / 100);
      itemTotal = itemSubtotal + itemTaxAmount;
    }

    // Rounding for precision
    itemSubtotal = Math.round(itemSubtotal * 100) / 100;
    itemTaxAmount = Math.round(itemTaxAmount * 100) / 100;
    itemTotal = Math.round(itemTotal * 100) / 100;

    aggregateSubtotal += itemSubtotal;
    aggregateTax += itemTaxAmount;

    return {
      id: `item_${index + 1}`,
      name: item.name,
      description: item.description || '',
      sac_hsn: item.sac_hsn || (is_gst ? SELLER_CONFIG.defaultSacCode : ''),
      rate,
      quantity: qty,
      tax_rate: rawTaxRate,
      tax_type: taxType,
      subtotal: itemSubtotal,
      tax_amount: itemTaxAmount,
      total: itemTotal,
    };
  });

  aggregateSubtotal = Math.round(aggregateSubtotal * 100) / 100;
  aggregateTax = Math.round(aggregateTax * 100) / 100;
  const grand_total = Math.round((aggregateSubtotal + aggregateTax) * 100) / 100;

  // Build Tax Breakup
  let tax_breakup: TaxBreakup;

  if (!is_gst || aggregateTax === 0) {
    tax_breakup = {
      total_tax: 0,
      is_interstate: !intraState,
    };
  } else if (intraState) {
    // Intra-state split: 50% CGST + 50% SGST
    const halfTax = Math.round((aggregateTax / 2) * 100) / 100;
    const avgTaxRate = computedLineItems[0]?.tax_rate || 18;
    tax_breakup = {
      cgst_rate: avgTaxRate / 2,
      cgst_amount: halfTax,
      sgst_rate: avgTaxRate / 2,
      sgst_amount: halfTax,
      total_tax: aggregateTax,
      is_interstate: false,
    };
  } else {
    // Inter-state: IGST
    const avgTaxRate = computedLineItems[0]?.tax_rate || 18;
    tax_breakup = {
      igst_rate: avgTaxRate,
      igst_amount: aggregateTax,
      total_tax: aggregateTax,
      is_interstate: true,
    };
  }

  return {
    is_gst,
    currency,
    line_items: computedLineItems,
    subtotal: aggregateSubtotal,
    tax_breakup,
    grand_total,
  };
}

/**
 * Format numeric value into human readable currency string with currency symbol.
 */
export function formatCurrencyAmount(amount: number, currency: string = 'INR'): string {
  const curr = SUPPORTED_CURRENCIES.find((c) => c.code === currency.toUpperCase()) || SUPPORTED_CURRENCIES[0];
  if (curr.code === 'INR') {
    return `${curr.symbol}${Math.round(amount).toLocaleString('en-IN')}`;
  }
  return `${curr.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generates a unique invoice number format (e.g. INV-2026-8A3B).
 */
export function generateInvoiceNumber(prefix = 'INV'): string {
  const year = new Date().getFullYear();
  const hex = Math.random().toString(16).substring(2, 6).toUpperCase();
  return `${prefix}-${year}-${hex}`;
}
