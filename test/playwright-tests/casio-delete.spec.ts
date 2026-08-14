import type { MathfieldElement } from '../../src/public/mathfield-element';

import { test, expect, type Page } from '@playwright/test';

/**
 * BASELINE SPEC for the Casio-fx991EX-style delete behaviour.
 *
 * These tests describe the TARGET behaviour. They are written before the
 * implementation lands, so a number of them fail today - that failing set is
 * the baseline we are measuring against. See the run report for which ones.
 *
 * The rules being encoded:
 *
 *  R1  Backspace from just outside a structure's right edge enters its last
 *      branch AND deletes one atom (today it only navigates in).
 *  R2  When the caret sits on an empty branch, the press moves to the
 *      adjacent branch AND deletes one atom there (today it only navigates).
 *  R3  Moving *out* of a structure (from the start of its first branch to
 *      just before the structure) stays navigation-only - one press,
 *      nothing deleted.
 *  R4  If there is no deletable atom anywhere to the left of the caret,
 *      backspace deletes forward instead. Never a dead press.
 *  R5  Superscript / subscript dissolve at their branch start: the `^` / `_`
 *      is what gets deleted and the content is hoisted into the parent.
 *      Same as `\sqrt`, `\repeatingpart`, `\boxed`.
 *  R6  Teardown thresholds: `\frac` dissolves as soon as one branch empties
 *      (hoisting the other); `\mixfraction` walks branch by branch and only
 *      disappears once all three are empty.
 *
 * Precedence at the start of a branch: structure-specific dissolve (R5/R6)
 * first, then step-out (R3) if there is something deletable further left,
 * otherwise forward-delete (R4).
 *
 * NOTE for implementation time: the two `\repeatingpart` tests in
 * `delete-keep-placeholder.spec.ts` assert the pre-R1 behaviour and must be
 * flipped to match the `\repeatingpart` cases below.
 *
 * Marker notation, matching the notation used in the feature request:
 *   `|`     collapsed caret
 *   `[...]` a selection (an emptied branch leaves its placeholder selected,
 *           which renders as `[]` once the markers replace it)
 */

type Step = { value: string; marked: string };

/**
 * Replay `presses` keystrokes starting from a marked latex string such as
 * `'123^{|45}'` or `'\\frac{12}{34}|'`, and return the state after each press.
 *
 * The caret is located by scanning every offset for the one whose marked
 * rendering matches `start`, so the input notation is exactly the notation
 * used in the expectations.
 */
async function replay(
  page: Page,
  start: string,
  presses: number,
  command: string = 'deleteBackward'
): Promise<Step[]> {
  await page.goto('/dist/playwright-test-page/');

  return page.locator('#mf-1').evaluate(
    (
      mfe: MathfieldElement,
      opts: { start: string; presses: number; command: string }
    ) => {
      const scratch = new (mfe.constructor as any)();
      scratch.style.position = 'absolute';
      scratch.style.left = '-9999px';
      scratch.style.visibility = 'hidden';
      document.body.appendChild(scratch);

      // Render the current value with the caret / selection marked, by
      // replaying the markers into a throwaway field. Splicing the string
      // directly does not work: a range that reaches into a nested branch
      // loses its enclosing braces.
      const marked = (): string => {
        scratch.value = mfe.value;
        const insert = (offset: number, m: string) => {
          scratch.position = offset;
          scratch.executeCommand([
            'insert',
            m,
            {
              silenceNotifications: true,
              focus: false,
              selectionMode: 'before',
            },
          ]);
        };
        // Right to left, so an earlier insertion never shifts an offset that
        // is still waiting to be marked.
        const ranges = (mfe.selection.ranges as [number, number][])
          .map(([a, b]) => [Math.min(a, b), Math.max(a, b)])
          .sort((a, b) => b[0] - a[0]);
        for (const [from, to] of ranges) {
          if (from === to) insert(from, '|');
          else {
            insert(to, ']');
            insert(from, '[');
          }
        }
        return scratch.value;
      };

      try {
        mfe.value = opts.start.replace(/\|/g, '');

        let placed = false;
        for (let i = 0; i <= mfe.lastOffset; i++) {
          mfe.position = i;
          if (marked() === opts.start) {
            placed = true;
            break;
          }
        }
        if (!placed) {
          throw new Error(
            `could not place the caret to render "${opts.start}" ` +
              `(value is "${mfe.value}")`
          );
        }

        const steps: Step[] = [];
        for (let i = 0; i < opts.presses; i++) {
          mfe.executeCommand([opts.command]);
          steps.push({ value: mfe.value, marked: marked() });
        }
        return steps;
      } finally {
        scratch.remove();
      }
    },
    { start, presses, command }
  );
}

