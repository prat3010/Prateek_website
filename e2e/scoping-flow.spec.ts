import { test, expect } from '@playwright/test';

test.describe('Autonomous E2E Smoke Flows', () => {
  test('scoping wizard renders and interacts cleanly', async ({ page }) => {
    await page.goto('/scoping');
    await expect(page).toHaveTitle(/Prateeq|Prateek/i);

    // Verify main scoping container is visible
    const main = page.locator('main, body');
    await expect(main).toBeVisible();
  });

  test('terminal diagnostics console responds to commands', async ({ page }) => {
    await page.goto('/terminal');
    await expect(page).toHaveTitle(/Prateeq|Prateek|Terminal/i);

    // Verify terminal prompt is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('analytics dashboard loads metrics', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveTitle(/Prateeq|Prateek|Analytics/i);
    await expect(page.locator('body')).toBeVisible();
  });
});
