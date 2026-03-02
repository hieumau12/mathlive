/**
 * MathLive Light — minimal build.
 *
 * Includes only:
 *  - `<math-field>` custom element (programmatic insert/getValue/setValue)
 *  - `convertLatexToMarkup` for static rendering
 *
 * Excluded: virtual keyboard, physical keyboard handling, speech/a11y,
 * context menus, popovers, text mode, smartmode, i18n strings, MathML/AsciiMath/Typst converters.
 */

export { MathfieldElement } from './public/mathfield-element';
export {
  convertLatexToMarkup,
  validateLatex,
} from './public/mathlive-ssr';

export { version } from './mathlive-light-version';

export type {
  InsertOptions,
  OutputFormat,
  Offset,
  Range,
  Selection,
  Style,
  MacroDictionary,
  LatexSyntaxError,
  ParseMode,
} from './public/core-types';

export type { Mathfield } from './public/mathfield';
export type { MathfieldOptions } from './public/options';

