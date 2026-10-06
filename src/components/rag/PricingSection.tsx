"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { m } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { useAuth } from "@/context/AuthContext";
import MagneticButton from "@/components/ui/MagneticButton";
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
        cta: "Launch Free Sandbox (No CC)",
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
        cta: "Launch Free Sandbox (No CC)",
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
  const router = useRouter();
  const { user, loginWithGoogle, getAccessToken } = useAuth();
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

  const handleSubscribe = useCallback(async (plan: PlanItem) => {
    // 1. Starter tier: Zero-CC instant sandbox
    if (plan.id.includes("starter") || plan.name.toLowerCase() === "starter") {
      if (user) {
        router.push("/rag/app?onboarding=true");
      } else {
        await loginWithGoogle("/rag/app?onboarding=true");
      }
      return;
    }

    // 2. Paid tiers (Pro / Business): Ensure authenticated first
    if (!user) {
      await loginWithGoogle(`/rag?plan=${encodeURIComponent(plan.planId || plan.id)}#pricing`);
      return;
    }

    try {
      setLoadingPlanId(plan.id);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Could not load Razorpay checkout SDK. Please check your connection.");
        setLoadingPlanId(null);
        return;
      }

      const token = await getAccessToken();
      const res = await fetch("/api/client/create-razorpay-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planId: plan.planId || plan.id }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to initialize subscription.");
        setLoadingPlanId(null);
        return;
      }

      if (data.isMock) {
        if (token) {
          try {
            await fetch("/api/client/verify-razorpay-subscription", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpaySubscriptionId: data.subscriptionId,
                razorpayPaymentId: "pay_mock",
                razorpaySignature: "test_sub_signature_mock",
                planId: plan.planId || plan.id,
              }),
            });
          } catch {}
        }
        router.push("/rag/app?upgraded=true");
        setLoadingPlanId(null);
        return;
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Retriever AI SaaS",
        description: `Subscription for ${plan.name} Plan`,
        image: "/images/gremlin-head.png",
        prefill: {
          email: user?.email || "",
        },
        handler: async function (response: {
          razorpay_subscription_id: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) {
          try {
            if (token) {
              await fetch("/api/client/verify-razorpay-subscription", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpaySubscriptionId: response.razorpay_subscription_id,
                  razorpayPaymentId: response.razorpay_payment_id || "pay_verified",
                  razorpaySignature: response.razorpay_signature || "sig_verified",
                  planId: plan.planId || plan.id,
                }),
              });
            }
            router.push("/rag/app?upgraded=true");
          } catch {
            router.push("/rag/app?upgraded=true");
          }
        },
        theme: {
          color: "#0ea5e9",
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Subscription launch error:", err);
      toast.error("An unexpected error occurred while launching checkout.");
    } finally {
      setLoadingPlanId(null);
    }
  }, [user, router, loginWithGoogle, getAccessToken]);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const planParam = params.get("plan");
    if (!planParam) return;

    const url = new URL(window.location.href);
    url.searchParams.delete("plan");
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);

    const allPlans = [...(pricing.inr?.plans || []), ...(pricing.usd?.plans || [])];
    const targetPlan = allPlans.find(
      (p) => p.planId === planParam || p.id === planParam || p.name.toLowerCase() === planParam.toLowerCase()
    );

    if (targetPlan) {
      const timer = setTimeout(() => {
        void handleSubscribe(targetPlan);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, pricing, handleSubscribe]);

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
            {currencyMode === "inr" && (
              <m.span
                layoutId="ragCurrencyPill"
                className={styles.currencyPill}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            🇮🇳 INR Rates (India)
          </button>
          <button
            className={`${styles.currencyBtn} ${currencyMode === "usd" ? styles.currencyActive : ""}`}
            onClick={() => setCurrencyMode("usd")}
          >
            {currencyMode === "usd" && (
              <m.span
                layoutId="ragCurrencyPill"
                className={styles.currencyPill}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
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
              <span className={styles.planPrice}>
                <NumberFlow value={Number(plan.price.replace(/,/g, "")) || 0} />
              </span>
              <span className={styles.planPeriod}>{plan.period}</span>
            </div>

            <ul className={styles.planFeatures}>
              {plan.features.map((feat, idx) => (
                <li key={idx} className={styles.planFeatureItem}>
                  ✓ {feat}
                </li>
              ))}
            </ul>

            <MagneticButton strength={0.25} style={{ width: "100%" }}>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlanId === plan.id}
                className={`comic-btn ${plan.popular ? "comic-btn-blue" : "comic-btn-outline"} ${styles.planCta}`}
              >
                {loadingPlanId === plan.id ? "Launching Razorpay..." : plan.cta}
              </button>
            </MagneticButton>
          </div>
        ))}
      </div>
    </section>
  );
}
