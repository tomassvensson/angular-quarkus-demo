import { test, expect } from './console-collector.fixture';

test('opens Angular homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/frontend/i);
  await expect(page.getByText('Angular + Quarkus Cognito Demo')).toBeVisible();
  // Homepage renders README.md if available, otherwise shows "Welcome" fallback
  const hasReadme = await page.locator('.markdown-body').count();
  if (hasReadme > 0) {
    await expect(page.locator('.markdown-body')).toBeVisible();
  } else {
    await expect(page.getByText('Welcome')).toBeVisible();
  }
});
