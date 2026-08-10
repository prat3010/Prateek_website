"use client";

import { useState, useEffect } from "react";
import styles from "./rag.module.css";

interface PlanItem {
  id: string;
  name: string;
  price: string;
  period: string;
  popular: boolean;
  description: string;
  features: string[];
  cta: string;
  planId?: string;
}

interface CurrencyGroup {
  currency: string;
  symbol: string;
  plans: PlanItem[];
}

interface PricingPayload {
  inr: CurrencyGroup;
  usd: CurrencyGroup;
}

const DEFAULT_PRICING_FALLBACK: PricingPayload = {
  inr: {
    currency: "INR",
    symbol: "₹",
    plans: [
      {
        id: "starter_inr",
        name: "Starter",
        price: "1,999",
        period: "/month",
        popular: false,
        description: "Ideal for small websites, blogs, and personal projects.",
        features: [
          "1 Workspace / Tenant",
          "20 Documents (~50MB)",
          "1,000 Chat Queries / mo",
          "Llama 3.3 70B & Gemini 2.5",
          "Standard Support",
        ],
        cta: "Start 7-Day Free Trial",
        planId: "plan_starter_inr",
      },
      {
        id: "pro_inr",
        name: "Pro",
        price: "5,999",
        period: "/month",
        popular: true,
        description: "For growing businesses, legal teams, and e-commerce stores.",
        features: [
          "5 Workspaces / Tenants",
          "100 Documents (~500MB)",
          "5,000 Chat Queries / mo",
          "Remove 'Powered by' Branding",
          "Presigned Citation PDF Downloads",
          "Priority Hybrid Search & Re-ranking",
        ],
        cta: "Upgrade to Pro",
        planId: "plan_pro_inr",
      },
      {
        id: "business_inr",
        name: "Business",
        price: "14,999",
        period: "/month",
        popular: false,
        description: "For agencies, medical networks, and high-traffic platforms.",
        features: [
          "Unlimited Workspaces",
          "500 Documents (~2.5GB)",
          "20,000 Chat Queries / mo",
          "Dedicated Private Tenant RLS Isolation",
          "Custom Domain Mapping",
          "99.9% Uptime SLA & 24/7 Support",
        ],
        cta: "Get Business Plan",
        planId: "plan_business_inr",
      },
    ],
  },
  usd: {
    currency: "USD",
    symbol: "$",
    plans: [
      {
        id: "starter_usd",
        name: "Starter",
        price: "29",
        period: "/month",
        popular: false,
        description: "Ideal for small websites, blogs, and personal projects.",
        features: [
          "1 Workspace / Tenant",
          "20 Documents (~50MB)",
          "1,000 Chat Queries / mo",
          "Llama 3.3 70B & Gemini 2.5",
          "Standard Support",
        ],
        cta: "Start 7-Day Free Trial",
        planId: "plan_starter_usd",
      },
      {
        id: "pro_usd",
        name: "Pro",
        price: "79",
        period: "/month",
        popular: true,
        description: "For growing businesses, legal teams, and e-commerce stores.",
        features: [
          "5 Workspaces / Tenants",
          "100 Documents (~500MB)",
          "5,000 Chat Queries / mo",
          "Remove 'Powered by' Branding",
          "Presigned Citation PDF Downloads",
          "Priority Hybrid Search & Re-ranking",
        ],
        cta: "Upgrade to Pro",
        planId: "plan_pro_usd",
      },
      {
        id: "business_usd",
        name: "Business",
        price: "199",
        period: "/month",
        popular: false,
        description: "For agencies, medical networks, and high-traffic platforms.",
        features: [
          "Unlimited Workspaces",
          "500 Documents (~2.5GB)",
          "20,000 Chat Queries / mo",
          "Dedicated Private Tenant RLS Isolation",
          "Custom Domain Mapping",
          "99.9% Uptime SLA & 24/7 Support",
        ],
        cta: "Get Business Plan",
        planId: "plan_business_usd",
      },
    ],
  },
};

