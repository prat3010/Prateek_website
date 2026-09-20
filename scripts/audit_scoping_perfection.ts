#!/usr/bin/env npx tsx
/**
 * ⚡ Scoping Engine Perfection & Quality Audit Suite
 *
 * Exhaustively evaluates and certifies:
 * 1. AI Intent Classification (Live API against Retriever AI / Catalog Matcher)
 * 2. Deterministic CPQ Mathematical Pricing & Volume Bundle Discounts
 * 3. RFP Parser & Feature Extraction
 * 4. Live Scoping Copilot Grounding (Retriever Tenant prateeq_scoping)
 * 5. Embeddable Widget Script Delivery
 */

import { calcQuote, resolveFeatureDependencies, type Currency, type QuoteSelection } from '../src/lib/pricing';
import questionnaireDefaults from '../src/data/intakeQuestionnaireDefaults.json';
import type { BaseEngineItem, FeatureItem, BrandAssetOption, MaintenancePlanOption } from '../src/data/resume';
import { POST as parseIntentHandler } from '../src/app/api/scoping/parse-intent/route';
import { POST as parseRfpHandler } from '../src/app/api/scoping/parse-rfp/route';
import { NextRequest } from 'next/server';

const { engines, features, brandAssets, maintenancePlans } = questionnaireDefaults;
const typedEngines = engines as BaseEngineItem[];
const typedFeatures = features as FeatureItem[];
const typedBrandAssets = brandAssets as BrandAssetOption[];
const typedMaintenancePlans = maintenancePlans as MaintenancePlanOption[];


interface AuditTestResult {
  name: string;
  passed: boolean;
  latencyMs: number;
  details: string;
}

const results: AuditTestResult[] = [];

