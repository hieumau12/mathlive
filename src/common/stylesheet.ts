import MATHFIELD_STYLESHEET from '../../css/mathfield.less' assert { type: 'css' };

import CORE_STYLESHEET from '../../css/core.less' assert { type: 'css' };

import UI_STYLESHEET from '../ui/style.less' assert { type: 'css' };

type StylesheetId = 'ui' | 'core' | 'mathfield-element' | 'mathfield';

let gStylesheets: Partial<Record<StylesheetId, CSSStyleSheet>>;

export function getStylesheetContent(id: StylesheetId): string {
  let content = '';

  switch (id) {
    //
    // Note: the `position: relative` is required to fix https://github.com/arnog/mathlive/issues/971
    //
    case 'mathfield-element':
      content = `
    :host { display: inline-block; background-color: field; color: fieldtext; border-width: 1px; border-style: solid; border-color: #acacac; border-radius: 2px;}
    :host([hidden]) { display: none; }
    :host([disabled]), :host([disabled]:focus), :host([disabled]:focus-within) { outline: none; opacity:  .5; }
    :host(:focus), :host(:focus-within) {
      outline: Highlight auto 1px;    /* For Firefox */
      outline: -webkit-focus-ring-color auto 1px;
    }
    :host([readonly]:focus), :host([readonly]:focus-within),
    :host([read-only]:focus), :host([read-only]:focus-within) {
      outline: none;
    }`;
      break;
    case 'core':
      content = CORE_STYLESHEET;
      break;
    case 'mathfield':
      content = MATHFIELD_STYLESHEET;
      break;
    case 'ui':
      content = UI_STYLESHEET;
      break;
    default:
      debugger;
  }
  return content;
}

export function getStylesheet(id: StylesheetId): CSSStyleSheet {
  if (!gStylesheets) gStylesheets = {};

  if (gStylesheets[id]) return gStylesheets[id]!;

  gStylesheets[id] = new CSSStyleSheet();

  gStylesheets[id]!.replaceSync(getStylesheetContent(id));

  return gStylesheets[id]!;
}
