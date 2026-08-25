import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

interface PromoCodeRow {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  currency: string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  partner_id: string | null;
}

const FALLBACK_PROMO_CODES: Record<string, Omit<PromoCodeRow, 'max_uses' | 'used_count' | 'expires_at' | 'partner_id'>> = {
  PRATEEQ10: {
    code: 'PRATEEQ10',
    discount_type: 'percentage',
    discount_value: 10,
    currency: 'ALL',
    is_active: true,
  },
  GROWTH5: {
    code: 'GROWTH5',
    discount_type: 'percentage',
    discount_value: 5,
    currency: 'ALL',
    is_active: true,
  },
  PARTNER20: {
    code: 'PARTNER20',
    discount_type: 'percentage',
    discount_value: 20,
    currency: 'ALL',
    is_active: true,
  },
  FOUNDER50: {
    code: 'FOUNDER50',
    discount_type: 'fixed',
    discount_value: 5000,
    currency: 'INR',
    is_active: true,
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = (body.code || '').trim().toUpperCase();
    const currency = (body.currency || 'INR') as 'INR' | 'USD';
    const subtotal = Number(body.subtotal) || 0;

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, error: 'Please enter a promo code.' },
        { status: 400 }
      );
    }

    let promoData: PromoCodeRow | null = null;

    if (supabase) {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .ilike('code', rawCode)
        .maybeSingle();

      if (!error && data) {
        promoData = data as PromoCodeRow;
      }
    }

    // Fallback if not in DB or offline
    if (!promoData && FALLBACK_PROMO_CODES[rawCode]) {
      const fb = FALLBACK_PROMO_CODES[rawCode];
      promoData = {
        ...fb,
        max_uses: null,
        used_count: 0,
        expires_at: null,
        partner_id: null,
      };
    }

    if (!promoData) {
      return NextResponse.json(
        { valid: false, error: `Promo code "${rawCode}" is invalid.` },
        { status: 404 }
      );
    }

    if (!promoData.is_active) {
      return NextResponse.json(
        { valid: false, error: `Promo code "${rawCode}" is no longer active.` },
        { status: 400 }
      );
    }

    if (promoData.expires_at && new Date(promoData.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: `Promo code "${rawCode}" has expired.` },
        { status: 400 }
      );
    }

    if (promoData.max_uses !== null && promoData.used_count >= promoData.max_uses) {
      return NextResponse.json(
        { valid: false, error: `Promo code "${rawCode}" has reached its maximum redemption limit.` },
        { status: 400 }
      );
    }

    if (promoData.currency !== 'ALL' && promoData.currency !== currency) {
      return NextResponse.json(
        { valid: false, error: `Promo code "${rawCode}" is only applicable in ${promoData.currency}.` },
        { status: 400 }
      );
    }

    // Calculate discount amounts
    let discountAmountINR = 0;
    let discountAmountUSD = 0;

    if (promoData.discount_type === 'percentage') {
      const rate = promoData.discount_value / 100;
      if (currency === 'INR') {
        discountAmountINR = Math.round(subtotal * rate);
        discountAmountUSD = Math.round((subtotal / 83) * rate);
      } else {
        discountAmountUSD = Math.round(subtotal * rate);
        discountAmountINR = Math.round(subtotal * 83 * rate);
      }
    } else {
      // Fixed discount
      if (promoData.currency === 'INR') {
        discountAmountINR = promoData.discount_value;
        discountAmountUSD = Math.round(promoData.discount_value / 83);
      } else if (promoData.currency === 'USD') {
        discountAmountUSD = promoData.discount_value;
        discountAmountINR = Math.round(promoData.discount_value * 83);
      } else {
        discountAmountINR = currency === 'INR' ? promoData.discount_value : Math.round(promoData.discount_value * 83);
        discountAmountUSD = currency === 'USD' ? promoData.discount_value : Math.round(promoData.discount_value / 83);
      }
    }

    return NextResponse.json({
      valid: true,
      code: promoData.code,
      discountType: promoData.discount_type,
      discountValue: promoData.discount_value,
      discountAmountINR,
      discountAmountUSD,
      partnerId: promoData.partner_id,
    });
  } catch (err) {
    console.error('Error validating promo code:', err);
    return NextResponse.json(
      { valid: false, error: 'Internal error validating promo code.' },
      { status: 500 }
    );
  }
}
