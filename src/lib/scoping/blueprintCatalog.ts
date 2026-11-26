import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { calcQuote, resolveFeatureDependencies, type Currency } from '@/lib/pricing';
import type {
  BaseEngineItem,
  FeatureItem,
  BrandAssetOption,
  MaintenancePlanOption,
} from '@/data/resume';

export const BLUEPRINT_OPEN_TAG = '<blueprint_action>';
export const BLUEPRINT_CLOSE_TAG = '</blueprint_action>';

const {
  engines: rawEngines,
  features: rawFeatures,
  brandAssets: rawBrandAssets,
  maintenancePlans: rawMaintenancePlans,
} = questionnaireDefaults;

export const engines = rawEngines as BaseEngineItem[];
export const featureCatalog = rawFeatures as FeatureItem[];
export const brandAssets = rawBrandAssets as BrandAssetOption[];
export const maintenancePlans = rawMaintenancePlans as MaintenancePlanOption[];

export interface BlueprintRecommendation {
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
export function classifyPromptForBlueprint(prompt: string): BlueprintRecommendation {
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
export function computePhasedBreakdown(
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
 * Builds the canonical, catalog-strict <blueprint_action> block that is
 * appended to a live Retriever reply. Any upstream blueprint block is stripped
 * before this runs, so the interactive card always matches the real catalog.
 */
export function buildCanonicalBlueprintBlock(
  prose: string,
  targetEngineId: string,
  targetFeatures: string[],
  blueprintRec: BlueprintRecommendation,
  currency: Currency,
  hasExistingScope: boolean
): string {
  if (prose.toLowerCase().includes('escrow queue')) return '';

  const effectiveFeatureIds = [...targetFeatures];
  for (const feat of featureCatalog) {
    const featRegex = new RegExp(`\\b${feat.id}\\b`, 'i');
    if (featRegex.test(prose) && !effectiveFeatureIds.includes(feat.id)) {
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

  return `\n\n${BLUEPRINT_OPEN_TAG}\n${JSON.stringify(canonicalBlueprintObj, null, 2)}\n${BLUEPRINT_CLOSE_TAG}`;
}

/**
 * Builds the complete fallback conversational response with structured <blueprint_action>
 */
