import { NextRequest, NextResponse } from 'next/server';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { calcQuote, resolveFeatureDependencies, type Currency } from '@/lib/pricing';
import type {
  BaseEngineItem,
  FeatureItem,
  BrandAssetOption,
  MaintenancePlanOption,
} from '@/data/resume';
import { RetrieverClient } from '@/lib/rag-client';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getIpHash } from '@/lib/security';
import { logScopingChatTrace } from '@/lib/scopingObservability';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const {
  engines: rawEngines,
  features: rawFeatures,
  brandAssets: rawBrandAssets,
  maintenancePlans: rawMaintenancePlans,
} = questionnaireDefaults;

const engines = rawEngines as BaseEngineItem[];
const featureCatalog = rawFeatures as FeatureItem[];
const brandAssets = rawBrandAssets as BrandAssetOption[];
const maintenancePlans = rawMaintenancePlans as MaintenancePlanOption[];

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

interface BlueprintRecommendation {
  archetypeId: string;
  baseEngineId: string;
  featureIds: string[];
  brandAssetId?: string;
  maintenancePlanId?: string;
  suggestedTimeline: string;
  title: string;
  summary: string;
  techHighlights: string[];
}

export interface ScopeContext {
  currentStep?: number;
  baseEngineId?: string;
  selectedFeatures?: string[];
  totalINR?: number;
  totalUSD?: number;
  scopeCode?: string;
}

export interface PhasedBreakdown {
  phase1: {
    title: string;
    featureIds: string[];
    suggestedTimeline: string;
    totalINR: number;
    totalUSD: number;
    deliverablesSummary: string;
  };
  phase2: {
    title: string;
    featureIds: string[];
    suggestedTimeline: string;
    totalINR: number;
    totalUSD: number;
    deliverablesSummary: string;
  };
}

/**
 * Generate a conversational solution blueprint based on user requirements.
 */
