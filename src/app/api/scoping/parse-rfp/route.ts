import { NextRequest, NextResponse } from 'next/server';
import pako from 'pako';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { resolveFeatureDependencies } from '@/lib/pricing';
import type { FeatureItem } from '@/data/resume';
import { RetrieverClient, type ParseIntentResponse } from '@/lib/rag-client';
import { checkRateLimit, rateLimitResponse, applyRateLimitHeaders } from '@/lib/rateLimit';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function decodePdfHex(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    const code = parseInt(hex.substring(i, i + 2), 16);
    if (!isNaN(code) && code >= 32 && code <= 126) {
      str += String.fromCharCode(code);
    }
  }
  return str;
}

export function extractTextFromPdfBuffer(buffer: Buffer): string {
  const latin = buffer.toString('latin1');
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  const allText: string[] = [];

  while ((match = streamRegex.exec(latin)) !== null) {
    let streamText = '';
    try {
      const streamBytes = Buffer.from(match[1], 'latin1');
      streamText = pako.inflate(streamBytes, { to: 'string' });
    } catch {
      streamText = match[1];
    }

    // Match hex character codes <456e7465...>
    const hexRegex = /<([0-9a-fA-F]+)>/g;
    let hMatch: RegExpExecArray | null;
    const currentWords: string[] = [];
    while ((hMatch = hexRegex.exec(streamText)) !== null) {
      const decoded = decodePdfHex(hMatch[1]);
      if (decoded) currentWords.push(decoded);
    }
    if (currentWords.length > 0) {
      allText.push(currentWords.join(''));
    }

    // Match literal PDF strings (text)
    const litRegex = /\(([^)]+)\)/g;
    let lMatch: RegExpExecArray | null;
    while ((lMatch = litRegex.exec(streamText)) !== null) {
      const clean = lMatch[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean.length > 1) {
        allText.push(clean);
      }
    }
  }

  // Fallback: search for readable ASCII tokens in the buffer if streams didn't yield text
  if (allText.length === 0) {
    const asciiMatches = latin.match(/[A-Za-z0-9_]{3,}/g);
    if (asciiMatches && asciiMatches.length > 5) {
      return asciiMatches.slice(0, 500).join(' ');
    }
  }

  return allText.join(' ').replace(/\s+/g, ' ').trim();
}

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
      const rawContent = jsonBody.content || '';
      fileSize = jsonBody.size || Buffer.byteLength(rawContent, 'utf-8');

      if (filename.toLowerCase().endsWith('.pdf') && (rawContent.startsWith('%PDF-') || rawContent.startsWith('JVBERi'))) {
        const buf = rawContent.startsWith('JVBERi')
          ? Buffer.from(rawContent, 'base64')
          : Buffer.from(rawContent, 'latin1');
        extractedText = extractTextFromPdfBuffer(buf);
      } else {
        extractedText = rawContent;
      }
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
        if (filename.toLowerCase().endsWith('.pdf')) {
          const arrayBuf = await file.arrayBuffer();
          extractedText = extractTextFromPdfBuffer(Buffer.from(arrayBuf));
        } else if (typeof file.text === 'function') {
          extractedText = await file.text();
        } else if (typeof file.arrayBuffer === 'function') {
          const buffer = await file.arrayBuffer();
          const textDecoder = new TextDecoder('utf-8');
          extractedText = textDecoder.decode(buffer.slice(0, 50000));
        }
      } catch {
        extractedText = filename;
      }

      // Sanitize extracted text to prevent raw binary corruption
      if (extractedText) {
        extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, ' ').trim();
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

    const tenantId = (process.env.RETRIEVER_SCOPING_TENANT_ID || '').trim();
    const apiKey = (process.env.RETRIEVER_SCOPING_API_KEY || '').trim();
    const apiUrl = (process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');
    const userId = process.env.RETRIEVER_SCOPING_USER_ID || crypto.randomUUID();

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
      unrecognizedRequirements?: string[];
    } | null = null;

    let modelUsed = 'catalog-heuristic-extractor';
    let fallbackMode = false;

    // 1. Attempt Cognitive Intent Classification via Retriever LLM
    if (apiKey && tenantId && extractedText.length > 20) {
      try {
        const client = new RetrieverClient({
          apiUrl,
          tenantId,
          apiKey,
          userId,
        });

        const promptText = `Analyze this Project RFP / Technical Specification document and extract complete architecture parameters:\n\n${extractedText.slice(0, 12000)}`;
        const intentResp = await client.classifyIntent(promptText);

        if (intentResp?.success && intentResp?.data) {
          const d = intentResp.data;
          classification = {
            archetypeId: d.archetype_id || 'saas_app',
            baseEngineId: d.base_engine_id || 'saas',
            featureIds: Array.isArray(d.feature_ids) ? d.feature_ids : ['auth', 'payments', 'admin', 'email'],
            brandAssetId: d.brand_asset_id || 'comprehensive',
            maintenancePlanId: d.maintenance_plan_id || 'growth',
            suggestedTimeline: d.suggested_timeline || '4 Weeks',
            confidenceScore: typeof d.confidence_score === 'number' ? d.confidence_score : 0.95,
            summaryRationale: d.summary_rationale || `RFP parsed successfully from "${filename}". Configured by Retriever Cognitive Engine.`,
            retrieverEngineRecommended: Boolean(d.retriever_engine_recommended),
            unrecognizedRequirements: Array.isArray(d.unrecognized_requirements) ? d.unrecognized_requirements : [],
          };
          modelUsed = intentResp.model || intentResp.provider || 'Retriever Engine';
        }
      } catch (err) {
        console.warn('Retriever RFP analysis error, falling back to local heuristic:', err);
      }
    }

    // 2. Transparent Fallback to Catalog Heuristic Matcher if Retriever is Unreachable or Unconfigured
    if (!classification) {
      fallbackMode = true;
      modelUsed = 'catalog-heuristic-extractor';

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
      } else if (combinedAnalysisText.includes('rag') || combinedAnalysisText.includes('vector') || combinedAnalysisText.includes('knowledge base') || combinedAnalysisText.includes('citation')) {
        archetypeId = 'ai_rag_app';
        baseEngineId = 'saas';
        featureIds = ['ai_rag', 'auth', 'admin', 'email'];
        brandAssetId = 'basic';
        maintenancePlanId = 'premium';
        suggestedTimeline = '4 Weeks';
        confidenceScore = 0.98;
        summaryRationale = `RFP "${filename}" identifies enterprise AI Knowledge Base / RAG requirements. Configured with Retriever pgvector search, citation downloads, and admin center.`;
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
        featureIds = ['lms', 'auth', 'payments', 'cms', 'email'];
        brandAssetId = 'comprehensive';
        maintenancePlanId = 'standard';
        suggestedTimeline = '4 Weeks';
        confidenceScore = 0.94;
        summaryRationale = `RFP "${filename}" outlines an Online Course & LMS Platform. Configured with student authentication, video player, and subscription billing.`;
      } else if (combinedAnalysisText.includes('ecommerce') || combinedAnalysisText.includes('store') || combinedAnalysisText.includes('products') || combinedAnalysisText.includes('shop')) {
        archetypeId = 'ecommerce';
        baseEngineId = 'multipage';
        featureIds = ['commerce', 'payments', 'auth', 'email', 'integrations'];
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

      classification = {
        archetypeId,
        baseEngineId,
        featureIds,
        brandAssetId,
        maintenancePlanId,
        suggestedTimeline,
        confidenceScore,
        summaryRationale,
        retrieverEngineRecommended,
      };
    }

    // Transitive dependency resolution
    const extraDependencies = resolveFeatureDependencies(classification.featureIds, featureCatalog);
    const resolvedFeatures = Array.from(new Set([...classification.featureIds, ...extraDependencies]));

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
        latencyMs,
        semanticCacheHit: false,
        tenantId: tenantId || 'local',
        modelUsed,
        fallbackMode,
      },
      unrecognizedRequirements: classification.unrecognizedRequirements,
    };

    const res = NextResponse.json(responsePayload, { status: 200 });
    return applyRateLimitHeaders(res, rateLimit);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse RFP document';
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
