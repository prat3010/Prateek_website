import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Whitelist of allowed top-level items to prevent arbitrary file reading
const ALLOWED_ROOT_ITEMS = ['src', 'public', 'package.json', 'readme.md'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get('path') || '';

    // Sanitize path inputs: remove leading/trailing slashes, replace backslashes
    const targetPath = rawPath.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\\+/g, '/').trim();

    // Prevent directory traversal attacks
    if (
      targetPath.includes('..') ||
      targetPath.startsWith('/') ||
      path.isAbsolute(targetPath)
    ) {
      return NextResponse.json({ error: 'Access denied: Directory traversal blocked' }, { status: 403 });
    }

    const projectRoot = process.cwd();
    const fullPath = path.join(/*turbopackIgnore: true*/ projectRoot, targetPath);

    // Verify path sits inside the workspace root directory
    const relative = path.relative(projectRoot, fullPath);
    const isInsideRoot = !relative.startsWith('..') && !path.isAbsolute(relative);

    if (!isInsideRoot && targetPath !== '') {
      return NextResponse.json({ error: 'Access denied: Path outside root' }, { status: 403 });
    }

    // Verify whitelisted items at root level
    if (targetPath !== '') {
      const topLevelFolder = targetPath.split('/')[0].toLowerCase();
      if (!ALLOWED_ROOT_ITEMS.includes(topLevelFolder)) {
        return NextResponse.json({ error: 'Access denied: Restricted directory' }, { status: 403 });
      }
    }

    const stat = await fs.stat(fullPath);

    // If target is a file, verify if contents are allowed to be read
    if (stat.isFile()) {
      const fileName = path.basename(fullPath).toLowerCase();
      if (fileName === 'package.json' || fileName === 'readme.md') {
        const content = await fs.readFile(fullPath, 'utf-8');
        return NextResponse.json({
          type: 'file',
          name: path.basename(fullPath),
          content: content,
        });
      } else {
        return NextResponse.json({
          type: 'file',
          name: path.basename(fullPath),
          size: stat.size,
          msg: 'Source code preview disabled for security reasons.',
        });
      }
    }

    // If target is a directory, read and filter its contents
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    let items = entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
    }));

    if (targetPath === '') {
      // Root level filters
      items = items.filter((item) => ALLOWED_ROOT_ITEMS.includes(item.name.toLowerCase()));
    } else {
      // Exclude hidden OS metadata files
      items = items.filter((item) => !item.name.startsWith('.'));
    }

    // Sort: directories first, then files alphabetically
    items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      type: 'directory',
      path: targetPath || 'root',
      contents: items,
    });
  } catch {
    return NextResponse.json({ error: 'Path not found' }, { status: 404 });
  }
}
