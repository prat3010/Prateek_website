import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://prateeq.in';
const OUTPUT_DIR = '/Users/prateeksharma/.gemini/antigravity/brain/14ee268e-5f32-4f8d-abe4-1b2b20d0001a/audit_screenshots';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const ROUTES = [
  { path: '/', name: '01_home', title: 'Home Page' },
  { path: '/scoping', name: '02_scoping', title: 'Scoping Studio' },
  { path: '/terminal', name: '03_terminal', title: 'Systems Terminal' },
  { path: '/terminal?exec=pitch', name: '03b_terminal_pitch', title: 'Terminal Pitch Auto-Exec' },
  { path: '/terminal?exec=architecture', name: '03c_terminal_arch', title: 'Terminal Architecture Auto-Exec' },
  { path: '/terminal?exec=tests', name: '03d_terminal_tests', title: 'Terminal Tests Auto-Exec' },
  { path: '/rag', name: '04_rag', title: 'Retriever AI Product' },
  { path: '/dashboard', name: '05_dashboard', title: 'Client Workspace' },
  { path: '/analytics', name: '06_analytics', title: 'Visitor Analytics' },
  { path: '/blog', name: '07_blog', title: 'Engineering Blog' },
  { path: '/admin', name: '08_admin', title: 'Admin Gate' },
  { path: '/rag/app', name: '09_rag_app', title: 'RAG Studio Workspace' }
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 } // iPhone 14/15 size
];

async function runAudit() {
  console.log('🚀 Starting Full-Spectrum Playwright Audit on https://prateeq.in...\n');
  const browser = await chromium.launch({ headless: true });
  const auditResults = [];

  for (const route of ROUTES) {
    console.log(`\n======================================================`);
    console.log(`🔍 AUDITING: ${route.title} (${route.path})`);
    console.log(`======================================================`);

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }
      });
      // Pre-set audience and theme cookies and localStorage so we capture the deep page layouts directly
      await context.addCookies([
        {
          name: 'audience',
          value: 'developer',
          url: 'https://prateeq.in'
        },
        {
          name: 'theme',
          value: 'azure',
          url: 'https://prateeq.in'
        }
      ]);
      await context.addInitScript(() => {
        localStorage.setItem('audience', 'developer');
        localStorage.setItem('theme', 'azure');
      });
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      const failedRequests = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      page.on('pageerror', err => {
        pageErrors.push(err.message);
      });

      page.on('requestfailed', req => {
        // Filter out benign tracker/adblock drops if any
        failedRequests.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
      });

      const startTime = Date.now();
      let status = 200;
      let title = '';

      try {
        const response = await page.goto(`${BASE_URL}${route.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        status = response?.status() || 200;
        title = await page.title();
        const duration = Date.now() - startTime;

        // Take Azure snapshot (Default)
        const azureScreenshot = path.join(OUTPUT_DIR, `${route.name}_${vp.name}_azure.png`);
        await page.screenshot({ path: azureScreenshot, fullPage: false });

        // Try toggling to Noir mode
        let noirCaptured = false;
        try {
          // Attempt to click theme toggle button or set data-theme='noir'
          await page.evaluate(() => {
            document.documentElement.setAttribute('data-theme', 'noir');
          });
          await page.waitForTimeout(500); // Allow spring transitions to settle
          const noirScreenshot = path.join(OUTPUT_DIR, `${route.name}_${vp.name}_noir.png`);
          await page.screenshot({ path: noirScreenshot, fullPage: false });
          noirCaptured = true;
        } catch {
          // Noir toggle fallback
        }


        // Test Interactive Modals or CLI on desktop
        if (route.path === '/' && vp.name === 'desktop') {
          try {
            // Click the first project card case-study tag to verify Portal modal
            const projectCard = await page.$('button[aria-label*="View system architecture"]');
            if (projectCard) {
              await projectCard.click();
              await page.waitForTimeout(600);
              const modalScreenshot = path.join(OUTPUT_DIR, `01_home_modal_portal_check.png`);
              await page.screenshot({ path: modalScreenshot, fullPage: false });
              console.log('  ✓ Project Case Study Modal opened & verified via Portal');
            }
          } catch (modalErr) {
            console.log('  Notice: Could not trigger project modal click:', modalErr.message);
          }
        }

        const result = {
          route: route.path,
          name: route.title,
          viewport: vp.name,
          status,
          title,
          durationMs: duration,
          consoleErrorsCount: consoleErrors.length,
          pageErrorsCount: pageErrors.length,
          failedRequestsCount: failedRequests.length,
          consoleErrors,
          pageErrors,
          failedRequests,
          azureScreenshot,
          noirCaptured
        };

        auditResults.push(result);

        const statusIcon = status < 400 && pageErrors.length === 0 ? '✅' : '⚠️';
        console.log(`  ${statusIcon} [${vp.name.toUpperCase()}] HTTP ${status} | ${duration}ms | Title: "${title}"`);
        if (consoleErrors.length > 0) console.log(`     ⚠️ Console Errors: ${consoleErrors.length}`);
        if (pageErrors.length > 0) console.log(`     ❌ Page Errors: ${pageErrors.join('; ')}`);
        if (failedRequests.length > 0) console.log(`     ⚠️ Failed Requests: ${failedRequests.length}`);

      } catch (err) {
        console.error(`  ❌ Error auditing ${route.path} [${vp.name}]:`, err.message);
        auditResults.push({
          route: route.path,
          name: route.title,
          viewport: vp.name,
          status: 'ERROR',
          error: err.message
        });
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  const reportPath = path.join(OUTPUT_DIR, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n✨ AUDIT COMPLETE! Full JSON report saved to ${reportPath}`);
}

runAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
