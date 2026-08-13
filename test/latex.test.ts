import {
  convertLatexToMarkup,
  validateLatex,
} from '../src/public/mathlive-ssr';
import { parseLatex } from '../src/core/parser';
import { Atom } from '../src/core/atom-class';

function markupAndError(formula: string): [string, string] {
  const markup = convertLatexToMarkup(formula, { defaultMode: 'math' });
  const errors = validateLatex(formula);
  if (errors.length === 0) return [markup, 'no-error'];
  return [markup, errors[0].code];
}

function error(expression: string) {
  const errors = validateLatex(expression);
  if (errors.length === 0) return 'no-error';
  return errors[0].code;
}

describe('BASIC PARSING', () => {
  test.each([
    'x',
    ' x ', // Spaces do not matter
    '%', // '%' is start of comment
    '% comment',
    'x % comment',
    'x',
    '-12',
    '1234|/@.`abcdefgzABCDEFGZ', // Basic literals
    'a b', // Spaces are ignored
    'ab', // Same as previous
    'a~b', // ~ is space, same as previous
    'a\\space b',
    '{a}b', // Group
    '{-}', // Operator in group
    '-a', // Spacing as unary operator
    'a-', // Spacing as postfix operator
    'a-b', // Spacing as infix operator
    'a\nb',
    'a=1}',
    'a=1{', // Syntax error
    'a=1{}', // Valid
  ])('%#/ %p renders correctly', (x) => {
    expect(markupAndError(x)).toMatchSnapshot();
  });
  // expect(error('a=1}}}}{{{{')).toMatch('unbalanced-braces');
});

describe('CHARACTERS', () => {
  const ref = convertLatexToMarkup('J0');
  test.each([
    '^^4a0',
    '^^^^004a0',
    '\\char"4A 0',
    "\\char'0112 0",
    '\\char74 0',
    '\\char "004A 0',
    '\\char`J 0',
    '\\char`\\J 0',
    '\\char `\\J 0',
    '\\char   `\\J 0',
    '\\char +- +-  `\\J 0',
    '\\char +- -  `\\J 0',
    '\\char +- -- -++ `\\J 0',
    '\\unicode{"4A} 0',
    '\\unicode{"004A} 0',
    '\\unicode{x004A} 0',
  ])('%#/ %p renders as "J0"', (x) => {
    expect(convertLatexToMarkup(x)).toEqual(ref);
  });
});
describe('EXPANSION PRIMITIVES', () => {
  test.each([
    // ['\\obeyspaces =   =', '=\\space\\space\\space='],
    ['\\csname alpha\\endcsname', '\\alpha'],
    ['\\csname alph\\char"41\\endcsname', '\\alph A'],
    ['=\\sqrt\\bgroup x \\egroup=', '=\\sqrt{x}='],
    ['\\string\\alpha', '\\backslash alpha'],
    ['#?', '\\placeholder{}'],
  ])('%#/ %p matches %p', (a, b) => {
    expect(convertLatexToMarkup(a)).toMatch(convertLatexToMarkup(b));
  });
});

describe('ARGUMENTS', () => {
  test.each([
    ['a^\\frac12', 'a^{\\frac{1}{2}}'],
    ['\\sqrt3^2', '\\sqrt{3}^{2}'],
    ['\\frac12', '\\frac{1}{2}'],
    ['\\frac  1  2', '\\frac{1}{2}'],
    ['\\frac357', '\\frac{3}{5}7'],
    ['\\frac3a', '\\frac{3}{a}'],
    ['\\frac\\alpha\\beta', '\\frac{\\alpha}{\\beta}'],
    // ['\\frac{{1}}{2}', '\\frac{1}{2}'],
    ['\\frac  {  { 1  } } { 2 }', '\\frac{{1}}{2}'],
  ])('%#/ %p matches %p', (a, b) => {
    expect(convertLatexToMarkup(a)).toMatch(convertLatexToMarkup(b));
  });
  test.each(['\\frac', '\\frac{}', '\\frac{}{}'])(
    '%#/ %p renders correctly',
    (x) => {
      expect(markupAndError(x)).toMatchSnapshot();
    }
  );
});

describe('INFIX COMMANDS', () => {
  test.each([
    ['a\\over b', '\\frac{a}{b}'],
    ['a\\over b c', '\\frac{a}{bc}'],
    ['x{a+1\\over1-b}y', 'x{\\frac{a+1}{1-b}}y'],
    ['x{a+1\\over1-b\\over2}y', 'x{a+1\\over1-b2}y'],
  ])('%#/ %p matches %p', (a, b) => {
    expect(convertLatexToMarkup(a)).toMatch(convertLatexToMarkup(b));
  });

  expect(error('a\\over b \\over c')).toMatch('too-many-infix-commands');
});

describe('VARIANT SERIALIZATION (issue #2867)', () => {
  function serialize(latex: string): string {
    const atoms = parseLatex(latex, { parseMode: 'math' });
    return Atom.serialize(atoms, { defaultMode: 'math' });
  }

  test.each([
    // Single digit superscripts/subscripts don't have braces
    ['\\mathbb{R}^{0}', '\\mathbb{R}^0'],
    ['\\mathbb{R}^0', '\\mathbb{R}^0'],
    ['\\mathbb{N}_{1}', '\\mathbb{N}_1'],
    ['\\mathcal{F}^{2}', '\\mathcal{F}^2'],
    // Single letter subscripts/superscripts keep braces
    ['\\mathfrak{g}_{n}', '\\mathfrak{g}_{n}'],
    // Multi-character subscripts/superscripts should have braces
    ['\\mathbb{R}^{10}', '\\mathbb{R}^{10}'],
    ['\\mathbb{N}_{abc}', '\\mathbb{N}_{abc}'],
  ])('%#/ %p serializes as %p', (input, expected) => {
    expect(serialize(input)).toBe(expected);
  });
});

