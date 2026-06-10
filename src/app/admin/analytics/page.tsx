import React from 'react';
import Link from 'next/link';
import { supabase } from '@/data/supabase';
import RefreshButton from './RefreshButton';
import styles from './analytics.module.css';
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
  Database,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';

export const revalidate = 300; // Cache dashboard queries for 5 minutes (ISR) to optimize database hits

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
  
  for (let i = 0; i < 250; i++) { // Increased count for better timeline filtering
    const date = new Date(now.getTime() - Math.floor(Math.random() * 32 * 24 * 60 * 60 * 1000)); // last 32 days
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

const safeDecode = (str: string | null) => {
  if (!str) return '';
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

// Helper to get flag emoji programmatically
const getFlagEmoji = (countryCode: string | null): string => {
  if (!countryCode || countryCode === 'Local/Unknown' || countryCode === 'Unknown') return '🌐';
  if (countryCode.length === 2) {
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  }
  // Fallback map for mock data full country names
  const mockFlags: Record<string, string> = {
    'United States': '🇺🇸',
    'India': '🇮🇳',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'Canada': '🇨🇦',
    'Singapore': '🇸🇬',
    'Australia': '🇦🇺',
  };
  return mockFlags[countryCode] || '🌐';
};

// Helper to get full country name using Intl.DisplayNames
const getCountryName = (countryCode: string | null): string => {
  if (!countryCode || countryCode === 'Local/Unknown' || countryCode === 'Unknown') return 'Local / Unknown';
  if (countryCode.length > 2) return countryCode;
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode.toUpperCase()) || countryCode;
  } catch {
    return countryCode;
  }
};

