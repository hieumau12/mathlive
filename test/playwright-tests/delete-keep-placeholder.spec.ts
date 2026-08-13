import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// Fork feature: deleting the sole content of a fraction/mixfraction branch,
// a subsup branch, a root, or an integral bound keeps a placeholder instead
// of collapsing the whole structure. See src/editor-model/delete.ts.
// (commits: 5c0b6dde, 6e4b6aa5, e2bc7e28, a292608b, 6eb7f0c8, 487f21f9)

test.describe('\\frac delete-keep-placeholder', () => {
  test('deleting the denominator digit leaves a placeholder, fraction survives', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\frac{2}{3}';
      mfe.position = mfe.lastOffset;
      mfe.executeCommand(['moveToPreviousChar']); // land right after '3'
      mfe.executeCommand(['deleteBackward']);
      return mfe.value;
    });

    expect(value).toBe(String.raw`\frac{2}{\placeholder{}}`);
  });

  test('deleting the placeholder afterward hoists the remaining numerator', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\frac{2}{3}';
      mfe.position = mfe.lastOffset;
      mfe.executeCommand(['moveToPreviousChar']);
      mfe.executeCommand(['deleteBackward']); // -> \frac{2}{\placeholder{}}
      mfe.executeCommand(['deleteBackward']); // -> hoist '2', drop the fraction
      return mfe.value;
    });

    expect(value).toBe('2');
  });
});

test.describe('\\mixfraction delete-keep-placeholder', () => {
  test('deleting the denominator digit leaves a placeholder in "below" only', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\mixfraction{2}{3}{5}';
      mfe.position = mfe.lastOffset;
      mfe.executeCommand(['moveToPreviousChar']); // land right after '5'
      mfe.executeCommand(['deleteBackward']);
      return mfe.value;
    });

    expect(value).toBe(String.raw`\mixfraction{2}{3}{\placeholder{}}`);
  });
});

test.describe('subsup delete-keep-placeholder', () => {
  test('deleting the last superscript digit leaves a placeholder there', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = 'x^{2}_{3}';
      mfe.position = mfe.lastOffset;
      mfe.executeCommand(['moveToPreviousChar']);
      mfe.executeCommand(['deleteBackward']);
      return mfe.value;
    });

    // Canonical serialization is subscript-first; the superscript (last in
    // navigation order) is the branch that gets emptied here.
    expect(value).toBe(String.raw`x_3^{\placeholder{}}`);
  });
});

test.describe('\\sqrt (root) delete-keep-placeholder', () => {
  test('deleting the sole content of a square root leaves a placeholder', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\sqrt{4}';
      mfe.position = mfe.lastOffset;
      mfe.executeCommand(['moveToPreviousChar']);
      mfe.executeCommand(['deleteBackward']);
      return mfe.value;
    });

    expect(value).toBe(String.raw`\sqrt{\placeholder{}}`);
  });
});

test.describe('\\repeatingpart delete behavior', () => {
  test('backspacing from right after the command navigates in without deleting it', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\repeatingpart{123}';
      mfe.position = mfe.lastOffset;
      const positionBefore = mfe.position;
      mfe.executeCommand(['deleteBackward']);
      return { value: mfe.value, positionBefore, positionAfter: mfe.position };
    });

    expect(result.value).toBe(String.raw`\repeatingpart{123}`);
    // The caret moves from just outside the command into its body instead
    // of deleting anything.
    expect(result.positionAfter).toBeLessThan(result.positionBefore);
  });

  test('deleting all its content down to empty still keeps a placeholder, not a crash', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\repeatingpart{1}';
      mfe.position = mfe.lastOffset;
      mfe.executeCommand(['deleteBackward']); // navigate in (no-op on content)
      mfe.executeCommand(['deleteBackward']); // delete '1' -> placeholder
      return mfe.value;
    });

    expect(value).toBe(String.raw`\repeatingpart{\placeholder{}}`);
  });
});

test.describe('integral bound delete-keep-placeholder', () => {
  test('deleting the lower bound digit of \\int leaves a placeholder, structure survives', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\int_{0}^{\\infty}';
      // position 4 = right after the lower-bound digit '0'
      mfe.position = 4;
      mfe.executeCommand(['deleteBackward']);
      return mfe.value;
    });

    expect(value).toBe(String.raw`\int_{\placeholder{}}^{\infty}`);
  });
});

test.describe('\\operatorname is atomic (not editable)', () => {
  test('cursor cannot land inside \\operatorname{...}', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const path = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = 'x\\operatorname{abc}y';
      mfe.position = 0;
      const positions = [mfe.position];
      for (let i = 0; i < 10 && mfe.position !== mfe.lastOffset; i++) {
        mfe.executeCommand(['moveToNextChar']);
        positions.push(mfe.position);
      }
      return positions;
    });

    // x, [skip whole operatorname atom], y, end -- 4 stops, not 7
    expect(path).toEqual([0, 1, 6, 7]);
  });

  test('a single backspace right after it deletes the whole atom at once', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = 'x\\operatorname{abc}y';
      mfe.position = 6; // right after the operatorname atom
      mfe.executeCommand(['deleteBackward']);
      return mfe.value;
    });

    expect(value).toBe('xy');
  });
});
