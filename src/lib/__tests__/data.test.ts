import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}));

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return mockSupabaseClient;
  },
}));

let mockSupabaseClient: unknown = null;

vi.mock('@/data/projects.json', () => ({
  default: [{ id: 'fallback-1', title: 'Fallback Project' }],
}));

vi.mock('@/data/skills.json', () => ({
  default: [{ name: 'Fallback Skill' }],
}));

vi.mock('@/data/certificates.json', () => ({
  default: [{ id: 'fallback-cert', title: 'Fallback Cert' }],
}));

vi.mock('@/data/resume.json', () => ({
  default: { name: 'Fallback Resume' },
}));

import { getProjects, getSkills, getCertificates, getProfile } from '../data';

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseClient = null;
  mockFrom.mockReturnValue({
    select: mockSelect.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    single: mockSingle,
  });
  mockSelect.mockReturnThis();
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockEq.mockResolvedValue({ data: null, error: null });
  mockSingle.mockResolvedValue({ data: null, error: null });
});

describe('getProjects', () => {
  it('returns fallback data when supabase is null', async () => {
    mockSupabaseClient = null;
    const result = await getProjects();
    expect(result).toEqual([{ id: 'fallback-1', title: 'Fallback Project' }]);
  });

  it('returns Supabase data when available', async () => {
    const fakeData = [{ id: 1, slug: 'proj-1', title: 'Project' }];
    mockSupabaseClient = { from: vi.fn(() => ({ select: mockSelect.mockReturnThis(), order: mockOrder.mockResolvedValue({ data: fakeData, error: null }) })) };
    const result = await getProjects();
    expect(result).toHaveLength(1);
  });

  it('falls back on Supabase error', async () => {
    mockSupabaseClient = { from: vi.fn(() => ({ select: mockSelect.mockReturnThis(), order: mockOrder.mockResolvedValue({ data: null, error: { message: 'fail' } }) })) };
    const result = await getProjects();
    expect(result).toEqual([{ id: 'fallback-1', title: 'Fallback Project' }]);
  });
});

describe('getSkills', () => {
  it('returns fallback data when supabase is null', async () => {
    mockSupabaseClient = null;
    const result = await getSkills();
    expect(result).toEqual([{ name: 'Fallback Skill' }]);
  });

  it('returns Supabase data when available', async () => {
    const fakeData = [{ name: 'TypeScript' }];
    mockSupabaseClient = { from: vi.fn(() => ({ select: mockSelect.mockReturnThis(), order: mockOrder.mockResolvedValue({ data: fakeData, error: null }) })) };
    const result = await getSkills();
    expect(result).toEqual(fakeData);
  });
});

describe('getCertificates', () => {
  it('returns fallback data when supabase is null', async () => {
    mockSupabaseClient = null;
    const result = await getCertificates();
    expect(result).toEqual([{ id: 'fallback-cert', title: 'Fallback Cert' }]);
  });

  it('falls back on Supabase error', async () => {
    mockSupabaseClient = { from: vi.fn(() => ({ select: mockSelect.mockReturnThis(), order: mockOrder.mockResolvedValue({ data: null, error: { message: 'fail' } }) })) };
    const result = await getCertificates();
    expect(result).toEqual([{ id: 'fallback-cert', title: 'Fallback Cert' }]);
  });
});

describe('getProfile', () => {
  it('returns fallback data when supabase is null', async () => {
    mockSupabaseClient = null;
    const result = await getProfile();
    expect(result).toEqual({ name: 'Fallback Resume' });
  });

  it('returns Supabase profile data when available', async () => {
    const fakeProfile = { data: { name: 'Prateek' } };
    mockSupabaseClient = {
      from: vi.fn(() => ({
        select: mockSelect.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        single: mockSingle.mockResolvedValue({ data: fakeProfile, error: null }),
      })),
    };
    const result = await getProfile();
    expect(result).toEqual({ name: 'Prateek' });
  });

  it('falls back on Supabase error', async () => {
    mockSupabaseClient = {
      from: vi.fn(() => ({
        select: mockSelect.mockReturnThis(),
        eq: mockEq.mockReturnThis(),
        single: mockSingle.mockResolvedValue({ data: null, error: { message: 'fail' } }),
      })),
    };
    const result = await getProfile();
    expect(result).toEqual({ name: 'Fallback Resume' });
  });
});