function classifyPromptForBlueprint(prompt: string): BlueprintRecommendation {
  const p = prompt.toLowerCase();

  // 1. Voice AI Bot / Conversational Voice
  if (
    p.includes('voice') ||
    p.includes('speech') ||
    p.includes('elevenlabs') ||
    p.includes('calling bot') ||
    p.includes('voice agent') ||
    p.includes('phone')
  ) {
    return {
      archetypeId: 'voice_ai_agent_app',
      baseEngineId: 'saas',
      featureIds: ['ai_voice_agent', 'ai_rag', 'auth', 'admin', 'email'],
      maintenancePlanId: 'premium',
      suggestedTimeline: '4–5 Weeks',
      title: 'Conversational Voice AI Agent Platform',
      summary:
        'A real-time voice AI assistant with ultra-low latency WebSockets, vector knowledge retrieval, caller verification, and automated appointment workflows.',
      techHighlights: [
        'LiveKit / WebRTC streaming audio pipeline with VAD interruptibility',
        'Gemini Live & ElevenLabs speech synthesis engines',
        'pgvector knowledge base for verified factual grounding',
        'Caller authentication and session security policies',
        'Admin review studio with call recordings and sentiment transcripts',
      ],
    };
  }

  // 2. Autonomous Agents, Multi-Agent Workflows & Industrial/Operations Automation
  if (
    p.includes('autonomous') ||
    p.includes('multi-agent') ||
    p.includes('tool calling') ||
    p.includes('agent workflow') ||
    p.includes('automat') ||
    p.includes('factory') ||
    p.includes('warehouse') ||
    p.includes('operations') ||
    p.includes('manufacturing') ||
    p.includes('erp') ||
    p.includes('internal tool')
  ) {
    return {
      archetypeId: 'autonomous_agents',
      baseEngineId: 'saas',
      featureIds: ['ai_agents', 'ai_rag', 'auth', 'admin', 'integrations', 'email'],
      maintenancePlanId: 'premium',
      suggestedTimeline: '4–5 Weeks',
      title: 'Autonomous Multi-Agent Workflow Core',
      summary:
        'A distributed autonomous workflow automation system featuring consensus reflection loops, sensor/API integrations, background job queues, and vector-backed audit logs.',
      techHighlights: [
        'Stateful multi-agent DAG execution engine for operational workflow scheduling',
        'Sandboxed tool calling & industrial API execution runtime',
        'pgvector persistent agent memory and semantic audit trail recall',
        'Human-in-the-loop approval gates for mission-critical steps',
        'Admin telemetry console with token usage, step latency, and alerts',
      ],
    };
  }

  // 3. Enterprise AI Knowledge Base & RAG Copilot
  if (
    p.includes('rag') ||
    p.includes('knowledge base') ||
    p.includes('vector') ||
    p.includes('citation') ||
    p.includes('semantic search') ||
    p.includes('chat with docs') ||
    p.includes('document search')
  ) {
    return {
      archetypeId: 'ai_rag_app',
      baseEngineId: 'saas',
      featureIds: ['ai_rag', 'auth', 'admin', 'email'],
      maintenancePlanId: 'premium',
      suggestedTimeline: '3–4 Weeks',
      title: 'Enterprise AI Knowledge Base & RAG Copilot',
      summary:
        'A secure enterprise knowledge platform with hybrid semantic search (pgvector + BM25), presigned citation downloads, authenticated multi-tenant isolation, and telemetry metrics.',
      techHighlights: [
        'pgvector hybrid search (HNSW + BM25) with source attribution citations',
        'Automated document ingestion, chunking, and presigned download tokens',
        'Next.js 16 App Router with responsive streaming chat interface',
        'Supabase Auth with strict Row-Level Security (RLS) tenant isolation',
        'Administrative dashboard tracking query latency, cache hits, and token usage',
      ],
    };
  }

  // 3. Multimodal Vision & Document OCR
  if (
    p.includes('ocr') ||
    p.includes('vision') ||
    p.includes('invoice') ||
    p.includes('scan') ||
    p.includes('extract')
  ) {
    return {
      archetypeId: 'vision_ocr_saas',
      baseEngineId: 'saas',
      featureIds: ['ai_vision_ocr', 'auth', 'payments', 'admin', 'email'],
      suggestedTimeline: '3–4 Weeks',
      title: 'Multimodal Vision & Document OCR SaaS',
      summary:
        'An intelligent document processing platform featuring layout-aware optical character recognition, structured JSON schema extraction, and exportable financial audits.',
      techHighlights: [
        'Multimodal Gemini Vision OCR for receipts, PDFs, and invoices',
        'JSON Schema validation for 100% deterministic structured output',
        'Client document library with presigned secure storage access',
        'Usage-based billing credits via Stripe / Razorpay',
        'CSV/Excel export pipeline and webhook dispatch',
      ],
    };
  }

  // 4. Gaming / Creator / Video VIP Vault
  if (
    p.includes('youtube') ||
    p.includes('streamer') ||
    p.includes('merch') ||
    p.includes('vip') ||
    p.includes('vault') ||
    p.includes('behind-the-scenes') ||
    p.includes('creator')
  ) {
    return {
      archetypeId: 'saas_app',
      baseEngineId: 'saas',
      featureIds: ['video', 'commerce', 'auth', 'payments', 'email'],
      suggestedTimeline: '3–4 Weeks',
      title: 'Creator VIP Vault & Merch Platform',
      summary:
        'A dedicated high-performance creator portal featuring secure VIP video streaming, token-gated behind-the-scenes content, direct-to-consumer merchandise catalog, and automated recurring member billing.',
      techHighlights: [
        'Next.js 16 App Router with responsive media player',
        'Supabase Auth with Row-Level Security (RLS) for VIP access tiers',
        'Signed CDN streaming URLs preventing video link sharing',
        'Integrated Stripe / Razorpay checkout with slide-over cart drawer',
        'Transactional email notifications for purchase receipts and drop alerts',
      ],
    };
  }

  // 5. Podcaster / Audio Transcripts & Search
  if (
    p.includes('podcast') ||
    p.includes('transcript') ||
    p.includes('episode')
  ) {
    return {
      archetypeId: 'saas_app',
      baseEngineId: 'saas',
      featureIds: ['ai_rag', 'auth', 'payments', 'email', 'cms'],
      suggestedTimeline: '3–4 Weeks',
      title: 'Podcaster Audio Hub & AI Transcript Search',
      summary:
        'An interactive podcast hub with private audio streaming, pgvector hybrid search across all episode transcripts, premium subscriber gating, and newsletter audience capture.',
      techHighlights: [
        'Next.js 16 App Router with persistent audio player bar',
        'pgvector hybrid search (HNSW + BM25) for semantic episode lookup',
        'Whisper automated transcription indexing pipeline',
        'Stripe / Razorpay membership subscriptions with paywalled audio',
        'Automated newsletter capture and subscriber broadcast emails',
      ],
    };
  }

  // 3. Real Estate / Property Documents AI
  if (
    p.includes('real estate') ||
    p.includes('property') ||
    p.includes('broker') ||
    p.includes('tour') ||
    p.includes('lease')
  ) {
    return {
      archetypeId: 'saas_app',
      baseEngineId: 'saas',
      featureIds: ['ai_rag', 'booking', 'auth', 'admin', 'email'],
      suggestedTimeline: '4 Weeks',
      title: 'Real Estate Property AI & Client Portal',
      summary:
        'A commercial real estate portal featuring an AI document copilot for property contracts and inspection reports, calendar-driven tour booking, and an authenticated buyer/seller client center.',
      techHighlights: [
        'Next.js 16 App Router with interactive property floorplans',
        'pgvector RAG engine for semantic search over contracts and deeds',
        'Real-time tour booking calendar with automated SMS/email reminders',
        'Authenticated client dashboard with saved searches and document vault',
        'Admin CRM portal for broker deal tracking and lead assignment',
      ],
    };
  }

  // 4. B2B SaaS MVP with Billing
  if (
    p.includes('saas') ||
    p.includes('mvp') ||
    p.includes('b2b') ||
    p.includes('subscription') ||
    p.includes('billing') ||
    p.includes('organization')
  ) {
    return {
      archetypeId: 'saas_app',
      baseEngineId: 'saas',
      featureIds: ['auth', 'admin', 'payments', 'integrations', 'email'],
      suggestedTimeline: '3–4 Weeks',
      title: 'B2B SaaS MVP Core & Subscription Billing',
      summary:
        'A production-grade B2B SaaS architecture with organization-level tenancy, tiered recurring subscription billing, role-based access control (RBAC), team audit logging, and external webhooks.',
      techHighlights: [
        'Next.js 16 App Router with React 19 Server Components',
        'PostgreSQL Row-Level Security (RLS) multi-tenancy enforcement',
        'Stripe / Razorpay customer portal with tiered billing lifecycles',
        'Role-Based Access Control (Admin, Member, Viewer permissions)',
        'Audit logs, webhook dispatch, and automated email verification',
      ],
    };
  }

  // 7. E-Commerce & Online Store
  if (
    p.includes('ecommerce') ||
    p.includes('e-commerce') ||
    p.includes('store') ||
    p.includes('shop') ||
    p.includes('checkout')
  ) {
    return {
      archetypeId: 'ecommerce',
      baseEngineId: 'multipage',
      featureIds: ['commerce', 'payments', 'auth', 'email', 'integrations'],
      suggestedTimeline: '2–3 Weeks',
      title: 'Direct-to-Consumer E-Commerce Store',
      summary:
        'A modern headless e-commerce store with dynamic product catalog, slide-over cart drawer, Razorpay/Stripe checkout, order confirmation emails, and inventory management.',
      techHighlights: [
        'Next.js 16 App Router with sub-second product pages',
        'Optimistic UI slide-over cart drawer with variant pickers',
        'Razorpay & Stripe multi-currency checkout gateway',
        'Customer order history and shipment tracking portal',
        'Automated order confirmation and fulfillment emails',
      ],
    };
  }

  // 9. Booking & Appointments
  if (
    p.includes('booking') ||
    p.includes('appointment') ||
    p.includes('calendar') ||
    p.includes('clinic') ||
    p.includes('reservation')
  ) {
    return {
      archetypeId: 'booking_appointments',
      baseEngineId: 'multipage',
      featureIds: ['booking', 'payments', 'auth', 'email'],
      suggestedTimeline: '2–3 Weeks',
      title: 'Online Booking & Appointments Portal',
      summary:
        'A client scheduling engine with timezone-aware calendar slots, upfront deposit processing, automated reminder emails, and customer account records.',
      techHighlights: [
        'Conflict-free atomic database slot reservation',
        'Timezone auto-detection with Google Calendar / ICS sync',
        'Upfront partial deposit collection via Razorpay / Stripe',
        'Automated reminder notifications via email and SMS',
        'Admin scheduling calendar with custom buffer times and breaks',
      ],
    };
  }

  // 10. LMS & Online Course Portal
  if (
    p.includes('course') ||
    p.includes('lms') ||
    p.includes('student') ||
    p.includes('lesson') ||
    p.includes('academy')
  ) {
    return {
      archetypeId: 'lms_portal',
      baseEngineId: 'saas',
      featureIds: ['lms', 'auth', 'payments', 'cms', 'email'],
      suggestedTimeline: '4 Weeks',
      title: 'Online Video Course Academy & LMS',
      summary:
        'A comprehensive online course platform with video lesson progression, paywalled module access, student authentication, and downloadable PDF completion certificates.',
      techHighlights: [
        'Video chapter progression with auto-resume playback state',
        'Paywalled curriculum tiers with one-time or subscription checkout',
        'Student profile dashboard with progress tracking metrics',
        'Dynamic client-side PDF certificate generator upon completion',
        'Course discussion threads and instructor announcements CMS',
      ],
    };
  }

  // 11. AI Strategy / Consulting / Audit
  if (
    p.includes('audit') ||
    p.includes('consulting') ||
    p.includes('strategy') ||
    p.includes('advisory')
  ) {
    return {
      archetypeId: 'ai_strategy_consulting',
      baseEngineId: 'ai_strategy_audit',
      featureIds: ['ai_rag', 'admin'],
      suggestedTimeline: '1-Week Sprint',
      title: 'AI Strategy & Architecture Audit Sprint',
      summary:
        'A targeted 60-minute deep-dive operational workflow audit analyzing technical bottlenecks, modeling AI ROI, and delivering an actionable 3-page custom AI Architecture Blueprint PDF.',
      techHighlights: [
        '60-minute technical discovery session with lead solutions architect',
        'Comprehensive audit of current codebase, API contracts, and manual bottlenecks',
        'Concrete AI ROI feasibility model with token cost projections',
        'Custom 3-page executive Architecture Blueprint PDF deliverable',
        'Clear next-step roadmap with guaranteed fixed implementation estimate',
      ],
    };
  }

  // 12. Landing Page
  if (p.includes('landing') || p.includes('one-page') || p.includes('waitlist')) {
    return {
      archetypeId: 'landing_page',
      baseEngineId: 'landing',
      featureIds: ['email', 'integrations'],
      suggestedTimeline: '1–2 Weeks',
      title: 'High-Converting Performance Landing Core',
      summary:
        'A bespoke, conversion-optimized landing page with sub-second performance, Framer Motion animations, social proof grids, and integrated lead capture.',
      techHighlights: [
        'Next.js 16 App Router with 100/100 Lighthouse performance target',
        'Interactive smooth scrolling with Lenis and Framer Motion effects',
        'Responsive mobile-first layout with high-contrast theme styling',
        'Automated lead capture routing directly to CRM / email',
        'Configured Google Analytics & Vercel Web Analytics telemetry',
      ],
    };
  }

  // 13. Fine Artists, Visual Painters, Sculptors & Artisans
  if (
    p.includes('paint') ||
    p.includes('artist') ||
    p.includes('sculpt') ||
    p.includes('photo') ||
    p.includes('gallery') ||
    p.includes('canvas') ||
    p.includes('craft')
  ) {
    return {
      archetypeId: 'saas_app',
      baseEngineId: 'saas',
      featureIds: ['auth', 'payments', 'commerce', 'booking', 'video', 'email'],
      suggestedTimeline: '3–4 Weeks',
      title: "Fine Artist's Studio Gallery & Bespoke Commission Hub",
      summary:
        'A dedicated direct-to-fan platform empowering visual artists and painters to showcase high-res artwork, take custom commission bookings with upfront deposits, sell prints with zero marketplace fees, and provide collectors with a private proofing portal.',
      techHighlights: [
        'High-resolution visual art gallery with lightbox and studio process video showcases',
        'Direct-to-fan print and original artwork checkout with zero platform cuts via Razorpay/Stripe',
        'Custom commission intake questionnaire with calendar consultation booking and 50% deposit gating',
        'Private collector dashboard (Auth) for commission progress updates and proofing reviews',
        'Automated collector email newsletters and exhibition release announcements',
      ],
    };
  }

  // Default Custom SaaS / Full-Stack Application
  return {
    archetypeId: 'saas_app',
    baseEngineId: 'saas',
    featureIds: ['auth', 'admin', 'email', 'integrations'],
    suggestedTimeline: '3–4 Weeks',
    title: 'Custom Engineering Architecture Blueprint',
    summary:
      'A modular, high-scale application architecture configured with modern authentication, administrative controls, transactional email alerts, and secure database persistence.',
    techHighlights: [
      'Next.js 16 App Router with React 19 Server Components',
      'PostgreSQL with strict Row-Level Security (RLS)',
      'Secure session-based token authentication',
      'Role-based administration center and metric tracking',
      'Production Docker deployment topology and CI/CD pipelines',
    ],
  };
}

