import { test } from '@playwright/test';
import path from 'node:path';

const outputDir = path.resolve(__dirname, '../../docs/screenshots');

test.describe('README screenshots', () => {
  test.skip(process.env.GENERATE_README_SHOTS !== 'true', 'Run only when generating README screenshots');

  test('capture login screen, role-based menu, and admin view', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });

    await page.route('**/api/v1/graphql', async (route) => {
      const body = route.request().postData() ?? '';

      if (body.includes('query { me { username email roles } }')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              me: {
                username: 'admin.user@example.com',
                email: 'admin.user@example.com',
                roles: ['AdminUser']
              }
            }
          })
        });
        return;
      }

      if (body.includes('query Users(')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              users: {
                page: 0,
                size: 10,
                total: 3,
                items: [
                  {
                    username: 'admin.user',
                    email: 'admin.user@example.com',
                    emailVerified: true,
                    confirmationStatus: 'CONFIRMED',
                    status: 'Enabled',
                    enabled: true,
                    created: '2026-02-10T10:00:00Z',
                    lastUpdatedTime: '2026-02-12T10:00:00Z',
                    modified: '2026-02-12T10:00:00Z',
                    mfaSetting: 'SOFTWARE_TOKEN_MFA',
                    groups: ['AdminUser']
                  },
                  {
                    username: 'regular.user',
                    email: 'regular.user@example.com',
                    emailVerified: true,
                    confirmationStatus: 'CONFIRMED',
                    status: 'Enabled',
                    enabled: true,
                    created: '2026-02-10T11:00:00Z',
                    lastUpdatedTime: '2026-02-12T09:00:00Z',
                    modified: '2026-02-12T09:00:00Z',
                    mfaSetting: 'None',
                    groups: ['RegularUser']
                  },
                  {
                    username: 'owner.user',
                    email: 'owner.user@example.com',
                    emailVerified: false,
                    confirmationStatus: 'UNCONFIRMED',
                    status: 'Disabled',
                    enabled: false,
                    created: '2026-02-10T12:00:00Z',
                    lastUpdatedTime: '2026-02-11T08:00:00Z',
                    modified: '2026-02-11T08:00:00Z',
                    mfaSetting: 'None',
                    groups: ['OwnerUser']
                  }
                ]
              }
            }
          })
        });
        return;
      }

      if (body.includes('query User(')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              user: {
                username: 'admin.user',
                email: 'admin.user@example.com',
                emailVerified: true,
                confirmationStatus: 'CONFIRMED',
                status: 'Enabled',
                enabled: true,
                created: '2026-02-10T10:00:00Z',
                lastUpdatedTime: '2026-02-12T10:00:00Z',
                modified: '2026-02-12T10:00:00Z',
                mfaSetting: 'SOFTWARE_TOKEN_MFA',
                groups: ['AdminUser']
              }
            }
          })
        });
        return;
      }

      if (body.includes('query { groups }')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              groups: ['RegularUser', 'AdminUser', 'OwnerUser', 'NoPermissionsTestUser']
            }
          })
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
    });

    await page.goto('/');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, 'role-based-menu.png'), fullPage: true });

    await page.goto('/users');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, 'admin-user-management-view.png'), fullPage: true });

    await page.route('**/api/v1/graphql', async (route) => {
      const body = route.request().postData() ?? '';
      if (body.includes('query { me { username email roles } }')) {
        await route.fulfill({ status: 401, contentType: 'text/plain', body: 'Unauthorized' });
        return;
      }
      await route.continue();
    });

    await page.goto('/');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, 'login-screen.png'), fullPage: true });
  });
});