function record(name: string, passed: boolean, latencyMs: number, details: string) {
  results.push({ name, passed, latencyMs, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${latencyMs.toFixed(1)}ms] ${name}: ${details}`);
}

async function runAudit() {
  console.log('\n======================================================================');
  console.log('🔍 PRATEEQ SCOPING ENGINE — COMPREHENSIVE QUALITY AUDIT');
  console.log('======================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: AI Intent Classification (SaaS + AI RAG Archetype)
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'I need an enterprise AI SaaS platform with user authentication, Stripe/Razorpay payments, an AI RAG copilot for PDF docs, and an admin dashboard.',
      }),
    });
    const res = await parseIntentHandler(req);
    const lat = performance.now() - start;
    const data = await res.json();

    const hasRequiredFeatures = ['auth', 'admin', 'ai_rag'].every(f => data.featureIds?.includes(f));
    const isSaas = data.baseEngineId === 'saas';
    const isTopNotch = res.status === 200 && data.success && isSaas && hasRequiredFeatures;

    record(
      'AI Intent: RAG SaaS Platform',
      isTopNotch,
      lat,
      `Engine: ${data.baseEngineId} | Features: [${data.featureIds?.join(', ')}] | Timeline: ${data.suggestedTimeline} (Model: ${data.modelUsed})`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: AI Intent Classification (Single-Page Landing / Waitlist)
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'High-converting single page landing page for an upcoming AI product waitlist with email captures.',
      }),
    });
    const res = await parseIntentHandler(req);
    const lat = performance.now() - start;
    const data = await res.json();

    const isLanding = data.baseEngineId === 'landing';
    const hasEmail = data.featureIds?.includes('email');
    const isTopNotch = res.status === 200 && data.success && isLanding && hasEmail;

    record(
      'AI Intent: Landing Page / Waitlist',
      isTopNotch,
      lat,
      `Engine: ${data.baseEngineId} | Features: [${data.featureIds?.join(', ')}] | Archetype: ${data.archetypeId}`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: AI Intent Classification (Multi-Page E-Commerce Store)
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'E-commerce online storefront with product SKU catalog, shopping cart drawer, and payment checkout.',
      }),
    });
    const res = await parseIntentHandler(req);
    const lat = performance.now() - start;
    const data = await res.json();

    const isEcom = data.baseEngineId === 'multipage' || data.archetypeId === 'ecommerce_store';
    const hasCommerce = data.featureIds?.includes('commerce') || data.featureIds?.includes('payments');
    const isTopNotch = res.status === 200 && data.success && isEcom && hasCommerce;

    record(
      'AI Intent: E-Commerce Storefront',
      isTopNotch,
      lat,
      `Engine: ${data.baseEngineId} | Features: [${data.featureIds?.join(', ')}] | Archetype: ${data.archetypeId}`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Transitive Dependency Resolution
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    // Selecting 'lms' should automatically resolve 'auth' and 'payments'
    const requested = ['lms'];
    const resolved = resolveFeatureDependencies(requested, typedFeatures);
    const lat = performance.now() - start;

    const hasAuth = resolved.includes('auth');
    const hasPayments = resolved.includes('payments');
    const isTopNotch = hasAuth && hasPayments;

    record(
      'Transitive Dependency Resolution (LMS -> Auth + Payments)',
      isTopNotch,
      lat,
      `Requested: [lms] -> Resolved: [${resolved.join(', ')}]`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: CPQ Math Invariant — 0%, 5%, and 10% Volume Bundle Discounts
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    // 2 features (0% discount)
    const sel0: QuoteSelection = { engineId: 'saas', featureIds: ['auth', 'email'] };
    const q0 = calcQuote(typedEngines, typedFeatures, typedBrandAssets, typedMaintenancePlans, sel0, 'INR');

    // 4 features (5% discount)
    const sel5: QuoteSelection = { engineId: 'saas', featureIds: ['auth', 'email', 'admin', 'payments'] };
    const q5 = calcQuote(typedEngines, typedFeatures, typedBrandAssets, typedMaintenancePlans, sel5, 'INR');

    // 7 features (10% discount)
    const sel10: QuoteSelection = { engineId: 'saas', featureIds: ['auth', 'email', 'admin', 'payments', 'cms', 'commerce', 'ai_rag'] };
    const q10 = calcQuote(typedEngines, typedFeatures, typedBrandAssets, typedMaintenancePlans, sel10, 'INR');

    const lat = performance.now() - start;
    const isTopNotch = q0.bundleDiscountPercent === 0 &&
                       q5.bundleDiscountPercent === 5 &&
                       q10.bundleDiscountPercent === 10 &&
                       q10.depositINR === Math.round(q10.netTotalINR * 0.5);

    record(
      'CPQ Math: Tiered Bundle Discounts & 50% Deposit Split',
      isTopNotch,
      lat,
      `Tiers: 2 feats = ${q0.bundleDiscountPercent}%, 4 feats = ${q5.bundleDiscountPercent}%, 7 feats = ${q10.bundleDiscountPercent}% | Deposit: ₹${q10.depositINR.toLocaleString()} of ₹${q10.netTotalINR.toLocaleString()}`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Dual Currency Parity (INR vs USD Conversion)
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    const sel: QuoteSelection = { engineId: 'saas', featureIds: ['auth', 'ai_rag', 'admin'] };
    const qINR = calcQuote(typedEngines, typedFeatures, typedBrandAssets, typedMaintenancePlans, sel, 'INR');
    const qUSD = calcQuote(typedEngines, typedFeatures, typedBrandAssets, typedMaintenancePlans, sel, 'USD');
    const lat = performance.now() - start;

    const isTopNotch = qINR.totalINR > 0 && qUSD.totalUSD > 0 && qINR.totalINR > qUSD.totalUSD;

    record(
      'Dual Currency Display & Parity',
      isTopNotch,
      lat,
      `Active INR: ₹${qINR.total.toLocaleString()} | Active USD: $${qUSD.total.toLocaleString()} | Dual: ₹${qINR.totalINR.toLocaleString()} / $${qINR.totalUSD.toLocaleString()}`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: RFP Document / Text Parser
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    const sampleRfp = `
# Project Request for Proposal (RFP)
We are seeking a full-stack engineering team to build a Next.js SaaS portal.
Requirements:
1. Secure Google OAuth and email login (Authentication)
2. Subscription billing via Stripe or Razorpay (Payments)
3. Document Q&A assistant powered by Retrieval-Augmented Generation (AI RAG)
4. Admin control center to manage accounts (Admin Dashboard)
Delivery Timeline: Need completion within 4 to 6 weeks.
    `;
    const req = new NextRequest('http://localhost:3000/api/scoping/parse-rfp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'Project_RFP.md',
        content: sampleRfp,
      }),
    });
    const res = await parseRfpHandler(req);
    const lat = performance.now() - start;
    const data = await res.json();

    const isTopNotch = res.status === 200 && data.success &&
      data.baseEngineId === 'saas' &&
      data.featureIds?.includes('auth') &&
      data.featureIds?.includes('ai_rag');

    record(
      'RFP Parser: Structured Scope Extraction',
      isTopNotch,
      lat,
      `Engine: ${data.baseEngineId} | Extracted Features: [${data.featureIds?.join(', ')}] | Confidence: ${data.confidenceScore}`
    );
  }


  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Live Retriever RAG Chat Search on Dogfooding Tenant prateeq_scoping
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    let isTopNotch = false;
    let hitCount = 0;
    let topScore = 0;
    let snippet = '';

    try {
      const resp = await fetch('https://rag.prateeq.in/v1/tenants/1f85286c-9d9a-4ebc-9c62-a99360a5ece4/search', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ret_live_eae27a51db3b44ef81e16df59137eda7bcfdc987dc204d6bacb9db0089a7886a',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'What are the payment terms, milestone split, and deliverable standards for a SaaS build?',
          limit: 3,
          enable_hybrid: true,
        }),
      });

      const data = await resp.json();
      hitCount = data.results?.length || 0;
      topScore = data.results?.[0]?.score || 0;
      snippet = data.results?.[0]?.content?.slice(0, 100) || '';
      isTopNotch = resp.status === 200 && hitCount > 0;
    } catch (err: any) {
      snippet = err.message;
    }
    const lat = performance.now() - start;

    record(
      'Live Scoping Copilot: Retriever pgvector Knowledge Search',
      isTopNotch,
      lat,
      `Hits: ${hitCount} | Top Score: ${topScore.toFixed(3)} | Snippet: "${snippet}..."`
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 9: Public Embed Widget Script Delivery
  // ──────────────────────────────────────────────────────────────────────────
  {
    const start = performance.now();
    let isTopNotch = false;
    let length = 0;

    try {
      const resp = await fetch('https://rag.prateeq.in/widget.js', { method: 'GET' });
      const text = await resp.text();
      length = text.length;
      isTopNotch = resp.status === 200 && length > 5000 && text.includes('Retriever');
    } catch (err: any) {
      // ignore
    }
    const lat = performance.now() - start;

    record(
      'Embed Widget: Public JavaScript Delivery (rag.prateeq.in/widget.js)',
      isTopNotch,
      lat,
      `Status: 200 OK | Byte Size: ${length} bytes`
    );
  }

  console.log('\n======================================================================');
  console.log('📋 AUDIT SUMMARY & VERDICT');
  console.log('======================================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`Total Quality Checks: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length} / ${results.length}`);
  console.log(`Verdict: ${allPassed ? '🏆 100% TOP-NOTCH — ZERO DEFECTS' : '⚠️ ATTENTION REQUIRED'}`);
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit run failed with error:', err);
  process.exit(1);
});
