import { test as base, ConsoleMessage } from '@playwright/test';

/**
 * Extended Playwright test fixture that collects browser console warnings and errors
 * during each test and reports them in the test output.
 *
 * Usage: import { test } from './console-collector.fixture' instead of '@playwright/test'
 */

interface ConsoleEntry {
  readonly type: string;
  readonly text: string;
  readonly url: string;
}

export const test = base.extend<{ consoleCollector: void }>({
  // eslint-disable-next-line no-empty-pattern
  consoleCollector: [async ({ page }, use, testInfo) => {
    const entries: ConsoleEntry[] = [];

    const onConsole = (msg: ConsoleMessage) => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        entries.push({
          type,
          text: msg.text(),
          url: msg.location().url
        });
      }
    };

    const onPageError = (error: Error) => {
      entries.push({
        type: 'pageerror',
        text: `${error.name}: ${error.message}`,
        url: ''
      });
    };

    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    await use();

    page.off('console', onConsole);
    page.off('pageerror', onPageError);

    // Report collected errors/warnings to stdout so CI can see them
    if (entries.length > 0) {
      const header = `\n[Browser Console] ${testInfo.title} — ${entries.length} issue(s):`;
      const lines = entries.map(
        (e, i) => {
          const urlSuffix = e.url ? ' (' + e.url + ')' : '';
          return `  ${i + 1}. [${e.type.toUpperCase()}] ${e.text}${urlSuffix}`;
        }
      );
      console.log([header, ...lines].join('\n'));

      // Attach as test artifact for CI reports
      await testInfo.attach('browser-console', {
        body: JSON.stringify(entries, null, 2),
        contentType: 'application/json'
      });
    }
  }, { auto: true }]
});

export { expect } from '@playwright/test';
