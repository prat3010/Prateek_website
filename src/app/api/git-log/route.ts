import { NextResponse } from 'next/server';
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

    // If query contains a commit hash, show details for that commit
    if (commitHash) {
      // Validate commit hash format to prevent shell injection (alphanumeric, 7 to 40 chars)
      if (!/^[a-f0-9]{7,40}$/.test(commitHash)) {
        return NextResponse.json({ error: 'Invalid commit hash format' }, { status: 400 });
      }

      const commits = readGeneratedCommits();
      const match = commits.find(c => c.hash === commitHash || commitHash.startsWith(c.hash));
      if (!match) {
        return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
      }

      const detail = [
        `commit ${match.hash}`,
        `Author: ${match.author}`,
        `Date:   ${match.date}`,
        '',
        `    ${match.subject}`,
        '',
        'Detailed file stats are not available from the public runtime route.',
        'Regenerate src/data/git-log.json at build time to refresh this commit journal.'
      ].join('\n');

      return NextResponse.json({ type: 'detail', content: detail });
    }

    // Default: return recent commit history list
    const commits = readGeneratedCommits();
    if (commits.length > 0) {
      return NextResponse.json({ type: 'list', commits });
    }

    return NextResponse.json({ type: 'list', commits: MOCK_COMMITS });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve git log' }, { status: 500 });
  }
}
