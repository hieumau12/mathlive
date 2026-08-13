import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// Fork feature: README.md items 5, 6, 8, 9. Custom `scroll`/`scrollTo`
// commands (src/editor-mathfield/commands.ts), the `scrollIntoCaret` insert
// option, and a `focus()` default of `{ preventScroll: true }`
// (src/editor-mathfield/mathfield-private.ts).

test.describe('scroll commands', () => {
  test('executeCommand(["scroll", distance]) runs without error', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const ok = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = 'x+y+z';
      return mfe.executeCommand(['scroll', 20]);
    });

    expect(ok).toBe(true);
  });

  test('executeCommand(["scrollTo", {left, behavior}]) runs without error', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const ok = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = 'x+y+z';
      return mfe.executeCommand(['scrollTo', { left: 5, behavior: 'instant' }]);
    });

    expect(ok).toBe(true);
  });
});

test.describe('scrollIntoCaret insert option', () => {
  test('insert({ scrollIntoCaret: true }) does not throw', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const ok = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '';
      mfe.focus();
      return mfe.executeCommand([
        'insert',
        'x+y',
      ]);
    });

    expect(ok).toBe(true);
  });
});

test.describe('focus() default preventScroll', () => {
  test('focus() with no arguments does not throw and focuses the field', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.focus());
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id))
      .toBe('mf-1');
  });

  test('focus({ preventScroll: false }) still focuses the field', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => mfe.focus({ preventScroll: false }));
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id))
      .toBe('mf-1');
  });
});
