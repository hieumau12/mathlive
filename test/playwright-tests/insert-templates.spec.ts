import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// Fork feature: Casio-fx991EX-style "smart insert" templates. Two new
// implicit-argument tokens, on top of the pre-existing `#@` (implicit
// argument *before* the insertion point) and `#0` (current selection):
//   #&  implicit argument *after* the insertion point
// e.g. '12|34' + insert('\frac{#@}{#&}') -> '\frac{12}{34}', splitting the
// digit run around the cursor instead of the library's default
// '\frac{12}{\placeholder{}}34'.
//
// Two behaviors are under test for every template:
//   1. The resulting value is structurally correct.
//   2. The cursor lands *inside* the newly-inserted structure, right before
//      wherever the #&-captured content ended up -- not at the end of the
//      whole structure. Verified by inserting a distinguishing 'Z' right
//      after and checking exactly where it landed in the resulting value;
//      this is more reliable than reading `position` numbers directly,
//      since the offset numbering scheme is an implementation detail.
//
// Regression coverage: when the #@/#0-captured text and the #&-captured
// text are identical (e.g. '1234|1234'), a naive "find the run of atoms
// whose serialized latex equals the target" search is ambiguous -- more
// than one run in the output can serialize to the same string -- and can
// resolve to the wrong one, landing the cursor at the very start of the
// expression instead of inside the new structure. See mode-editor-math.ts's
// AFTER_ARG_MARKER mechanism, which sidesteps this by marking exactly where
// #&'s content landed rather than searching for it by content.

async function insertAt(
  page: import('@playwright/test').Page,
  value: string,
  position: number,
  template: string
): Promise<string> {
  return page.locator('#mf-1').evaluate(
    (mfe: MathfieldElement, [value, position, template]) => {
      mfe.value = value as string;
      mfe.position = position as number;
      mfe.executeCommand(['insert', template as string]);
      // Insert a marker right after the insert to reveal exactly where the
      // cursor landed, without depending on the numeric offset scheme.
      mfe.executeCommand(['insert', 'Z']);
      return mfe.value;
    },
    [value, position, template]
  );
}

test.describe('#& smart-insert templates -- basic shape and cursor placement', () => {
  test('FRACTION: #@}{#& splits a digit run into numerator/denominator', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '1234', 2, String.raw`\frac{#@}{#&}`);
    expect(value).toBe(String.raw`\frac{12}{Z34}`);
  });

  test('X_POWER_BY_Y: #@^{#&} splits a digit run into base/exponent', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '23', 1, String.raw`#@^{#&}`);
    expect(value).toBe(String.raw`2^{Z3}`);
  });

  test('E_POWER_BY_X: \\eulerE^{#&} only consumes the after side, before is untouched', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '1234', 2, String.raw`\eulerE^{#&}`);
    expect(value).toBe(String.raw`12\eulerE^{Z34}`);
  });

  test('SQRT: \\sqrt{#&} only consumes the after side', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '1234', 2, String.raw`\sqrt{#&}`);
    expect(value).toBe(String.raw`12\sqrt{Z34}`);
  });

  test('Y_ROOT_OF_X: \\sqrt[#@]{#&} splits into index/radicand', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '38', 1, String.raw`\sqrt[#@]{#&}`);
    expect(value).toBe(String.raw`\sqrt[3]{Z8}`);
  });

  test('LOG_A_OF_X: \\log_{#0} (#&) combines a selection (#0) with an implicit after-argument', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '234';
      mfe.selection = { ranges: [[0, 1]], direction: 'forward' };
      mfe.executeCommand(['insert', '\\log_{#0} (#&)']);
      mfe.executeCommand(['insert', 'Z']);
      return mfe.value;
    });
    expect(value).toBe(String.raw`\log_2(Z34)`);
  });
});

test.describe('#& edge cases', () => {
  test('stops at the first operator: #& does not swallow past a trailing +', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '1234+56', 2, String.raw`\sqrt{#&}`);
    expect(value).toBe(String.raw`12\sqrt{Z34}+56`);
  });

  test('nothing after the cursor: #& falls back to a placeholder, which typing then replaces', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '12', 2, String.raw`\sqrt{#&}`);
    expect(value).toBe(String.raw`12\sqrt{Z}`);
  });

  test('nothing before the cursor: the whole expression is captured by #&', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '1234', 0, String.raw`\sqrt{#&}`);
    expect(value).toBe(String.raw`\sqrt{Z1234}`);
  });

  test('a parenthesized group right after the cursor is captured as one unit, plus anything chained after it', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '5(2+3)8', 1, String.raw`\sqrt{#&}`);
    expect(value).toBe(String.raw`5\sqrt{Z(2+3)8}`);
  });

  test('a parenthesized group still stops at a trailing operator', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '5(2+3)+8', 1, String.raw`\sqrt{#&}`);
    expect(value).toBe(String.raw`5\sqrt{Z(2+3)}+8`);
  });
});

test.describe('#& critical regression: identical before/after content', () => {
  // Bug report: '1234|1234' -> '\frac{#@}{#&}'-style templates put the
  // cursor at the very start of the whole expression instead of inside the
  // new structure, specifically when the #@ and #& captures have the same
  // text. Root cause: '#@^{#&}' parses to *five* top-level atoms --
  // ['1','2','3','4', subsup] -- with the exponent living in the trailing
  // `subsup` atom's own branch, not fused onto the last base digit. A
  // content-matching search over contiguous atom runs finds the digits
  // '1','2','3','4' (i.e. #@'s own content, excluding the subsup atom) just
  // as validly as the real target inside the subsup's branch, and returns
  // whichever it reaches first.

  test('X_POWER_BY_Y with identical base and exponent text', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '12341234', 4, String.raw`#@^{#&}`);
    expect(value).toBe(String.raw`1234^{Z1234}`);
  });

  test('FRACTION with identical numerator and denominator text', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '1212', 2, String.raw`\frac{#@}{#&}`);
    expect(value).toBe(String.raw`\frac{12}{Z12}`);
  });

  test('Y_ROOT_OF_X with identical index and radicand text', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await insertAt(page, '33', 1, String.raw`\sqrt[#@]{#&}`);
    expect(value).toBe(String.raw`\sqrt[3]{Z3}`);
  });

  test('LOG_A_OF_X with identical selection (#0) and after (#&) text', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '3434';
      mfe.selection = { ranges: [[0, 2]], direction: 'forward' };
      mfe.executeCommand(['insert', '\\log_{#0} (#&)']);
      mfe.executeCommand(['insert', 'Z']);
      return mfe.value;
    });
    expect(value).toBe(String.raw`\log_{34}(Z34)`);
  });

  test('the internal marker character never leaks into the final value', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const values = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      const out: string[] = [];
      for (const [value, position, template] of [
        ['12341234', 4, '#@^{#&}'],
        ['1212', 2, '\\frac{#@}{#&}'],
        ['1234', 2, '\\sqrt{#&}'],
      ] as const) {
        mfe.value = value;
        mfe.position = position;
        mfe.executeCommand(['insert', template]);
        out.push(mfe.value);
      }
      return out;
    });
    for (const value of values)
      expect(value.includes(String.fromCharCode(0xf8fe))).toBe(false);
  });
});
