import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect, type Locator } from '@playwright/test';

// Visual regression coverage for fork features that are partly or entirely
// defined by CSS/layout, not by DOM structure or the serialized LaTeX value
// -- a class name being present proves nothing about width, color, or
// pseudo-element content. These complement (not replace) the value/structure
// assertions in the other spec files.
//
// Baselines live in ./visual-snapshots.spec.ts-snapshots/. Regenerate with
// `npx playwright test visual-snapshots.spec.ts --update-snapshots` and
// review the diff images before committing.

// Text-rendering anti-aliasing differs enough between browser engines that
// maintaining 3 baseline sets isn't worth it -- chromium is the single
// source of truth for these.
test.beforeEach(({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Visual snapshots are chromium-only');
});

async function snapshot(
  page: import('@playwright/test').Page
): Promise<{ mfe: Locator; content: Locator }> {
  await page.goto('/dist/playwright-test-page/');
  await page.evaluate(() => (document as any).fonts.ready);
  return {
    mfe: page.locator('#mf-1'),
    // Scope the screenshot to the actual math content, piercing the shadow
    // root -- avoids capturing the virtual-keyboard-toggle/menu icons as
    // unrelated noise.
    content: page.locator('#mf-1 .ML__content'),
  };
}

test.describe('mixfraction rendering', () => {
  test('\\mixfraction{2}{3}{5} -- bracketed whole number + stacked fraction', async ({
    page,
  }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\mixfraction{2}{3}{5}';
    });
    await expect(content).toHaveScreenshot('mixfraction-2-3-5.png');
  });
});

test.describe('fraction line width', () => {
  // README item 2: the fraction bar must span the WIDER of numerator/
  // denominator, not just the numerator's width.
  test('line spans a wide denominator under a narrow numerator', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\frac{x}{12345678}';
    });
    await expect(content).toHaveScreenshot('frac-wide-denominator.png');
  });

  test('line spans a wide numerator over a narrow denominator', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\frac{12345678}{x}';
    });
    await expect(content).toHaveScreenshot('frac-wide-numerator.png');
  });
});

test.describe('variable / constant / conversion rendering', () => {
  test('\\variable{a} -- plain variable body', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\variable{a}';
    });
    await expect(content).toHaveScreenshot('variable-plain.png');
  });

  test('\\variable{randreal} -- special-cased bold-italic "Rand#"', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\variable{randreal}';
    });
    await expect(content).toHaveScreenshot('variable-randreal.png');
  });

  test('\\constant{const_proton_mass} -- resolved scientific-constant symbol', async ({
    page,
  }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\constant{const_proton_mass}';
    });
    await expect(content).toHaveScreenshot('constant-proton-mass.png');
  });

  test('\\conversion{convFtM} -- resolved metric-conversion symbol', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\conversion{convFtM}';
    });
    await expect(content).toHaveScreenshot('conversion-ftm.png');
  });
});

test.describe('ans-value box', () => {
  test('\\variable{Ans} -- boxed value with the "Ans" label', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\variable{Ans}';
      el.setAnsValue('\\frac{1}{2}');
    });
    await expect(content).toHaveScreenshot('ans-value-box.png');
  });
});

test.describe('repeatingpart rendering', () => {
  test('\\repeatingpart{123} -- default color underline-style bar', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\repeatingpart{123}';
    });
    await expect(content).toHaveScreenshot('repeatingpart-default-color.png');
  });

  test('\\textcolor{red}{\\repeatingpart{123}} -- bar follows currentColor', async ({
    page,
  }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '\\textcolor{red}{\\repeatingpart{123}}';
    });
    await expect(content).toHaveScreenshot('repeatingpart-red-color.png');
  });
});

test.describe('angle-unit macros', () => {
  test('\\opdegree, \\opradian, \\opgradian, \\degree side by side', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      el.value = '5\\opdegree+5\\opradian+5\\opgradian+5\\degree';
    });
    await expect(content).toHaveScreenshot('angle-unit-macros.png');
  });
});

test.describe('exponentialNotation styles', () => {
  test('MathRm style (default): 1\\exponentialE4', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      (customElements.get('math-field') as any).exponentialNotation = 'mathrm';
      el.value = '1\\exponentialE4';
    });
    await expect(content).toHaveScreenshot('exponential-notation-mathrm.png');
  });

  test('Scientific style: 1\\exponentialE4', async ({ page }) => {
    const { mfe, content } = await snapshot(page);
    await mfe.evaluate((el: MathfieldElement) => {
      (customElements.get('math-field') as any).exponentialNotation = 'scientific';
      el.value = '1\\exponentialE4';
    });
    await expect(content).toHaveScreenshot('exponential-notation-scientific.png');
    // Reset the static default so it doesn't leak into later tests/workers.
    await mfe.evaluate((el: MathfieldElement) => {
      (customElements.get('math-field') as any).exponentialNotation = 'mathrm';
    });
  });
});

test.describe('delete-keep-placeholder end states', () => {
  // These prove the kept placeholder actually renders as a visible dashed
  // box in the right spot, not just that the serialized LaTeX is correct.
  const cases: Array<[string, string]> = [
    ['frac-denominator', '\\frac{2}{\\placeholder{}}'],
    ['mixfraction-below', '\\mixfraction{2}{3}{\\placeholder{}}'],
    ['subsup-superscript', 'x_3^{\\placeholder{}}'],
    ['sqrt-body', '\\sqrt{\\placeholder{}}'],
    ['repeatingpart-body', '\\repeatingpart{\\placeholder{}}'],
    ['integral-lower-bound', '\\int_{\\placeholder{}}^{\\infty}'],
  ];

  for (const [name, latex] of cases) {
    test(`${latex} renders a visible placeholder`, async ({ page }) => {
      const { mfe, content } = await snapshot(page);
      await mfe.evaluate((el: MathfieldElement, v) => {
        el.value = v;
      }, latex);
      await expect(content).toHaveScreenshot(`placeholder-${name}.png`);
    });
  }
});
