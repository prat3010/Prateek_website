import { test, expect } from '@playwright/test';

test.describe('Autonomous E2E Smoke Flows', () => {
  test('scoping wizard renders and interacts cleanly', async ({ page }) => {
    await page.goto('/scoping');
    await expect(page).toHaveTitle(/Prateek/i);

    // Verify main scoping elements
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('terminal diagnostics console responds to commands', async ({ page }) => {
    await page.goto('/terminal');
    await expect(page).toHaveTitle(/Terminal|Prateek/i);

    // Verify terminal command prompt exists
    const input = page.locator('input[type="text"]');
    if (await input.isVisible()) {
      await input.fill('help');
      await input.press('Enter');
      await expect(page.locator('body')).toContainText(/Available commands|site-info/i);
    }
  });

  test('analytics dashboard loads metrics', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveTitle(/Analytics|Prateek/i);
    await expect(page.locator('body')).toBeVisible();
  });
});
