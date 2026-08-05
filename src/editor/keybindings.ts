import type { Selector } from '../public/commands';
import type { Keybinding } from '../public/options';
import type { ParseMode } from '../public/core-types';
import type { KeyboardLayout } from './keyboard-layouts/types';

import {
  getCodeForKey,
  keystrokeModifiersFromString,
  keystrokeModifiersToString,
} from './keyboard-layout';
import { isBrowser, osPlatform } from '../ui/utils/capabilities';
import { keyboardEventToString } from './keyboard';

/**
 * @param p The platform to test against.
 */
function matchPlatform(p: string): boolean {
  if (isBrowser()) {
    const plat = osPlatform();
    const isNeg = p.startsWith('!');
    const isMatch = p.endsWith(plat);
    if (isNeg && !isMatch) return true;
    if (!isNeg && isMatch) return true;
  }
  if (p === '!other') return false;
  return p === 'other';
}

/**
 * Return the selector matching the keystroke.
 * The keybindings and keystroke should be in normalized form
 * (i.e. using key code, e.g. `[KeyQ]`)
 *
 */
export function getCommandForKeybinding(
  keybindings: readonly Keybinding[],
  mode: ParseMode,
  evt: KeyboardEvent
): Selector | [Selector, ...any[]] | '' {
  if (keybindings.length === 0) return '';

  // Normalize keystroke to the format (order of modifiers) expected
  // by keybindings
  const keystroke = keystrokeModifiersToString(
    keystrokeModifiersFromString(keyboardEventToString(evt))
  );
  const altKeystroke = keystrokeModifiersToString({
    key: evt.key,
    shift: evt.shiftKey,
    alt: evt.altKey,
    ctrl: evt.ctrlKey,
    meta: evt.metaKey || (evt.ctrlKey && /macos|ios/.test(osPlatform())),
    cmd: false,
    win: false,
  });

  // Try to match using a virtual keystroke
  for (let i = keybindings.length - 1; i >= 0; i--) {
    if (
      keybindings[i].key === keystroke ||
      keybindings[i].key === altKeystroke
    ) {
      if (!keybindings[i].ifMode || keybindings[i].ifMode === mode)
        return keybindings[i].command as Selector | [Selector, ...any[]];
    }
  }

  return '';
}

/**
 * Return a normalized keybinding that account for the current
 * keyboard layout. For example, a keybinding with the key `{` and
 * a US layout will return 'shift+[' and '{' (the latter is the key code).
 *
 */
function normalizeKeybinding(
  keybinding: Keybinding,
  layout: KeyboardLayout
): Keybinding | undefined {
  if (
    keybinding.ifPlatform &&
    !/^!?(macos|windows|android|ios|chromeos|other)$/.test(
      keybinding.ifPlatform
    )
  ) {
    throw new Error(
      `Unexpected platform "${keybinding.ifPlatform}" for keybinding ${keybinding.key}`
    );
  }

  if (
    keybinding.ifLayout !== undefined &&
    (layout.score === 0 || !keybinding.ifLayout.includes(layout.id))
  )
    return undefined;

  const modifiers = keystrokeModifiersFromString(keybinding.key);
  let platform = keybinding.ifPlatform;

  if (modifiers.cmd) {
    if (platform && platform !== 'macos' && platform !== 'ios') {
      throw new Error(
        'Unexpected "cmd" modifier with platform "' +
          platform +
          '"' +
          '\n' +
          '"cmd" modifier can only be used with macOS or iOS platform.'
      );
    }

    if (!platform) platform = osPlatform() === 'ios' ? 'ios' : 'macos';

    modifiers.win = false;
    modifiers.cmd = false;
    modifiers.meta = true;
  }

  if (modifiers.win) {
    if (platform && platform !== 'windows') {
      throw new Error(
        'Unexpected "win" modifier with platform "' +
          platform +
          '"' +
          '\n' +
          '"win" modifier can only be used with Windows platform.'
      );
    }

    platform = 'windows';
    modifiers.win = false;
    modifiers.cmd = false;
    modifiers.meta = true;
  }

  if (platform && !matchPlatform(platform)) return undefined;

  //
  // Is this a keybinding specified with a key code (e.g.  `[KeyW]`)?
  //
  if (/^\[.+\]$/.test(modifiers.key))
    return { ...keybinding, key: keystrokeModifiersToString(modifiers) };

  //
  // This is not a key code (e.g. `[KeyQ]`) it's a simple key (e.g. `a`).
  // Map it to a key code given the current keyboard layout.
  //
  const code = getCodeForKey(modifiers.key, layout);
  if (!code)
    return { ...keybinding, key: keystrokeModifiersToString(modifiers) };

  if ((code.shift && modifiers.shift) || (code.alt && modifiers.alt)) {
    throw new Error(
      `The keybinding ${keybinding.key} (${selectorToString(
        keybinding.command as Selector | [Selector, ...any[]]
      )}) is conflicting with the key combination ${keystrokeModifiersToString(
        code
      )} using the ${layout.displayName} keyboard layout`
    );
  }
  code.shift = code.shift || modifiers.shift;
  code.alt = code.alt || modifiers.alt;
  code.meta = modifiers.meta;
  code.ctrl = modifiers.ctrl;
  return { ...keybinding, key: keystrokeModifiersToString(code) };
}

function selectorToString(selector: Selector | [Selector, ...any[]]): string {
  if (Array.isArray(selector)) {
    const sel = [...selector];
    return (
      sel.shift() +
      '(' +
      sel
        .map((x) => (typeof x === 'string' ? `"${x}"` : x.toString()))
        .join(', ') +
      ')'
    );
  }

  return selector as string;
}

/**
 * Parse the input keybindings and return them normalized:
 * - 'keys' are transformed to 'code' according to the current keyboard layout
 * - keybindings that don't apply to the current platform are removed
 */
export function normalizeKeybindings(
  keybindings: readonly Keybinding[],
  layout: KeyboardLayout
): [result: Keybinding[], errors: string[]] {
  const errors: string[] = [];
  const result: Keybinding[] = [];

  for (const x of keybindings) {
    try {
      const binding = normalizeKeybinding(x, layout);
      if (!binding) continue;
      // Is there a conflict with an existing keybinding?
      const conflict = result.find(
        (x) => x.key === binding.key && x.ifMode === binding.ifMode
      );
      if (conflict) {
        throw new Error(
          `Ambiguous key binding ${x.key} (${selectorToString(
            x.command as Selector | [Selector, ...any[]]
          )}) matches ${conflict.key} (${selectorToString(
            conflict.command as Selector | [Selector, ...any[]]
          )}) with the ${layout.displayName} keyboard layout`
        );
      }
      result.push(binding);
    } catch (error: unknown) {
      if (error instanceof Error) errors.push(error.message);
    }
  }

  return [result, errors];
}