/**
 * Computes deterministic Phase 1 (Lean MVP) vs Phase 2 (Scale & Growth) breakdown.
 */
function computePhasedBreakdown(
  baseEngineId: string,
  resolvedFeatures: string[],
  currency: Currency,
  brandAssetId: string,
  maintenancePlanId: string
): PhasedBreakdown {
  const isAiOrDomain = (f: string) =>
    f.startsWith('ai_') || f === 'commerce' || f === 'booking' || f === 'lms' || f === 'video';

  let phase1FeatureIds: string[] = [];

  if (resolvedFeatures.length <= 2) {
    phase1FeatureIds = [...resolvedFeatures];
  } else {
    const domainFeatures = resolvedFeatures.filter(isAiOrDomain);
    const authFeatures = resolvedFeatures.filter((f) => f === 'auth');

    phase1FeatureIds = [...domainFeatures.slice(0, 2), ...authFeatures];
    if (phase1FeatureIds.length === 0 && resolvedFeatures.length > 0) {
      phase1FeatureIds = resolvedFeatures.slice(0, 2);
    }
  }

  const phase1Resolved = Array.from(
    new Set([...phase1FeatureIds, ...resolveFeatureDependencies(phase1FeatureIds, featureCatalog)])
  );

  const phase2FeatureIds = resolvedFeatures.filter((f) => !phase1Resolved.includes(f));

  const phase1Quote = calcQuote(
    engines,
    featureCatalog,
    brandAssets,
    maintenancePlans,
    {
      engineId: baseEngineId,
      featureIds: phase1Resolved,
      brandAssetId,
      maintenancePlanId: 'standard',
    },
    currency
  );

  const fullQuote = calcQuote(
    engines,
    featureCatalog,
    brandAssets,
    maintenancePlans,
    {
      engineId: baseEngineId,
      featureIds: resolvedFeatures,
      brandAssetId,
      maintenancePlanId,
    },
    currency
  );

  const phase1FeatureLabels = phase1Resolved
    .map((id) => featureCatalog.find((f) => f.id === id)?.label)
    .filter(Boolean) as string[];

  const phase2FeatureLabels = phase2FeatureIds
    .map((id) => featureCatalog.find((f) => f.id === id)?.label)
    .filter(Boolean) as string[];

  const phase2INR = Math.max(0, fullQuote.netTotalINR - phase1Quote.netTotalINR);
  const phase2USD = Math.max(0, fullQuote.netTotalUSD - phase1Quote.netTotalUSD);

  const isLanding = baseEngineId === 'landing';

  return {
    phase1: {
      title: 'Phase 1: Core Lean MVP',
      featureIds: phase1Resolved,
      suggestedTimeline: isLanding ? '1–2 Weeks' : '2–3 Weeks',
      totalINR: phase1Quote.netTotalINR,
      totalUSD: phase1Quote.netTotalUSD,
      deliverablesSummary:
        phase1FeatureLabels.length > 0
          ? `Production-ready launch with ${phase1FeatureLabels.join(', ')}.`
          : 'Core functional engine launch with zero technical debt.',
    },
    phase2: {
      title: 'Phase 2: Scale & Automation',
      featureIds: phase2FeatureIds,
      suggestedTimeline: isLanding ? '1 Week' : '1–2 Weeks',
      totalINR: phase2INR,
      totalUSD: phase2USD,
      deliverablesSummary:
        phase2FeatureLabels.length > 0
          ? `Growth & scale add-ons: ${phase2FeatureLabels.join(', ')}.`
          : 'Continuous enhancement, telemetry, and automated workflows.',
    },
  };
}

