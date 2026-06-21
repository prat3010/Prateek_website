import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { classifyReferrer, getCountryName } from '@/app/admin/analytics/_lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let totalViews = 0;
    let uniqueVisitors = 0;
    let popularPath = 'N/A';
    let topReferrer = 'N/A';
    let topCountry = 'N/A';
    let isDemoMode = false;

    if (!supabase) {
      isDemoMode = true;
      // Provide mock stats for demo mode
      totalViews = 1845;
      uniqueVisitors = 512;
      popularPath = '/';
      topReferrer = 'GitHub';
      topCountry = 'United States';
    } else {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      let rpcSuccess = false;

      // 1. Try to use the high-performance RPC
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_analytics_summary', {
          cutoff_time: ninetyDaysAgo,
        });

        if (!rpcError && rpcData) {
          rpcSuccess = true;
          totalViews = Number(rpcData.total_views || 0);
          uniqueVisitors = Number(rpcData.unique_visitors || 0);

          if (rpcData.popular_pages && rpcData.popular_pages.length > 0) {
            popularPath = rpcData.popular_pages[0].path || 'N/A';
          }

          // Group and classify referrers
          const referrerMap: Record<string, number> = {};
          (rpcData.top_referrers || []).forEach((r: { name: string; count: number }) => {
            const cleanRef = classifyReferrer(r.name);
            referrerMap[cleanRef] = (referrerMap[cleanRef] || 0) + Number(r.count);
          });
          const sortedRefs = Object.entries(referrerMap).sort((a, b) => b[1] - a[1]);
          if (sortedRefs.length > 0) {
            topReferrer = sortedRefs[0][0];
          }

          if (rpcData.top_countries && rpcData.top_countries.length > 0) {
            topCountry = getCountryName(rpcData.top_countries[0].code);
          }
        }
      } catch (rpcErr) {
        console.warn('analytics-summary API: RPC failed, falling back to client-side count:', rpcErr);
      }

      // 2. Fallback: Slow Path client-side aggregation
      if (!rpcSuccess) {
        const { data, error } = await supabase
          .from('page_visits')
          .select('path, country, referrer, ip_hash, is_bot')
          .gte('created_at', ninetyDaysAgo)
          .order('created_at', { ascending: false }) // Ensure deterministic sorted latest records
          .limit(5000);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const nonBotVisits = data.filter(v => !v.is_bot);
          totalViews = nonBotVisits.length;

          const uniqueIps = new Set(nonBotVisits.map(v => v.ip_hash).filter(Boolean));
          uniqueVisitors = uniqueIps.size;

          const paths: Record<string, number> = {};
          const referrers: Record<string, number> = {};
          const countries: Record<string, number> = {};

          nonBotVisits.forEach(v => {
            if (v.path) paths[v.path] = (paths[v.path] || 0) + 1;
            if (v.country && v.country !== 'Local/Unknown') {
              countries[v.country] = (countries[v.country] || 0) + 1;
            }

            const cleanRef = classifyReferrer(v.referrer);
            referrers[cleanRef] = (referrers[cleanRef] || 0) + 1;
          });

          const sortedPaths = Object.entries(paths).sort((a, b) => b[1] - a[1]);
          if (sortedPaths.length > 0) popularPath = sortedPaths[0][0];

          const sortedRefs = Object.entries(referrers).sort((a, b) => b[1] - a[1]);
          if (sortedRefs.length > 0) topReferrer = sortedRefs[0][0];

          const sortedCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]);
          if (sortedCountries.length > 0) topCountry = getCountryName(sortedCountries[0][0]);
        } else {
          isDemoMode = true;
          totalViews = 0;
          uniqueVisitors = 0;
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      isDemoMode,
      totalViews,
      uniqueVisitors,
      popularPath,
      topReferrer,
      topCountry,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown database error' },
      { status: 500 }
    );
  }
}
