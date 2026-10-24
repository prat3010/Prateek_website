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

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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
 * Builds the complete fallback conversational response with structured <blueprint_action>
 */
function buildFallbackResponseText(prompt: string, currency: Currency): string {
  const blueprintRec = classifyPromptForBlueprint(prompt);

  // Ensure transitive feature dependencies are included
  const extraDependencies = resolveFeatureDependencies(
    blueprintRec.featureIds,
    featureCatalog
  );
  const resolvedFeatures = Array.from(
    new Set([...blueprintRec.featureIds, ...extraDependencies])
  );

  const maintenancePlanId =
    blueprintRec.maintenancePlanId ||
    (blueprintRec.featureIds.some((f) => f.startsWith('ai_')) ? 'premium' : 'standard');
  const brandAssetId = blueprintRec.brandAssetId || 'ready';

  // Calculate deterministic quote prices from questionnaire defaults
  const quote = calcQuote(
    engines,
    featureCatalog,
    brandAssets,
    maintenancePlans,
    {
      engineId: blueprintRec.baseEngineId,
      featureIds: resolvedFeatures,
      brandAssetId,
      maintenancePlanId,
    },
    currency
  );

  const totalINR = quote.netTotalINR;
  const totalUSD = quote.netTotalUSD;
  const engineObj = engines.find((e) => e.id === blueprintRec.baseEngineId);
  const engineTitle = engineObj ? engineObj.title : blueprintRec.baseEngineId.toUpperCase();

  const featureNames = resolvedFeatures
    .map((id) => featureCatalog.find((f) => f.id === id)?.label)
    .filter(Boolean) as string[];

  const blueprintActionJson = JSON.stringify(
    {
      archetypeId: blueprintRec.archetypeId,
      baseEngineId: blueprintRec.baseEngineId,
      featureIds: resolvedFeatures,
      brandAssetId,
      maintenancePlanId,
      suggestedTimeline: blueprintRec.suggestedTimeline,
      title: blueprintRec.title,
      totalINR,
      totalUSD,
    },
    null,
    2
  );

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

I have configured a formal starting blueprint below. Tap **"👉 Apply Blueprint to Quote"** to automatically populate your interactive quote in Step 2.

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

export async function POST(req: NextRequest) {
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
    const sessionId = (body.sessionId || '').trim() || null;
    const currency: Currency = body.currency === 'USD' ? 'USD' : 'INR';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Message is required for scoping chat.' },
        { status: 400 }
      );
    }

    const tenantId =
      process.env.RETRIEVER_SCOPING_TENANT_ID ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_TENANT_ID ||
      '';
    const apiKey =
      process.env.RETRIEVER_SCOPING_API_KEY ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_API_KEY ||
      '';
    const apiUrl = (
      process.env.RETRIEVER_API_URL ||
      process.env.NEXT_PUBLIC_RETRIEVER_API_URL ||
      'https://rag.prateeq.in'
    ).replace(/\/$/, '');
    const userId =
      process.env.RETRIEVER_SCOPING_USER_ID ||
      process.env.NEXT_PUBLIC_RETRIEVER_SCOPING_USER_ID ||
      '36e62429-419e-48ef-af92-533afca9e028';

    let activeSessionId = sessionId;

    // 2. Attempt Live Retrieval & Streaming Inference via Retriever VPS
    if (tenantId && apiKey) {
      try {
        const client = new RetrieverClient({
          apiUrl,
          tenantId,
          apiKey,
          userId,
        });

        // Ensure session exists with a tight timeout
        if (!activeSessionId) {
          try {
            const sessionRes = await Promise.race([
              client.createSession(),
              new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Session creation timeout')), 2500)
              ),
            ]);
            if (sessionRes?.sessionId) {
              activeSessionId = sessionRes.sessionId;
            }
          } catch (sessionErr) {
            console.warn('Retriever session creation failed:', sessionErr);
          }
        }

        if (activeSessionId) {
          // Attempt chat message streaming with a 3.5-second abort timeout
          const chatAbortController = new AbortController();
          const chatTimeoutId = setTimeout(() => chatAbortController.abort(), 3500);

          try {
            const upstreamStream = await client.chat(
              activeSessionId,
              prompt,
              chatAbortController.signal
            );
            clearTimeout(chatTimeoutId);

            if (upstreamStream) {
              return new Response(upstreamStream, {
                headers: {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache, no-transform',
                  'Connection': 'keep-alive',
                  'X-Session-ID': activeSessionId,
                },
              });
            }
          } catch (chatError) {
            clearTimeout(chatTimeoutId);
            console.warn('Retriever VPS chat stream error or timeout (falling back):', chatError);
          }
        }
      } catch (clientErr) {
        console.warn('Retriever client error (falling back to local generator):', clientErr);
      }
    }

    // 3. Graceful Fallback Mode: Local Conversational Blueprint Streaming
    // If Retriever VPS is unreachable, times out, or throws, provide instant high-fidelity response.
    const fallbackSessionId =
      activeSessionId || `scoping_fallback_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fallbackText = buildFallbackResponseText(prompt, currency);
    const fallbackStream = createTextStream(fallbackText, 10, req.signal);

    return new Response(fallbackStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Session-ID': fallbackSessionId,
        'X-Fallback-Mode': 'true',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scoping chat error';
    console.error('Fatal scoping chat error:', error);
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