export default async function AnalyticsPage(props: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const searchParams = props?.searchParams ? await props.searchParams : null;
  const range = searchParams?.range || '7d';
  let isDemoMode = false;
  let visits: PageVisit[] = [];
  let errorMsg = '';

  // Get timeframe filter dates
  let daysLimit = 7;
  if (range === '24h') daysLimit = 1;
  else if (range === '30d') daysLimit = 30;
  else if (range === 'all') daysLimit = 365;

  const cutoffDateStr = new Date(
    // eslint-disable-next-line react-hooks/purity
    Date.now() - daysLimit * 24 * 60 * 60 * 1000
  ).toISOString();

  if (!supabase) {
    isDemoMode = true;
    visits = getMockData();
  } else {
    try {
      let query = supabase.from('page_visits').select('*');
      
      if (range !== 'all') {
        query = query.gte('created_at', cutoffDateStr);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(2000); // Pull up to last 2000 rows for in-memory analysis

      if (error) {
        throw error;
      }
      visits = data || [];
    } catch (e: unknown) {
      isDemoMode = true;
      errorMsg = e instanceof Error ? e.message : 'Failed to fetch data';
      visits = getMockData();
    }
  }

  // Filter in-memory if in Demo Mode (mock data generated locally)
  if (isDemoMode) {
    // eslint-disable-next-line react-hooks/purity
    const cutoffTime = Date.now() - daysLimit * 24 * 60 * 60 * 1000;
    visits = visits.filter(v => new Date(v.created_at).getTime() >= cutoffTime);
  }

  // --- Aggregate Stats ---
  let totalViews = 0;
  let totalBots = 0;
  const uniqueIps = new Set<string>();
  const pathCounts: Record<string, number> = {};
  const referrerCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  let mobileCount = 0;
  let desktopCount = 0;
  let tabletCount = 0;

  // Daily views for the timeline chart (last 14 days)
  const dailyViews: { dateStr: string; label: string; count: number }[] = [];
  const today = new Date();
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Label format e.g. "Jun 1"
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyViews.push({ dateStr, label, count: 0 });
  }

  // Create a map for O(1) daily lookup
  const dailyViewsMap: Record<string, typeof dailyViews[0]> = {};
  dailyViews.forEach(day => {
    dailyViewsMap[day.dateStr] = day;
  });

  // Perform in-memory aggregation in a single optimized pass
  visits.forEach(v => {
    if (v.is_bot) {
      totalBots++;
    } else {
      totalViews++;
      if (v.ip_hash) {
        uniqueIps.add(v.ip_hash);
      }

      // 1. Popular Pages count
      pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;

      // 2. Referrers count
      let cleanRef = 'Direct / Search';
      if (v.referrer && v.referrer !== 'Direct' && v.referrer !== '') {
        const refStr = v.referrer.toLowerCase();
        if (refStr.includes('github.com') || refStr === 'github') cleanRef = 'GitHub';
        else if (refStr.includes('linkedin.com') || refStr === 'linkedin') cleanRef = 'LinkedIn';
        else if (refStr.includes('t.co') || refStr === 'twitter' || refStr === 'x') cleanRef = 'Twitter / X';
        else if (refStr.includes('google')) cleanRef = 'Google Search';
        else {
          try {
            if (v.referrer.startsWith('http://') || v.referrer.startsWith('https://')) {
              const url = new URL(v.referrer);
              cleanRef = url.hostname;
            } else {
              cleanRef = v.referrer;
            }
          } catch {
            cleanRef = v.referrer;
          }
        }
      }
      referrerCounts[cleanRef] = (referrerCounts[cleanRef] || 0) + 1;

      // 3. Geolocation count
      const c = v.country || 'Unknown';
      if (c !== 'Local/Unknown') {
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      }

      // 4. Device Breakdown count
      if (v.device === 'mobile') mobileCount++;
      else if (v.device === 'tablet') tabletCount++;
      else desktopCount++;

      // 5. Daily views timeline count
      try {
        const vDateStr = new Date(v.created_at).toISOString().split('T')[0];
        const dayEntry = dailyViewsMap[vDateStr];
        if (dayEntry) {
          dayEntry.count++;
        }
      } catch {
        // Ignore parsing errors for malformed dates
      }
    }
  });

  const uniqueVisitors = uniqueIps.size;

  // Process sorted lists from aggregated values
  const popularPages = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topReferrers = Object.entries(referrerCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topCountries = Object.entries(countryCounts)
    .map(([code, count]) => ({
      code,
      name: getCountryName(code),
      flag: getFlagEmoji(code),
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const totalDeviceVisits = mobileCount + desktopCount + tabletCount || 1;
  const desktopPct = Math.round((desktopCount / totalDeviceVisits) * 100);
  const mobilePct = Math.round((mobileCount / totalDeviceVisits) * 100);
  const tabletPct = Math.round((tabletCount / totalDeviceVisits) * 100);

  const maxViews = Math.max(...dailyViews.map(d => d.count), 1);

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
    <div className={styles.dashboardContainer} style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      {/* --- Back to Website Button --- */}
      <div className={styles.backBtnContainer}>
        <Link 
          href="/" 
          className={styles.backBtn}
        >
          <ArrowLeft size={16} /> Return to Portfolio
        </Link>
      </div>

      {/* --- Azure Header Banner --- */}
      <div className={`comic-panel ${styles.headerBanner}`}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={`font-headline text-stroke uppercase ${styles.headerTitle}`}>
              Analytics Action Panel!
            </h1>
            <p className={`font-body ${styles.headerSub}`}>
              {isDemoMode ? '⚡ SYSTEM IN DEMO MODE (SHOWING SIMULATED METRICS)' : '🔌 LIVE VISITOR DATA LINKED SECURELY'}
            </p>
          </div>
          <RefreshButton />
        </div>
      </div>

      {/* --- Timeframe Filter Buttons --- */}
      <div className={styles.filterContainer}>
        {[
          { label: '🕒 Last 24 Hours', value: '24h' },
          { label: '📅 Last 7 Days', value: '7d' },
          { label: '📊 Last 30 Days', value: '30d' },
          { label: '🌐 All Time (2k)', value: 'all' },
        ].map((btn) => {
          const isActive = range === btn.value;
          return (
            <Link
              key={btn.value}
              href={`/admin/analytics?range=${btn.value}`}
              className={`comic-btn text-xs font-headline ${
                isActive ? `comic-btn-yellow ${styles.activeFilter}` : 'comic-btn-outline'
              }`}
              style={{ padding: '6px 12px' }}
            >
              {btn.label}
            </Link>
          );
        })}
      </div>

      {/* --- Alert configuration box if in demo mode --- */}
      {isDemoMode && (
        <div className={`comic-panel ${styles.warningAlert}`}>
          <div className={styles.warningIconWrapper}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className={`font-headline ${styles.warningTitle}`}>
              Supabase Configuration Missing!
            </h3>
            {errorMsg ? (
              <p className={`font-body ${styles.warningError}`}>
                Database Error: {errorMsg}
              </p>
            ) : (
              <p className={`font-body ${styles.warningDesc}`}>
                The database keys are not configured in your <code className={`font-code ${styles.warningCode}`}>.env.local</code>. We are displaying mock data so you can test the UI layout.
              </p>
            )}
            <div className={`font-body ${styles.warningSteps}`}>
              <span className={styles.stepBlue}>👉 Step 1: Run table SQL in your Supabase Console</span>
              <span className={styles.stepGreen}>👉 Step 2: Set keys in .env.local to go Live!</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Privacy & Security Standards Disclaimer --- */}
      <div className={styles.privacyAlert}>
        <div className={styles.privacyIconWrapper}>
          <HelpCircle size={28} />
        </div>
        <div>
          <h3 className={styles.privacyTitle}>
            Privacy & Performance Protection Active!
          </h3>
          <p className={styles.privacyDesc}>
            This analytics panel is public so visitors can inspect our custom-built telemetry and database aggregation logic. To ensure absolute compliance with global privacy regulations and optimize hosting overhead, the following safeguards are implemented:
          </p>
          <div className={styles.privacyDetails}>
            <span>🔒 <strong>No PII:</strong> IP addresses are salted and hashed locally with a daily rotating salt before saving.</span>
            <span>🕵️ <strong>Sanitized Referrers:</strong> All traffic source referrers are parsed and stored as domain-only hostnames to prevent private URL/path leakage.</span>
            <span>⚡ <strong>Cached Queries:</strong> Supabase aggregation queries are cached on the server for 5 minutes (via ISR) to prevent database resource exhaustion.</span>
          </div>
        </div>
      </div>

      {/* --- Overview Grid (KPIs) --- */}
      <div className={styles.kpiGrid}>
        {/* KPI: Pageviews */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardIconBg}>
            <Eye size={120} />
          </div>
          <div className={styles.kpiCardContent}>
            <span className={styles.kpiCardLabel}>Page Views</span>
            <h2 className={`${styles.kpiCardValue} ${styles.textRed}`}>
              {totalViews.toLocaleString()}
            </h2>
            <p className={styles.kpiCardSubtext}>
              Accumulated actions
            </p>
          </div>
          <div className={`${styles.kpiCardBadge} ${styles.bgRed}`}>
            <Eye size={24} />
          </div>
        </div>

        {/* KPI: Unique Visitors */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardIconBg}>
            <Users size={120} />
          </div>
          <div className={styles.kpiCardContent}>
            <span className={styles.kpiCardLabel}>Unique Visitors</span>
            <h2 className={`${styles.kpiCardValue} ${styles.textBlue}`}>
              {uniqueVisitors.toLocaleString()}
            </h2>
            <p className={styles.kpiCardSubtext}>
              Based on daily IP hashes
            </p>
          </div>
          <div className={`${styles.kpiCardBadge} ${styles.bgBlue}`}>
            <Users size={24} />
          </div>
        </div>

        {/* KPI: Bot Traffic */}
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardIconBg}>
            <Database size={120} />
          </div>
          <div className={styles.kpiCardContent}>
            <span className={styles.kpiCardLabel}>Spam & Crawler Hits</span>
            <h2 className={`${styles.kpiCardValue} ${styles.textGreen}`}>
              {totalBots.toLocaleString()}
            </h2>
            <p className={styles.kpiCardSubtext}>
              Filtered search bots
            </p>
          </div>
          <div className={`${styles.kpiCardBadge} ${styles.bgGreen}`}>
            <Database size={24} />
          </div>
        </div>
      </div>

      {/* --- Traffic Timeline (Daily Views) --- */}
      <div className={styles.timelineSection}>
        <h2 className={styles.timelineHeader}>
          <TrendingUp className="mr-2 text-[var(--pop-red)]" /> Traffic Timeline (Last 14 Days)
        </h2>
        
        <div className={styles.timelineChart}>
          {dailyViews.map((day, idx) => {
            const heightPct = (day.count / maxViews) * 100;
            return (
              <div key={idx} className={styles.chartColumn}>
                {/* Tooltip on Hover */}
                <div className={styles.chartTooltip}>
                  {day.count} views ({day.label})
                </div>
                
                {/* Bar */}
                <div 
                  className={styles.chartBar}
                  style={{ height: `${Math.max(heightPct, 3)}%` }}
                >
                  {day.count > 0 && <div className={styles.chartBarStripes} />}
                </div>
                
                {/* Label */}
                <span className={styles.chartLabel}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className={styles.chartSpacer} />
      </div>

      {/* --- Second Row: Pages and Devices --- */}
      <div className={styles.layoutGrid}>
        
        {/* Popular Pages Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelHeader}>
            <Compass className="mr-2 text-[var(--pop-red)]" /> POPULAR DESTINATIONS
          </h2>
          <div className={styles.tableContainer}>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>PAGE PATH</th>
                  <th style={{ textAlign: 'right' }}>VIEWS</th>
                  <th style={{ textAlign: 'right' }}>PERCENTAGE</th>
                </tr>
              </thead>
              <tbody className={styles.analyticsTable}>
                {popularPages.map((page, index) => {
                  const percent = Math.round((page.count / (totalViews || 1)) * 100);
                  return (
                    <tr key={index}>
                      <td className={styles.pathCell}>{page.path}</td>
                      <td style={{ textAlign: 'right' }}>{page.count}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={styles.pctBadge}>
                          {percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {popularPages.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      No page views recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Devices Panel */}
        <div className={styles.panel}>
          <div className={styles.devicesFlex}>
            <div>
              <h2 className={styles.panelHeader}>
                <Smartphone className="mr-2 text-[var(--pop-blue)]" /> DEVICE MIX
              </h2>
              
              <div className={styles.deviceMixList}>
                {/* Desktop Bar */}
                <div className={styles.deviceBarWrapper}>
                  <div className={styles.deviceLabelRow}>
                    <span><Tv size={14} style={{ marginRight: '4px' }} /> DESKTOP ({desktopCount})</span>
                    <span>{desktopPct}%</span>
                  </div>
                  <div className={styles.deviceTrack}>
                    <div 
                      className={`${styles.deviceFill} ${styles.bgBlue}`}
                      style={{ width: `${desktopPct}%` }}
                    />
                  </div>
                </div>

                {/* Mobile Bar */}
                <div className={styles.deviceBarWrapper}>
                  <div className={styles.deviceLabelRow}>
                    <span><Smartphone size={14} style={{ marginRight: '4px' }} /> MOBILE ({mobileCount})</span>
                    <span>{mobilePct}%</span>
                  </div>
                  <div className={styles.deviceTrack}>
                    <div 
                      className={`${styles.deviceFill} ${styles.bgRed}`} 
                      style={{ width: `${mobilePct}%` }}
                    />
                  </div>
                </div>

                {/* Tablet Bar */}
                <div className={styles.deviceBarWrapper}>
                  <div className={styles.deviceLabelRow}>
                    <span><Tablet size={14} style={{ marginRight: '4px' }} /> TABLET ({tabletCount})</span>
                    <span>{tabletPct}%</span>
                  </div>
                  <div className={styles.deviceTrack}>
                    <div 
                      className={`${styles.deviceFill} ${styles.bgYellow}`} 
                      style={{ width: `${tabletPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.devicesPanelFooter}>
              Derived from parsing HTTP user-agent header.
            </div>
          </div>
        </div>
      </div>

      {/* --- Third Row: Referrers & Countries --- */}
      <div className={styles.halfGrid}>
        
        {/* Referrers Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelHeader}>
            <ExternalLink className="mr-2 text-[var(--pop-green)]" /> TRAFFIC ORIGINS
          </h2>
          <div className={styles.rowList}>
            {topReferrers.map((ref, idx) => (
              <div key={idx} className={styles.rowItem}>
                <span className={styles.truncateText} title={ref.name}>{ref.name}</span>
                <span className={styles.countBadge}>
                  {ref.count} views
                </span>
              </div>
            ))}
            {topReferrers.length === 0 && (
              <p className={styles.panelSubtext}>No referrer data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Countries Panel */}
        <div className={styles.panel}>
          <h2 className={styles.panelHeader}>
            <MapPin className="mr-2 text-[var(--pop-pink)]" /> TOP VISITOR GEOGRAPHIES
          </h2>
          <div className={styles.rowList}>
            {topCountries.map((country, idx) => (
              <div key={idx} className={styles.rowItem}>
                <span className={styles.countryRow}>{country.flag} {country.name}</span>
                <span className={`${styles.countBadge} ${styles.pinkBadge}`}>
                  {country.count} visits
                </span>
              </div>
            ))}
            {topCountries.length === 0 && (
              <p className={styles.panelSubtext}>No geo data recorded yet (available in production).</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Live Activity Feed --- */}
      <div className={styles.feedSection}>
        <h2 className={styles.panelHeader}>
          <Clock className="mr-2 text-[var(--pop-red)]" /> LIVE ACTION FEED
        </h2>
        <div className={styles.feedList}>
          {visits.length === 0 && (
            <p style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '14px' }}>
              Waiting for actions... Go visit some pages to log data!
            </p>
          )}
          {visits.slice(0, 20).map((visit, index) => {
            const isVisitBot = visit.is_bot;
            const badgeClass = isVisitBot 
              ? styles.badgeCrawler 
              : visit.device === 'mobile' 
              ? styles.badgeMobile 
              : visit.device === 'tablet'
              ? styles.badgeTablet
              : styles.badgeDesktop;

            return (
              <div 
                key={index} 
                className={`${styles.feedItem} ${isVisitBot ? styles.feedItemBot : ''}`}
              >
                <div className={styles.feedRowPrimary}>
                  <span className={`${styles.badge} ${badgeClass}`}>
                    {isVisitBot ? 'CRAWLER' : visit.device?.toUpperCase() || 'DESKTOP'}
                  </span>
                  
                  <span className={styles.timeText}>{getRelativeTime(visit.created_at)}</span>
                  
                  <span className={styles.geoText}>
                    {visit.country && visit.country !== 'Local/Unknown' && visit.country !== 'Unknown'
                      ? `📍 ${getFlagEmoji(visit.country)} ${visit.city ? safeDecode(visit.city) + ', ' : ''}${getCountryName(visit.country)}`
                      : '📍 Local / Unknown'}
                  </span>

                  <span>
                    visited <code className={styles.pathCode}>{visit.path}</code>
                  </span>
                </div>

                <div className={styles.feedRowSecondary}>
                  <span>Browser: {visit.browser} ({visit.os})</span>
                  {visit.referrer && (
                    <span className={styles.refText} title={visit.referrer}>
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
