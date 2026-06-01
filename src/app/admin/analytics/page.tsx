import React from 'react';
import { supabase } from '@/data/supabase';
import RefreshButton from './RefreshButton';
import { 
  Eye, 
  Users, 
  MapPin, 
  Compass, 
  Smartphone, 
  Tv, 
  Tablet, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Database
} from 'lucide-react';

export const revalidate = 0; // Force server rendering on every request

// Interface for Page Visit row
interface PageVisit {
  id: string;
  created_at: string;
  path: string;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referrer: string | null;
  ip_hash: string | null;
  is_bot: boolean;
}

// Generate rich mock data for Demo Mode
function getMockData(): PageVisit[] {
  const paths = ['/', '/projects', '/#skills', '/contact', '/playground', '/projects/earth-evolution-simulator'];
  const countries = ['United States', 'India', 'United Kingdom', 'Germany', 'Canada', 'Singapore', 'Australia'];
  const cities = ['San Francisco', 'Bengaluru', 'London', 'Berlin', 'Toronto', 'Singapore', 'Sydney'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const osList = ['macOS', 'Windows', 'iOS', 'Android', 'Linux'];
  const referrers = [
    'https://github.com/prat3010',
    'https://linkedin.com/in/freshlimevodka',
    'https://t.co/3010prateek',
    'https://google.com',
    ''
  ];
  
  const mockVisits: PageVisit[] = [];
  const now = new Date();
  
  for (let i = 0; i < 150; i++) {
    const date = new Date(now.getTime() - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)); // last 15 days
    const isBot = Math.random() < 0.12; // 12% bots
    const deviceIndex = Math.random();
    const device = isBot ? 'desktop' : deviceIndex < 0.55 ? 'desktop' : deviceIndex < 0.9 ? 'mobile' : 'tablet';
    const locIndex = Math.floor(Math.random() * countries.length);
    
    mockVisits.push({
      id: `mock-uuid-${i}`,
      created_at: date.toISOString(),
      path: paths[Math.floor(Math.random() * paths.length)],
      country: isBot ? 'Unknown' : countries[locIndex],
      region: isBot ? '' : 'Region ' + (locIndex + 1),
      city: isBot ? '' : cities[locIndex],
      browser: isBot ? 'Googlebot' : browsers[Math.floor(Math.random() * browsers.length)],
      os: isBot ? 'Linux' : osList[Math.floor(Math.random() * osList.length)],
      device,
      referrer: referrers[Math.floor(Math.random() * referrers.length)],
      ip_hash: `mock-hash-${Math.floor(Math.random() * 40)}`, // 40 unique users
      is_bot: isBot,
    });
  }
  
  // Sort descending
  return mockVisits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default async function AnalyticsPage() {
  let isDemoMode = false;
  let visits: PageVisit[] = [];
  let errorMsg = '';

  if (!supabase) {
    isDemoMode = true;
    visits = getMockData();
  } else {
    try {
      const { data, error } = await supabase
        .from('page_visits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000); // Pull up to last 2000 rows for in-memory analysis

      if (error) {
        throw error;
      }
      visits = data || [];
    } catch (e: any) {
      isDemoMode = true;
      errorMsg = e.message || 'Failed to fetch data';
      visits = getMockData();
    }
  }

  // --- Aggregate Stats ---
  const realVisits = visits.filter(v => !v.is_bot);
  const botVisits = visits.filter(v => v.is_bot);

  // Total Pageviews & Uniques
  const totalViews = realVisits.length;
  const uniqueVisitors = new Set(realVisits.map(v => v.ip_hash)).size;
  const totalBots = botVisits.length;

  // 1. Popular Pages
  const pathCounts: Record<string, number> = {};
  realVisits.forEach(v => {
    pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;
  });
  const popularPages = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 2. Referrers
  const referrerCounts: Record<string, number> = {};
  realVisits.forEach(v => {
    let cleanRef = 'Direct / Search';
    if (v.referrer) {
      try {
        const url = new URL(v.referrer);
        cleanRef = url.hostname;
        if (cleanRef.includes('github.com')) cleanRef = 'GitHub';
        else if (cleanRef.includes('linkedin.com')) cleanRef = 'LinkedIn';
        else if (cleanRef === 't.co') cleanRef = 'Twitter / X';
        else if (cleanRef.includes('google')) cleanRef = 'Google Search';
      } catch (e) {
        cleanRef = v.referrer;
      }
    }
    referrerCounts[cleanRef] = (referrerCounts[cleanRef] || 0) + 1;
  });
  const topReferrers = Object.entries(referrerCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 3. Geolocation (Countries)
  const countryCounts: Record<string, number> = {};
  realVisits.forEach(v => {
    const c = v.country || 'Unknown';
    if (c !== 'Local/Unknown') {
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    }
  });
  const topCountries = Object.entries(countryCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 4. Device Breakdown
  let mobileCount = 0;
  let desktopCount = 0;
  let tabletCount = 0;
  realVisits.forEach(v => {
    if (v.device === 'mobile') mobileCount++;
    else if (v.device === 'tablet') tabletCount++;
    else desktopCount++;
  });
  const totalDeviceVisits = mobileCount + desktopCount + tabletCount || 1;
  const desktopPct = Math.round((desktopCount / totalDeviceVisits) * 100);
  const mobilePct = Math.round((mobileCount / totalDeviceVisits) * 100);
  const tabletPct = Math.round((tabletCount / totalDeviceVisits) * 100);

  // Format relative timestamp helper
  const getRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="container section-padding min-h-screen pt-28">
      {/* --- Pop Art Header Banner --- */}
      <div className="comic-panel halftone-overlay bg-[var(--pop-yellow)] p-6 mb-8 text-[var(--pop-black)] rotate-[-1deg] relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-headline text-stroke uppercase leading-none mb-1">
              Analytics Action Panel!
            </h1>
            <p className="font-body text-sm font-bold uppercase tracking-wide opacity-80">
              {isDemoMode ? '⚡ SYSTEM IN DEMO MODE (SHOWING SIMULATED METRICS)' : '🔌 LIVE VISITOR DATA LINKED SECURELY'}
            </p>
          </div>
          <RefreshButton />
        </div>
      </div>

      {/* --- Alert configuration box if in demo mode --- */}
      {isDemoMode && (
        <div className="comic-panel border-[var(--pop-red)] bg-[var(--surface-elevated)] p-5 mb-8 flex flex-col md:flex-row items-start gap-4">
          <div className="p-3 bg-[var(--pop-red)] text-white comic-border-thin comic-shadow-sm rounded-lg">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="font-headline text-xl text-[var(--pop-red)] uppercase leading-none mb-2">
              Supabase Configuration Missing!
            </h3>
            {errorMsg ? (
              <p className="font-body text-sm text-red-500 mb-2">
                Database Error: {errorMsg}
              </p>
            ) : (
              <p className="font-body text-sm text-[var(--color-text-muted)] mb-2">
                The database keys are not configured in your <code className="font-code text-xs px-1 py-0.5 border border-dashed rounded bg-slate-100 dark:bg-zinc-800">.env.local</code>. We are displaying mock data so you can test the UI layout.
              </p>
            )}
            <div className="text-sm font-body font-bold flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-[var(--pop-blue)]">👉 Step 1: Run table SQL in your Supabase Console</span>
              <span className="text-[var(--pop-green)]">👉 Step 2: Set keys in .env.local to go Live!</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Overview Grid (KPIs) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KPI: Pageviews */}
        <div className="comic-panel bg-[var(--surface-primary)] p-6 flex items-center justify-between comic-shadow relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[var(--color-text)]">
            <Eye size={120} />
          </div>
          <div>
            <span className="font-headline text-lg uppercase text-[var(--color-text-muted)]">Page Views</span>
            <h2 className="text-5xl font-headline text-stroke text-[var(--pop-red)] leading-none mt-1">
              {totalViews.toLocaleString()}
            </h2>
            <p className="font-body text-xs font-bold uppercase text-[var(--color-text-muted)] mt-2">
              Accumulated actions
            </p>
          </div>
          <div className="p-4 bg-[var(--pop-red)] text-white comic-border rounded-full comic-shadow-sm">
            <Eye size={24} />
          </div>
        </div>

        {/* KPI: Unique Visitors */}
        <div className="comic-panel bg-[var(--surface-primary)] p-6 flex items-center justify-between comic-shadow relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[var(--color-text)]">
            <Users size={120} />
          </div>
          <div>
            <span className="font-headline text-lg uppercase text-[var(--color-text-muted)]">Unique Visitors</span>
            <h2 className="text-5xl font-headline text-stroke text-[var(--pop-blue)] leading-none mt-1">
              {uniqueVisitors.toLocaleString()}
            </h2>
            <p className="font-body text-xs font-bold uppercase text-[var(--color-text-muted)] mt-2">
              Based on daily IP hashes
            </p>
          </div>
          <div className="p-4 bg-[var(--pop-blue)] text-white comic-border rounded-full comic-shadow-sm">
            <Users size={24} />
          </div>
        </div>

        {/* KPI: Bot Traffic */}
        <div className="comic-panel bg-[var(--surface-primary)] p-6 flex items-center justify-between comic-shadow relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-[var(--color-text)]">
            <Database size={120} />
          </div>
          <div>
            <span className="font-headline text-lg uppercase text-[var(--color-text-muted)]">Spam & Crawler Hits</span>
            <h2 className="text-5xl font-headline text-stroke text-[var(--pop-green)] leading-none mt-1">
              {totalBots.toLocaleString()}
            </h2>
            <p className="font-body text-xs font-bold uppercase text-[var(--color-text-muted)] mt-2">
              Filtered search bots
            </p>
          </div>
          <div className="p-4 bg-[var(--pop-green)] text-[var(--pop-black)] comic-border rounded-full comic-shadow-sm">
            <Database size={24} />
          </div>
        </div>
      </div>

      {/* --- Second Row: Pages and Devices --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Popular Pages Panel */}
        <div className="comic-panel lg:col-span-8 bg-[var(--surface-primary)] p-6">
          <h2 className="text-2xl font-headline uppercase leading-none mb-4 flex items-center border-b-2 border-[var(--pop-black)] pb-2">
            <Compass className="mr-2 text-[var(--pop-red)]" /> POPULAR DESTINATIONS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body text-sm">
              <thead>
                <tr className="border-b border-[var(--pop-black)] text-[var(--color-text-muted)] uppercase text-xs font-bold">
                  <th className="py-2">PAGE PATH</th>
                  <th className="py-2 text-right">VIEWS</th>
                  <th className="py-2 text-right">PERCENTAGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                {popularPages.map((page, index) => {
                  const percent = Math.round((page.count / (totalViews || 1)) * 100);
                  return (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-zinc-900 font-bold">
                      <td className="py-3 font-code text-xs text-[var(--pop-blue)]">{page.path}</td>
                      <td className="py-3 text-right">{page.count}</td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 bg-[var(--pop-yellow)] border border-[var(--pop-black)] text-[var(--pop-black)] text-xs rounded">
                          {percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {popularPages.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-[var(--color-text-muted)] italic">
                      No page views recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Devices Panel */}
        <div className="comic-panel lg:col-span-4 bg-[var(--surface-primary)] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-headline uppercase leading-none mb-6 flex items-center border-b-2 border-[var(--pop-black)] pb-2">
              <Smartphone className="mr-2 text-[var(--pop-blue)]" /> DEVICE MIX
            </h2>
            
            {/* Custom Pop Art Bars */}
            <div className="space-y-4">
              {/* Desktop Bar */}
              <div>
                <div className="flex justify-between font-body text-xs font-bold mb-1">
                  <span className="flex items-center"><Tv size={14} className="mr-1" /> DESKTOP ({desktopCount})</span>
                  <span>{desktopPct}%</span>
                </div>
                <div className="w-full h-6 bg-slate-100 dark:bg-zinc-800 border-2 border-[var(--pop-black)] comic-shadow-sm overflow-hidden">
                  <div 
                    className="h-full bg-[var(--pop-blue)] border-r-2 border-[var(--pop-black)]" 
                    style={{ width: `${desktopPct}%` }}
                  />
                </div>
              </div>

              {/* Mobile Bar */}
              <div>
                <div className="flex justify-between font-body text-xs font-bold mb-1">
                  <span className="flex items-center"><Smartphone size={14} className="mr-1" /> MOBILE ({mobileCount})</span>
                  <span>{mobilePct}%</span>
                </div>
                <div className="w-full h-6 bg-slate-100 dark:bg-zinc-800 border-2 border-[var(--pop-black)] comic-shadow-sm overflow-hidden">
                  <div 
                    className="h-full bg-[var(--pop-red)] border-r-2 border-[var(--pop-black)]" 
                    style={{ width: `${mobilePct}%` }}
                  />
                </div>
              </div>

              {/* Tablet Bar */}
              <div>
                <div className="flex justify-between font-body text-xs font-bold mb-1">
                  <span className="flex items-center"><Tablet size={14} className="mr-1" /> TABLET ({tabletCount})</span>
                  <span>{tabletPct}%</span>
                </div>
                <div className="w-full h-6 bg-slate-100 dark:bg-zinc-800 border-2 border-[var(--pop-black)] comic-shadow-sm overflow-hidden">
                  <div 
                    className="h-full bg-[var(--pop-yellow)] border-r-2 border-[var(--pop-black)]" 
                    style={{ width: `${tabletPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-4 mt-4 border-t border-dashed border-gray-300 dark:border-zinc-700 font-body text-xs text-[var(--color-text-muted)] italic text-center">
            Derived from parsing HTTP user-agent header.
          </div>
        </div>
      </div>

      {/* --- Third Row: Referrers & Countries --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* Referrers Panel */}
        <div className="comic-panel bg-[var(--surface-primary)] p-6">
          <h2 className="text-2xl font-headline uppercase leading-none mb-4 flex items-center border-b-2 border-[var(--pop-black)] pb-2">
            <ExternalLink className="mr-2 text-[var(--pop-green)]" /> TRAFFIC ORIGINS
          </h2>
          <div className="space-y-3 font-body font-bold text-sm">
            {topReferrers.map((ref, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <span className="text-[var(--color-text)] truncate max-w-[250px]">{ref.name}</span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-zinc-800 border border-[var(--pop-black)] rounded-full text-xs">
                  {ref.count} views
                </span>
              </div>
            ))}
            {topReferrers.length === 0 && (
              <p className="text-[var(--color-text-muted)] italic text-xs">No referrer data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Countries Panel */}
        <div className="comic-panel bg-[var(--surface-primary)] p-6">
          <h2 className="text-2xl font-headline uppercase leading-none mb-4 flex items-center border-b-2 border-[var(--pop-black)] pb-2">
            <MapPin className="mr-2 text-[var(--pop-pink)]" /> TOP VISITOR GEOGRAPHIES
          </h2>
          <div className="space-y-3 font-body font-bold text-sm">
            {topCountries.map((country, idx) => (
              <div key={idx} className="flex justify-between items-center py-1">
                <span>📍 {country.name}</span>
                <span className="px-3 py-1 bg-[var(--pop-pink)] border border-[var(--pop-black)] text-white rounded text-xs comic-shadow-sm">
                  {country.count} visits
                </span>
              </div>
            ))}
            {topCountries.length === 0 && (
              <p className="text-[var(--color-text-muted)] italic text-xs">No geo data recorded yet (available in production).</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Live Activity Feed --- */}
      <div className="comic-panel bg-[var(--surface-primary)] p-6 mb-8">
        <h2 className="text-2xl font-headline uppercase leading-none mb-4 flex items-center border-b-2 border-[var(--pop-black)] pb-2">
          <Clock className="mr-2 text-[var(--pop-red)]" /> LIVE ACTION FEED
        </h2>
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
          {visits.length === 0 && (
            <p className="font-body text-sm text-[var(--color-text-muted)] italic text-center py-12">
              Waiting for actions... Go visit some pages to log data!
            </p>
          )}
          {visits.slice(0, 15).map((visit, index) => {
            const isVisitBot = visit.is_bot;
            const badgeColor = isVisitBot 
              ? 'bg-[var(--pop-green)] text-[var(--pop-black)]' 
              : visit.device === 'mobile' 
              ? 'bg-[var(--pop-red)] text-white' 
              : 'bg-[var(--pop-blue)] text-white';

            return (
              <div 
                key={index} 
                className={`p-3 border-2 border-[var(--pop-black)] rounded-md comic-shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-2 ${
                  isVisitBot ? 'bg-slate-50 dark:bg-zinc-900 border-dashed opacity-75' : 'bg-[var(--surface-secondary)]'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 font-body text-xs font-bold">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-headline uppercase border border-[var(--pop-black)] ${badgeColor}`}>
                    {isVisitBot ? 'CRAWLER' : visit.device?.toUpperCase() || 'DESKTOP'}
                  </span>
                  
                  <span className="text-[var(--color-text-muted)]">{getRelativeTime(visit.created_at)}</span>
                  
                  <span className="text-[var(--pop-pink)] font-code">
                    {visit.city && visit.country ? `📍 ${visit.city}, ${visit.country}` : visit.country || 'Local/Unknown'}
                  </span>

                  <span className="text-[var(--color-text)]">
                    visited <code className="font-code text-[var(--pop-blue)] font-bold">{visit.path}</code>
                  </span>
                </div>

                <div className="font-body text-[10px] text-[var(--color-text-muted)] flex flex-wrap gap-2">
                  <span>Browser: {visit.browser} ({visit.os})</span>
                  {visit.referrer && (
                    <span className="truncate max-w-[200px]" title={visit.referrer}>
                      Ref: {visit.referrer}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
