import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createInitialTerminalScopeSession,
  formatTerminalCartTable,
  handleTerminalScopeCommand,
  type TerminalScopeSession,
} from '../terminalScoping';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import type { BaseEngineItem, FeatureItem, BrandAssetOption, MaintenancePlanOption } from '@/data/resume';

const {
  engines,
  features,
  brandAssets,
  maintenancePlans,
} = questionnaireDefaults as {
  engines: BaseEngineItem[];
  features: FeatureItem[];
  brandAssets: BrandAssetOption[];
  maintenancePlans: MaintenancePlanOption[];
};

describe('terminalScoping Domain Module', () => {
  let session: TerminalScopeSession;

  beforeEach(() => {
    session = createInitialTerminalScopeSession('INR');
    vi.restoreAllMocks();
  });

  it('creates initial session with valid defaults', () => {
    expect(session.selectedEngineId).toBe('landing');
    expect(session.selectedFeatures).toContain('auth');
    expect(session.currency).toBe('INR');
  });

  it('formats terminal cart table with ASCII layout and currency totals', () => {
    const table = formatTerminalCartTable(session, engines, features, brandAssets, maintenancePlans);
    const joined = table.join('\n');
    expect(joined).toContain('PRATEEQ ARCHITECTURE SCOPING LEDGER');
    expect(joined).toContain('Landing Page Core Engine');
    expect(joined).toContain('TOTAL INVESTMENT:');
    expect(joined).toContain('50% Milestone Deposit');
  });

  it('handles "scope help" command', async () => {
    const result = await handleTerminalScopeCommand('scope help', session, engines, features, brandAssets, maintenancePlans);
    expect(result.lines.some((l) => l.text.includes('TERMINAL SCOPING CLI COMMAND INDEX'))).toBe(true);
  });

  it('handles "scope list" command', async () => {
    const result = await handleTerminalScopeCommand('scope list', session, engines, features, brandAssets, maintenancePlans);
    expect(result.lines.some((l) => l.text.includes('BASE APPLICATION ENGINES'))).toBe(true);
    expect(result.lines.some((l) => l.text.includes('ARCHITECTURE ADD-ON MODULES'))).toBe(true);
  });

  it('handles "scope new saas" and resets cart to saas engine', async () => {
    const result = await handleTerminalScopeCommand('scope new saas', session, engines, features, brandAssets, maintenancePlans);
    expect(result.nextSession.selectedEngineId).toBe('saas');
    expect(result.lines.some((l) => l.text.includes('Full-Stack SaaS MVP Core Engine'))).toBe(true);
  });

  it('handles "scope currency usd" and switches session currency', async () => {
    const result = await handleTerminalScopeCommand('scope currency usd', session, engines, features, brandAssets, maintenancePlans);
    expect(result.nextSession.currency).toBe('USD');
    expect(result.lines.some((l) => l.text.includes('Switched active currency to USD'))).toBe(true);
  });

  it('handles "scope add" with auto-resolution of prerequisites', async () => {
    // Adding booking requires payments & auth
    const result = await handleTerminalScopeCommand('scope add booking', session, engines, features, brandAssets, maintenancePlans);
    expect(result.nextSession.selectedFeatures).toContain('booking');
    expect(result.nextSession.selectedFeatures).toContain('payments');
    expect(result.nextSession.selectedFeatures).toContain('auth');
  });

  it('handles "scope remove" with dependency warnings and --force flag', async () => {
    // Setup session with auth and dependent crm
    const customSession: TerminalScopeSession = {
      ...session,
      selectedFeatures: ['auth', 'crm'],
    };

    // Attempting to remove auth without force should warn about crm
    const warnResult = await handleTerminalScopeCommand('scope remove auth', customSession, engines, features, brandAssets, maintenancePlans);
    expect(warnResult.lines.some((l) => l.text.includes('DEPENDENCY WARNING'))).toBe(true);
    expect(warnResult.nextSession.selectedFeatures).toContain('auth');

    // Removing auth with --force drops both auth and crm
    const forceResult = await handleTerminalScopeCommand('scope remove auth --force', customSession, engines, features, brandAssets, maintenancePlans);
    expect(forceResult.nextSession.selectedFeatures).not.toContain('auth');
    expect(forceResult.nextSession.selectedFeatures).not.toContain('crm');
  });

  it('handles "scope analyze" with Retriever AI mock response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestedEngineId: 'saas',
        suggestedFeatureIds: ['auth', 'payments', 'ai_rag'],
        confidence: 0.94,
        primaryOutcome: 'AI Document Intelligence App',
        rationale: 'Architecture recommended based on RAG & vector requirements.',
      }),
    } as unknown as Response);

    const result = await handleTerminalScopeCommand('scope analyze "Build an AI SaaS with documents"', session, engines, features, brandAssets, maintenancePlans);
    expect(result.nextSession.selectedEngineId).toBe('saas');
    expect(result.nextSession.selectedFeatures).toContain('ai_rag');
    expect(result.lines.some((l) => l.text.includes('RETRIEVER AI COGNITIVE SCOPING ANALYSIS'))).toBe(true);
    expect(result.lines.some((l) => l.text.includes('94%'))).toBe(true);
  });

  it('handles "scope export" and flags PDF generation trigger', async () => {
    const result = await handleTerminalScopeCommand('scope export', session, engines, features, brandAssets, maintenancePlans);
    expect(result.triggerExportPdf).toBe(true);
    expect(result.lines.some((l) => l.text.includes('Generating digital Scoping Proposal PDF'))).toBe(true);
  });

  it('handles "scope checkout" and triggers QR code & fast-pass link', async () => {
    const result = await handleTerminalScopeCommand('scope checkout', session, engines, features, brandAssets, maintenancePlans);
    expect(result.triggerCheckoutQr).toBeDefined();
    expect(result.triggerCheckoutQr?.depositPercent).toBe(50);
    expect(result.lines.some((l) => l.text.includes('Fast-Pass:'))).toBe(true);
  });

  it('handles direct "cart" command', async () => {
    const result = await handleTerminalScopeCommand('cart', session, engines, features, brandAssets, maintenancePlans);
    expect(result.lines.some((l) => l.text.includes('PRATEEQ ARCHITECTURE SCOPING LEDGER'))).toBe(true);
  });
});
