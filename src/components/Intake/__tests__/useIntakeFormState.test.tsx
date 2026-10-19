import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { useIntakeFormState } from '../useIntakeFormState';
import type { ResumeData } from '@/data/resume';
import type { ParseIntentResponse } from '@/lib/rag-client';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    getAccessToken: vi.fn(),
    user: null,
    loading: false,
  }),
}));

vi.mock('@/lib/auth', () => ({
  signInWithGoogle: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('useIntakeFormState - applyBlueprint', () => {
  const mockResumeData = {
    intake: questionnaireDefaults,
  } as unknown as ResumeData;

  const mockTelemetry = {
    latencyMs: 120,
    semanticCacheHit: false,
    tenantId: 'prateeq_scoping',
    modelUsed: 'meta-llama/llama-3.3-70b-instruct',
    fallbackMode: false,
  };

  it('preserves all requested feature IDs from blueprint without wiping them out', () => {
    const { result } = renderHook(() =>
      useIntakeFormState(mockResumeData, null, null, false)
    );

    const ragBlueprint: ParseIntentResponse = {
      success: true,
      archetypeId: 'ai_rag_app',
      baseEngineId: 'saas',
      featureIds: ['ai_rag', 'auth', 'admin', 'email'],
      brandAssetId: 'basic',
      maintenancePlanId: 'premium',
      suggestedTimeline: '4 Weeks',
      confidenceScore: 0.98,
      summaryRationale: 'Matched knowledge base',
      retrieverEngineRecommended: true,
      telemetry: mockTelemetry,
      unrecognizedRequirements: [],
    };

    act(() => {
      result.current.applyBlueprint(ragBlueprint);
    });

    expect(result.current.formData.selectedBaseEngineId).toBe('saas');
    expect(result.current.formData.selectedFeatures).toContain('ai_rag');
    expect(result.current.formData.selectedFeatures).toContain('auth');
    expect(result.current.formData.selectedFeatures).toContain('admin');
    expect(result.current.formData.selectedFeatures).toContain('email');
    expect(result.current.formData.timeline).toBe('4 Weeks');
    expect(result.current.formData.selectedMaintenanceId).toBe('premium');
    expect(result.current.selectedGoalCategory).toBe('ai_widgets');
  });

  it('auto-resolves missing dependencies (e.g. auth and payments for booking or commerce)', () => {
    const { result } = renderHook(() =>
      useIntakeFormState(mockResumeData, null, null, false)
    );

    const bookingBlueprint: ParseIntentResponse = {
      success: true,
      archetypeId: 'booking_appointments',
      baseEngineId: 'multipage',
      featureIds: ['booking'], // Booking depends on payments and auth
      brandAssetId: 'basic',
      maintenancePlanId: 'standard',
      suggestedTimeline: '2 to 3 Weeks',
      confidenceScore: 0.95,
      summaryRationale: 'Matched booking platform',
      retrieverEngineRecommended: false,
      telemetry: mockTelemetry,
      unrecognizedRequirements: [],
    };

    act(() => {
      result.current.applyBlueprint(bookingBlueprint);
    });

    // Booking, payments, and auth must all be present
    expect(result.current.formData.selectedFeatures).toContain('booking');
    expect(result.current.formData.selectedFeatures).toContain('payments');
    expect(result.current.formData.selectedFeatures).toContain('auth');
  });

  it('filters out non-existent/phantom feature IDs if passed in blueprint', () => {
    const { result } = renderHook(() =>
      useIntakeFormState(mockResumeData, null, null, false)
    );

    const dirtyBlueprint: ParseIntentResponse = {
      success: true,
      archetypeId: 'ecommerce',
      baseEngineId: 'multipage',
      featureIds: ['commerce', 'phantom_analytics_id', 'non_existent_search', 'cms'],
      brandAssetId: 'comprehensive',
      maintenancePlanId: 'growth',
      suggestedTimeline: '2 to 3 Weeks',
      confidenceScore: 0.95,
      summaryRationale: 'E-commerce test',
      retrieverEngineRecommended: false,
      telemetry: mockTelemetry,
      unrecognizedRequirements: [],
    };

    act(() => {
      result.current.applyBlueprint(dirtyBlueprint);
    });

    expect(result.current.formData.selectedFeatures).toContain('commerce');
    expect(result.current.formData.selectedFeatures).toContain('cms');
    expect(result.current.formData.selectedFeatures).not.toContain('phantom_analytics_id');
    expect(result.current.formData.selectedFeatures).not.toContain('non_existent_search');
  });
});
