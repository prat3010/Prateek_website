import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MOCK_COMMITS = [
  { hash: '7865db1', author: 'Prateeq Sharma', date: '3 hours ago', subject: 'fix: force dynamic route rendering to disable cache, and improve navigation tips' },
  { hash: 'f8e84fb', author: 'Prateeq Sharma', date: '4 hours ago', subject: 'feat: implement live API-driven ASCII File Explorer under the secret command' },
  { hash: '69abbe9', author: 'Prateeq Sharma', date: '1 day ago', subject: 'feat: add tail sway and head bob animations to Pizza Rat' },
  { hash: '408403d', author: 'Prateeq Sharma', date: '2 days ago', subject: 'feat: replace gremlins with detailed Pizza Rat easter egg' },
  { hash: '8798bfd', author: 'Prateeq Sharma', date: '3 days ago', subject: 'feat: wake up interactive gargoyle on scroll and apply kinematic flight path' },
  { hash: '561ba08', author: 'Prateeq Sharma', date: '4 days ago', subject: 'feat: implement rooftop black cat stroll and Markov-chain behavior' },
  { hash: '3e490fc', author: 'Prateeq Sharma', date: '5 days ago', subject: 'feat: add wobbly hand-drawn outline displacement using 2D FBM noise' },
  { hash: 'b12c87f', author: 'Prateeq Sharma', date: '6 days ago', subject: 'feat: build comic halftone shader with overlapping offset color plates' },
  { hash: 'a127021', author: 'Prateeq Sharma', date: '1 week ago', subject: 'init: bootstrap portfolio website in Next.js v16.2 and custom CSS Modules' }
];

interface GitCommit {
  hash: string;
  author: string;
  date: string;
  subject: string;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const secs = Math.floor(diffMs / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (mins > 0) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    return `${secs} sec${secs > 1 ? 's' : ''} ago`;
  } catch {
    return dateStr;
  }
}

function getGitHubToken(): string | null {
  return process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || process.env.GH_TOKEN || null;
}

function getGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'PrateekWebsite-Terminal/1.0',
  };
  const token = getGitHubToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchGitHubCommits(owner: string, repo: string): Promise<GitCommit[] | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`, {
      headers: getGitHubHeaders(),
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;

    return data.map((item: { sha?: string; commit?: { author?: { name?: string; date?: string }; message?: string }; author?: { login?: string } }) => ({
      hash: item.sha?.slice(0, 7) || '',
      author: item.commit?.author?.name || item.author?.login || 'Unknown',
      date: item.commit?.author?.date ? formatRelativeTime(item.commit.author.date) : 'Recently',
      subject: item.commit?.message?.split('\n')[0] || ''
    })).filter((c: GitCommit) => Boolean(c.hash && c.subject));
  } catch {
    return null;
  }
}

async function fetchGitHubCommitDetail(owner: string, repo: string, commitHash: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`, {
      headers: getGitHubHeaders(),
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    const data = await res.json();

    const sha = data.sha || commitHash;
    const author = data.commit?.author?.name || 'Unknown';
    const email = data.commit?.author?.email ? `<${data.commit.author.email}>` : '';
    const date = data.commit?.author?.date || '';
    const message = data.commit?.message || '';
    const stats = data.stats || { total: 0, additions: 0, deletions: 0 };
    const files = Array.isArray(data.files) ? data.files : [];

    const fileList = files.slice(0, 10).map((f: { filename: string; additions: number; deletions: number }) => `  - ${f.filename} (+${f.additions}, -${f.deletions})`).join('\n');
    const extraFiles = files.length > 10 ? `\n  ...and ${files.length - 10} more file(s)` : '';

    return [
      `commit ${sha}`,
      `Author: ${author} ${email}`.trim(),
      `Date:   ${date}`,
      `Repository: ${owner}/${repo}`,
      '',
      ...message.split('\n').map((l: string) => `    ${l}`),
      '',
      `Stats: ${files.length} file(s) changed (+${stats.additions}, -${stats.deletions})`,
      fileList ? `Files:\n${fileList}${extraFiles}` : ''
    ].filter(Boolean).join('\n');
  } catch {
    return null;
  }
}

