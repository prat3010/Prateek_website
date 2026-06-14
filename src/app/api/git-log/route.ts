import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

const MOCK_COMMITS = [
  { hash: '7865db1', author: 'Prateek Sharma', date: '3 hours ago', subject: 'fix: force dynamic route rendering to disable cache, and improve navigation tips' },
  { hash: 'f8e84fb', author: 'Prateek Sharma', date: '4 hours ago', subject: 'feat: implement live API-driven ASCII File Explorer under the secret command' },
  { hash: '69abbe9', author: 'Prateek Sharma', date: '1 day ago', subject: 'feat: simplify 3D Gremlins control to mouse-driven tilt and velocity damping' },
  { hash: '408403d', author: 'Prateek Sharma', date: '2 days ago', subject: 'feat: convert Gremlins to bouncing rounded-cubes with squash-and-stretch' },
  { hash: '8798bfd', author: 'Prateek Sharma', date: '3 days ago', subject: 'feat: wake up interactive gargoyle on scroll and apply kinematic flight path' },
  { hash: '561ba08', author: 'Prateek Sharma', date: '4 days ago', subject: 'feat: implement rooftop black cat stroll and Markov-chain behavior' },
  { hash: '3e490fc', author: 'Prateek Sharma', date: '5 days ago', subject: 'feat: add wobbly hand-drawn outline displacement using 2D FBM noise' },
  { hash: 'b12c87f', author: 'Prateek Sharma', date: '6 days ago', subject: 'feat: build comic halftone shader with overlapping offset color plates' },
  { hash: 'a127021', author: 'Prateek Sharma', date: '1 week ago', subject: 'init: bootstrap portfolio website in Next.js v16.2 and custom CSS Modules' }
];

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

      try {
        const { stdout } = await execAsync(`git show --stat --oneline ${commitHash}`);
        return NextResponse.json({ type: 'detail', content: stdout });
      } catch {
        // Fallback if git is not installed or git show fails
        const mock = MOCK_COMMITS.find(c => c.hash === commitHash.slice(0, 7));
        if (mock) {
          const mockDetail = `commit ${commitHash}e84fbf76329a1b5c1a84f3e8b0a9dfd10a6b14
Author: ${mock.author} <prateek@dev.com>
Date:   ${mock.date}

    ${mock.subject}

 src/components/effects/ThreeGremlinParade.tsx | 15 ++++++++++-----
 1 file changed, 10 insertions(+), 5 deletions(-)`;
          return NextResponse.json({ type: 'detail', content: mockDetail });
        }
        return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
      }
    }

    // Default: return recent commit history list
    try {
      const { stdout } = await execAsync('git log -n 10 --pretty=format:"%h|%an|%ar|%s"');
      const lines = stdout.trim().split('\n');
      const commits = lines.map(line => {
        const [hash, author, date, subject] = line.split('|');
        return { hash, author, date, subject };
      });
      return NextResponse.json({ type: 'list', commits });
    } catch {
      // Return whitelisted mock commits as fallback
      return NextResponse.json({ type: 'list', commits: MOCK_COMMITS });
    }

  } catch {
    return NextResponse.json({ error: 'Failed to retrieve git log' }, { status: 500 });
  }
}
