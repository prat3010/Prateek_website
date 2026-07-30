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
  stripeUrl: string;
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
        stripeUrl: "https://buy.stripe.com/test_starter_inr",
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
        stripeUrl: "https://buy.stripe.com/test_pro_inr",
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
        stripeUrl: "https://buy.stripe.com/test_business_inr",
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
        stripeUrl: "https://buy.stripe.com/test_starter_usd",
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
        stripeUrl: "https://buy.stripe.com/test_pro_usd",
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
        stripeUrl: "https://buy.stripe.com/test_business_usd",
      },
    ],
  },
};

export function PricingSection() {
  const [pricing, setPricing] = useState<PricingPayload>(DEFAULT_PRICING_FALLBACK);
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

            <a
              href={plan.stripeUrl || "/rag/login"}
              target="_blank"
              rel="noopener noreferrer"
              className={`comic-btn ${plan.popular ? "comic-btn-blue" : "comic-btn-outline"} ${styles.planCta}`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