function readLocalDevCommits(): GitCommit[] {
  if (process.env.NODE_ENV !== 'development') return [];
  try {
    const stdout = execSync('git log -n 10 --pretty=format:"%h|%an|%ar|%s"', { timeout: 3000 }).toString();
    const commits = stdout.trim().split('\n').map((line: string) => {
      const [hash, author, date, subject] = line.split('|');
      return { hash, author, date, subject };
    });
    return commits.filter((c: GitCommit) => Boolean(c.hash && c.subject));
  } catch {
    return [];
  }
}

function readLocalDevCommitDetail(sha: string): string | null {
  if (process.env.NODE_ENV !== 'development') return null;
  try {
    const stdout = execSync(`git show --stat --oneline ${sha}`, { timeout: 3000 }).toString();
    return stdout.trim();
  } catch {
    return null;
  }
}

function readGeneratedCommits(): GitCommit[] {
  try {
    const jsonPath = path.join(process.cwd(), 'src/data/git-log.json');
    if (!fs.existsSync(jsonPath)) {
      return [];
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const commits = JSON.parse(fileContent);
    if (!Array.isArray(commits)) {
      return [];
    }

    return commits.filter((commit): commit is GitCommit => (
      typeof commit?.hash === 'string' &&
      typeof commit?.author === 'string' &&
      typeof commit?.date === 'string' &&
      typeof commit?.subject === 'string'
    ));
  } catch (err) {
    console.warn('Failed to read pre-built git-log.json:', err);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const commitHash = searchParams.get('commit') || '';
    const rawRepo = searchParams.get('repo') || 'prat3010/Prateek_website';
    const repoMatch = rawRepo.match(/^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/);
    const owner = repoMatch ? repoMatch[1] : 'prat3010';
    const repo = repoMatch ? repoMatch[2] : 'Prateek_website';
    const repoPath = `${owner}/${repo}`;

    // If query contains a commit hash, show details for that commit
    if (commitHash) {
      if (!/^[a-f0-9]{7,40}$/i.test(commitHash)) {
        return NextResponse.json({ error: 'Invalid commit hash format' }, { status: 400 });
      }

      // Tier 1: Try GitHub REST API
      const ghDetail = await fetchGitHubCommitDetail(owner, repo, commitHash);
      if (ghDetail) {
        return NextResponse.json({ type: 'detail', repo: repoPath, content: ghDetail });
      }

      // Tier 2: Try Local Git (Dev Mode)
      const localDetail = readLocalDevCommitDetail(commitHash);
      if (localDetail) {
        return NextResponse.json({ type: 'detail', repo: repoPath, content: localDetail });
      }

      // Tier 3: Try Pre-built JSON Snapshot
      const commits = readGeneratedCommits();
      const match = commits.find(c => c.hash === commitHash || c.hash.startsWith(commitHash) || commitHash.startsWith(c.hash));
      if (match) {
        const detail = [
          `commit ${match.hash}`,
          `Author: ${match.author}`,
          `Date:   ${match.date}`,
          `Repository: ${repoPath}`,
          '',
          `    ${match.subject}`,
          '',
          'Detailed file stats are retrieved live via GitHub API or local repository in dev mode.'
        ].join('\n');
        return NextResponse.json({ type: 'detail', repo: repoPath, content: detail });
      }

      return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
    }

    // Default: return recent commit history list
    // Tier 1: Try GitHub REST API
    const ghCommits = await fetchGitHubCommits(owner, repo);
    if (ghCommits && ghCommits.length > 0) {
      return NextResponse.json({ type: 'list', repo: repoPath, commits: ghCommits });
    }

    // Tier 2: Try Local Git (Dev Mode)
    const localCommits = readLocalDevCommits();
    if (localCommits.length > 0) {
      return NextResponse.json({ type: 'list', repo: repoPath, commits: localCommits });
    }

    // Tier 3: Try Pre-built JSON Snapshot
    const jsonCommits = readGeneratedCommits();
    if (jsonCommits.length > 0) {
      return NextResponse.json({ type: 'list', repo: repoPath, commits: jsonCommits });
    }

    // Tier 4: Fallback to Mock Commits
    return NextResponse.json({ type: 'list', repo: repoPath, commits: MOCK_COMMITS });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve git log' }, { status: 500 });
  }
}

