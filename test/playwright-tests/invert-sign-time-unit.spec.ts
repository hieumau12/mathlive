import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// Fork feature: `executeCommand(['insert', 'INVERT_SIGN'])` and
// `executeCommand(['insert', 'TIME_UNIT'])` are special-cased string
// sentinels handled in src/editor-mathfield/mode-editor-math.ts. INVERT_SIGN
// toggles the sign of the number before the cursor without touching the
// rest of the expression (commits 0adf00f0/f1179db0). TIME_UNIT cycles
// degree -> minute -> second -> (nothing) each time it's invoked.

test.describe('INVERT_SIGN', () => {
  test('prefixes a positive number with a minus sign', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '5';
      mfe.position = mfe.lastOffset;
      mfe.executeCommand(['insert', 'INVERT_SIGN']);
      return mfe.value;
    });

    expect(value).toBe('-5');
  });

  test('flips a minus back to a plus without altering the rest of the expression', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '5';
      mfe.position = mfe.lastOffset;
      mfe.executeCommand(['insert', 'INVERT_SIGN']); // -> -5
      mfe.executeCommand(['insert', 'INVERT_SIGN']); // -> +5
      return mfe.value;
    });

    expect(value).toBe('+5');
  });
});

test.describe('TIME_UNIT', () => {
  test('cycles degree -> minute -> second -> nothing on repeated invocation', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const values = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '5';
      mfe.position = mfe.lastOffset;
      const out: string[] = [];
      for (let i = 0; i < 4; i++) {
        mfe.executeCommand(['insert', 'TIME_UNIT']);
        out.push(mfe.value);
      }
      return out;
    });

    expect(values[0]).toBe(String.raw`5\degree`);
    expect(values[1]).toBe(String.raw`5\degree0\minute`);
    expect(values[2]).toBe(String.raw`5\degree0\minute0\second`);
    // Fourth call is a no-op: no more units to cycle to.
    expect(values[3]).toBe(values[2]);
  });
});
