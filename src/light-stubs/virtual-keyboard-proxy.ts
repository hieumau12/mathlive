// Light stub: virtual keyboard proxy — no-op

import type { MathfieldProxy } from '../public/virtual-keyboard';
import type { _Mathfield } from '../editor-mathfield/mathfield-private';

export function makeProxy(_mf: _Mathfield): MathfieldProxy {
  return {} as MathfieldProxy;
}

export function isVirtualKeyboardMessage(_evt: Event): boolean {
  return false;
}

