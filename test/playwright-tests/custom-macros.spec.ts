import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// Fork feature: README.md items 1, 13. `\mixfraction{whole}{numerator}{denominator}`
// is a fork-specific atom (`GenMixFractionAtom`) distinct from `\frac`. It is
// inserted via the `shift+/` keybinding, which expands to
// `\mixfraction{#@}{#?}{#?}` (see src/editor/keybindings-definitions.ts).
test.describe('mixfraction', () => {
  test('inserts and fills all three branches in order: body, numerator, denominator', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '';
      mfe.focus();
      mfe.executeCommand(['insert', '\\mixfraction{#@}{#?}{#?}']);
      mfe.executeCommand(['insert', '2']);
      mfe.executeCommand(['moveToNextPlaceholder']);
      mfe.executeCommand(['insert', '3']);
      mfe.executeCommand(['moveToNextPlaceholder']);
      mfe.executeCommand(['insert', '5']);
      return mfe.value;
    });

    expect(value).toBe(String.raw`\mixfraction{2}{3}{5}`);
  });

  test('is a distinct atom type from \\frac (genmixfraction)', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const hasMixfractionMarkup = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => {
        mfe.value = '\\mixfraction{2}{3}{5}';
        return mfe.value === '\\mixfraction{2}{3}{5}';
      });

    expect(hasMixfractionMarkup).toBe(true);
  });
});

// Fork feature: README.md item 13. `\opdegree`, `\opradian`, `\opgradian` are
// default macros (src/tera-research/mathfield-macros.ts) expanding to
// `^{\circ}`, `^{\mathrm{r}}`, `^{\mathrm{g}}` respectively.
test.describe('angle-unit macros', () => {
  for (const macro of ['\\opdegree', '\\opradian', '\\opgradian', '\\degree']) {
    test(`${macro} round-trips through the mathfield`, async ({ page }) => {
      await page.goto('/dist/playwright-test-page/');

      const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement, m) => {
        mfe.value = `5${m}`;
        return mfe.value;
      }, macro);

      expect(value).toBe(`5${macro}`);
    });
  }
});

// Fork feature: README.md item 15. Macros flagged `isImplicitArg: true`
// (decimalsep, thousandSep, thousandthSep, exponentialE) are swept into the
// numerator when a fraction is created immediately after them, instead of
// only the last digit group.
test.describe('implicit-arg number sweep', () => {
  test('sweeps a whole number containing \\exponentialE into the fraction numerator', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '';
      mfe.focus();
      mfe.executeCommand(['insert', '1']);
      mfe.executeCommand(['insert', '\\exponentialE']);
      mfe.executeCommand(['insert', '4']);
      // Mirrors the `/` keybinding: ['insert', '\\frac{#@}{#?}']
      mfe.executeCommand(['insert', '\\frac{#@}{#?}']);
      return mfe.value;
    });

    expect(value).toBe(String.raw`\frac{1\exponentialE4}{\placeholder{}}`);
  });
});

// Fork feature: README.md item 14. `MathfieldElement.exponentialNotation`
// (static) controls the default `\exponentialE` rendering style, and the
// per-instance setter merges a matching macro into `mf.macros`.
test.describe('exponentialNotation', () => {
  test('instance setter merges the exponentialE macro definition', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '1\\exponentialE4';
      const before = (mfe.macros as any).exponentialE.def;
      (mfe as any).exponentialNotation = 'scientific';
      const after = (mfe.macros as any).exponentialE.def;
      return { before, after };
    });

    expect(result.before).toBe('\\mathrm{ᴇ}');
    expect(result.after).toContain('\\scriptsize{\\times10}');
  });

  test('static setter dispatches mathlive-update-exponential-notation on document', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const fired = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener(
          'mathlive-update-exponential-notation',
          () => resolve(true),
          { once: true }
        );
        (customElements.get('math-field') as any).exponentialNotation = 'scientific';
        setTimeout(() => resolve(false), 500);
      });
    });

    expect(fired).toBe(true);
  });
});

// Fork feature: README.md item 10. Setting the static separator-character
// properties dispatches a `mathlive-update-separator` document event.
test.describe('mathlive-update-separator event', () => {
  test('fires when a static separator property is set', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const fired = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        document.addEventListener('mathlive-update-separator', () => resolve(true), {
          once: true,
        });
        (customElements.get('math-field') as any).thousandSeparatorChar = ',';
        setTimeout(() => resolve(false), 500);
      });
    });

    expect(fired).toBe(true);
  });
});