/**
 * Builds the complete fallback conversational response with structured <blueprint_action>
 */
function buildFallbackResponseText(
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

/**
 * Encodes text into a realistic streaming SSE ReadableStream.
 */
function createTextStream(
  fullText: string,
  delayMs = 10,
  signal?: AbortSignal
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const words = fullText.split(' ');
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += 3) {
    chunks.push(words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : ''));
  }

  let isClosed = false;

  return new ReadableStream({
    async start(controller) {
      const onAbort = () => {
        isClosed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      for (const chunk of chunks) {
        if (isClosed || signal?.aborted) break;
        const sseLine = `data: ${JSON.stringify({ delta: chunk })}\n\n`;
        try {
          controller.enqueue(encoder.encode(sseLine));
        } catch {
          isClosed = true;
          break;
        }
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }

      if (!isClosed && !signal?.aborted) {
        try {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch {
          // ignore
        }
      }
    },
    cancel() {
      isClosed = true;
    },
  });
}

function extractCleanProseFromSse(rawSse: string): string {
  let cleanText = '';
  const lines = rawSse.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('data: ')) {
      const payload = trimmed.slice(6).trim();
      if (payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        if (typeof parsed.delta === 'string') cleanText += parsed.delta;
        else if (typeof parsed.text === 'string') cleanText += parsed.text;
        else if (typeof parsed.content === 'string') cleanText += parsed.content;
      } catch {
        cleanText += payload;
      }
    } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed.delta === 'string') cleanText += parsed.delta;
        else if (typeof parsed.text === 'string') cleanText += parsed.text;
        else if (typeof parsed.content === 'string') cleanText += parsed.content;
      } catch {
        // Not JSON
      }
    }
  }
  return cleanText || rawSse;
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  // 1. Sliding window rate limit check (25 requests / min)
  const rateLimit = await checkRateLimit(req, {
    scope: 'scoping_chat',
    limit: 25,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = (body.message || body.query || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];
    const sessionId = (body.sessionId || '').trim() || null;
    const scopeCode = (body.scopeCode || (body.currentScope as ScopeContext)?.scopeCode || '').trim();
    const turnIndex = typeof body.turnIndex === 'number' ? body.turnIndex : (history.length ? Math.floor(history.length / 2) + 1 : 1);
    const currency: Currency = body.currency === 'USD' ? 'USD' : 'INR';
    const currentScope = (body.currentScope as ScopeContext) || null;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Message is required for scoping chat.' },
        { status: 400 }
      );
    }

    const visitorCountry = req.headers.get('x-vercel-ip-country') || 'Unknown';
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const ipHash = await getIpHash(rawIp);
    const userAgent = req.headers.get('user-agent') || '';

    // Extract preliminary intent & reasoning for deep observability
    const blueprintRec = classifyPromptForBlueprint(prompt);

    const tenantId =
      process.env.RETRIEVER_SCOPING_TENANT_ID ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_TENANT_ID ||
      (process.env.NODE_ENV !== 'test' ? '1f85286c-9d9a-4ebc-9c62-a99360a5ece4' : '');
    const apiKey =
      process.env.RETRIEVER_SCOPING_API_KEY ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_API_KEY ||
      (process.env.NODE_ENV !== 'test' ? 'ret_live_ScopingGuest2026.ReadOnlyChat' : '');
    const apiUrl = (
      process.env.RETRIEVER_API_URL ||
      process.env.NEXT_PUBLIC_RETRIEVER_API_URL ||
      'https://rag.prateeq.in'
    ).replace(/\/$/, '');
    const userId =
      process.env.RETRIEVER_SCOPING_USER_ID ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_USER_ID ||
      '36e62429-419e-48ef-af92-533afca9e028';

    // Check if the user query is an out-of-scope physical labor request
    const pLower = prompt.toLowerCase();
    const isPhysicalOutOfScope =
      (pLower.includes('wall') ||
        pLower.includes('living room') ||
        pLower.includes('bedroom') ||
        pLower.includes('house') ||
        pLower.includes('physical') ||
        pLower.includes('plumb') ||
        pLower.includes('car')) &&
      (pLower.includes('paint') ||
        pLower.includes('clean') ||
        pLower.includes('repair') ||
        pLower.includes('fix'));

    if (isPhysicalOutOfScope) {
      const escrowText = `Your unique request has been logged directly into Prateek Sharma's executive escrow queue. Because this requires bespoke personal handling outside our automated software scoping modules, Prateek will review your inquiry personally. To receive a personal response and evaluation from Prateek, please enter your email or sign up below.`;
      const fallbackSessionId =
        sessionId || `scoping_escrow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const escrowStream = createTextStream(escrowText, 10, req.signal);

      const elapsed = Math.round(performance.now() - startTime);
      logScopingChatTrace({
        sessionId: fallbackSessionId,
        scopeCode,
        turnIndex,
        userQuery: prompt,
        assistantResponse: escrowText,
        agentIntent: 'escrow_escalation',
        agentReasoning: 'Physical or non-software task routed to executive escrow review queue.',
        modelUsed: 'escrow-escalation-router',
        latencyMs: elapsed,
        isFallback: false,
        currency,
        currentEngine: currentScope?.baseEngineId || 'saas',
        selectedFeatures: currentScope?.selectedFeatures || [],
        quoteINR: currentScope?.totalINR || 0,
        quoteUSD: currentScope?.totalUSD || 0,
        visitorIpHash: ipHash,
        visitorCountry,
        visitorUserAgent: userAgent,
      }).catch((err) => console.warn('Escrow trace logging warning:', err));

      return new Response(escrowStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Session-ID': fallbackSessionId,
          'X-Fallback-Mode': 'false',
          'Set-Cookie': `prateeq_chat_session_id=${encodeURIComponent(fallbackSessionId)}; Path=/; Max-Age=2592000; SameSite=Lax`,
        },
      });
    }

    const cookieSessionId = req.cookies.get('prateeq_chat_session_id')?.value;
    const resolvedSessionId =
      sessionId ||
      cookieSessionId ||
      `scoping_session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let promptWithContext = prompt;
    if (currentScope?.selectedFeatures?.length) {
      const activeLabels = currentScope.selectedFeatures
        .map((id) => featureCatalog.find((f) => f.id === id)?.label || id)
        .join(', ');
      promptWithContext = `[Client Step ${currentScope.currentStep || 2} Context: Engine=${currentScope.baseEngineId}, Modules=${activeLabels}, Total=${currency === 'USD' ? `$${currentScope.totalUSD}` : `₹${currentScope.totalINR}`}]\n\nUser Question: ${prompt}`;
    }

    // 2. Compute Blueprint Recommendation Action Payload
    const isNewBuildVision =
      pLower.includes('launch') ||
      pLower.includes('build') ||
      pLower.includes('create') ||
      pLower.includes('store') ||
      pLower.includes('shop') ||
      pLower.includes('ecommerce') ||
      pLower.includes('saas') ||
      pLower.includes('platform') ||
      pLower.includes('calling bot') ||
      pLower.includes('voice agent') ||
      pLower.includes('vault') ||
      pLower.includes('streamer') ||
      pLower.includes('podcast');

    const hasExistingScope =
      Boolean(currentScope?.selectedFeatures?.length) &&
      !isNewBuildVision &&
      (pLower.includes('budget') ||
        pLower.includes('cut') ||
        pLower.includes('timeline') ||
        pLower.includes('cheaper') ||
        pLower.includes('my scope') ||
        pLower.includes('active scope') ||
        pLower.includes('these exact'));

    const targetEngineId = hasExistingScope && currentScope?.baseEngineId ? currentScope.baseEngineId : blueprintRec.baseEngineId;
    const targetFeatures = hasExistingScope && currentScope?.selectedFeatures?.length
      ? currentScope.selectedFeatures
      : blueprintRec.featureIds;

    // 3. Attempt Fast Stateless Completions from Retriever Cognitive Engine
    let fullResponseText = '';
    let usedRetriever = false;

    if (tenantId && apiKey) {
      const client = new RetrieverClient({
        apiUrl,
        tenantId,
        apiKey,
        userId,
      });

      try {
        const messages = [
          { role: 'system', content: SCOPING_ARCHITECT_SYSTEM_PROMPT },
          ...history.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: String(m.content || ''),
          })),
          { role: 'user', content: promptWithContext },
        ];

        // 25-second timeout: the local blueprint fallback should not leave the
        // visitor staring at an empty bubble for the full 45s budget.
        const timeoutMs = 25000;
        const abortCtrl = new AbortController();
        const timeoutTimer = setTimeout(() => {
          abortCtrl.abort(new Error(`Retriever completions timeout (${timeoutMs / 1000}s limit)`));
        }, timeoutMs);

        const onReqAbort = () => abortCtrl.abort();
        if (req.signal) {
          req.signal.addEventListener('abort', onReqAbort, { once: true });
        }

        try {
          const compRes = await client.completions(messages, {
            enable_reranking: false,
            temperature: 0.4,
            max_tokens: 800,
            top_k: 3,
            enable_query_rewriting: false,
            enable_self_query: false,
            enable_colbert_rerank: false,
            signal: abortCtrl.signal,
          });

          if (compRes?.content && compRes.content.trim().length > 0) {
            fullResponseText = compRes.content.trim();
            usedRetriever = true;
          }
        } finally {
          clearTimeout(timeoutTimer);
          if (req.signal) {
            req.signal.removeEventListener('abort', onReqAbort);
          }
        }
      } catch (err) {
        console.warn('Retriever completions failed or timed out; falling back to local blueprint engine:', err);
      }
    }

    // 4. Graceful Fallback Mode: Local Heuristic Rule-Based Blueprint Engine
    if (!usedRetriever || !fullResponseText.trim()) {
      fullResponseText = buildFallbackResponseText(prompt, currency, currentScope);
    } else {
      // 5. Always sanitize Retriever output and attach canonical, catalog-strict <blueprint_action>
      // Strip any hallucinated/unvalidated <blueprint_action> block from Retriever's prose
      fullResponseText = fullResponseText
        .replace(/<blueprint_action>[\s\S]*?<\/blueprint_action>/gi, '')
        .trim();

      if (!fullResponseText.toLowerCase().includes('escrow queue')) {
        // Collect model-suggested valid features
        const effectiveFeatureIds = [...targetFeatures];
        for (const feat of featureCatalog) {
          const featRegex = new RegExp(`\\b${feat.id}\\b`, 'i');
          if (featRegex.test(fullResponseText) && !effectiveFeatureIds.includes(feat.id)) {
            effectiveFeatureIds.push(feat.id);
          }
        }

        const extraDeps = resolveFeatureDependencies(effectiveFeatureIds, featureCatalog);
        const allFeatureIds = Array.from(new Set([...effectiveFeatureIds, ...extraDeps]));
        const validFeatureIds = allFeatureIds.filter((id) => featureCatalog.some((f) => f.id === id));

        const quote = calcQuote(
          engines,
          featureCatalog,
          brandAssets,
          maintenancePlans,
          {
            engineId: targetEngineId,
            featureIds: validFeatureIds,
            brandAssetId: blueprintRec.brandAssetId || 'ready',
            maintenancePlanId: blueprintRec.maintenancePlanId || 'standard',
          },
          currency
        );

        const canonicalBlueprintObj = {
          archetypeId: blueprintRec.archetypeId,
          baseEngineId: targetEngineId,
          featureIds: validFeatureIds,
          brandAssetId: blueprintRec.brandAssetId || 'ready',
          maintenancePlanId: blueprintRec.maintenancePlanId || 'standard',
          suggestedTimeline: blueprintRec.suggestedTimeline,
          title: hasExistingScope ? `Refined ${targetEngineId.toUpperCase()} Scope` : blueprintRec.title,
          totalINR: quote.netTotalINR,
          totalUSD: quote.netTotalUSD,
          phasedBreakdown: computePhasedBreakdown(
            targetEngineId,
            validFeatureIds,
            currency,
            blueprintRec.brandAssetId || 'ready',
            blueprintRec.maintenancePlanId || 'standard'
          ),
        };

        const canonicalBlueprintJson = JSON.stringify(canonicalBlueprintObj, null, 2);
        fullResponseText += `\n\n<blueprint_action>\n${canonicalBlueprintJson}\n</blueprint_action>`;
      }
    }

    // 6. Realistic, collision-free SSE Stream
    const stream = createTextStream(fullResponseText, 6, req.signal);

    // Asynchronously log telemetry trace
    const elapsed = Math.round(performance.now() - startTime);
    logScopingChatTrace({
      sessionId: resolvedSessionId,
      scopeCode,
      turnIndex,
      userQuery: prompt,
      assistantResponse: extractCleanProseFromSse(fullResponseText),
      agentIntent: blueprintRec.archetypeId,
      agentReasoning: `${blueprintRec.title}: ${blueprintRec.summary}`,
      modelUsed: usedRetriever ? 'retriever-vps' : 'heuristic-rule-engine',
      latencyMs: elapsed,
      isFallback: !usedRetriever,
      currency,
      currentEngine: targetEngineId,
      selectedFeatures: targetFeatures,
      quoteINR: currentScope?.totalINR || 0,
      quoteUSD: currentScope?.totalUSD || 0,
      visitorIpHash: ipHash,
      visitorCountry,
      visitorUserAgent: userAgent,
    }).catch((err) => console.warn('Trace logging warning:', err));

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Session-ID': resolvedSessionId,
        'X-Fallback-Mode': usedRetriever ? 'false' : 'true',
        'X-Accel-Buffering': 'no',
        'Set-Cookie': `prateeq_chat_session_id=${encodeURIComponent(resolvedSessionId)}; Path=/; Max-Age=2592000; SameSite=Lax`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scoping chat error';
    console.error('Fatal scoping chat error:', error);
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
