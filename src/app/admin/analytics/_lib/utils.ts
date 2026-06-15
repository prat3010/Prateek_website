// Utility functions for analytics dashboard

/**
 * Safely decode a URI-encoded string, returning the original on failure.
 */
export function safeDecode(str: string | null): string {
  if (!str) return '';
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

/**
 * Resolve a 2-letter country code to its full display name using Intl.DisplayNames.
 */
export function getCountryName(countryCode: string | null): string {
  if (!countryCode || countryCode === 'Local/Unknown' || countryCode === 'Unknown') return 'Local / Unknown';
  if (countryCode.length > 2) return countryCode;
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(countryCode.toUpperCase()) || countryCode;
  } catch {
    return countryCode;
  }
}

/**
 * Format an ISO timestamp as a human-friendly relative time string.
 */
export function getRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Classify a raw referrer string into a human-friendly source name.
 */
export function classifyReferrer(referrer: string | null): string {
  if (!referrer || referrer === 'Direct' || referrer === '') return 'Direct / Search';

  const refStr = referrer.toLowerCase();
  if (refStr.includes('github.com') || refStr === 'github') return 'GitHub';
  if (refStr.includes('linkedin.com') || refStr === 'linkedin') return 'LinkedIn';
  if (refStr.includes('t.co') || refStr === 'twitter' || refStr === 'x') return 'Twitter / X';
  if (refStr.includes('google')) return 'Google Search';

  try {
    if (referrer.startsWith('http://') || referrer.startsWith('https://')) {
      return new URL(referrer).hostname;
    }
  } catch {
    // Ignore URL parse errors
  }
  return referrer;
}
