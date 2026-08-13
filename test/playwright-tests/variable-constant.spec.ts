import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// Fork feature: `\variable{...}`, `\constant{...}`, `\conversion{...}` are
// atomic core commands (VariableAtom, src/atoms/variable.ts) with
// `skipBoundary = true`, so arrow-key navigation jumps clean over the whole
// atom instead of stopping at an internal boundary (fixed cursor-skip bug).

test.describe('variable/constant/conversion round-trip', () => {
  test('\\variable{a} round-trips through the mathfield', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\variable{a}';
      return mfe.value;
    });

    expect(value).toBe(String.raw`\variable{a}`);
  });

  test('\\constant{const_proton_mass} round-trips through the mathfield', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\constant{const_proton_mass}';
      return mfe.value;
    });

    expect(value).toBe(String.raw`\constant{const_proton_mass}`);
  });

  test('\\conversion{convFtM} round-trips through the mathfield', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\conversion{convFtM}';
      return mfe.value;
    });

    expect(value).toBe(String.raw`\conversion{convFtM}`);
  });
});

test.describe('cursor boundary skip', () => {
  test('ArrowRight jumps clean over \\variable{...} instead of stopping inside it', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const path = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = 'x\\variable{ab}y';
      mfe.position = 0;
      const positions = [mfe.position];
      for (let i = 0; i < 10 && mfe.position !== mfe.lastOffset; i++) {
        mfe.executeCommand(['moveToNextChar']);
        positions.push(mfe.position);
      }
      return positions;
    });

    // x, [skip whole \variable{ab} atom], y, end -- 4 stops, not 6
    expect(path).toEqual([0, 1, 4, 5]);
  });

  test('ArrowLeft jumps clean back over \\constant{...} too', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const path = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = 'x\\constant{abc}y';
      mfe.position = mfe.lastOffset;
      const positions = [mfe.position];
      for (let i = 0; i < 10 && mfe.position !== 0; i++) {
        mfe.executeCommand(['moveToPreviousChar']);
        positions.push(mfe.position);
      }
      return positions;
    });

    // y, [skip whole \constant{abc} atom], x, start -- 4 stops, not 6
    expect(path.length).toBe(4);
  });
});
