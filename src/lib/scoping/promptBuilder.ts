import { calcQuote, resolveFeatureDependencies, type Currency } from '@/lib/pricing';
import {
  brandAssets,
  classifyPromptForBlueprint,
  computePhasedBreakdown,
  engines,
  featureCatalog,
  maintenancePlans,
  type ScopeContext,
} from './blueprintCatalog';

export const SCOPING_ARCHITECT_SYSTEM_PROMPT = `You are Prateek Sharma's Lead Solutions Architect and Conversational Scoping Copilot on prateeq.in/scoping.
You help prospective clients, startup founders, and creators architect custom web applications, SaaS MVPs, and AI platforms.

PERSONALITY & VOICE:
- Tone: Consultative, authoritative, deeply technical, and commercially pragmatic (adhering to the Ponytail Principle: the simplest architecture that completely solves the problem).
- Style: Speak in the first person ("I recommend", "my architecture", "we build"). Be transparent about engineering realities, timelines, and costs.
- Domain Mastery: You have deep command of Next.js 16 App Router, React 19, TypeScript, Python FastAPI, PostgreSQL Row-Level Security (RLS), pgvector hybrid search, and multi-tenant systems.

THE 5 BASE ENGINES (Fixed-Price Baseline):
1. Landing Page Engine ('landing'): ₹30,000 / $400 (1–2 weeks) — Single-page high-conversion marketing presence with contact capture.
2. Multi-Page Business Engine ('multipage'): ₹55,000 / $750 (2–3 weeks) — Full company web platform with dynamic pages, SEO, and CMS blog.
3. SaaS MVP Core Engine ('saas'): ₹175,000 / $2,400 (3–4 weeks) — Complete software application core with database multi-tenancy, authentication, and user workspace.
4. AI Strategy & Architecture Audit ('ai_strategy_audit'): ₹20,000 / $300 (1 week) — Low-risk 60-min discovery session + 3-page actionable architecture roadmap.
5. Standalone Widget Embed ('standalone_embed'): ₹15,000 / $200 (1–2 weeks) — Embeddable JavaScript widget or micro-app.

THE 18 CANONICAL FEATURE MODULES (Add-on IDs):
- auth: User Auth & Client Portal (Google OAuth 2.0 / Magic Links, Supabase RLS) — ₹25,000 / $350
- payments: Payment Gateway Integration (Razorpay / Stripe, Subscriptions) — ₹45,000 / $600
- cms: Headless Blog & CMS Content Management (Markdown parser) — ₹30,000 / $400
- ai_rag: Private AI Knowledge Base / Vector Search (pgvector hybrid search) — ₹125,000 / $1,700
- ai_agents: Autonomous AI Agents & Workflow Automation (DAG engine) — ₹135,000 / $1,800
- admin: Admin Dashboard & Role Access Control (RBAC backoffice) — ₹75,000 / $1,000
- email: Automated Email Workflows (Resend Transactional) — ₹15,000 / $200
- booking: Booking & Appointments Module (calendar slots; requires payments, auth) — ₹50,000 / $700
- commerce: E-Commerce Storefront & Cart Module (slide-over cart; requires payments, auth) — ₹75,000 / $1,000
- lms: LMS & Online Course Portal Module (video progression; requires payments, auth) — ₹85,000 / $1,150
- crm: CRM & Lead Management Module (pipeline & deal kanban; requires auth) — ₹60,000 / $800
- pwa: Progressive Web App (PWA) & Offline Module — ₹35,000 / $450
- i18n: Multilingual & i18n Localization Module — ₹30,000 / $400
- integrations: Third-Party Integrations (Slack / Zapier / Webhooks) — ₹40,000 / $550
- video: Video Hosting & Streaming Module (signed CDN playback) — ₹65,000 / $850
- migration: Legacy Database & Data Migration (ETL pipeline) — ₹30,000 / $400
- ai_voice_agent: Real-Time Voice AI Agent & WebRTC Call Assistant (LiveKit/Deepgram) — ₹95,000 / $1,250
- ai_vision_ocr: Multimodal AI Vision & Document Processing Engine (Gemini OCR) — ₹75,000 / $1,000

RULES OF ENGAGEMENT:
1. Always analyze the user's specific idea, recommend the ideal Base Engine, and list the exact Feature Modules needed.
2. Break down costs and suggest a clear Phase 1 (Core Lean MVP) vs Phase 2 (Scale & Automation) roadmap when appropriate.
3. Reference official engine and feature catalog IDs and realistic pricing.
4. Focus your response on consultative architectural advice, stack recommendations, and trade-offs. Do NOT output raw <blueprint_action> tags yourself; the scoping engine will attach the interactive blueprint action card automatically based on your recommended stack.`;

