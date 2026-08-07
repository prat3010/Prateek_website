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

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }

      // Check if script element already exists in DOM
      let script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
      if (script) {
        if (typeof window !== 'undefined' && window.Razorpay) {
          resolve(true);
          return;
        }
        script.addEventListener('load', () => resolve(true), { once: true });
        script.addEventListener('error', () => resolve(false), { once: true });
        
        // Wait up to 5s if already present
        let count = 0;
        const interval = setInterval(() => {
          count++;
          if (typeof window !== 'undefined' && window.Razorpay) {
            clearInterval(interval);
            resolve(true);
          } else if (count >= 50) {
            clearInterval(interval);
            resolve(false);
          }
        }, 100);
        return;
      }

      // Append script dynamically
      script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Could not initialize Razorpay payment gateway. Please refresh the page and try again.');
        setLoading(false);
        return;
      }

      // 1. Create order on backend
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
        throw new Error(orderData.error || 'Order creation failed.');
      }

      // 2. Configure Razorpay Modal Options
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
          // 3. Verify Payment Signature on backend
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
            if (onSuccess) onSuccess(response.razorpay_payment_id);
          } else {
            alert(`Payment verification failed: ${verifyData.error}`);
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

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response: { error: { description: string } }) {
        alert(`Payment failed: ${response.error?.description || 'Transaction declined.'}`);
      });
      paymentObject.open();
    } catch (err: unknown) {
      console.error('Razorpay Checkout error:', err);
      alert(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
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
