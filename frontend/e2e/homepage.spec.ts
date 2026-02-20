import { test, expect } from './console-collector.fixture';

test('opens Angular homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/frontend/i);
  await expect(page.getByText('Angular + Quarkus Cognito Demo')).toBeVisible();
  // Homepage renders README.md if the backend is available, otherwise shows "Welcome" fallback.
  // Use locator.or() to avoid race condition: the README fetch is async and may
  // replace "Welcome" before the assertion runs.
  const readmeLocator = page.locator('.markdown-body');
  const welcomeLocator = page.getByText('Welcome');
  await expect(readmeLocator.or(welcomeLocator)).toBeVisible({ timeout: 15000 });
});