export function buildFallbackResponseText(
  prompt: string,
  currency: Currency,
  currentScope?: ScopeContext | null
): string {
  const p = prompt.toLowerCase();
  const blueprintRec = classifyPromptForBlueprint(prompt);

  const isBudgetQuery =
    p.includes('budget') ||
    p.includes('cheap') ||
    p.includes('cut cost') ||
    p.includes('cut costs') ||
    p.includes('lower price') ||
    p.includes('lean') ||
    p.includes('de-scope') ||
    p.includes('descope') ||
    p.includes('tight') ||
    p.includes('affordable') ||
    p.includes('cost too high') ||
    p.includes('reduce cost') ||
    p.includes('sculpt') ||
    p.includes('cut $') ||
    p.includes('cut ₹') ||
    /\b(under|less than|cut|save|trim|reduce)\s*([$₹]|usd|inr)?\s*\d+/i.test(p);

  const isTimelineQuery =
    p.includes('timeline') ||
    p.includes('how long') ||
    p.includes('delivery') ||
    p.includes('duration') ||
    p.includes('how many weeks') ||
    p.includes('when can');

  const isDependencyQuery =
    p.includes('depend') ||
    p.includes('prereq') ||
    p.includes('why do i need') ||
    p.includes('why auth') ||
    p.includes('why vector');

  // Check if user is introducing a brand new build/archetype vision
  const isNewBuildVision =
    p.includes('launch') ||
    p.includes('build') ||
    p.includes('create') ||
    p.includes('store') ||
    p.includes('shop') ||
    p.includes('ecommerce') ||
    p.includes('saas') ||
    p.includes('platform') ||
    p.includes('calling bot') ||
    p.includes('voice agent') ||
    p.includes('vault') ||
    p.includes('streamer') ||
    p.includes('podcast');

  const hasExistingScope =
    Boolean(currentScope?.selectedFeatures && currentScope.selectedFeatures.length > 0) &&
    !isNewBuildVision &&
    (isBudgetQuery || isTimelineQuery || isDependencyQuery || p.includes('my scope') || p.includes('current scope') || p.includes('these exact'));

  const targetEngineId = hasExistingScope && currentScope?.baseEngineId ? currentScope.baseEngineId : blueprintRec.baseEngineId;
  const targetFeatures = hasExistingScope && currentScope?.selectedFeatures ? currentScope.selectedFeatures : blueprintRec.featureIds;

  // Ensure transitive feature dependencies are included
  const extraDependencies = resolveFeatureDependencies(
    targetFeatures,
    featureCatalog
  );
  const resolvedFeatures = Array.from(
    new Set([...targetFeatures, ...extraDependencies])
  );

  const maintenancePlanId =
    blueprintRec.maintenancePlanId ||
    (resolvedFeatures.some((f) => f.startsWith('ai_')) ? 'premium' : 'standard');
  const brandAssetId = blueprintRec.brandAssetId || 'ready';

  // Calculate deterministic quote prices from questionnaire defaults
  const quote = calcQuote(
    engines,
    featureCatalog,
    brandAssets,
    maintenancePlans,
    {
      engineId: targetEngineId,
      featureIds: resolvedFeatures,
      brandAssetId,
      maintenancePlanId,
    },
    currency
  );

  const totalINR = quote.netTotalINR;
  const totalUSD = quote.netTotalUSD;
  const engineObj = engines.find((e) => e.id === targetEngineId);
  const engineTitle = engineObj ? engineObj.title : targetEngineId.toUpperCase();

  const featureNames = resolvedFeatures
    .map((id) => featureCatalog.find((f) => f.id === id)?.label)
    .filter(Boolean) as string[];

  const phased = computePhasedBreakdown(
    targetEngineId,
    resolvedFeatures,
    currency,
    brandAssetId,
    maintenancePlanId
  );

  const blueprintActionJson = JSON.stringify(
    {
      archetypeId: blueprintRec.archetypeId,
      baseEngineId: targetEngineId,
      featureIds: resolvedFeatures,
      brandAssetId,
      maintenancePlanId,
      suggestedTimeline: blueprintRec.suggestedTimeline,
      title: hasExistingScope ? `Refined ${engineTitle} Scope` : blueprintRec.title,
      totalINR,
      totalUSD,
      phasedBreakdown: phased,
    },
    null,
    2
  );

  const wordCount = prompt.trim().split(/\s+/).length;
  const isVagueQuery =
    !hasExistingScope &&
    wordCount <= 4 &&
    !isBudgetQuery &&
    !isTimelineQuery &&
    !isDependencyQuery &&
    !p.includes('voice') &&
    !p.includes('speech') &&
    !p.includes('rag') &&
    !p.includes('ocr') &&
    !p.includes('youtube') &&
    !p.includes('podcast') &&
    !p.includes('booking') &&
    !p.includes('course') &&
    !p.includes('store') &&
    !p.includes('shop') &&
    !p.includes('ecommerce') &&
    !p.includes('audit');

  if (blueprintRec.title.includes('Artist')) {
    return `### 🎨 Tailored Creative Architecture: Artist's Studio & Commission Hub
As a visual artist or painter, establishing direct collector ownership eliminates 30–50% gallery cuts, automates upfront commission deposits, and provides a private milestone proofing portal.

### 📦 Recommended Solution Architecture:
- **Core Engine:** ${engineTitle}
- **Target Investment:** ${currency === 'USD' ? `$${totalUSD.toLocaleString()}` : `₹${totalINR.toLocaleString()}`}
- **Timeline:** ${blueprintRec.suggestedTimeline}
- **Key Modules:** ${featureNames.join(', ')}

### ⚡ Why These Modules Were Selected:
1. **E-Commerce & Merch Store (\`commerce\`):** Sell original paintings, canvas drops, and limited-edition prints directly with zero platform cuts.
2. **Integrated Payments (\`payments\`):** Collect upfront 50% milestone deposits for custom portrait commissions via Razorpay/Stripe.
3. **Interactive Calendar Booking (\`booking\`):** Let clients book 1-on-1 discovery calls or commission consultation slots directly.
4. **Client Portal (\`auth\`):** A private dashboard for collectors to view in-progress proofing photos and approve finals.
5. **Video Vault (\`video\`):** Host behind-the-scenes painting process videos and time-lapse demonstrations.

💡 *To help me sculpt this into your exact workflow:*
1. Do you plan to sell original physical canvases, digital prints, or take bespoke portrait commissions?
2. Do you want clients to pay an upfront milestone deposit before you begin work?
3. Do you have an existing brand identity, or do you need a complete brand kit?

<blueprint_action>
${blueprintActionJson}
</blueprint_action>`;
  }

  if (isBudgetQuery) {
    const p1Price = currency === 'USD' ? `$${phased.phase1.totalUSD.toLocaleString()}` : `₹${phased.phase1.totalINR.toLocaleString()}`;
    const p2Price = currency === 'USD' ? `$${phased.phase2.totalUSD.toLocaleString()}` : `₹${phased.phase2.totalINR.toLocaleString()}`;
    const currentPriceStr = currency === 'USD' ? `$${totalUSD.toLocaleString()}` : `₹${totalINR.toLocaleString()}`;

    const contextPrefix = hasExistingScope
      ? `Based on your active Step 2 selection (**${resolvedFeatures.length} modules, currently ${currentPriceStr}**), I have structured a lean MVP path to bring your immediate investment down to **${p1Price}**:`
      : `To respect your budget target while eliminating technical debt, I have decoupled your scope into a **Phase 1 Lean MVP** and a **Phase 2 Scale Layer**.`;

    return `### 💡 Budget-Sculpted Architecture: Phased MVP Roadmap
${contextPrefix}

### 📦 Phase 1: Core Lean MVP (Launch Ready)
- **Engine:** ${engineTitle}
- **Target Investment:** ${p1Price}
- **Timeline:** ${phased.phase1.suggestedTimeline}
- **Included Modules:** ${phased.phase1.featureIds.map((id) => featureCatalog.find((f) => f.id === id)?.label).filter(Boolean).join(', ')}
- **Deliverables:** ${phased.phase1.deliverablesSummary}

### 🚀 Phase 2: Scale & Automation (Deferred Add-on)
- **Target Investment:** ${p2Price}
- **Timeline:** ${phased.phase2.suggestedTimeline}
- **Included Modules:** ${phased.phase2.featureIds.map((id) => featureCatalog.find((f) => f.id === id)?.label).filter(Boolean).join(', ') || 'Growth optimizations'}
- **Deliverables:** ${phased.phase2.deliverablesSummary}

Tap **"👉 Apply Phase 1 MVP"** below to update your live technical scope, or **"👉 Apply Full Scope"** for the complete architecture.

<blueprint_action>
${blueprintActionJson}
</blueprint_action>`;
  }

  if (isTimelineQuery && hasExistingScope) {
    const estWeeks = resolvedFeatures.length <= 2 ? '1–2 Weeks' : resolvedFeatures.length <= 5 ? '3–4 Weeks' : '4–6 Weeks';
    return `### ⏱️ Estimated Production Delivery: ${estWeeks}
For your active configuration of **${resolvedFeatures.length} modules** on the **${engineTitle}**:

### 📅 Sprint Delivery Breakdown:
- **Phase 1 (Sprint 1–2):** Core platform engine scaffolding, database architecture with Row-Level Security (RLS), and foundation modules (${resolvedFeatures.slice(0, 2).map((id) => featureCatalog.find((f) => f.id === id)?.label).filter(Boolean).join(', ')}).
- **Phase 2 (Sprint ${resolvedFeatures.length <= 2 ? '2' : '3–4'}):** Feature matrix integration (${resolvedFeatures.slice(2).map((id) => featureCatalog.find((f) => f.id === id)?.label).filter(Boolean).join(', ') || 'real-time integrations'}), end-to-end automated testing, and client portal staging.
- **Phase 3 (Final Handover):** Production deployment on Vercel/Oracle VPS edge, performance optimization, and 30-day bug warranty inception.

<blueprint_action>
${blueprintActionJson}
</blueprint_action>`;
  }

  if (isDependencyQuery && hasExistingScope) {
    return `### 🧩 Architectural Dependency Analysis
In our engineering standard, modules adhere to explicit dependencies to ensure security and zero runtime faults:

- **Authentication (Supabase Auth & RLS):** Required by customer payments, private user data stores, and client workspaces to bind session tokens to PostgreSQL policies.
- **pgvector Vector Database:** Prerequisite for semantic hybrid search (BM25 + HNSW) and multi-agent memory retrieval.
- **Transactional Email (Resend):** Directly wired into authentication triggers and payment success webhooks for immediate receipt delivery.

Your active selection on the **${engineTitle}** satisfies all necessary system dependencies with zero orphan modules.

<blueprint_action>
${blueprintActionJson}
</blueprint_action>`;
  }

  if (isVagueQuery) {
    return `Here is a custom architecture plan designed for your requirements:

### 🎯 Architecture: ${blueprintRec.title}
${blueprintRec.summary}

### 🛠️ Recommended Technology Stack:
- **Core Engine:** ${engineTitle}
- **App Framework:** Next.js 16 App Router, React 19, TypeScript
- **Database & Security:** Supabase PostgreSQL with strict Row-Level Security (RLS)
- **Key Modules:** ${featureNames.join(', ')}
- **Estimated Delivery:** ${blueprintRec.suggestedTimeline}

### ⚡ Architectural Highlights:
${blueprintRec.techHighlights.map((h) => `- ${h}`).join('\n')}

### 🧭 Socratic Diagnostic Alignment:
To calibrate this specification to your exact operational goals, consider:
1. **Target Audience:** Will this be consumer-facing (self-serve) or an internal team workspace?
2. **Access & Monetization:** Do you require user accounts, role-based permissions, or upfront payment/subscription billing?
3. **Data Integration:** Do you have existing databases, PDFs, or third-party APIs that this platform must interface with?

You can reply with your answers to refine this scope further, or apply the starting blueprint below:

<blueprint_action>
${blueprintActionJson}
</blueprint_action>`;
  }

  const p1PriceSummary = currency === 'USD' ? `$${phased.phase1.totalUSD.toLocaleString()}` : `₹${phased.phase1.totalINR.toLocaleString()}`;

  const portfolioProofNote =
    targetEngineId === 'saas' &&
    resolvedFeatures.some(
      (f) =>
        f.includes('ai') ||
        f.includes('rag') ||
        f.includes('search') ||
        f.includes('vector')
    )
      ? `\n\n🏛️ **Verified Production Proof:** Prateek has built and deployed this exact pattern in our **Retriever Cognitive Engine** (\`https://rag.prateeq.in\`) using PostgreSQL pgvector hybrid search and sub-300ms streaming. You can test a live working demo directly in the [Playground: Retriever](/playground).`
      : p.includes('terminal') || p.includes('game') || p.includes('arcade')
        ? `\n\n🕹️ **Verified Production Proof:** Prateek engineered the interactive Web Terminal OS (\`/terminal\`) and retro arcade engines with zero-dependency Canvas loops and Web Audio API synthesis. Check out [Playground: Terminal](/playground).`
        : `\n\n🏛️ **Engineering Authority:** Every architecture is delivered with clean TypeScript, strict PostgreSQL Row-Level Security (RLS), and a 30-day bug warranty backed by verified production case studies.`;

  return `Here is a custom architecture plan designed for your requirements:

### 🎯 Architecture: ${blueprintRec.title}
${blueprintRec.summary}

### 🛠️ Recommended Technology Stack:
- **Core Engine:** ${engineTitle}
- **App Framework:** Next.js 16 App Router, React 19, TypeScript
- **Database & Security:** Supabase PostgreSQL with strict Row-Level Security (RLS)
- **Key Modules:** ${featureNames.join(', ')}
- **Estimated Delivery:** ${blueprintRec.suggestedTimeline}

### ⚡ Architectural Highlights:
${blueprintRec.techHighlights.map((h) => `- ${h}`).join('\n')}
${portfolioProofNote}

💡 *Budget Phasing Available:* You can choose between launching the **Phase 1 Lean MVP** (${p1PriceSummary}) to validate fast, or applying the **Full Architecture** below.

<blueprint_action>
${blueprintActionJson}
</blueprint_action>`;
}
