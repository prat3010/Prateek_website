import outreachDefaults from '@/data/outreach_defaults.json';

export interface RawLeadCandidate {
  lead_name: string;
  company: string;
  role: string;
  email: string | null;
  source_url: string;
  snippet: string;
  intent_source: 'hn_whoishiring' | 'hn_freelance' | 'remoteok';
  lead_type: 'client' | 'job';
  compensation: string | null;
  local_score: number;
  local_reason: string;
}

const FETCH_HEADERS = {
  'User-Agent': 'PrateekOutreachProspector/1.0 (+https://prateeq.in)',
  Accept: 'application/json, text/plain, */*',
};

const BLOCKED_EMAIL_DOMAINS = [
  'example.com',
  'domain.com',
  'ycombinator.com',
  'sentry.io',
  'github.com',
  'remoteok.com',
  'w3.org',
];

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&dollar;/gi, '$')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractRealEmail(text: string): string | null {
  if (!text) return null;

  const isAllowedEmail = (raw: string): boolean => {
    const email = raw.toLowerCase();
    if (email.startsWith('noreply@') || email.startsWith('no-reply@')) return false;
    return !BLOCKED_EMAIL_DOMAINS.some((domain) => email.endsWith(`@${domain}`) || email.includes(`.${domain}`));
  };

  // 1. Check mailto: links in raw HTML first (anchor text often hides the email, e.g. "email us")
  const mailtoMatches = text.match(/mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,10})/gi);
  if (mailtoMatches) {
    for (const m of mailtoMatches) {
      const addr = m.replace(/^mailto:/i, '');
      if (isAllowedEmail(addr)) return addr;
    }
  }

  // 2. Check plain/stripped text for email addresses
  const plain = stripHtml(text);
  const matches = plain.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,10}\b/g);
  if (!matches) return null;

  for (const raw of matches) {
    if (isAllowedEmail(raw)) return raw;
  }
  return null;
}

