import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// Fork feature: README.md item 12. The `disable-physical-keyboard`
// attribute / `disablePhysicalKeyboard` option ignores physical keyboard
// input on a mathfield. Setting the attribute always disables it; removing
// the attribute does NOT re-enable it -- only
// `mf.setOptions({ disablePhysicalKeyboard: false })` does.
// (src/public/mathfield-element.ts attributeChangedCallback)

test.describe('disable-physical-keyboard attribute', () => {
  test('typing is ignored once the attribute is set', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '';
      mfe.setAttribute('disable-physical-keyboard', '');
    });

    await page.locator('#mf-1').click();
    await page.locator('#mf-1').pressSequentially('123', { delay: 50 });

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value);
    expect(value).toBe('');
  });

  test('removing the attribute does NOT re-enable the physical keyboard', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '';
      mfe.setAttribute('disable-physical-keyboard', '');
      mfe.removeAttribute('disable-physical-keyboard');
    });

    const stillDisabled = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) =>
      mfe.getOptions(['disablePhysicalKeyboard']).disablePhysicalKeyboard
    );
    expect(stillDisabled).toBe(true);

    await page.locator('#mf-1').click();
    await page.locator('#mf-1').pressSequentially('123', { delay: 50 });

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value);
    expect(value).toBe('');
  });

  test('setOptions({ disablePhysicalKeyboard: false }) re-enables typing', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '';
      mfe.setAttribute('disable-physical-keyboard', '');
      mfe.setOptions({ disablePhysicalKeyboard: false });
    });

    await page.locator('#mf-1').click();
    await page.locator('#mf-1').pressSequentially('123', { delay: 50 });

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value);
    expect(value).toBe('123');
  });
});
