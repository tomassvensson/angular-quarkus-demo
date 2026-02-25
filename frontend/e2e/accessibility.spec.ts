import { test, expect } from './console-collector.fixture';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility tests using axe-core.
 * Validates WCAG 2.1 AA compliance on key pages.
 */

test.describe('Accessibility (axe-core)', () => {
  test('homepage has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    // Wait for the page content to be visible
    const readmeLocator = page.locator('.markdown-body');
    const welcomeLocator = page.getByText('Welcome');
    await expect(readmeLocator.or(welcomeLocator)).toBeVisible({ timeout: 15000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('public lists page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/public');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
