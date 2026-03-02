// Light stub: virtual keyboard global — no-op
// Provides the window.mathVirtualKeyboard stub so mathfield-private compiles.

import type {
  VirtualKeyboardInterface,
  VirtualKeyboardMessage,
  VirtualKeyboardMessageAction,
} from '../public/virtual-keyboard';

/** Minimal no-op stub for the virtual keyboard global. */
class _NoopVirtualKeyboard implements Partial<VirtualKeyboardInterface>, EventTarget {
  visible = false;
  boundingRect: DOMRect = new DOMRect();

  show(): void {}
  hide(): void {}
  connect(): void {}
  disconnect(): void {}
  update(): void {}
  executeCommand(): boolean { return false; }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean { return true; }
}

export function mountMathVirtualKeyboard(): void {}

if (typeof window !== 'undefined') {
  (window as any).mathVirtualKeyboard ??= new _NoopVirtualKeyboard();
}

