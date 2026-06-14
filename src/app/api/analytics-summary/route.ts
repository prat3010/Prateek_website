import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';

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
      topReferrer = 'GitHub (github.com/prat3010)';
      topCountry = 'United States';
    } else {
      const { data, error } = await supabase
        .from('page_visits')
        .select('path, country, referrer, ip_hash, is_bot');

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
          if (v.country && v.country !== 'Local/Unknown') countries[v.country] = (countries[v.country] || 0) + 1;
          
          let ref = 'Direct / Search';
          if (v.referrer && v.referrer !== 'Direct' && v.referrer !== '') {
            const lowerRef = v.referrer.toLowerCase();
            if (lowerRef.includes('github')) ref = 'GitHub';
            else if (lowerRef.includes('linkedin')) ref = 'LinkedIn';
            else if (lowerRef.includes('t.co') || lowerRef.includes('twitter') || lowerRef.includes('x.com')) ref = 'Twitter / X';
            else if (lowerRef.includes('google')) ref = 'Google Search';
            else ref = v.referrer;
          }
          referrers[ref] = (referrers[ref] || 0) + 1;
        });

        const sortedPaths = Object.entries(paths).sort((a, b) => b[1] - a[1]);
        if (sortedPaths.length > 0) popularPath = sortedPaths[0][0];

        const sortedRefs = Object.entries(referrers).sort((a, b) => b[1] - a[1]);
        if (sortedRefs.length > 0) topReferrer = sortedRefs[0][0];

        const sortedCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]);
        if (sortedCountries.length > 0) topCountry = sortedCountries[0][0];
      } else {
        isDemoMode = true;
        totalViews = 0;
        uniqueVisitors = 0;
      }
    }

    return NextResponse.json({
      success: true,
      isDemoMode,
      totalViews,
      uniqueVisitors,
      popularPath,
      topReferrer,
      topCountry
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown database error' }, { status: 500 });
  }
}
