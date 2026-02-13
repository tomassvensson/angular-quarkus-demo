import { test, expect } from '@playwright/test';

test('opens Angular homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/frontend/i);
  await expect(page.getByText('Angular + Quarkus Cognito Demo')).toBeVisible();
  await expect(page.getByText('Welcome')).toBeVisible();
});
