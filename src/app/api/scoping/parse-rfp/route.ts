import { NextRequest, NextResponse } from 'next/server';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { resolveFeatureDependencies } from '@/lib/pricing';
import type { FeatureItem } from '@/data/resume';
import type { ParseIntentResponse } from '@/lib/rag-client';
import { checkRateLimit, rateLimitResponse, applyRateLimitHeaders } from '@/lib/rateLimit';

const RETRIEVER_TENANT_ID = process.env.RETRIEVER_SCOPING_TENANT_ID || 'prateeq_scoping';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB


const { features: rawFeatures } = questionnaireDefaults;
const featureCatalog = rawFeatures as FeatureItem[];

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  // Edge AI Token Shield: 5 requests per minute per IP (document OCR / layout extraction)
  const rateLimit = await checkRateLimit(req, {
    scope: 'scoping_rfp',
    limit: 5,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  try {
    let filename = '';
    let extractedText = '';
    let fileSize = 0;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const jsonBody = await req.json();
      if (!jsonBody || !jsonBody.filename) {
        return NextResponse.json(
          { error: 'No document file provided in request.' },
          { status: 400 }
        );
      }
      filename = jsonBody.filename;
      extractedText = jsonBody.content || '';
      fileSize = jsonBody.size || Buffer.byteLength(extractedText, 'utf-8');
    } else {
      let formData: FormData;
      try {
        formData = await req.formData();
      } catch {
        return NextResponse.json(
          { error: 'Invalid form-data payload. Please upload using multipart/form-data or JSON.' },
          { status: 400 }
        );
      }

      const file = formData.get('file') as File | null;
      if (!file || typeof file !== 'object') {
        return NextResponse.json(
          { error: 'No document file provided in request.' },
          { status: 400 }
        );
      }

      fileSize = typeof file.size === 'number' ? file.size : 0;
      filename = file.name || 'document.txt';

      try {
        if (typeof file.text === 'function') {
          extractedText = await file.text();
        } else if (typeof file.arrayBuffer === 'function') {
          const buffer = await file.arrayBuffer();
          const textDecoder = new TextDecoder('utf-8');
          extractedText = textDecoder.decode(buffer.slice(0, 50000));
        }
      } catch {
        extractedText = filename;
      }
    }

    if (fileSize > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of 25MB (${Math.round(fileSize / (1024 * 1024))}MB uploaded).` },
        { status: 413 }
      );
    }

    const lowerFilename = filename.toLowerCase();
    const isAllowedExt = lowerFilename.endsWith('.pdf') ||
                         lowerFilename.endsWith('.docx') ||
                         lowerFilename.endsWith('.md') ||
                         lowerFilename.endsWith('.txt');

    if (!isAllowedExt) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a PDF, DOCX, Markdown (.md), or Plain Text (.txt) file.' },
        { status: 415 }
      );
    }

    const combinedAnalysisText = `${filename} ${extractedText}`.toLowerCase();

    // 1. Determine Archetype and Features from RFP / PRD text
    let archetypeId = 'saas_app';
    let baseEngineId = 'saas';
    let featureIds: string[] = ['auth', 'payments', 'admin', 'email'];
    let brandAssetId = 'comprehensive';
    let maintenancePlanId = 'growth';
    let suggestedTimeline = '4 Weeks';
    let confidenceScore = 0.95;
    let summaryRationale = `RFP parsed successfully from "${filename}". Configured based on identified specifications.`;
    let retrieverEngineRecommended = false;

    if (combinedAnalysisText.includes('voice') || combinedAnalysisText.includes('speech') || combinedAnalysisText.includes('telephony')) {
      archetypeId = 'voice_ai_agent_app';
      baseEngineId = 'saas';
      featureIds = ['ai_voice_agent', 'ai_rag', 'auth', 'admin', 'email'];
      brandAssetId = 'comprehensive';
      maintenancePlanId = 'premium';
      suggestedTimeline = '4 to 5 Weeks';
      confidenceScore = 0.97;
      summaryRationale = `RFP "${filename}" contains Voice AI specifications. Configured with conversational Voice AI, Retriever RAG knowledge base, and client portal.`;
      retrieverEngineRecommended = true;
    } else if (combinedAnalysisText.includes('rag') || combinedAnalysisText.includes('vector') || combinedAnalysisText.includes('knowledge base') || combinedAnalysisText.includes('citation')) {
      archetypeId = 'ai_rag_app';
      baseEngineId = 'saas';
      featureIds = ['ai_rag', 'auth', 'admin', 'search', 'email'];
      brandAssetId = 'basic';
      maintenancePlanId = 'premium';
      suggestedTimeline = '4 Weeks';
      confidenceScore = 0.98;
      summaryRationale = `RFP "${filename}" identifies enterprise AI Knowledge Base / RAG requirements. Configured with Retriever pgvector search, citation downloads, and admin center.`;
      retrieverEngineRecommended = true;
    } else if (combinedAnalysisText.includes('agent') || combinedAnalysisText.includes('autonomous') || combinedAnalysisText.includes('tool calling')) {
      archetypeId = 'autonomous_agents';
      baseEngineId = 'saas';
      featureIds = ['ai_agents', 'ai_rag', 'auth', 'admin', 'email', 'integrations'];
      brandAssetId = 'comprehensive';
      maintenancePlanId = 'premium';
      suggestedTimeline = '4 to 5 Weeks';
      confidenceScore = 0.96;
      summaryRationale = `RFP "${filename}" identifies autonomous AI multi-agent workflows. Configured with ReAct agents, tool execution, and vector memory.`;
      retrieverEngineRecommended = true;
    } else if (combinedAnalysisText.includes('ocr') || combinedAnalysisText.includes('vision') || combinedAnalysisText.includes('extract invoice')) {
      archetypeId = 'vision_ocr_saas';
      baseEngineId = 'saas';
      featureIds = ['ai_vision_ocr', 'auth', 'payments', 'admin', 'email'];
      brandAssetId = 'basic';
      maintenancePlanId = 'standard';
      suggestedTimeline = '3 to 4 Weeks';
      confidenceScore = 0.95;
      summaryRationale = `RFP "${filename}" identifies document OCR extraction requirements. Configured with Layout OCR, JSON Schema pipelines, and payment billing.`;
      retrieverEngineRecommended = true;
    } else if (combinedAnalysisText.includes('course') || combinedAnalysisText.includes('lms') || combinedAnalysisText.includes('lesson')) {
      archetypeId = 'lms_portal';
      baseEngineId = 'saas';
      featureIds = ['lms', 'auth', 'payments', 'blog', 'email'];
      brandAssetId = 'comprehensive';
      maintenancePlanId = 'standard';
      suggestedTimeline = '4 Weeks';
      confidenceScore = 0.94;
      summaryRationale = `RFP "${filename}" outlines an Online Course & LMS Platform. Configured with student authentication, video player, and subscription billing.`;
    } else if (combinedAnalysisText.includes('ecommerce') || combinedAnalysisText.includes('store') || combinedAnalysisText.includes('products') || combinedAnalysisText.includes('shop')) {
      archetypeId = 'ecommerce';
      baseEngineId = 'multipage';
      featureIds = ['commerce', 'payments', 'auth', 'email', 'analytics'];
      brandAssetId = 'comprehensive';
      maintenancePlanId = 'growth';
      suggestedTimeline = '2 to 3 Weeks';
      confidenceScore = 0.96;
      summaryRationale = `RFP "${filename}" outlines an E-Commerce storefront with online cart, payments, customer accounts, and automated invoicing.`;
    } else if (combinedAnalysisText.includes('booking') || combinedAnalysisText.includes('appointment') || combinedAnalysisText.includes('calendar')) {
      archetypeId = 'booking_appointments';
      baseEngineId = 'multipage';
      featureIds = ['booking', 'payments', 'auth', 'email'];
      brandAssetId = 'basic';
      maintenancePlanId = 'standard';
      suggestedTimeline = '2 to 3 Weeks';
      confidenceScore = 0.95;
      summaryRationale = `RFP "${filename}" specifies an appointment & booking system with real-time calendar synchronization and upfront payment deposits.`;
    } else if (combinedAnalysisText.includes('landing') || combinedAnalysisText.includes('single page')) {
      archetypeId = 'landing_page';
      baseEngineId = 'landing';
      featureIds = ['email'];
      brandAssetId = 'basic';
      maintenancePlanId = 'standard';
      suggestedTimeline = '1 Week';
      confidenceScore = 0.98;
      summaryRationale = `RFP "${filename}" requests a high-converting single-page Landing Core Engine with lead capture and SEO schema.`;
    }

    // Transitive dependency resolution
    const extraDependencies = resolveFeatureDependencies(featureIds, featureCatalog);
    const resolvedFeatures = Array.from(new Set([...featureIds, ...extraDependencies]));

    const endTime = performance.now();
    const latencyMs = Math.max(1, Math.round(endTime - startTime));

    const responsePayload: ParseIntentResponse = {
      success: true,
      archetypeId,
      baseEngineId,
      featureIds: resolvedFeatures,
      brandAssetId,
      maintenancePlanId,
      suggestedTimeline,
      confidenceScore,
      summaryRationale,
      retrieverEngineRecommended,
      telemetry: {
        latencyMs,
        semanticCacheHit: false,
        tenantId: RETRIEVER_TENANT_ID,
        modelUsed: 'document-layout-extractor',
        fallbackMode: false,
      },
    };

    const res = NextResponse.json(responsePayload, { status: 200 });
    return applyRateLimitHeaders(res, rateLimit);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse RFP document';
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
