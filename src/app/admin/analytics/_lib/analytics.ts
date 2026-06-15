// Data fetching and aggregation logic for the analytics dashboard

import { supabase } from '@/data/supabase';
import type { PageVisit, AggregatedStats, TimeRange } from './types';
import { getCountryName, classifyReferrer } from './utils';

const QUERY_LIMIT = 2000;

const RANGE_TO_DAYS: Record<TimeRange, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  'all': 365,
};

const TIMELINE_DAYS = 14;

interface FetchResult {
  visits: PageVisit[];
  error: string | null;
}

/**
 * Fetch visits from Supabase. Returns an error message if the database
 * is not configured or the query fails — no mock data fallback.
 */
export async function fetchVisits(range: TimeRange): Promise<FetchResult> {
  if (!supabase) {
    return {
      visits: [],
      error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file.',
    };
  }

  const daysLimit = RANGE_TO_DAYS[range];
  const cutoffDateStr = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000).toISOString();

  try {
    let query = supabase.from('page_visits').select('*');
    if (range !== 'all') {
      query = query.gte('created_at', cutoffDateStr);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(QUERY_LIMIT);

    if (error) throw error;
    return { visits: data || [], error: null };
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : 'Failed to fetch data';
    return { visits: [], error: errorMsg };
  }
}

/**
 * Aggregate raw visits into dashboard statistics in a single optimized pass.
 */
export function aggregateVisits(visits: PageVisit[]): AggregatedStats {
  let totalViews = 0;
  let totalBots = 0;
  let mobileCount = 0;
  let desktopCount = 0;
  let tabletCount = 0;

  const uniqueIps = new Set<string>();
  const pathCounts: Record<string, number> = {};
  const referrerCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};

  // Build daily timeline buckets
  const dailyViews: AggregatedStats['dailyViews'] = [];
  const today = new Date();
  const dailyViewsMap: Record<string, (typeof dailyViews)[0]> = {};

  for (let i = TIMELINE_DAYS - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const entry = { dateStr, label, count: 0 };
    dailyViews.push(entry);
    dailyViewsMap[dateStr] = entry;
  }

  // Single-pass aggregation
  for (const v of visits) {
    if (v.is_bot) {
      totalBots++;
      continue;
    }

    totalViews++;
    if (v.ip_hash) uniqueIps.add(v.ip_hash);

    // Path counts
    pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;

    // Referrer counts
    const cleanRef = classifyReferrer(v.referrer);
    referrerCounts[cleanRef] = (referrerCounts[cleanRef] || 0) + 1;

    // Country counts
    const country = v.country || 'Unknown';
    if (country !== 'Local/Unknown') {
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    }

    // Device counts
    if (v.device === 'mobile') mobileCount++;
    else if (v.device === 'tablet') tabletCount++;
    else desktopCount++;

    // Daily timeline
    try {
      const vDateStr = new Date(v.created_at).toISOString().split('T')[0];
      const dayEntry = dailyViewsMap[vDateStr];
      if (dayEntry) dayEntry.count++;
    } catch {
      // Ignore malformed dates
    }
  }

  // Derive sorted top lists
  const popularPages = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topReferrers = Object.entries(referrerCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topCountries = Object.entries(countryCounts)
    .map(([code, count]) => ({ code, name: getCountryName(code), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalDeviceVisits = mobileCount + desktopCount + tabletCount || 1;

  return {
    totalViews,
    totalBots,
    uniqueVisitors: uniqueIps.size,
    popularPages,
    topReferrers,
    topCountries,
    desktopCount,
    mobileCount,
    tabletCount,
    desktopPct: Math.round((desktopCount / totalDeviceVisits) * 100),
    mobilePct: Math.round((mobileCount / totalDeviceVisits) * 100),
    tabletPct: Math.round((tabletCount / totalDeviceVisits) * 100),
    dailyViews,
    maxViews: Math.max(...dailyViews.map(d => d.count), 1),
  };
}
