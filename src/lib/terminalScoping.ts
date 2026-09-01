import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import {
  calcQuote,
  resolveFeatureDependencies,
  findDependentFeatures,
  formatPricePair,
  type Currency,
  type PromoDiscountInfo,
} from '@/lib/pricing';
import type {
  BaseEngineItem,
  FeatureItem,
  BrandAssetOption,
  MaintenancePlanOption,
} from '@/data/resume';

export interface TerminalScopeSession {
  selectedEngineId: string;
  selectedFeatures: string[];
  selectedBrandAssetId: string;
  selectedMaintenancePlanId: string;
  appliedPromo: PromoDiscountInfo | null;
  currency: Currency;
  companyName: string;
  projectGoal: string;
  aiRationale?: string;
  lastAnalysisConfidence?: number;
}

export interface TerminalScopingResult {
  lines: Array<{
    text: string;
    type: 'input' | 'output' | 'error' | 'success' | 'link' | 'image';
    command?: string;
    imageUrl?: string;
    href?: string;
  }>;
  nextSession: TerminalScopeSession;
  triggerExportPdf?: boolean;
  triggerCheckoutQr?: {
    amount: number;
    currency: Currency;
    depositPercent: number;
    fastPassUrl: string;
  };
}

const {
  engines: defaultEngines,
  features: defaultFeatures,
  brandAssets: defaultBrandAssets,
  maintenancePlans: defaultMaintenancePlans,
} = questionnaireDefaults as {
  engines: BaseEngineItem[];
  features: FeatureItem[];
  brandAssets: BrandAssetOption[];
  maintenancePlans: MaintenancePlanOption[];
};

export function createInitialTerminalScopeSession(currency: Currency = 'INR'): TerminalScopeSession {
  return {
    selectedEngineId: 'landing',
    selectedFeatures: ['auth', 'email'],
    selectedBrandAssetId: 'none',
    selectedMaintenancePlanId: 'essential',
    appliedPromo: null,
    currency,
    companyName: 'Terminal Architect',
    projectGoal: 'High-Performance Web Platform',
  };
}