/** Convenience: assert the whole `marked` trace at once - readable diffs. */
function expectTrace(steps: Step[], expected: string[]): void {
  expect(steps.map((s) => s.marked)).toEqual(expected);
}

/** Convenience: assert the whole `value` trace at once. */
function expectValues(steps: Step[], expected: string[]): void {
  expect(steps.map((s) => s.value)).toEqual(expected);
}

/** Run a movement command `times` times from `startPos`, collecting positions. */
async function move(
  page: Page,
  latex: string,
  startPos: number | 'last',
  command: string,
  times: number
): Promise<{ positions: number[]; lastOffset: number }> {
  await page.goto('/dist/playwright-test-page/');

  return page.locator('#mf-1').evaluate(
    (
      mfe: MathfieldElement,
      opts: {
        latex: string;
        startPos: number | 'last';
        command: string;
        times: number;
      }
    ) => {
      mfe.value = opts.latex;
      mfe.position =
        opts.startPos === 'last' ? mfe.lastOffset : (opts.startPos as number);
      const positions: number[] = [];
      for (let i = 0; i < opts.times; i++) {
        mfe.executeCommand([opts.command]);
        positions.push(mfe.position);
      }
      return { positions, lastOffset: mfe.lastOffset };
    },
    { latex, startPos, command, times }
  );
}

// ---------------------------------------------------------------------------
// ex1 - superscript dissolves at its branch start
// ---------------------------------------------------------------------------

test.describe('ex1 - superscript dissolves at branch start (R5)', () => {
  test('123^{|45} + delete hoists the exponent into the base', async ({
    page,
  }) => {
    const steps = await replay(page, '123^{|45}', 1);
    expectValues(steps, ['12345']);
    expectTrace(steps, ['123|45']);
  });

  test('the caret lands before the hoisted content, so typing continues there', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => {
        mfe.value = '123^{45}';
        mfe.position = 4; // 123^{|45}
        mfe.executeCommand(['deleteBackward']);
        mfe.executeCommand(['insert', '9']);
        return mfe.value;
      });
    expect(value).toBe('123945');
  });

  test('single-atom exponent: 1+2^{|3} + delete', async ({ page }) => {
    const steps = await replay(page, '1+2^{|3}', 1);
    expectValues(steps, ['1+23']);
    expectTrace(steps, ['1+2|3']);
  });
});

// ---------------------------------------------------------------------------
// ex2 / ex3 - backspace from outside a structure enters AND deletes
// ---------------------------------------------------------------------------

