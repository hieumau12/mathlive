import {
  getMacroDefinition,
  getMacros,
} from '../latex-commands/definitions-utils';
import type { ContextInterface } from '../core/types';

import { defaultColorMap, defaultBackgroundColorMap } from './color';
import { getDefaultRegisters } from './registers';

/** @internal */
export function getDefaultContext(): ContextInterface {
  return {
    registers: getDefaultRegisters(),
    smartFence: false,
    renderPlaceholder: undefined,
    placeholderSymbol: '▢',
    letterShapeStyle: 'tex',
    minFontScale: 0,
    maxMatrixCols: 10,
    colorMap: defaultColorMap,
    backgroundColorMap: defaultBackgroundColorMap,
    getMacro: (token) => getMacroDefinition(token, getMacros()),
  };
}
