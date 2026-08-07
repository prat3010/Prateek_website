'use client';

import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  amount: number;
  currency: 'INR' | 'USD';
  scopeCode: string;
  companyName: string;
  baseEngineTitle: string;
  selectedFeatures: string[];
  totalCost: number;
  userEmail: string;
  userName: string;
  buttonText?: string;
  onSuccess?: (paymentId: string) => void;
}

export default function RazorpayCheckoutButton({
  amount,
  currency,
  scopeCode,
  companyName,
  userEmail,
  userName,
  buttonText,
  onSuccess,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const loadScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }

      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
      if (existing) {
        if (typeof window !== 'undefined' && window.Razorpay) {
          resolve(true);
          return;
        }
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        // Failsafe check
        setTimeout(() => {
          resolve(typeof window !== 'undefined' && Boolean(window.Razorpay));
        }, 1500);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 1. Ensure Razorpay SDK is present
      const loaded = await loadScript();
      if (!loaded || typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Razorpay SDK could not be loaded into browser window.');
      }

      // 2. Create Order on Backend
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          receipt: `receipt_${scopeCode}`,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || 'Failed to create payment order on server.');
      }

      // 3. Construct Options and Open Modal Synchronously in Main Thread
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TMyS4YM83bVpqF',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Prateek Sharma | Web Architecture',
        description: `50% Scope Deposit for ${scopeCode}`,
        image: 'https://prateeq.in/images/hero-character-noir.png',
        order_id: orderData.id,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                scopeCode,
                companyName,
                userEmail,
                amount,
                currency,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              alert(`🎉 Payment Successful! Deposit confirmed. Payment ID: ${response.razorpay_payment_id}`);
              if (onSuccess) onSuccess(response.razorpay_payment_id);
            } else {
              alert(`Payment verification failed: ${verifyData.error || 'Invalid signature'}`);
            }
          } catch (vErr) {
            console.error('Payment verification request error:', vErr);
            alert('Payment completed, but verification endpoint returned an error.');
          }
        },
        prefill: {
          name: userName || companyName,
          email: userEmail,
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp: { error?: { description?: string } }) {
        alert(`Payment Failed: ${resp.error?.description || 'Transaction declined.'}`);
      });
      razorpayInstance.open();
    } catch (err: unknown) {
      console.error('Checkout execution error:', err);
      alert(err instanceof Error ? err.message : 'Checkout encountered an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="comic-btn comic-btn-blue"
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" style={{ marginRight: '0.4rem' }} /> Opening Gateway...
        </>
      ) : (
        <>
          <CreditCard size={16} style={{ marginRight: '0.4rem' }} />
          {buttonText || `Pay 50% Deposit (${currency === 'INR' ? `₹${amount.toLocaleString('en-IN')}` : `$${amount}`})`}
        </>
      )}
    </button>
  );
}
