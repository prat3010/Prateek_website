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

  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.getElementById('razorpay-sdk-script') as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => resolve(false);
        // Polling check in case onload already fired
        const interval = setInterval(() => {
          if (typeof window !== 'undefined' && window.Razorpay) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
          resolve(typeof window !== 'undefined' && Boolean(window.Razorpay));
        }, 3000);
        return;
      }

      const script = document.createElement('script');
      script.id = 'razorpay-sdk-script';
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
      // 1. Ensure Razorpay SDK script is loaded
      const isLoaded = await loadRazorpaySDK();
      if (!isLoaded || typeof window === 'undefined' || !window.Razorpay) {
        alert('Could not load Razorpay Gateway SDK. Please check network connection.');
        setLoading(false);
        return;
      }

      // 2. Create Order on Backend API
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
        alert(`Order creation failed: ${orderData.error || 'Server error'}`);
        setLoading(false);
        return;
      }

      // 3. Configure Razorpay Payment Options
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
              alert(`🎉 Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
              if (onSuccess) onSuccess(response.razorpay_payment_id);
            } else {
              alert(`Payment verification failed: ${verifyData.error || 'Invalid signature'}`);
            }
          } catch (vErr) {
            console.error('Payment verification error:', vErr);
            alert('Payment completed, but verification server route encountered an error.');
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

      // 4. Open Payment Gateway Modal
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (resp: { error?: { description?: string } }) {
        alert(`Payment Failed: ${resp.error?.description || 'Transaction declined.'}`);
      });
      rzpInstance.open();
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      alert(err instanceof Error ? err.message : 'Checkout failed.');
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