test.describe('ex2 - backspace into a structure deletes as it enters (R1)', () => {
  test('123^4+5| x3 -> 123^{[placeholder]}', async ({ page }) => {
    const steps = await replay(page, '123^4+5|', 3);
    expectValues(steps, ['123^4+', '123^4', '123^{\\placeholder{}}']);
    expectTrace(steps, ['123^4+|', '123^4|', '123^{[]}']);
  });

  test('123^4+5| x5 tears the whole thing down', async ({ page }) => {
    const steps = await replay(page, '123^4+5|', 5);
    expectValues(steps, [
      '123^4+',
      '123^4',
      '123^{\\placeholder{}}',
      '123',
      '12',
    ]);
  });

  // ex3 in the request duplicated ex2 verbatim; this is the case it could not
  // distinguish - a multi-atom exponent proves R1 deletes ONE atom rather
  // than clearing the whole branch.
  test('123^{45}+5| x3 deletes one exponent atom, not the whole branch', async ({
    page,
  }) => {
    const steps = await replay(page, '123^{45}+5|', 3);
    expectValues(steps, ['123^{45}+', '123^{45}', '123^4']);
    expectTrace(steps, ['123^{45}+|', '123^{45}|', '123^{4|}']);
  });

  test('123^{45}| x1', async ({ page }) => {
    const steps = await replay(page, '123^{45}|', 1);
    expectValues(steps, ['123^4']);
    expectTrace(steps, ['123^{4|}']);
  });

  test('\\sqrt: 1+\\sqrt{123}| x1', async ({ page }) => {
    const steps = await replay(page, '1+\\sqrt{123}|', 1);
    expectValues(steps, ['1+\\sqrt{12}']);
    expectTrace(steps, ['1+\\sqrt{12|}']);
  });

  test('\\frac: \\frac{12}{34}| x1 enters the denominator and deletes', async ({
    page,
  }) => {
    const steps = await replay(page, '\\frac{12}{34}|', 1);
    expectValues(steps, ['\\frac{12}{3}']);
    expectTrace(steps, ['\\frac{12}{3|}']);
  });

  test('\\repeatingpart: 1+\\repeatingpart{123}| x1', async ({ page }) => {
    const steps = await replay(page, '1+\\repeatingpart{123}|', 1);
    expectValues(steps, ['1+\\repeatingpart{12}']);
    expectTrace(steps, ['1+\\repeatingpart{12|}']);
  });
});

// ---------------------------------------------------------------------------
// ex4 - auto delete right when there is nothing on the left
// ---------------------------------------------------------------------------

test.describe('ex4 - auto delete right (R4)', () => {
  test('|12345 + delete removes the character on the right', async ({
    page,
  }) => {
    const steps = await replay(page, '|12345', 1);
    expectValues(steps, ['2345']);
    expectTrace(steps, ['|2345']);
  });

  test('|12345 x5 empties the field one char at a time', async ({ page }) => {
    const steps = await replay(page, '|12345', 5);
    expectValues(steps, ['2345', '345', '45', '5', '']);
  });

  test('\\frac{|12}{34} full teardown', async ({ page }) => {
    const steps = await replay(page, '\\frac{|12}{34}', 5);
    expectValues(steps, [
      '\\frac{2}{34}',
      '\\frac{\\placeholder{}}{34}',
      '34',
      '4',
      '',
    ]);
    expectTrace(steps, [
      '\\frac{|2}{34}',
      '\\frac{[]}{34}',
      '|34',
      '|4',
      '|',
    ]);
  });

  test('|\\frac{12}{34} + delete descends into the numerator', async ({
    page,
  }) => {
    const steps = await replay(page, '|\\frac{12}{34}', 1);
    expectValues(steps, ['\\frac{2}{34}']);
    expectTrace(steps, ['\\frac{|2}{34}']);
  });

  test('an empty field absorbs delete without changing or throwing', async ({
    page,
  }) => {
    const steps = await replay(page, '|', 3);
    expectValues(steps, ['', '', '']);
  });

  test('R4 does not fire when there IS something deletable to the left', async ({
    page,
  }) => {
    // The `+` is deletable, so this steps out instead of eating the `2`.
    const steps = await replay(page, '1+\\frac{|23}{45}', 1);
    expectValues(steps, ['1+\\frac{23}{45}']);
    expectTrace(steps, ['1+|\\frac{23}{45}']);
  });
});

// ---------------------------------------------------------------------------
// ex5 - \mixfraction teardown
// ---------------------------------------------------------------------------