describe('MATHRM SERIALIZATION (issue #2818)', () => {
  function serialize(latex: string): string {
    const atoms = parseLatex(latex, { parseMode: 'math' });
    return Atom.serialize(atoms, { defaultMode: 'math' });
  }

  test.each([
    // \mathrm should be preserved in latex-expanded format
    ['\\mathrm{d}', '\\mathrm{d}'],
    ['\\mathrm{dx}', '\\mathrm{dx}'],
    ['\\frac{\\mathrm{d}y}{\\mathrm{d}x}', '\\frac{\\mathrm{d}y}{\\mathrm{d}x}'],
    ['x\\mathrm{d}x', 'x\\mathrm{d}x'],
    ['a+\\mathrm{b}+c', 'a+\\mathrm{b}+c'],
    // Other upright variants should also work
    ['\\mathsf{A}', '\\mathsf{A}'],
    ['\\mathtt{code}', '\\mathtt{code}'],
  ])('%#/ %p serializes as %p', (input, expected) => {
    expect(serialize(input)).toBe(expected);
  });
});

describe('VALIDATE LATEX WITH MACROS', () => {
  test('custom macro is not flagged as unknown', () => {
    const errors = validateLatex('\\plimsoll', { macros: { plimsoll: '⦵' } });
    expect(errors).toHaveLength(0);
  });

  test('unknown command is still flagged without macros', () => {
    const errors = validateLatex('\\unknowncmd');
    expect(errors).toStrictEqual([expect.objectContaining({ code: 'unknown-command' })]);
  });

  test('unknown command is still flagged even with unrelated macros', () => {
    const errors = validateLatex('\\unknowncmd', { macros: { plimsoll: '⦵' } });
    expect(errors).toStrictEqual([expect.objectContaining({ code: 'unknown-command' })]);
  });
});

describe('ANS VALUE (fork feature)', () => {
  // `\variable{Ans}` renders the value passed via the `ansValue` option to
  // `convertLatexToMarkup`, wrapped in a `.ML__ans-value` box
  // (src/atoms/variable.ts, src/public/mathlive-ssr.ts). These assertions
  // check the actual rendered content of that box, not just its presence --
  // a box that always rendered blank (or the same fixed content) would still
  // pass a bare `toContain('ML__ans-value')` check.
  test('renders the ansValue LaTeX as an actual fraction, not raw text', () => {
    const markup = convertLatexToMarkup('\\variable{Ans}', {
      ansValue: '\\frac{1}{2}',
    });
    expect(markup).toContain('<span class="ML__ans-value">');
    // Must be a real rendered fraction structure, not the literal string.
    expect(markup).toContain('ML__mfrac');
    expect(markup).toContain('<span class="ML__cmr">1</span>');
    expect(markup).toContain('<span class="ML__cmr">2</span>');
    expect(markup).not.toContain('\\frac');
  });

  test('renders a plain decimal ansValue as its literal digits', () => {
    const markup = convertLatexToMarkup('\\variable{Ans}', { ansValue: '3.14' });
    expect(markup).toContain(
      '<span class="ML__ans-value"><span class="ML__cmr">3.14</span></span>'
    );
  });

  test('different ansValue inputs produce genuinely different markup', () => {
    const half = convertLatexToMarkup('\\variable{Ans}', { ansValue: '\\frac{1}{2}' });
    const pi = convertLatexToMarkup('\\variable{Ans}', { ansValue: '3.14' });
    const xy = convertLatexToMarkup('\\variable{Ans}', { ansValue: 'x+y' });

    expect(half).not.toBe(pi);
    expect(pi).not.toBe(xy);
    expect(half).not.toBe(xy);
    // 'x+y' renders as two mathit variables around a '+' operator, not text.
    expect(xy).toContain('<span class="ML__mathit">x</span>');
    expect(xy).toContain('<span class="ML__cmr">+</span>');
    expect(xy).toContain('ML__mathit" style="margin-right:0.04em">y</span>');
  });

  test('does not render a .ML__ans-value box without the ansValue option', () => {
    const markup = convertLatexToMarkup('\\variable{Ans}');
    expect(markup).not.toContain('ML__ans-value');
  });

  test('ansValue has zero effect on other \\variable{} contents', () => {
    const withAns = convertLatexToMarkup('\\variable{a}', { ansValue: '\\frac{1}{2}' });
    const withoutAns = convertLatexToMarkup('\\variable{a}');
    expect(withAns).not.toContain('ML__ans-value');
    // Setting an unrelated ansValue must not perturb this variable's markup.
    expect(withAns).toBe(withoutAns);
  });
});

describe('REST* ARGUMENT COMMANDS (issue #2570)', () => {
  // Commands with {:rest*} deferred arguments should handle braced arguments
  test.each([
    '\\bf{425}',
    '\\it{text}',
    '\\bfseries{bold}',
    '\\mdseries{medium}',
    '\\upshape{upright}',
    '\\slshape{slanted}',
    '\\scshape{small caps}',
    '\\rmfamily{roman}',
    '\\sffamily{sans-serif}',
    '\\ttfamily{monospace}',
  ])('%#/ %p renders correctly', (x) => {
    expect(markupAndError(x)).toMatchSnapshot();
  });
});
