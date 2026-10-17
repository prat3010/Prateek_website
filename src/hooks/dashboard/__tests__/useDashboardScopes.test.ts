import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDashboardScopes } from '../useDashboardScopes';

describe('useDashboardScopes hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('initializes isLoading as false when userEmail is undefined (prevents unauthenticated hang)', () => {
    const { result } = renderHook(() =>
      useDashboardScopes({
        userEmail: undefined,
        getAccessToken: async () => null,
        setAuthGateError: vi.fn(),
      })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.scopes).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches scopes and manages isLoading when userEmail is provided', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        scopes: [
          {
            id: 'scope-1',
            scope_code: 'SC-100',
            company_name: 'Acme Corp',
            base_engine: 'Landing Page',
            features: ['auth'],
            total_cost_inr: 50000,
            total_cost_usd: 600,
            currency: 'USD',
            status: 'draft',
          },
        ],
      }),
    } as unknown as Response);

    const { result } = renderHook(() =>
      useDashboardScopes({
        userEmail: 'user@example.com',
        getAccessToken: async () => 'test-token',
        setAuthGateError: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.scopes).toHaveLength(1);
    expect(result.current.scopes[0].scope_code).toBe('SC-100');
    expect(global.fetch).toHaveBeenCalledWith('/api/client/get-scopes', expect.any(Object));
  });

  it('resets isLoading to false if user logs out (userEmail transitions to undefined)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ scopes: [] }),
    } as unknown as Response);

    const { result, rerender } = renderHook(
      ({ email }: { email: string | undefined }) =>
        useDashboardScopes({
          userEmail: email,
          getAccessToken: async () => 'test-token',
          setAuthGateError: vi.fn(),
        }),
      { initialProps: { email: 'user@example.com' as string | undefined } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate user logout
    rerender({ email: undefined });

    expect(result.current.isLoading).toBe(false);
  });
});