test.describe('ex5 - \\mixfraction teardown (R2, R6)', () => {
  test('\\mixfraction{1}{2}{3}| walks the branches right to left', async ({
    page,
  }) => {
    const steps = await replay(page, '\\mixfraction{1}{2}{3}|', 4);
    expectValues(steps, [
      '\\mixfraction{1}{2}{\\placeholder{}}',
      '\\mixfraction{1}{\\placeholder{}}{\\placeholder{}}',
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{\\placeholder{}}',
      '',
    ]);
    expectTrace(steps, [
      '\\mixfraction{1}{2}{[]}',
      '\\mixfraction{1}{[]}{\\placeholder{}}',
      '\\mixfraction{[]}{\\placeholder{}}{\\placeholder{}}',
      '|',
    ]);
  });

  test('1+\\mixfraction{|2}{3}{4} steps out, then tears down left to right', async ({
    page,
  }) => {
    const steps = await replay(page, '1+\\mixfraction{|2}{3}{4}', 7);
    expectValues(steps, [
      '1+\\mixfraction{2}{3}{4}',
      '1\\mixfraction{2}{3}{4}',
      '\\mixfraction{2}{3}{4}',
      '\\mixfraction{\\placeholder{}}{3}{4}',
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{4}',
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{\\placeholder{}}',
      '',
    ]);
    expectTrace(steps, [
      '1+|\\mixfraction{2}{3}{4}',
      '1|\\mixfraction{2}{3}{4}',
      '|\\mixfraction{2}{3}{4}',
      '\\mixfraction{[]}{3}{4}',
      '\\mixfraction{\\placeholder{}}{[]}{4}',
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{[]}',
      '|',
    ]);
  });

  test('multi-atom branches lose one atom per press', async ({ page }) => {
    const steps = await replay(page, '\\mixfraction{12}{34}{56}|', 4);
    expectValues(steps, [
      '\\mixfraction{12}{34}{5}',
      '\\mixfraction{12}{34}{\\placeholder{}}',
      '\\mixfraction{12}{3}{\\placeholder{}}',
      '\\mixfraction{12}{\\placeholder{}}{\\placeholder{}}',
    ]);
  });

  test('from the start of the numerator, delete crosses into the whole part and removes one atom', async ({
    page,
  }) => {
    // Crossing a branch boundary fuses with a delete, exactly as it does at
    // the other edge in ex5a. Only *leaving* the structure is navigation-only.
    const steps = await replay(page, '\\mixfraction{12}{|34}{5}', 2);
    expectValues(steps, [
      '\\mixfraction{1}{34}{5}',
      '\\mixfraction{\\placeholder{}}{34}{5}',
    ]);
    expectTrace(steps, [
      '\\mixfraction{1|}{34}{5}',
      '\\mixfraction{[]}{34}{5}',
    ]);
  });

  test('a press never skips over a branch that is already empty', async ({
    page,
  }) => {
    // Once the branches to the left are empty there is nothing to delete
    // that way, so the caret walks right one branch per press, removing an
    // atom only when it reaches a branch that still has content.
    const steps = await replay(page, '\\mixfraction{1}{2|}{3}', 4);
    expectValues(steps, [
      '\\mixfraction{1}{\\placeholder{}}{3}',
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{3}',
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{3}',
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{\\placeholder{}}',
    ]);
    expectTrace(steps, [
      '\\mixfraction{1}{[]}{3}',
      '\\mixfraction{[]}{\\placeholder{}}{3}',
      '\\mixfraction{\\placeholder{}}{[]}{3}',
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{[]}',
    ]);
  });

  test('a fifth press then clears the emptied mixfraction', async ({ page }) => {
    const steps = await replay(page, '\\mixfraction{1}{2|}{3}', 5);
    expect(steps[4].value).toBe('');
  });

  test('with content to the left, the caret walks left one branch per press', async ({
    page,
  }) => {
    // Same shape, but the `9+` gives the leftward walk somewhere to go: the
    // third press steps out of the mixfraction towards it instead of
    // turning around and deleting forward.
    const steps = await replay(page, '9+\\mixfraction{1}{2|}{3}', 3);
    expectValues(steps, [
      '9+\\mixfraction{1}{\\placeholder{}}{3}',
      '9+\\mixfraction{\\placeholder{}}{\\placeholder{}}{3}',
      '9+\\mixfraction{\\placeholder{}}{\\placeholder{}}{3}',
    ]);
    expectTrace(steps, [
      '9+\\mixfraction{1}{[]}{3}',
      '9+\\mixfraction{[]}{\\placeholder{}}{3}',
      '9+|\\mixfraction{\\placeholder{}}{\\placeholder{}}{3}',
    ]);
  });

  test('emptying a branch never dissolves the mixfraction while another has content', async ({
    page,
  }) => {
    const steps = await replay(page, '\\mixfraction{1}{|2}{3}', 1);
    expectValues(steps, ['\\mixfraction{\\placeholder{}}{2}{3}']);
    expectTrace(steps, ['\\mixfraction{[]}{2}{3}']);
  });
});

