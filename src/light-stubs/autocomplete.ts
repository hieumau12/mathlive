// Light stub: autocomplete — no-ops
import type { _Mathfield } from '../editor-mathfield/mathfield-private';
import type { ParseMode } from '../public/core-types';

export function removeSuggestion(_mathfield: _Mathfield): void {}
export function updateAutocomplete(_mathfield: _Mathfield, _options?: { atIndex?: number }): void {}
export function acceptCommandSuggestion(_mathfield: _Mathfield): boolean { return false; }

export function complete(
  _mathfield: _Mathfield,
  _completion: 'reject' | 'accept' | 'accept-with-shift',
  _options?: { mode?: ParseMode }
): boolean {
  return false;
}

