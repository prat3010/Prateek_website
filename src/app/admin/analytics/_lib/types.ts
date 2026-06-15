// Analytics type definitions

export interface PageVisit {
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

export interface AggregatedStats {
  totalViews: number;
  totalBots: number;
  uniqueVisitors: number;
  popularPages: { path: string; count: number }[];
  topReferrers: { name: string; count: number }[];
  topCountries: { code: string; name: string; count: number }[];
  desktopCount: number;
  mobileCount: number;
  tabletCount: number;
  desktopPct: number;
  mobilePct: number;
  tabletPct: number;
  dailyViews: { dateStr: string; label: string; count: number }[];
  maxViews: number;
}

export type TimeRange = '24h' | '7d' | '30d' | 'all';