// ---------------------------------------------------------------------------
// R5 - dissolve at branch start, across every structure that has an
// introducing operator
// ---------------------------------------------------------------------------

test.describe('R5 - dissolve at branch start', () => {
  test('subscript: 1+x_{|45} hoists the subscript', async ({ page }) => {
    const steps = await replay(page, '1+x_{|45}', 1);
    expectValues(steps, ['1+x45']);
    expectTrace(steps, ['1+x|45']);
  });

  test('\\sqrt already dissolves: 1+\\sqrt{|45}', async ({ page }) => {
    const steps = await replay(page, '1+\\sqrt{|45}', 1);
    expectValues(steps, ['1+45']);
    expectTrace(steps, ['1+|45']);
  });

  test('\\repeatingpart dissolves like \\sqrt: 1+\\repeatingpart{|123}', async ({
    page,
  }) => {
    const steps = await replay(page, '1+\\repeatingpart{|123}', 1);
    expectValues(steps, ['1+123']);
    expectTrace(steps, ['1+|123']);
  });

  test('\\repeatingpart never traps the caret at the end of its own body', async ({
    page,
  }) => {
    // Regression for the current bug: backspacing at the body start used to
    // teleport the caret to `\repeatingpart{123|}`.
    const steps = await replay(page, '1+\\repeatingpart{|123}', 1);
    expect(steps[0].marked).not.toBe('1+\\repeatingpart{123|}');
  });

  test('\\boxed already dissolves: 1+\\boxed{|45}', async ({ page }) => {
    const steps = await replay(page, '1+\\boxed{|45}', 1);
    expectValues(steps, ['1+45']);
    expectTrace(steps, ['1+|45']);
  });

  test('an emptied superscript dissolves the carrier entirely', async ({
    page,
  }) => {
    const steps = await replay(page, '123^{45}|', 3);
    expectValues(steps, ['123^4', '123^{\\placeholder{}}', '123']);
  });
});

// ---------------------------------------------------------------------------
// R3 - stepping out of a structure is navigation-only
// ---------------------------------------------------------------------------

test.describe('R3 - stepping out deletes nothing', () => {
  test('\\frac numerator start', async ({ page }) => {
    const steps = await replay(page, '1+\\frac{|12}{34}', 1);
    expectValues(steps, ['1+\\frac{12}{34}']);
    expectTrace(steps, ['1+|\\frac{12}{34}']);
  });

  test('\\mixfraction whole-number start', async ({ page }) => {
    const steps = await replay(page, '1+\\mixfraction{|2}{3}{4}', 1);
    expectValues(steps, ['1+\\mixfraction{2}{3}{4}']);
    expectTrace(steps, ['1+|\\mixfraction{2}{3}{4}']);
  });

  test('\\sqrt index does NOT dissolve - it steps out', async ({ page }) => {
    const steps = await replay(page, '1+\\sqrt[|3]{8}', 1);
    expectValues(steps, ['1+\\sqrt[3]{8}']);
    expectTrace(steps, ['1+|\\sqrt[3]{8}']);
  });

  test('a step-out is followed by an ordinary delete on the next press', async ({
    page,
  }) => {
    const steps = await replay(page, '1+\\frac{|12}{34}', 2);
    expectValues(steps, ['1+\\frac{12}{34}', '1\\frac{12}{34}']);
    expectTrace(steps, ['1+|\\frac{12}{34}', '1|\\frac{12}{34}']);
  });
});

// ---------------------------------------------------------------------------
// R6 - teardown thresholds
// ---------------------------------------------------------------------------

