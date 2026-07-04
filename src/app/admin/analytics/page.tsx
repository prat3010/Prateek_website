import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import RefreshButton from './RefreshButton';
import { getAnalyticsData } from './_lib/analytics';
import { safeDecode, getCountryName, getRelativeTime } from './_lib/utils';
import type { TimeRange } from './_lib/types';
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
  TrendingUp,
  Calendar,
  Globe,
  Lock,
  EyeOff,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Visitor Analytics | Prateeq Sharma',
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 300; // Cache dashboard queries for 5 minutes (ISR) to optimize database hits

export default async function AnalyticsPage(props: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const searchParams = props?.searchParams ? await props.searchParams : null;
  const range = (searchParams?.range || '7d') as TimeRange;

  // Fetch and aggregate
  const { visits, stats, error } = await getAnalyticsData(range);

  return (
    <div className={styles.dashboardContainer} style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      {/* --- Back to Website Button --- */}
      <div className={styles.backBtnContainer} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/" className={styles.backBtn}>
          <ArrowLeft size={16} /> Return to Portfolio
        </Link>
        <Link href="/terminal" className={styles.backBtn}>
          Terminal Diagnostics
        </Link>
      </div>

      {/* --- Azure Header Banner --- */}
      <div className={`comic-panel ${styles.headerBanner}`}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={`font-headline text-stroke uppercase ${styles.headerTitle}`}>
              Analytics Action Panel!
            </h1>
            <p className={`font-body ${styles.headerSub}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {error ? <ShieldAlert size={14} className={styles.demoIcon} /> : <Database size={14} className={styles.liveIcon} />}
              <span>{error ? 'UNABLE TO FETCH REAL DATA' : 'LIVE VISITOR DATA LINKED SECURELY'}</span>
            </p>
          </div>
          <RefreshButton />
        </div>
      </div>

      {/* --- Timeframe Filter Buttons --- */}
      <div className={styles.filterContainer}>
        {([
          { label: 'Last 24 Hours', value: '24h', icon: Clock },
          { label: 'Last 7 Days', value: '7d', icon: Calendar },
          { label: 'Last 30 Days', value: '30d', icon: TrendingUp },
          { label: 'All Time (2k)', value: 'all', icon: Globe },
        ] as const).map((btn) => {
          const isActive = range === btn.value;
          const Icon = btn.icon;
          return (
            <Link
              key={btn.value}
              href={`/admin/analytics?range=${btn.value}`}
              className={`comic-btn text-xs font-headline ${
                isActive ? `comic-btn-yellow ${styles.activeFilter}` : 'comic-btn-outline'
              }`}
              style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon size={12} />
              <span>{btn.label}</span>
            </Link>
          );
        })}
      </div>

      {/* --- Error state — stop here if data can't be fetched --- */}
      {error && (
        <div className={`comic-panel ${styles.warningAlert}`}>
          <div className={styles.warningIconWrapper}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className={`font-headline ${styles.warningTitle}`}>
              Something&apos;s Not Right!
            </h3>
            <p className={`font-body ${styles.warningDesc}`}>
              Real analytics data could not be fetched. The dashboard cannot display any metrics.
            </p>
            <p className={`font-body ${styles.warningError}`}>
              Error: {error}
            </p>
            <div className={`font-body ${styles.warningSteps}`}>
              <span className={styles.stepBlue}>→ Step 1: Run the table SQL in your Supabase Console</span>
              <span className={styles.stepGreen}>→ Step 2: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local</span>
            </div>
          </div>
        </div>
      )}

      {stats && (
      <>
      {/* --- Privacy & Security Standards Disclaimer --- */}
      <div className={styles.privacyAlert}>
        <div className={styles.privacyIconWrapper}>
          <HelpCircle size={28} />
        </div>
        <div>
          <h3 className={styles.privacyTitle}>
            Privacy & Performance Notes
          </h3>
          <p className={styles.privacyDesc}>
            This analytics panel is public so visitors can inspect the telemetry and aggregation setup. The dashboard keeps the data model narrow and avoids exposing raw visitor details:
          </p>
          <div className={styles.privacyDetails}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} style={{ flexShrink: 0 }} />
              <span><strong>No PII:</strong> IP addresses are salted and hashed locally before saving.</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <EyeOff size={14} style={{ flexShrink: 0 }} />
              <span><strong>Sanitized Referrers:</strong> Traffic source referrers are stored as domain-only hostnames.</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} style={{ flexShrink: 0 }} />
              <span><strong>Cached Queries:</strong> Supabase aggregation queries are cached on the server for 5 minutes.</span>
            </span>
          </div>
        </div>
      </div>

      {/* --- Overview Grid (KPIs) --- */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiCardIconBg}><Eye size={120} /></div>
          <div className={styles.kpiCardContent}>
            <span className={styles.kpiCardLabel}>Page Views</span>
            <h2 className={`${styles.kpiCardValue} ${styles.textRed}`}>{stats.totalViews.toLocaleString()}</h2>
            <p className={styles.kpiCardSubtext}>Accumulated actions</p>
          </div>
          <div className={`${styles.kpiCardBadge} ${styles.bgRed}`}><Eye size={24} /></div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiCardIconBg}><Users size={120} /></div>
          <div className={styles.kpiCardContent}>
            <span className={styles.kpiCardLabel}>Unique Visitors</span>
            <h2 className={`${styles.kpiCardValue} ${styles.textBlue}`}>{stats.uniqueVisitors.toLocaleString()}</h2>
            <p className={styles.kpiCardSubtext}>Based on daily IP hashes</p>
          </div>
          <div className={`${styles.kpiCardBadge} ${styles.bgBlue}`}><Users size={24} /></div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiCardIconBg}><Database size={120} /></div>
          <div className={styles.kpiCardContent}>
            <span className={styles.kpiCardLabel}>Spam & Crawler Hits</span>
            <h2 className={`${styles.kpiCardValue} ${styles.textGreen}`}>{stats.totalBots.toLocaleString()}</h2>
            <p className={styles.kpiCardSubtext}>Filtered search bots</p>
          </div>
          <div className={`${styles.kpiCardBadge} ${styles.bgGreen}`}><Database size={24} /></div>
        </div>
      </div>

      {/* --- Traffic Timeline (Daily Views) --- */}
      <div className={styles.timelineSection}>
        <h2 className={styles.timelineHeader}>
          <TrendingUp style={{ marginRight: '8px', color: 'var(--pop-red)' }} /> Traffic Timeline (Last 14 Days)
        </h2>

        <div className={styles.timelineChart}>
          {stats.dailyViews.map((day, idx) => {
            const heightPct = (day.count / stats.maxViews) * 100;
            return (
              <div key={idx} className={styles.chartColumn}>
                <div className={styles.chartTooltip}>
                  {day.count} views ({day.label})
                </div>
                <div
                  className={styles.chartBar}
                  style={{ height: `${Math.max(heightPct, 3)}%` }}
                >
                  {day.count > 0 && <div className={styles.chartBarStripes} />}
                </div>
                <span className={styles.chartLabel}>{day.label}</span>
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
            <Compass style={{ marginRight: '8px', color: 'var(--pop-red)' }} /> POPULAR DESTINATIONS
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
                {stats.popularPages.map((page, index) => {
                  const percent = Math.round((page.count / (stats.totalViews || 1)) * 100);
                  return (
                    <tr key={index}>
                      <td className={styles.pathCell}>{page.path}</td>
                      <td style={{ textAlign: 'right' }}>{page.count}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={styles.pctBadge}>{percent}%</span>
                      </td>
                    </tr>
                  );
                })}
                {stats.popularPages.length === 0 && (
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
                <Smartphone style={{ marginRight: '8px', color: 'var(--pop-blue)' }} /> DEVICE MIX
              </h2>

              <div className={styles.deviceMixList}>
                <div className={styles.deviceBarWrapper}>
                  <div className={styles.deviceLabelRow}>
                    <span><Tv size={14} style={{ marginRight: '4px' }} /> DESKTOP ({stats.desktopCount})</span>
                    <span>{stats.desktopPct}%</span>
                  </div>
                  <div className={styles.deviceTrack}>
                    <div className={`${styles.deviceFill} ${styles.bgBlue}`} style={{ width: `${stats.desktopPct}%` }} />
                  </div>
                </div>

                <div className={styles.deviceBarWrapper}>
                  <div className={styles.deviceLabelRow}>
                    <span><Smartphone size={14} style={{ marginRight: '4px' }} /> MOBILE ({stats.mobileCount})</span>
                    <span>{stats.mobilePct}%</span>
                  </div>
                  <div className={styles.deviceTrack}>
                    <div className={`${styles.deviceFill} ${styles.bgRed}`} style={{ width: `${stats.mobilePct}%` }} />
                  </div>
                </div>

                <div className={styles.deviceBarWrapper}>
                  <div className={styles.deviceLabelRow}>
                    <span><Tablet size={14} style={{ marginRight: '4px' }} /> TABLET ({stats.tabletCount})</span>
                    <span>{stats.tabletPct}%</span>
                  </div>
                  <div className={styles.deviceTrack}>
                    <div className={`${styles.deviceFill} ${styles.bgYellow}`} style={{ width: `${stats.tabletPct}%` }} />
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
        <div className={styles.panel}>
          <h2 className={styles.panelHeader}>
            <ExternalLink style={{ marginRight: '8px', color: 'var(--pop-green)' }} /> TRAFFIC ORIGINS
          </h2>
          <div className={styles.rowList}>
            {stats.topReferrers.map((ref, idx) => (
              <div key={idx} className={styles.rowItem}>
                <span className={styles.truncateText} title={ref.name}>{ref.name}</span>
                <span className={styles.countBadge}>{ref.count} views</span>
              </div>
            ))}
            {stats.topReferrers.length === 0 && (
              <p className={styles.panelSubtext}>No referrer data recorded yet.</p>
            )}
          </div>
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelHeader}>
            <MapPin style={{ marginRight: '8px', color: 'var(--pop-pink)' }} /> TOP VISITOR GEOGRAPHIES
          </h2>
          <div className={styles.rowList}>
            {stats.topCountries.map((country, idx) => {
              const showCode = country.code && country.code.length === 2 && country.code !== 'Local/Unknown' && country.code !== 'Unknown';
              return (
                <div key={idx} className={styles.rowItem}>
                  <span className={styles.countryRow}>
                    {showCode ? `[${country.code.toUpperCase()}] ` : ''}
                    {country.name}
                  </span>
                  <span className={`${styles.countBadge} ${styles.pinkBadge}`}>
                    {country.count} visits
                  </span>
                </div>
              );
            })}
            {stats.topCountries.length === 0 && (
              <p className={styles.panelSubtext}>No geo data recorded yet (available in production).</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Live Activity Feed --- */}
      <div className={styles.feedSection}>
        <h2 className={styles.panelHeader}>
          <Clock style={{ marginRight: '8px', color: 'var(--pop-red)' }} /> LIVE ACTION FEED
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

                  <span className={styles.geoText} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} />
                    <span>
                      {visit.country && visit.country !== 'Local/Unknown' && visit.country !== 'Unknown'
                        ? `${visit.city ? safeDecode(visit.city) + ', ' : ''}${getCountryName(visit.country)}`
                        : 'Local / Unknown'}
                    </span>
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
      </>)}
    </div>
  );
}
