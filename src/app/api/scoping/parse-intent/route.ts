import { NextRequest, NextResponse } from 'next/server';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { resolveFeatureDependencies } from '@/lib/pricing';
import type { FeatureItem } from '@/data/resume';
import { RetrieverClient, type ParseIntentRequest, type ParseIntentResponse } from '@/lib/rag-client';

const { features: rawFeatures } = questionnaireDefaults;

const featureCatalog = rawFeatures as FeatureItem[];

/**
 * Intelligent Semantic Intent Classifier & Catalog Matcher
 */
function classifyIntentWithCatalog(prompt: string): {
  archetypeId: string;
  baseEngineId: string;
  featureIds: string[];
  brandAssetId: string;
  maintenancePlanId: string;
  suggestedTimeline: string;
  confidenceScore: number;
  summaryRationale: string;
  retrieverEngineRecommended: boolean;
  unrecognizedRequirements: string[];
} {
  const p = prompt.toLowerCase();

  // 1. Check for specific AI / Advanced Archetypes
  if (p.includes('voice') || p.includes('speech') || p.includes('elevenlabs') || p.includes('calling bot') || p.includes('voice agent')) {
    return {
      archetypeId: 'voice_ai_agent_app',
      baseEngineId: 'saas',
      featureIds: ['ai_voice_agent', 'ai_rag', 'auth', 'admin', 'email'],
      brandAssetId: 'comprehensive',
      maintenancePlanId: 'premium',
      suggestedTimeline: '4 to 5 Weeks',
      confidenceScore: 0.97,
      summaryRationale: 'Configured with conversational Voice AI agent, Retriever RAG knowledge base, secure authentication, and real-time audio synthesis.',
      retrieverEngineRecommended: true,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('agent') || p.includes('autonomous') || p.includes('workflow') || p.includes('multi-agent') || p.includes('tool calling')) {
    return {
      archetypeId: 'autonomous_agents',
      baseEngineId: 'saas',
      featureIds: ['ai_agents', 'ai_rag', 'auth', 'admin', 'email', 'integrations'],
      brandAssetId: 'comprehensive',
      maintenancePlanId: 'premium',
      suggestedTimeline: '4 to 5 Weeks',
      confidenceScore: 0.96,
      summaryRationale: 'Configured for autonomous multi-agent tool execution, consensus reflection loops, background worker scheduling, and vector memory.',
      retrieverEngineRecommended: true,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('rag') || p.includes('knowledge base') || p.includes('vector') || p.includes('citation') || p.includes('retriever') || p.includes('semantic search') || p.includes('chat with docs') || p.includes('chatbot') || p.includes('ai bot')) {
    return {
      archetypeId: 'ai_rag_app',
      baseEngineId: 'saas',
      featureIds: ['ai_rag', 'auth', 'admin', 'search', 'email'],
      brandAssetId: 'basic',
      maintenancePlanId: 'premium',
      suggestedTimeline: '4 Weeks',
      confidenceScore: 0.98,
      summaryRationale: 'Configured with Retriever Enterprise RAG engine, pgvector semantic indexing, presigned citation downloads, and role-based admin center.',
      retrieverEngineRecommended: true,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('ocr') || p.includes('vision') || p.includes('invoice parser') || p.includes('extract pdf') || p.includes('document scan')) {
    return {
      archetypeId: 'vision_ocr_saas',
      baseEngineId: 'saas',
      featureIds: ['ai_vision_ocr', 'auth', 'payments', 'admin', 'email'],
      brandAssetId: 'basic',
      maintenancePlanId: 'standard',
      suggestedTimeline: '3 to 4 Weeks',
      confidenceScore: 0.95,
      summaryRationale: 'Configured with layout-aware document OCR, JSON schema data extraction pipelines, and authenticated client portal.',
      retrieverEngineRecommended: true,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('course') || p.includes('lms') || p.includes('student') || p.includes('lesson') || p.includes('academy') || p.includes('education')) {
    return {
      archetypeId: 'lms_portal',
      baseEngineId: 'saas',
      featureIds: ['lms', 'auth', 'payments', 'blog', 'email'],
      brandAssetId: 'comprehensive',
      maintenancePlanId: 'standard',
      suggestedTimeline: '4 Weeks',
      confidenceScore: 0.94,
      summaryRationale: 'Configured for video course progression, student authentication, subscription billing, and downloadable certification.',
      retrieverEngineRecommended: false,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('booking') || p.includes('appointment') || p.includes('doctor') || p.includes('clinic') || p.includes('consultation') || p.includes('calendar') || p.includes('reservation')) {
    return {
      archetypeId: 'booking_appointments',
      baseEngineId: 'multipage',
      featureIds: ['booking', 'payments', 'auth', 'email'],
      brandAssetId: 'basic',
      maintenancePlanId: 'standard',
      suggestedTimeline: '2 to 3 Weeks',
      confidenceScore: 0.95,
      summaryRationale: 'Configured with real-time calendar appointment booking, upfront deposits, automated email confirmations, and client portal.',
      retrieverEngineRecommended: false,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('ecommerce') || p.includes('e-commerce') || p.includes('store') || p.includes('shop') || p.includes('cart') || p.includes('checkout') || p.includes('products') || p.includes('selling')) {
    return {
      archetypeId: 'ecommerce',
      baseEngineId: 'multipage',
      featureIds: ['commerce', 'payments', 'auth', 'email', 'analytics'],
      brandAssetId: 'comprehensive',
      maintenancePlanId: 'growth',
      suggestedTimeline: '2 to 3 Weeks',
      confidenceScore: 0.96,
      summaryRationale: 'Configured with product catalog, slide-over cart drawer, Razorpay/Stripe checkout, and inventory notifications.',
      retrieverEngineRecommended: false,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('crm') || p.includes('internal tool') || p.includes('operations') || p.includes('admin portal') || p.includes('erp')) {
    return {
      archetypeId: 'crm_admin',
      baseEngineId: 'saas',
      featureIds: ['admin', 'auth', 'crm', 'migration', 'email'],
      brandAssetId: 'provided',
      maintenancePlanId: 'standard',
      suggestedTimeline: '3 to 4 Weeks',
      confidenceScore: 0.93,
      summaryRationale: 'Configured with internal CRM records, role-based access control, automated customer webhooks, and database migration.',
      retrieverEngineRecommended: false,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('saas') || p.includes('mvp') || p.includes('platform') || p.includes('software') || p.includes('subscription') || p.includes('billing')) {
    return {
      archetypeId: 'saas_app',
      baseEngineId: 'saas',
      featureIds: ['auth', 'payments', 'admin', 'email'],
      brandAssetId: 'comprehensive',
      maintenancePlanId: 'growth',
      suggestedTimeline: '4 Weeks',
      confidenceScore: 0.95,
      summaryRationale: 'Configured with Full-Stack SaaS MVP Core, Supabase PostgreSQL, Google OAuth PKCE, Razorpay recurring subscriptions, and role-based admin center.',
      retrieverEngineRecommended: false,
      unrecognizedRequirements: [],
    };
  }

  if (p.includes('landing') || p.includes('single page') || p.includes('waitlist') || p.includes('launch page') || p.includes('funnel')) {
    return {
      archetypeId: 'landing_page',
      baseEngineId: 'landing',
      featureIds: ['email'],
      brandAssetId: 'basic',
      maintenancePlanId: 'standard',
      suggestedTimeline: '1 Week',
      confidenceScore: 0.98,
      summaryRationale: 'Configured with high-converting single-page Landing Core Engine, responsive motion UI, reCAPTCHA v3, and automated lead capture.',
      retrieverEngineRecommended: false,
      unrecognizedRequirements: [],
    };
  }

  // Default Fallback: Multi-page Business Platform
  return {
    archetypeId: 'business_multipage',
    baseEngineId: 'multipage',
    featureIds: ['email', 'blog', 'analytics'],
    brandAssetId: 'basic',
    maintenancePlanId: 'standard',
    suggestedTimeline: '2 Weeks',
    confidenceScore: 0.91,
    summaryRationale: 'Configured with Multi-Page Business Website Core Engine, headless blog CMS, GDPR analytics, and lead capture workflows.',
    retrieverEngineRecommended: false,
    unrecognizedRequirements: [],
  };
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const body: ParseIntentRequest = await req.json();
    const prompt = (body.prompt || '').trim();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required for intent parsing.' },
        { status: 400 }
      );
    }

    let classification: {
      archetypeId: string;
      baseEngineId: string;
      featureIds: string[];
      brandAssetId: string;
      maintenancePlanId: string;
      suggestedTimeline: string;
      confidenceScore: number;
      summaryRationale: string;
      retrieverEngineRecommended: boolean;
      unrecognizedRequirements: string[];
    } | null = null;

    let modelUsed = 'rule-based-fallback';
    const semanticCacheHit = false;
    let fallbackMode = false;

    const tenantId = process.env.RETRIEVER_SCOPING_TENANT_ID || '';
    const apiKey = process.env.RETRIEVER_SCOPING_API_KEY || '';
    const apiUrl = (process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');
    const userId = process.env.RETRIEVER_SCOPING_USER_ID || '00000000-0000-0000-0000-000000000000';

    // 1. Attempt Live Structured Classification from Retriever Cognitive Core
    if (apiKey && tenantId) {
      try {
        const client = new RetrieverClient({
          apiUrl,
          tenantId,
          apiKey,
          userId,
        });

        const intentResp = await client.classifyIntent(prompt);
        if (intentResp?.success && intentResp?.data) {
          const d = intentResp.data;
          classification = {
            archetypeId: d.archetype_id || 'saas_app',
            baseEngineId: d.base_engine_id || 'saas',
            featureIds: Array.isArray(d.feature_ids) ? d.feature_ids : [],
            brandAssetId: d.brand_asset_id || 'none',
            maintenancePlanId: d.maintenance_plan_id || 'essential',
            suggestedTimeline: d.suggested_timeline || '3 to 4 Weeks',
            confidenceScore: typeof d.confidence_score === 'number' ? d.confidence_score : 0.9,
            summaryRationale: d.summary_rationale || 'Structured architecture blueprint generated by Retriever.',
            retrieverEngineRecommended: Boolean(d.retriever_engine_recommended),
            unrecognizedRequirements: Array.isArray(d.unrecognized_requirements) ? d.unrecognized_requirements : [],
          };
          modelUsed = intentResp.model || intentResp.provider || 'Retriever Engine';
        }
      } catch (err) {
        console.warn('Retriever live structured classification error (falling back to rule-based matcher):', err);
      }
    }

    // 2. Transparent Fallback to Catalog Rule-Based Matcher if Retriever is Unreachable
    if (!classification) {
      fallbackMode = true;
      classification = classifyIntentWithCatalog(prompt);
      modelUsed = 'rule-based-fallback';
    }

    // Always enforce transitive dependency resolution on selected features
    const extraDependencies = resolveFeatureDependencies(
      classification.featureIds,
      featureCatalog
    );
    const resolvedFeatures = Array.from(
      new Set([...classification.featureIds, ...extraDependencies])
    );

    const endTime = performance.now();
    const latencyMs = Math.max(1, Math.round(endTime - startTime));

    const responsePayload: ParseIntentResponse = {
      success: true,
      archetypeId: classification.archetypeId,
      baseEngineId: classification.baseEngineId,
      featureIds: resolvedFeatures,
      brandAssetId: classification.brandAssetId,
      maintenancePlanId: classification.maintenancePlanId,
      suggestedTimeline: classification.suggestedTimeline,
      confidenceScore: classification.confidenceScore,
      summaryRationale: classification.summaryRationale,
      retrieverEngineRecommended: classification.retrieverEngineRecommended,
      telemetry: {
        latencyMs, // Real measured latency without fake inflation
        semanticCacheHit,
        tenantId: tenantId || 'local',
        modelUsed, // Real model or 'rule-based-fallback'
        fallbackMode,
      },
      unrecognizedRequirements: classification.unrecognizedRequirements,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown intent parsing error';
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