export function extractApplicationUrl(text: string): string | null {
  if (!text) return null;
  const atsPatterns = [
    /https?:\/\/(?:jobs\.)?lever\.co\/[^\s<>"')]+/i,
    /https?:\/\/(?:boards\.)?greenhouse\.io\/[^\s<>"')]+/i,
    /https?:\/\/jobs\.ashbyhq\.com\/[^\s<>"')]+/i,
    /https?:\/\/(?:apply\.)?[a-zA-Z0-9-]+\.workable\.com\/[^\s<>"')]+/i,
    /https?:\/\/[a-zA-Z0-9-]+\.breezy\.hr\/[^\s<>"')]+/i,
    /https?:\/\/[a-zA-Z0-9-]+\.notion\.site\/[^\s<>"')]+/i,
    /https?:\/\/wellfound\.com\/[^\s<>"')]+/i,
    /https?:\/\/(?:www\.)?ycombinator\.com\/companies\/[^\s<>"')]+/i,
  ];

  // 1. Check raw href="..." attributes first so HN's truncated anchor text ("...") doesn't break ATS links
  const hrefMatches = Array.from(text.matchAll(/href=["']([^"']+)["']/gi)).map((m) =>
    m[1].replace(/&#x2F;/gi, '/').replace(/&amp;/gi, '&')
  );
  for (const href of hrefMatches) {
    for (const pat of atsPatterns) {
      const match = href.match(pat);
      if (match) {
        return match[0].replace(/[.,;)]+$/, '');
      }
    }
  }

  // 2. Fallback to stripped plain text
  const plain = stripHtml(text);
  for (const pat of atsPatterns) {
    const match = plain.match(pat);
    if (match) {
      return match[0].replace(/[.,;)]+$/, '');
    }
  }
  return null;
}

export function extractCompensation(
  text: string,
  structuredMin?: number | null,
  structuredMax?: number | null
): string | null {
  if (structuredMin && structuredMin > 0) {
    const minK = Math.round(structuredMin / 1000);
    if (structuredMax && structuredMax > structuredMin) {
      const maxK = Math.round(structuredMax / 1000);
      return `$${minK}k - $${maxK}k/yr`;
    }
    return `$${minK}k+/yr`;
  }

  if (!text) return null;
  const clean = text.replace(/&dollar;/gi, '$');
  const patterns = [
    /(\$\s*\d{1,3}\s*[kK]\s*(?:-|–|to)\s*(?:\$)?\s*\d{1,3}\s*[kK](?:\s*(?:\/|\s*per\s*)(?:yr|year|annum))?)/i,
    /(\$\s*\d{2,3},\d{3}\s*(?:-|–|to)\s*(?:\$)?\s*\d{2,3},\d{3}(?:\s*(?:\/|\s*per\s*)(?:yr|year|usd))?)/i,
    /(\$\s*\d{1,3}(?:\.\d{2})?\s*(?:-|–|to)\s*(?:\$)?\s*\d{1,3}(?:\.\d{2})?\s*(?:\/|\s*per\s*)(?:hr|hour))/i,
    /(\$\s*\d{1,3}(?:\.\d{2})?\s*(?:\/|\s*per\s*)(?:hr|hour))/i,
    /(\$\s*\d{2,3}\s*[kK](?:\s*(?:\/|\s*per\s*)(?:yr|year))?)/i,
    /((?:₹|INR\s*)\s*\d{1,2}(?:\.\d+)?\s*(?:-|–|to)\s*(?:₹|INR\s*)?\s*\d{1,2}(?:\.\d+)?\s*(?:LPA|Lakhs?|L|Cr))/i,
  ];

  for (const pat of patterns) {
    const m = clean.match(pat);
    if (m) return m[1].replace(/\s+/g, ' ').trim();
  }
  return null;
}

export function isIndiaEligibleRemote(text: string): boolean {
  const low = text.toLowerCase();
  const extraExclusions = [
    'us work authorization',
    'authorized to work in the us',
    'w2 only',
    'c2c only',
    'security clearance',
    'us/canada',
    'us & canada',
    'us and canada',
    'remote (us',
    'remote - us',
    'remote - uk',
    'remote - eu',
  ];
  const exclusions = [...(outreachDefaults.geographicExclusions || []), ...extraExclusions];
  if (exclusions.some((ex) => low.includes(ex.toLowerCase()))) {
    return false;
  }

  const inclusions = [
    ...(outreachDefaults.geographicInclusions || []),
    'async',
    'distributed',
    'work from anywhere',
  ];
  return inclusions.some((inc) => low.includes(inc.toLowerCase()));
}

export function detectLeadType(title: string, description: string): 'client' | 'job' {
  const low = `${title} ${description}`.toLowerCase();
  const freelanceSignals = [
    'freelance',
    'contract',
    'contractor',
    'consultant',
    'consulting',
    'project-based',
    'project based',
    'part-time',
    'hourly',
    'b2b',
    'agency',
    'seeking freelancer',
    'seeking contractor',
    'sow',
  ];
  return freelanceSignals.some((sig) => low.includes(sig)) ? 'client' : 'job';
}

export function scoreCandidateLocally(title: string, description: string): { score: number; reason: string } {
  const low = `${title} ${description}`.toLowerCase();

  const negKeywords = outreachDefaults.negativeTechKeywords || [];
  for (const nk of negKeywords) {
    const escaped = nk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(low)) {
      return { score: 0, reason: `Filtered out negative tech keyword: ${nk}` };
    }
  }

  let score = 0;
  const matched: string[] = [];

  const targetKeywords = outreachDefaults.targetTechKeywords || [];
  for (const kw of targetKeywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(low)) {
      const weight = ['rag', 'pgvector', 'ai agent', 'agentic', 'forward deployed', 'next.js', 'nextjs', 'fastapi'].includes(kw)
        ? 18
        : 10;
      score += weight;
      matched.push(kw);
    }
  }

  if (/\b(founder|cto|founding engineer|forward deployed|solutions architect|ai engineer)\b/i.test(low)) {
    score += 15;
    matched.push('high-intent role');
  }

  if (detectLeadType(title, description) === 'client') {
    score += 15;
    matched.push('contract/freelance');
  }

  if (/\b(worldwide|anywhere|global|india)\b/i.test(low)) {
    score += 10;
  } else if (/\bremote\b/i.test(low)) {
    score += 6;
  }

  const bounded = Math.min(score, 98);
  return {
    score: bounded,
    reason: matched.length ? `Matched: ${matched.slice(0, 4).join(', ')}` : 'General software match',
  };
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchHnWhosHiring(knownUrls: Set<string>): Promise<RawLeadCandidate[]> {
  const results: RawLeadCandidate[] = [];
  const user = await fetchJsonWithTimeout<{ submitted?: number[] }>(
    'https://hacker-news.firebaseio.com/v0/user/whoishiring.json',
    5000
  );
  if (!user?.submitted?.length) return results;

  let threadKids: number[] = [];
  for (const tid of user.submitted.slice(0, 5)) {
    const item = await fetchJsonWithTimeout<{ title?: string; kids?: number[] }>(
      `https://hacker-news.firebaseio.com/v0/item/${tid}.json`,
      4000
    );
    if (item?.title?.toLowerCase().includes('who is hiring') && Array.isArray(item.kids)) {
      threadKids = item.kids.slice(0, 60);
      break;
    }
  }

  if (!threadKids.length) return results;

  const settled = await Promise.allSettled(
    threadKids.map((cid) =>
      fetchJsonWithTimeout<{ id?: number; text?: string; deleted?: boolean; dead?: boolean }>(
        `https://hacker-news.firebaseio.com/v0/item/${cid}.json`,
        4000
      )
    )
  );

  for (const entry of settled) {
    if (entry.status !== 'fulfilled' || !entry.value || entry.value.deleted || entry.value.dead) continue;
    const comment = entry.value;
    if (!comment.id || !comment.text) continue;

    const cleanText = stripHtml(comment.text);
    if (!cleanText || !isIndiaEligibleRemote(cleanText)) continue;

    const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean);
    const firstLine = lines[0] || cleanText.slice(0, 120);
    const parts = firstLine.split('|').map((p) => p.trim()).filter(Boolean);
    const company = (parts[0] || 'HN Startup').slice(0, 100);
    const role = (parts[1] || 'Software / AI Engineer').slice(0, 120);

    const atsUrl = extractApplicationUrl(comment.text);
    const hnUrl = `https://news.ycombinator.com/item?id=${comment.id}`;
    const sourceUrl = atsUrl || hnUrl;

    if (knownUrls.has(sourceUrl) || knownUrls.has(hnUrl)) continue;

    const { score, reason } = scoreCandidateLocally(role, cleanText);
    if (score < 35) continue;

    results.push({
      lead_name: 'Hiring Team',
      company,
      role,
      email: extractRealEmail(comment.text),
      source_url: sourceUrl,
      snippet: cleanText.slice(0, 600),
      intent_source: 'hn_whoishiring',
      lead_type: detectLeadType(role, cleanText),
      compensation: extractCompensation(cleanText),
      local_score: score,
      local_reason: reason,
    });
  }

  return results;
}

export async function fetchHnFreelance(knownUrls: Set<string>): Promise<RawLeadCandidate[]> {
  const results: RawLeadCandidate[] = [];
  const queries = [
    '"seeking freelancer" OR "seeking contractor"',
    '"freelance" ("next.js" OR "nextjs" OR "rag" OR "ai agent")',
  ];

  const seenIds = new Set<string>();

  const settled = await Promise.allSettled(
    queries.map((q) =>
      fetchJsonWithTimeout<{
        hits?: Array<{ objectID?: string; author?: string; comment_text?: string }>;
      }>(`https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=comment&hitsPerPage=15`, 5000)
    )
  );

  for (const entry of settled) {
    if (entry.status !== 'fulfilled' || !entry.value?.hits) continue;
    for (const hit of entry.value.hits) {
      if (!hit.objectID || !hit.comment_text || seenIds.has(hit.objectID)) continue;
      seenIds.add(hit.objectID);

      const cleanText = stripHtml(hit.comment_text);
      if (cleanText.length < 40) continue;

      const atsUrl = extractApplicationUrl(hit.comment_text);
      const hnUrl = `https://news.ycombinator.com/item?id=${hit.objectID}`;
      const sourceUrl = atsUrl || hnUrl;
      if (knownUrls.has(sourceUrl) || knownUrls.has(hnUrl)) continue;

      const { score, reason } = scoreCandidateLocally('Freelance AI / Full-Stack', cleanText);
      if (score < 30) continue;

      const email = extractRealEmail(hit.comment_text);
      results.push({
        lead_name: hit.author || 'HN Poster',
        company: hit.author ? `HN: ${hit.author}` : 'HN Freelance Lead',
        role: 'Freelance / Contract Engineer',
        email,
        source_url: sourceUrl,
        snippet: cleanText.slice(0, 600),
        intent_source: 'hn_freelance',
        lead_type: 'client',
        compensation: extractCompensation(cleanText),
        local_score: score,
        local_reason: reason,
      });
    }
  }

  return results;
}

interface RemoteOkJob {
  company?: string;
  position?: string;
  description?: string;
  url?: string;
  apply_url?: string;
  tags?: string[];
  salary_min?: number;
  salary_max?: number;
  location?: string;
}

export async function fetchRemoteOk(knownUrls: Set<string>): Promise<RawLeadCandidate[]> {
  const results: RawLeadCandidate[] = [];
  const data = await fetchJsonWithTimeout<RemoteOkJob[]>('https://remoteok.com/api', 7000);
  if (!Array.isArray(data) || data.length <= 1) return results;

  for (const job of data.slice(1, 50)) {
    const company = (job.company || '').trim();
    const role = (job.position || '').trim();
    if (!company || !role) continue;

    const cleanDesc = stripHtml(job.description || '');
    const fullText = `${role} ${job.location || ''} ${(job.tags || []).join(' ')} ${cleanDesc}`;
    if (!isIndiaEligibleRemote(fullText)) continue;

    const sourceUrl = (job.apply_url || extractApplicationUrl(job.description || '') || job.url || '').trim();
    if (!sourceUrl || knownUrls.has(sourceUrl)) continue;

    const { score, reason } = scoreCandidateLocally(role, fullText);
    if (score < 35) continue;

    results.push({
      lead_name: 'Hiring Team',
      company,
      role,
      email: extractRealEmail(job.description || ''),
      source_url: sourceUrl,
      snippet: cleanDesc.slice(0, 600),
      intent_source: 'remoteok',
      lead_type: detectLeadType(role, fullText),
      compensation: extractCompensation(cleanDesc, job.salary_min, job.salary_max),
      local_score: score,
      local_reason: reason,
    });
  }

  return results;
}
