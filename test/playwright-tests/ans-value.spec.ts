import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect } from '@playwright/test';

// Fork feature: `\variable{Ans}` renders the value previously set via
// `mf.setAnsValue(latex)` inside a boxed `.ML__ans-value` element
// (src/atoms/variable.ts). setAnsValue() triggers an explicit rerender
// (src/editor-mathfield/mathfield-private.ts), fixed by commit b2e075b0
// ("not rerender when setAns value").
//
// These assertions check what actually renders inside the box, not just
// whether the box element exists -- a box that always rendered blank (or
// the same fixed content regardless of the ans value) would still pass a
// bare "does .ML__ans-value exist" check.

test.describe('setAnsValue', () => {
  test('renders the ans value as its literal text for a plain decimal', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const text = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\variable{Ans}';
      mfe.setAnsValue('3.14');
      return mfe.shadowRoot!.querySelector('.ML__ans-value')?.textContent;
    });

    expect(text).toBe('3.14');
  });

  test('renders the ans value as an actual fraction structure, not raw latex', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const html = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\variable{Ans}';
      mfe.setAnsValue('\\frac{1}{2}');
      return mfe.shadowRoot!.querySelector('.ML__ans-value')?.innerHTML;
    });

    expect(html).toContain('ML__mfrac');
    expect(html).toContain('<span class="ML__cmr">1</span>');
    expect(html).toContain('<span class="ML__cmr">2</span>');
    expect(html).not.toContain('\\frac');
  });

  test('re-rendering with a different ans value changes the displayed content', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\variable{Ans}';
      mfe.setAnsValue('3.14');
      const first = mfe.shadowRoot!.querySelector('.ML__ans-value')?.textContent;
      mfe.setAnsValue('x+y');
      const second = mfe.shadowRoot!.querySelector('.ML__ans-value')?.textContent;
      return { first, second };
    });

    expect(result.first).toBe('3.14');
    expect(result.second).toBe('x+y');
  });

  test('no .ML__ans-value box before setAnsValue is called', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const hasAnsBoxBefore = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => {
        mfe.value = '\\variable{Ans}';
        return !!mfe.shadowRoot!.querySelector('.ML__ans-value');
      });

    expect(hasAnsBoxBefore).toBe(false);
  });

  test('calling setAnsValue() with no argument clears the ans box and rerenders', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');

    const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\variable{Ans}';
      mfe.setAnsValue('\\frac{1}{2}');
      const before = !!mfe.shadowRoot!.querySelector('.ML__ans-value');
      mfe.setAnsValue();
      const after = !!mfe.shadowRoot!.querySelector('.ML__ans-value');
      return { before, after };
    });

    expect(result.before).toBe(true);
    expect(result.after).toBe(false);
  });

  test('an unrelated \\variable{a} never picks up the ans value', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');

    const result = await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '\\variable{a}';
      mfe.setAnsValue('\\frac{1}{2}');
      return {
        hasAnsBox: !!mfe.shadowRoot!.querySelector('.ML__ans-value'),
        text: mfe.shadowRoot!.querySelector('.ML__base')?.textContent,
      };
    });

    expect(result.hasAnsBox).toBe(false);
    expect(result.text).toBe('a');
  });
});
