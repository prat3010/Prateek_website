import { describe, it, expect } from 'vitest';
import {
  TERMINAL_PITCH_LINES,
  TERMINAL_ARCHITECTURE_LINES,
  TERMINAL_WAR_STORIES_LINES,
  TERMINAL_TEST_SUITE_LINES,
  handleInterviewModeCommand,
  type InterviewSessionState,
} from '@/lib/terminalPresentation';

describe('Terminal Presentation Engine', () => {
  it('exports formatted pitch lines with executive summary and superpowers', () => {
    expect(TERMINAL_PITCH_LINES.length).toBeGreaterThan(5);
    const hasExecutive = TERMINAL_PITCH_LINES.some((line) => line.text.includes('WHY HIRE ME'));
    const hasSuperpowers = TERMINAL_PITCH_LINES.some((line) => line.text.includes('CORE SUPERPOWERS'));
    expect(hasExecutive).toBe(true);
    expect(hasSuperpowers).toBe(true);
  });

  it('exports ASCII architecture blueprint lines for 8-tier ecosystem', () => {
    expect(TERMINAL_ARCHITECTURE_LINES.length).toBeGreaterThan(5);
    const hasTier1 = TERMINAL_ARCHITECTURE_LINES.some((line) => line.text.includes('TIER 1'));
    const hasTier4 = TERMINAL_ARCHITECTURE_LINES.some((line) => line.text.includes('TIER 4'));
    expect(hasTier1).toBe(true);
    expect(hasTier4).toBe(true);
  });

  it('exports automated test suite matrix lines with breakdown', () => {
    expect(TERMINAL_TEST_SUITE_LINES.length).toBeGreaterThan(5);
    const hasSecurity = TERMINAL_TEST_SUITE_LINES.some((line) => line.text.includes('Security, Auth & Rate Limiting'));
    const hasPdfSmoke = TERMINAL_TEST_SUITE_LINES.some((line) => line.text.includes('PDF Geometry & Rendering Engine Smoke Tests'));
    expect(hasSecurity).toBe(true);
    expect(hasPdfSmoke).toBe(true);
  });

  it('exports engineering war stories covering tough production problems', () => {
    expect(TERMINAL_WAR_STORIES_LINES.length).toBeGreaterThan(5);
    const hasPortalTrap = TERMINAL_WAR_STORIES_LINES.some((line) => line.text.includes('Framer Motion CSS Containing Block Trap'));
    const hasOllamaCost = TERMINAL_WAR_STORIES_LINES.some((line) => line.text.includes('Local VPS Embeddings'));
    expect(hasPortalTrap).toBe(true);
    expect(hasOllamaCost).toBe(true);
  });

  describe('Interactive Interview Mode CLI', () => {
    it('initializes role selection prompt on "interview-mode"', () => {
      const state: InterviewSessionState = { step: 'role_select' };
      const result = handleInterviewModeCommand('interview-mode', state);
      expect(result.nextState.step).toBe('role_select');
      expect(result.lines.some((l) => l.text.includes('INTERACTIVE INTERVIEW'))).toBe(true);
    });

    it('branches into technical leader / CTO presentation on option "1"', () => {
      const state: InterviewSessionState = { step: 'role_select' };
      const result = handleInterviewModeCommand('1', state);
      expect(result.nextState.step).toBe('details');
      expect(result.nextState.selectedRole).toBe('tech');
      expect(result.lines.some((l) => l.text.includes('TECHNICAL LEAD / CTO'))).toBe(true);
      expect(result.lines.some((l) => l.text.includes('Hexagonal Isolation'))).toBe(true);
    });

    it('branches into commercial client / founder presentation on option "2"', () => {
      const state: InterviewSessionState = { step: 'role_select' };
      const result = handleInterviewModeCommand('2', state);
      expect(result.nextState.step).toBe('details');
      expect(result.nextState.selectedRole).toBe('biz');
      expect(result.lines.some((l) => l.text.includes('FOUNDER / COMMERCIAL CLIENT'))).toBe(true);
      expect(result.lines.some((l) => l.text.includes('Time to Market'))).toBe(true);
    });

    it('returns helpful error on unknown option', () => {
      const state: InterviewSessionState = { step: 'role_select' };
      const result = handleInterviewModeCommand('99', state);
      expect(result.nextState.step).toBe('role_select');
      expect(result.lines.some((l) => l.type === 'error')).toBe(true);
    });
  });
});
