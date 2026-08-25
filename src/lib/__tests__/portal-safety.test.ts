import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('ADR 05: ScrollSection Containing Block & <Portal> Safety', () => {
  const componentsDir = path.join(process.cwd(), 'src/components');

  function getTsxFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file === '__tests__') continue;
        results = results.concat(getTsxFiles(filePath));
      } else if (file.endsWith('.tsx') && !file.includes('.test.')) {
        results.push(filePath);
      }
    }
    return results;
  }

  it('verifies that any dialog/modal rendered inside page sections uses <Portal>', () => {
    const allTsx = getTsxFiles(componentsDir);
    const violations: string[] = [];

    const excludedFiles = [
      'Portal.tsx',
      'ScrollSection.tsx',
      'NoirSkyline.tsx',
      'GestureScroll.tsx',
      'Navbar.tsx',
      'ThemeToggle.tsx',
      'AudioControl.tsx',
    ];

    for (const file of allTsx) {
      const fileName = path.basename(file);
      if (excludedFiles.includes(fileName)) continue;

      const content = fs.readFileSync(file, 'utf-8');
      const isModal = /role=['"]dialog['"]|aria-modal=['"]true['"]|Modal|Drawer/i.test(fileName) ||
                      (/className=.*?modal/i.test(content) && /fixed/i.test(content));

      if (isModal) {
        const usesPortal = content.includes('<Portal') || content.includes('createPortal');
        if (!usesPortal) {
          violations.push(path.relative(componentsDir, file));
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