export function formatTerminalCartTable(
  session: TerminalScopeSession,
  engines: BaseEngineItem[] = defaultEngines,
  features: FeatureItem[] = defaultFeatures,
  brandAssets: BrandAssetOption[] = defaultBrandAssets,
  maintenancePlans: MaintenancePlanOption[] = defaultMaintenancePlans
): string[] {
  const quote = calcQuote(
    engines,
    features,
    brandAssets,
    maintenancePlans,
    {
      engineId: session.selectedEngineId,
      featureIds: session.selectedFeatures,
      brandAssetId: session.selectedBrandAssetId,
      maintenancePlanId: session.selectedMaintenancePlanId,
      promoCode: session.appliedPromo,
    },
    session.currency
  );

  const curr = session.currency;
  const isINR = curr === 'INR';

  const fmt = (inr?: number, usd?: number) => {

    const valINR = inr ?? 0;
    const valUSD = usd ?? 0;
    return isINR
      ? `₹${valINR.toLocaleString('en-IN')}`
      : `$${valUSD.toLocaleString('en-US')}`;
  };

  const engineTitle = quote.engine ? quote.engine.title : 'Core Engine';
  const enginePriceINR = quote.engine ? quote.engine.priceINR : 0;
  const enginePriceUSD = quote.engine ? quote.engine.priceUSD : 0;
  const engineSpecs = quote.engine ? quote.engine.techSpecs : 'Next.js 16 App Router';

  const lines: string[] = [];
  lines.push('========================================================================');
  lines.push('                  PRATEEQ ARCHITECTURE SCOPING LEDGER                  ');
  lines.push('========================================================================');
  lines.push(` Session Target: ${session.companyName} [${session.projectGoal}]`);
  lines.push(` Active Currency: ${curr} (Use 'scope currency inr|usd' to switch)`);
  lines.push('------------------------------------------------------------------------');
  lines.push(` [CORE ENGINE]`);
  lines.push(`   ${engineTitle.padEnd(46)} ${fmt(enginePriceINR, enginePriceUSD).padStart(20)}`);
  lines.push(`   * Tech Specs: ${engineSpecs}`);
  lines.push('------------------------------------------------------------------------');
  lines.push(` [SELECTED ADD-ON MODULES (${quote.features.length})]`);

  if (quote.features.length === 0) {
    lines.push('   (No add-on modules selected. Use "scope add <feature_id>" to add)');
  } else {
    quote.features.forEach((feat, idx) => {
      const num = `${idx + 1}.`.padEnd(3);
      const title = feat.label.length > 42 ? `${feat.label.slice(0, 41)}…` : feat.label;
      const priceStr = fmt(feat.priceINR, feat.priceUSD);
      lines.push(`   ${num} ${title.padEnd(43)} ${priceStr.padStart(19)}`);
    });
  }

  lines.push('------------------------------------------------------------------------');
  lines.push(` Gross Subtotal:                                 ${fmt(quote.grossTotalINR, quote.grossTotalUSD).padStart(20)}`);

  if (quote.bundleDiscountPercent > 0) {
    const discountStr = `-${fmt(quote.bundleDiscountAmountINR, quote.bundleDiscountAmountUSD)} (${quote.bundleDiscountPercent}% BUNDLE TIER)`;
    lines.push(` Volume Bundle Discount:                         ${discountStr.padStart(20)}`);
  }

  if (quote.promoDiscountAmountINR > 0 || quote.promoDiscountAmountUSD > 0) {
    const promoStr = `-${fmt(quote.promoDiscountAmountINR, quote.promoDiscountAmountUSD)} [${session.appliedPromo?.code}]`;
    lines.push(` Promo / Partner Code:                           ${promoStr.padStart(20)}`);
  }

  lines.push('========================================================================');
  lines.push(` TOTAL INVESTMENT:                               ${fmt(quote.netTotalINR, quote.netTotalUSD).padStart(20)}`);
  lines.push(` 50% Milestone Deposit (To Start):               ${fmt(quote.depositINR, quote.depositUSD).padStart(20)}`);
  lines.push('========================================================================');

  if (session.aiRationale) {
    lines.push(' [RETRIEVER AI ARCHITECTURAL RATIONALE]');
    lines.push(`   "${session.aiRationale}"`);
    lines.push('------------------------------------------------------------------------');
  }

  lines.push(` Next Actions:`);
  lines.push(`   - 'scope checkout' -> Generate Scan-to-Pay QR Code & Fast-Pass Link`);
  lines.push(`   - 'scope export'   -> Download full Scoping Proposal PDF`);
  lines.push(`   - 'scope add/remove <feature_id>' -> Modify active architecture`);

  return lines;
}