export function PricingSection() {
  const [pricing, setPricing] = useState<PricingPayload>(DEFAULT_PRICING_FALLBACK);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [currencyMode, setCurrencyMode] = useState<"inr" | "usd">(() => {
    if (typeof window !== "undefined") {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!tz.includes("Kolkata") && !tz.includes("Asia/Calcutta") && !tz.includes("India")) {
          return "usd";
        }
      } catch (e) {
        console.warn("Timezone detection failed", e);
      }
    }
    return "inr";
  });

  useEffect(() => {
    let active = true;
    fetch("https://rag.prateeq.in/v1/config/pricing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && data.inr && data.usd) {
          setPricing(data);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: PlanItem) => {
    try {
      setLoadingPlanId(plan.id);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Could not load Razorpay checkout SDK. Please check your connection.");
        setLoadingPlanId(null);
        return;
      }

      const res = await fetch("/api/client/create-razorpay-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.planId || plan.id }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || "Failed to initialize subscription.");
        setLoadingPlanId(null);
        return;
      }

      if (data.isMock) {
        alert(`⚡ Razorpay Subscription Sandbox Mode:\n\nSimulated active subscription for ${plan.name} Plan (${data.subscriptionId}).`);
        setLoadingPlanId(null);
        return;
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Retriever AI SaaS",
        description: `Subscription for ${plan.name} Plan`,
        image: "/images/gremlin-head.png",
        handler: function (response: { razorpay_subscription_id: string }) {
          alert(`Subscription activated successfully! ID: ${response.razorpay_subscription_id}`);
        },
        theme: {
          color: "#0ea5e9",
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Subscription launch error:", err);
      alert("An unexpected error occurred while launching checkout.");
    } finally {
      setLoadingPlanId(null);
    }
  };

  const currentGroup = currencyMode === "inr" ? pricing.inr : pricing.usd;

  return (
    <section className={styles.pricingSection} id="pricing">
      <div className={styles.pricingHeader}>
        <span className={styles.pricingPreTitle}>TRANSPARENT PRICING</span>
        <h2 className={styles.pricingTitle}>Simple, Self-Serve Subscription Plans</h2>
        <p className={styles.pricingDesc}>
          Scale your knowledge base effortlessly. Zero hidden fees. Cancel anytime.
        </p>

        <div className={styles.currencyToggle}>
          <button
            className={`${styles.currencyBtn} ${currencyMode === "inr" ? styles.currencyActive : ""}`}
            onClick={() => setCurrencyMode("inr")}
          >
            🇮🇳 INR Rates (India)
          </button>
          <button
            className={`${styles.currencyBtn} ${currencyMode === "usd" ? styles.currencyActive : ""}`}
            onClick={() => setCurrencyMode("usd")}
          >
            🌐 USD Rates (Global)
          </button>
        </div>
      </div>

      <div className={styles.pricingGrid}>
        {currentGroup.plans.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.pricingCard} ${plan.popular ? styles.pricingCardPopular : ""}`}
          >
            {plan.popular && <span className={styles.popularTag}>MOST POPULAR</span>}
            <h3 className={styles.planName}>{plan.name}</h3>
            <p className={styles.planDesc}>{plan.description}</p>

            <div className={styles.planPriceContainer}>
              <span className={styles.planSymbol}>{currentGroup.symbol}</span>
              <span className={styles.planPrice}>{plan.price}</span>
              <span className={styles.planPeriod}>{plan.period}</span>
            </div>

            <ul className={styles.planFeatures}>
              {plan.features.map((feat, idx) => (
                <li key={idx} className={styles.planFeatureItem}>
                  ✓ {feat}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={loadingPlanId === plan.id}
              className={`comic-btn ${plan.popular ? "comic-btn-blue" : "comic-btn-outline"} ${styles.planCta}`}
            >
              {loadingPlanId === plan.id ? "Launching Razorpay..." : plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
