// Light stub: keyboard-input — no physical key processing
import type { _Mathfield } from '../editor-mathfield/mathfield-private';

/** No-op: physical keystroke handling disabled in light build. */
export function onKeystroke(_mathfield: _Mathfield, _evt: KeyboardEvent): boolean {
  return false;
}

/** No-op: text input from IME/physical keyboard disabled in light build. */
export function onInput(_mathfield: _Mathfield, _text: string, _options?: unknown): void {}