export async function handleTerminalScopeCommand(
  cmd: string,
  session: TerminalScopeSession,
  engines: BaseEngineItem[] = defaultEngines,
  features: FeatureItem[] = defaultFeatures,
  brandAssets: BrandAssetOption[] = defaultBrandAssets,
  maintenancePlans: MaintenancePlanOption[] = defaultMaintenancePlans
): Promise<TerminalScopingResult> {
  const trimmed = cmd.trim();
  const parts = trimmed.split(/\s+/);
  const root = parts[0]?.toLowerCase();
  const sub = (parts[1] || '').toLowerCase();

  // If user typed 'cart' directly
  if (root === 'cart') {
    if (sub === 'checkout') {
      return handleCheckout(session, parts.slice(2), engines, features, brandAssets, maintenancePlans);
    }
    const table = formatTerminalCartTable(session, engines, features, brandAssets, maintenancePlans);
    return {
      lines: table.map((t) => ({ text: t, type: 'output' })),
      nextSession: session,
    };
  }

  if (root !== 'scope') {
    return {
      lines: [{ text: `Unknown command: ${cmd}. Type 'scope help' for usage.`, type: 'error' }],
      nextSession: session,
    };
  }

  // Handle 'scope' with no args or 'scope help'
  if (!sub || sub === 'help') {
    return {
      lines: [
        { text: '========================================================================', type: 'success' },
        { text: '                  TERMINAL SCOPING CLI COMMAND INDEX                    ', type: 'success' },
        { text: '========================================================================', type: 'output' },
        { text: ' scope list [engines|features]  -> List all engines, add-ons & pricing', type: 'output' },
        { text: ' scope new <engine_id>          -> Initialize scope (landing|multipage|saas)', type: 'output' },
        { text: ' scope analyze "<your idea>"    -> AI scoping analysis powered by Retriever RAG', type: 'output' },
        { text: ' scope add <feature_id>         -> Add module (auto-resolves prerequisites)', type: 'output' },
        { text: ' scope remove <feature_id>      -> Remove module (dependency cascade check)', type: 'output' },
        { text: ' scope promo <promo_code>       -> Apply referral / discount promo code', type: 'output' },
        { text: ' scope currency <inr|usd>       -> Toggle currency between INR and USD', type: 'output' },
        { text: ' scope cart / cart              -> Print formatted ASCII bill of materials', type: 'output' },
        { text: ' scope export                   -> Download verified Scoping Proposal PDF', type: 'output' },
        { text: ' scope checkout [--deposit 50]  -> Generate Mobile Payment QR & Fast-Pass', type: 'output' },
        { text: '========================================================================', type: 'output' },
      ],
      nextSession: session,
    };
  }

  // 1. scope list [engines|features]
  if (sub === 'list') {
    const target = (parts[2] || 'all').toLowerCase();
    const outputLines: Array<{ text: string; type: 'output' | 'success' }> = [];

    if (target === 'all' || target === 'engines') {
      outputLines.push({ text: '--- BASE APPLICATION ENGINES ---', type: 'success' });
      engines.forEach((e) => {
        const p = formatPricePair(e.priceINR, e.priceUSD, session.currency);
        outputLines.push({
          text: ` • [${e.id}] ${e.title.padEnd(28)} ${p} | ${e.tier}`,
          type: 'output',
        });
      });
    }

    if (target === 'all' || target === 'features') {
      outputLines.push({ text: '--- ARCHITECTURE ADD-ON MODULES ---', type: 'success' });
      features.forEach((f) => {
        const p = formatPricePair(f.priceINR, f.priceUSD, session.currency);
        const deps = f.dependsOn && f.dependsOn.length > 0 ? ` (Requires: ${f.dependsOn.join(', ')})` : '';
        outputLines.push({
          text: ` • [${f.id.padEnd(12)}] ${f.label.padEnd(40)} ${p}${deps}`,
          type: 'output',
        });
      });
    }

    outputLines.push({
      text: "Tip: Type 'scope add <feature_id>' or 'scope new <engine_id>' to configure.",
      type: 'output',
    });

    return {
      lines: outputLines,
      nextSession: session,
    };
  }

  // 2. scope new <engine_id>
  if (sub === 'new') {
    const engineId = parts[2]?.toLowerCase() || 'landing';
    const found = engines.find((e) => e.id === engineId);
    if (!found) {
      return {
        lines: [
          { text: `Engine '${engineId}' not found. Available engines: ${engines.map((e) => e.id).join(', ')}`, type: 'error' },
        ],
        nextSession: session,
      };
    }

    const updatedSession: TerminalScopeSession = {
      ...session,
      selectedEngineId: found.id,
      selectedFeatures: ['auth', 'email'],
      appliedPromo: null,
      aiRationale: undefined,
    };

    return {
      lines: [
        { text: `✔ Initialized new architecture blueprint with engine: [${found.title}]`, type: 'success' },
        { text: `Type 'cart' to view the updated bill of materials.`, type: 'output' },
      ],
      nextSession: updatedSession,
    };
  }

  // 3. scope currency <inr|usd>
  if (sub === 'currency') {
    const newCurr = (parts[2] || '').toUpperCase() as Currency;
    if (newCurr !== 'INR' && newCurr !== 'USD') {
      return {
        lines: [{ text: "Usage: scope currency inr | scope currency usd", type: 'error' }],
        nextSession: session,
      };
    }

    const updatedSession = { ...session, currency: newCurr };
    return {
      lines: [{ text: `✔ Switched active currency to ${newCurr}`, type: 'success' }],
      nextSession: updatedSession,
    };
  }

  // 4. scope add <feature_id>
  if (sub === 'add') {
    const featureId = (parts[2] || '').toLowerCase();
    if (!featureId) {
      return {
        lines: [{ text: "Usage: scope add <feature_id> (e.g. 'scope add auth' or 'scope add ai_rag')", type: 'error' }],
        nextSession: session,
      };
    }

    const targetFeat = features.find((f) => f.id === featureId);
    if (!targetFeat) {
      return {
        lines: [
          { text: `Module '${featureId}' not found. Type 'scope list features' to view available IDs.`, type: 'error' },
        ],
        nextSession: session,
      };
    }

    const resolved = resolveFeatureDependencies([featureId], features);
    const updatedFeatures = Array.from(new Set([...session.selectedFeatures, featureId, ...resolved]));
    const newlyAdded = updatedFeatures.filter((id) => !session.selectedFeatures.includes(id));

    const updatedSession: TerminalScopeSession = {
      ...session,
      selectedFeatures: updatedFeatures,
    };

    const lines: Array<{ text: string; type: 'success' | 'output' }> = [
      { text: `✔ Added module: ${targetFeat.label}`, type: 'success' },
    ];

    if (newlyAdded.length > 1) {
      const prereqs = newlyAdded.filter((id) => id !== featureId);
      lines.push({
        text: `  ℹ Auto-resolved prerequisites: ${prereqs.join(', ')}`,
        type: 'output',
      });
    }

    return {
      lines,
      nextSession: updatedSession,
    };
  }

  // 5. scope remove <feature_id> [--force]
  if (sub === 'remove') {
    const featureId = (parts[2] || '').toLowerCase();
    const isForce = parts.includes('--force') || parts.includes('-f');

    if (!featureId) {
      return {
        lines: [{ text: "Usage: scope remove <feature_id> [--force]", type: 'error' }],
        nextSession: session,
      };
    }

    if (!session.selectedFeatures.includes(featureId)) {
      return {
        lines: [{ text: `Module '${featureId}' is not in your active cart.`, type: 'error' }],
        nextSession: session,
      };
    }

    const targetFeat = features.find((f) => f.id === featureId);
    const dependents = findDependentFeatures(featureId, session.selectedFeatures, features);

    if (dependents.length > 0 && !isForce) {
      return {
        lines: [
          {
            text: `⚠️ DEPENDENCY WARNING: Removing '${targetFeat?.label || featureId}' breaks active modules:`,
            type: 'error',
          },
          ...dependents.map((d) => ({
            text: `   • ${d.label} [${d.id}]`,
            type: 'output' as const,
          })),
          {
            text: `Pass '--force' to drop all connected modules: 'scope remove ${featureId} --force'`,
            type: 'error',
          },
        ],
        nextSession: session,
      };
    }

    const removedIds = [featureId, ...(isForce ? dependents.map((d) => d.id) : [])];
    const updatedFeatures = session.selectedFeatures.filter((id) => !removedIds.includes(id));

    const updatedSession: TerminalScopeSession = {
      ...session,
      selectedFeatures: updatedFeatures,
    };

    return {
      lines: [
        {
          text: `✔ Removed '${targetFeat?.label || featureId}'${dependents.length > 0 ? ` and ${dependents.length} connected module(s)` : ''}`,
          type: 'success',
        },
      ],
      nextSession: updatedSession,
    };
  }

  // 6. scope promo <promo_code>
  if (sub === 'promo') {
    const promoCode = (parts[2] || '').toUpperCase();
    if (!promoCode) {
      return {
        lines: [{ text: "Usage: scope promo <code_or_partner_id> (e.g. 'scope promo FOUNDER10')", type: 'error' }],
        nextSession: session,
      };
    }

    if (promoCode === 'CLEAR' || promoCode === 'REMOVE') {
      return {
        lines: [{ text: "✔ Removed applied promo discount.", type: 'success' }],
        nextSession: { ...session, appliedPromo: null },
      };
    }

    try {
      const quote = calcQuote(
        engines,
        features,
        brandAssets,
        maintenancePlans,
        {
          engineId: session.selectedEngineId,
          featureIds: session.selectedFeatures,
          brandAssetId: session.selectedBrandAssetId,
          maintenancePlanId: session.selectedMaintenancePlanId,
        },
        session.currency
      );

      const res = await fetch('/api/scoping/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoCode,
          grossTotal: quote.grossTotal,
          currency: session.currency,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        return {
          lines: [{ text: `Invalid promo code: ${data.message || 'Code not recognized.'}`, type: 'error' }],
          nextSession: session,
        };
      }

      const updatedSession: TerminalScopeSession = {
        ...session,
        appliedPromo: {
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmountINR: data.discountAmountINR,
          discountAmountUSD: data.discountAmountUSD,
        },
      };

      const discountStr =
        session.currency === 'INR'
          ? `₹${data.discountAmountINR?.toLocaleString('en-IN')}`
          : `$${data.discountAmountUSD?.toLocaleString('en-US')}`;

      return {
        lines: [
          { text: `✔ Promo code [${data.code}] applied! Discount: -${discountStr}`, type: 'success' },
          { text: `Type 'cart' to inspect updated ledger.`, type: 'output' },
        ],
        nextSession: updatedSession,
      };
    } catch {
      return {
        lines: [{ text: "Failed to validate promo code over network.", type: 'error' }],
        nextSession: session,
      };
    }
  }

  // 7. scope analyze "<prompt>" (Dogfoods Retriever Cognitive Engine)
  if (sub === 'analyze') {
    const promptText = parts.slice(2).join(' ').replace(/^["']|["']$/g, '');
    if (!promptText || promptText.length < 5) {
      return {
        lines: [
          {
            text: 'Usage: scope analyze "<detailed project description or RFP>"',
            type: 'error',
          },
          {
            text: 'Example: scope analyze "Need a SaaS platform with Google Auth, Stripe billing, and AI document search"',
            type: 'output',
          },
        ],
        nextSession: session,
      };
    }

    try {
      const res = await fetch('/api/scoping/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, currency: session.currency }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          lines: [{ text: `Retriever Scoping Engine error: ${data.error || 'Failed to analyze.'}`, type: 'error' }],
          nextSession: session,
        };
      }

      const suggestedEngineId = data.suggestedEngineId || 'saas';
      const suggestedFeatures: string[] = data.suggestedFeatureIds || [];
      const resolvedFeatures = resolveFeatureDependencies(suggestedFeatures, features);
      const mergedFeatures = Array.from(new Set([...suggestedFeatures, ...resolvedFeatures]));

      const updatedSession: TerminalScopeSession = {
        ...session,
        selectedEngineId: suggestedEngineId,
        selectedFeatures: mergedFeatures,
        projectGoal: data.primaryOutcome || promptText.slice(0, 50),
        aiRationale: data.rationale,
        lastAnalysisConfidence: data.confidence,
      };

      const table = formatTerminalCartTable(updatedSession, engines, features, brandAssets, maintenancePlans);

      return {
        lines: [
          { text: `🧠 RETRIEVER AI COGNITIVE SCOPING ANALYSIS:`, type: 'success' },
          { text: `   Confidence Score: ${(data.confidence * 100).toFixed(0)}%`, type: 'output' },
          { text: `   Suggested Engine: [${suggestedEngineId}]`, type: 'output' },
          { text: `   Detected Modules (${mergedFeatures.length}): ${mergedFeatures.join(', ')}`, type: 'output' },
          { text: ' ', type: 'output' },
          ...table.map((t) => ({ text: t, type: 'output' as const })),
        ],
        nextSession: updatedSession,
      };
    } catch {
      return {
        lines: [{ text: "Failed to connect to Retriever Cognitive Engine.", type: 'error' }],
        nextSession: session,
      };
    }
  }

  // 8. scope export
  if (sub === 'export') {
    return {
      lines: [
        { text: "✔ Generating digital Scoping Proposal PDF...", type: 'success' },
        { text: "Proposal download started in browser.", type: 'output' },
      ],
      nextSession: session,
      triggerExportPdf: true,
    };
  }

  // 9. scope checkout [--deposit 50] / cart checkout
  if (sub === 'checkout') {
    return handleCheckout(session, parts.slice(2), engines, features, brandAssets, maintenancePlans);
  }

  // 10. scope cart / scope status
  if (sub === 'cart' || sub === 'status') {
    const table = formatTerminalCartTable(session, engines, features, brandAssets, maintenancePlans);
    return {
      lines: table.map((t) => ({ text: t, type: 'output' })),
      nextSession: session,
    };
  }

  return {
    lines: [{ text: `Unknown sub-command: 'scope ${sub}'. Type 'scope help' for all options.`, type: 'error' }],
    nextSession: session,
  };
}

function handleCheckout(
  session: TerminalScopeSession,
  args: string[],
  engines: BaseEngineItem[],
  features: FeatureItem[],
  brandAssets: BrandAssetOption[],
  maintenancePlans: MaintenancePlanOption[]
): TerminalScopingResult {
  const quote = calcQuote(
    engines,
    features,
    brandAssets,
    maintenancePlans,
    {
      engineId: session.selectedEngineId,
      featureIds: session.selectedFeatures,
      brandAssetId: session.selectedBrandAssetId,
      maintenancePlanId: session.selectedMaintenancePlanId,
      promoCode: session.appliedPromo,
    },
    session.currency
  );

  const depositPercent = args.includes('--full') ? 100 : 50;
  const depositAmount =
    depositPercent === 100
      ? (session.currency === 'INR' ? quote.netTotalINR : quote.netTotalUSD)
      : (session.currency === 'INR' ? quote.depositINR : quote.depositUSD);

  const fastPassUrl = `/dashboard?imported=true&engine=${session.selectedEngineId}&features=${session.selectedFeatures.join(',')}&currency=${session.currency}${session.appliedPromo ? `&promo=${session.appliedPromo.code}` : ''}`;

  return {
    lines: [
      { text: '========================================================================', type: 'success' },
      { text: '                  CHECKOUT & MOBILE SCAN-TO-PAY GATEWAY                 ', type: 'success' },
      { text: '========================================================================', type: 'output' },
      { text: ` Deposit Due (${depositPercent}%): ${session.currency === 'INR' ? `₹${depositAmount.toLocaleString('en-IN')}` : `$${depositAmount.toLocaleString('en-US')}`}`, type: 'success' },
      { text: ' ', type: 'output' },
      { text: ' 📱 Scan QR Code or click Fast-Pass link to complete deposit:', type: 'output' },
      { text: ` 🔗 Fast-Pass: ${fastPassUrl}`, type: 'link', href: fastPassUrl },
      { text: '========================================================================', type: 'output' },
    ],
    nextSession: session,
    triggerCheckoutQr: {
      amount: depositAmount,
      currency: session.currency,
      depositPercent,
      fastPassUrl,
    },
  };
}