test.describe('R6 - teardown thresholds', () => {
  test('\\frac dissolves as soon as the denominator empties, hoisting the numerator', async ({
    page,
  }) => {
    const steps = await replay(page, '\\frac{2}{3}|', 2);
    expectValues(steps, ['\\frac{2}{\\placeholder{}}', '2']);
    expectTrace(steps, ['\\frac{2}{[]}', '2|']);
  });

  test('\\frac dissolves when the numerator empties, hoisting the denominator', async ({
    page,
  }) => {
    const steps = await replay(page, '\\frac{|2}{34}', 2);
    expectValues(steps, ['\\frac{\\placeholder{}}{34}', '34']);
    expectTrace(steps, ['\\frac{[]}{34}', '|34']);
  });

  test('\\mixfraction survives two empty branches and dies on the third', async ({
    page,
  }) => {
    const steps = await replay(page, '\\mixfraction{1}{2}{3}|', 4);
    expect(steps[2].value).toBe(
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{\\placeholder{}}'
    );
    expect(steps[3].value).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Property: no dead presses
// ---------------------------------------------------------------------------

test.describe('property - every press changes something', () => {
  for (const latex of [
    '12345',
    '123^4+5',
    '\\frac{12}{34}',
    '\\mixfraction{1}{2}{3}',
    '1+\\sqrt{25}',
    '1+\\frac{12}{34}+x^2',
  ]) {
    test(`from the end of "${latex}", delete reaches empty with no repeats`, async ({
      page,
    }) => {
      const steps = await replay(page, `${latex}|`, 40);
      // Locate the first press that produced an empty field.
      const done = steps.findIndex((s) => s.value === '');
      expect(done, `never reached an empty field: ${JSON.stringify(steps)}`).
        toBeGreaterThanOrEqual(0);
      const meaningful = steps.slice(0, done + 1);
      for (let i = 1; i < meaningful.length; i++) {
        expect(
          meaningful[i].marked,
          `press #${i + 1} was a dead press`
        ).not.toBe(meaningful[i - 1].marked);
      }
    });

    test(`from the start of "${latex}", delete reaches empty with no repeats`, async ({
      page,
    }) => {
      const steps = await replay(page, `|${latex}`, 40);
      const done = steps.findIndex((s) => s.value === '');
      expect(done, `never reached an empty field: ${JSON.stringify(steps)}`).
        toBeGreaterThanOrEqual(0);
      const meaningful = steps.slice(0, done + 1);
      for (let i = 1; i < meaningful.length; i++) {
        expect(
          meaningful[i].marked,
          `press #${i + 1} was a dead press`
        ).not.toBe(meaningful[i - 1].marked);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test.describe('edge cases', () => {
  test('nested fraction at the leftmost position forward-deletes in place', async ({
    page,
  }) => {
    const steps = await replay(page, '\\frac{\\frac{|1}{2}}{3}', 1);
    expectValues(steps, ['\\frac{\\frac{\\placeholder{}}{2}}{3}']);
    expectTrace(steps, ['\\frac{\\frac{[]}{2}}{3}']);
  });

  test('\\sqrt at the leftmost position still dissolves rather than forward-deleting', async ({
    page,
  }) => {
    // R5 outranks R4.
    const steps = await replay(page, '\\sqrt{|12}', 1);
    expectValues(steps, ['12']);
    expectTrace(steps, ['|12']);
  });

  test('single atom: 1| + delete empties the field', async ({ page }) => {
    const steps = await replay(page, '1|', 2);
    expectValues(steps, ['', '']);
  });

  test('deleting a non-collapsed selection is unaffected', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => {
        mfe.value = '12345';
        mfe.selection = { ranges: [[1, 3]] } as any;
        mfe.executeCommand(['deleteBackward']);
        return mfe.value;
      });
    expect(value).toBe('145');
  });

  test('undo restores the state before a fused enter-and-delete', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const result = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => {
        mfe.value = '\\mixfraction{1}{2}{3}';
        mfe.position = mfe.lastOffset;
        mfe.executeCommand(['deleteBackward']);
        const after = mfe.value;
        mfe.executeCommand(['undo']);
        return { after, undone: mfe.value };
      });
    expect(result.after).toBe('\\mixfraction{1}{2}{\\placeholder{}}');
    expect(result.undone).toBe('\\mixfraction{1}{2}{3}');
  });

  test('typing after an auto-delete-right inserts at the caret', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => {
        mfe.value = '12345';
        mfe.position = 0;
        mfe.executeCommand(['deleteBackward']); // -> 2345
        mfe.executeCommand(['insert', '9']);
        return mfe.value;
      });
    expect(value).toBe('92345');
  });

  test('sup and sub on the same base: dissolving the sub keeps the sup', async ({
    page,
  }) => {
    // `x^{45}_{6}` normalises to `x_6^{45}`; the sub is the first branch.
    const steps = await replay(page, 'x_{|6}^{45}', 1);
    expectValues(steps, ['x^{45}6']);
  });

  test('R1 does not apply to \\left(...\\right): the closing delimiter IS the atom on the left', async ({
    page,
  }) => {
    // Nothing is "entered" here - the `)` is an ordinary atom to the left of
    // the caret, so rule 1 (plain backspace) applies and drops it. This is
    // what a Casio does too.
    const steps = await replay(page, '1+(12)|', 4);
    expectValues(steps, ['1+(12', '1+(1', '1+(', '1+']);
    expectTrace(steps, ['1+(12|', '1+(1|', '1+(|', '1+|']);
  });
});

// ---------------------------------------------------------------------------
// Regression - behaviour that must survive the change
// ---------------------------------------------------------------------------

test.describe('regression - must not change', () => {
  test('\\frac denominator start still hoists both branches', async ({
    page,
  }) => {
    const steps = await replay(page, '1+\\frac{12}{|34}', 1);
    expectValues(steps, ['1+1234']);
    expectTrace(steps, ['1+12|34']);
  });

  test('\\operatorname stays atomic - one backspace removes it whole', async ({
    page,
  }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => {
        mfe.value = 'x\\operatorname{abc}y';
        mfe.position = 6;
        mfe.executeCommand(['deleteBackward']);
        return mfe.value;
      });
    expect(value).toBe('xy');
  });

  test('\\int bound still keeps a placeholder', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');
    const value = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => {
        mfe.value = '\\int_{0}^{\\infty}';
        mfe.position = 4;
        mfe.executeCommand(['deleteBackward']);
        return mfe.value;
      });
    expect(value).toBe('\\int_{\\placeholder{}}^{\\infty}');
  });

  test('deleteForward is unchanged from the middle of a run', async ({
    page,
  }) => {
    const steps = await replay(page, '12|345', 2, 'deleteForward');
    expectValues(steps, ['1245', '125']);
  });
});

// ---------------------------------------------------------------------------
// The physical Backspace key, not just the command
// ---------------------------------------------------------------------------

test.describe('real keystrokes', () => {
  /** Press Backspace `n` times for real, from a caret at `position`. */
  async function backspace(
    page: Page,
    latex: string,
    position: number | 'last',
    presses: number
  ): Promise<string> {
    await page.goto('/dist/playwright-test-page/');
    await page.locator('#mf-1').click();
    await page.waitForTimeout(100); // let the focus state settle
    await page.locator('#mf-1').evaluate(
      (mfe: MathfieldElement, opts: { latex: string; position: number | 'last' }) => {
        mfe.value = opts.latex;
        mfe.position =
          opts.position === 'last' ? mfe.lastOffset : (opts.position as number);
      },
      { latex, position }
    );
    for (let i = 0; i < presses; i++) await page.keyboard.press('Backspace');
    return page.locator('#mf-1').evaluate((mfe: MathfieldElement) => mfe.value);
  }

  test('ex1 via the Backspace key', async ({ page }) => {
    expect(await backspace(page, '123^{45}', 4, 1)).toBe('12345');
  });

  test('ex2 via the Backspace key', async ({ page }) => {
    expect(await backspace(page, '123^4+5', 'last', 3)).toBe(
      '123^{\\placeholder{}}'
    );
  });

  test('ex4 auto-delete-right via the Backspace key', async ({ page }) => {
    expect(await backspace(page, '12345', 0, 2)).toBe('345');
  });

  test('ex5 \\mixfraction teardown via the Backspace key', async ({ page }) => {
    expect(await backspace(page, '\\mixfraction{1}{2}{3}', 'last', 3)).toBe(
      '\\mixfraction{\\placeholder{}}{\\placeholder{}}{\\placeholder{}}'
    );
  });

  test('a fourth Backspace clears the emptied \\mixfraction', async ({
    page,
  }) => {
    expect(await backspace(page, '\\mixfraction{1}{2}{3}', 'last', 4)).toBe('');
  });

  test('typing after a delete still works', async ({ page }) => {
    await page.goto('/dist/playwright-test-page/');
    await page.locator('#mf-1').click();
    await page.locator('#mf-1').evaluate((mfe: MathfieldElement) => {
      mfe.value = '123^{45}';
      mfe.position = 4;
    });
    await page.keyboard.press('Backspace');
    await page.keyboard.type('9');
    const value = await page
      .locator('#mf-1')
      .evaluate((mfe: MathfieldElement) => mfe.value);
    expect(value).toBe('123945');
  });
});

// ---------------------------------------------------------------------------
// moveToPreviousCharLoop / moveToNextCharLoop
// ---------------------------------------------------------------------------

test.describe('moveToNextCharLoop / moveToPreviousCharLoop', () => {
  test('moveToNextCharLoop wraps from the end to the start', async ({
    page,
  }) => {
    const { positions, lastOffset } = await move(
      page,
      '12',
      'last',
      'moveToNextCharLoop',
      1
    );
    expect(lastOffset).toBe(2);
    expect(positions).toEqual([0]);
  });

  test('moveToPreviousCharLoop wraps from the start to the end', async ({
    page,
  }) => {
    const { positions, lastOffset } = await move(
      page,
      '12',
      0,
      'moveToPreviousCharLoop',
      1
    );
    expect(lastOffset).toBe(2);
    expect(positions).toEqual([2]);
  });

  test('away from the boundaries it behaves like moveToNextChar', async ({
    page,
  }) => {
    const { positions } = await move(page, '123', 0, 'moveToNextCharLoop', 3);
    expect(positions).toEqual([1, 2, 3]);
  });

  test('away from the boundaries it behaves like moveToPreviousChar', async ({
    page,
  }) => {
    const { positions } = await move(
      page,
      '123',
      'last',
      'moveToPreviousCharLoop',
      3
    );
    expect(positions).toEqual([2, 1, 0]);
  });

  test('it loops forever rather than stopping at the end', async ({ page }) => {
    const { positions } = await move(page, '12', 0, 'moveToNextCharLoop', 5);
    expect(positions).toEqual([1, 2, 0, 1, 2]);
  });

  test('it loops backwards forever too', async ({ page }) => {
    const { positions } = await move(
      page,
      '12',
      0,
      'moveToPreviousCharLoop',
      5
    );
    expect(positions).toEqual([2, 1, 0, 2, 1]);
  });

  test('the loop visits every position inside a structure', async ({
    page,
  }) => {
    const { positions, lastOffset } = await move(
      page,
      '\\frac{1}{2}',
      0,
      'moveToNextCharLoop',
      6
    );
    // One full lap, then back to the start.
    expect(positions.slice(0, lastOffset)).toEqual(
      Array.from({ length: lastOffset }, (_, i) => i + 1)
    );
    expect(positions[lastOffset]).toBe(0);
  });

  test('an empty field stays at 0 in both directions', async ({ page }) => {
    const next = await move(page, '', 0, 'moveToNextCharLoop', 2);
    const prev = await move(page, '', 0, 'moveToPreviousCharLoop', 2);
    expect(next.positions).toEqual([0, 0]);
    expect(prev.positions).toEqual([0, 0]);
  });

  test('the non-looping commands still stop at the boundaries', async ({
    page,
  }) => {
    const next = await move(page, '12', 'last', 'moveToNextChar', 1);
    const prev = await move(page, '12', 0, 'moveToPreviousChar', 1);
    expect(next.positions).toEqual([2]);
    expect(prev.positions).toEqual([0]);
  });
});
