                        ## This is project forked from _[mathlive](https://github.com/arnog/mathlive)_ project

# What is change in this repo?

1. Ability to make **_macro_** like a digit. It can replace by placeholder `#@`</br>
   </br>
2. Fix bug: Frac line not expand to full width.
   </br>

- Comment the line `fracLine.width = Math.max(numerBox.width, denomBox.width);` in **_genfrac.ts_** file
- Comment the line `this.width = rows.reduce((acc, row) => Math.max(acc, row.width), 0)` in **_v-box.ts_** file

3. Remove soundsDirectory and fontsDirectory and Plonk sounds
4. Now marcos function can define a mapping value for arguments. It use to replace value of input args to new value to
   display in view.\
   _Example:_\
    ``` 
   mf.current!.macros = {
                ...mf.current!.macros,
                conversion: {
                    args: 1,
                    def: '\\mathbf{#1}',
                    isImplicitArg: true,
                    argsMapping: {
                       value: 'newValueToDisplay'  
                   }
                },
            };
   ```
5. Change scroll into caret behavior to "smooth". executeCommand "move" type now can auto scroll into caret.
6. Add scroll commands. using `executeCommand(['scroll', distance])` or `executeCommand(['scrollTo', {left: 10, behavior: 'smooth'}])`
7. Define more default macros for support Calce
8. Default mathfield focus function will run with preventFocus = true
Changed in mathfield-private.ts  
```
focus(options: FocusOptions | undefined = {preventScroll: true})
```
9. Add scrollIntoCaret option in InsertOptions. This make sure the caret is always visible in input view
npm


10. Add custom document event ```mathlive-update-separator``` to notify that MathfieldElement global separator changed.

    Example:
    ```bash
    document.addEventListener("mathlive-update-separator", (event) => {
      // handler
    })
    ```


11. Ignore import warming in nextjs project
    ```javascript
    /** @type {import('next').NextConfig} */
    const nextConfig = {
      webpack: config => {
      config.ignoreWarnings = [
      { module: /src\/app\/component\/MathLiveComponent\.tsx/ },
      ];
      
          return config;
      }
    };
    
    export default nextConfig;
```

12. Add `disable-physical-keyboard` boolean attribute / `disablePhysicalKeyboard` option to ignore physical keyboard input on a mathfield.
    ```html
    <math-field disable-physical-keyboard></math-field>
    ```
    Note: setting the attribute always disables the physical keyboard; removing the attribute does **not** re-enable it. To re-enable, use `mf.setOptions({ disablePhysicalKeyboard: false })`.

13. Add 3 new default macros for angle-unit operators, alongside the existing `\degree`: `\opdegree` (`^{\circ}`), `\opradian` (`^{\mathrm{r}}`), `\opgradian` (`^{\mathrm{g}}`).

14. `\exponentialE` rendering is now configurable, the same way `decimalSeparatorChar` / `thousandSeparatorChar` / `thousandthSeparatorChar` are. Two styles are supported via the new `ExponentialENotation` enum:
    - `ExponentialENotation.MathRm` (default): renders as `\mathrm{ᴇ}`, e.g. `1.23ᴇ4`
    - `ExponentialENotation.Scientific`: renders as `\scriptsize{\times10}`

    Set it globally (affects all mathfields) or per-instance:
    ```javascript
    import { MathfieldElement, ExponentialENotation } from 'mathlive';

    // Global default
    MathfieldElement.exponentialNotation = ExponentialENotation.Scientific;

    // Per mathfield instance
    mf.exponentialNotation = ExponentialENotation.MathRm;
    ```
    Changing the global value dispatches a `mathlive-update-exponential-notation` document event, mirroring `mathlive-update-separator`:
    ```javascript
    document.addEventListener("mathlive-update-exponential-notation", (event) => {
      // handler
    })
    ```

15. Fix: macros that render in the middle of a number (`\decimalsep`, `\thousandSep`, `\thousandthSep`, `\exponentialE`) are now correctly swept in as part of the number for implicit-argument capture — for example, pressing `/` right after typing `1.23ᴇ4` now builds the fraction numerator from the whole number instead of just the last digit group. Previously `isImplicitArg` was forced to `false` at runtime for these macros, even though the default macro dictionary declared them as `true`.

16. Two new tokens for **insert templates** (`executeCommand(['insert', template])`), enabling Casio-fx991EX-style "smart insert" behavior — splitting whatever's around the cursor into a new structure instead of always dropping in a placeholder:
    - `#&` — the implicit argument *after* the insertion point, symmetric to the existing `#@` (*before* the insertion point). Captures the run of atoms immediately following the cursor, using the same rules as `#@`: stops at the first binary/relational operator, keeps a parenthesized group together as one unit. Falls back to a placeholder if there's nothing to capture.
    - `#|` — explicitly places the cursor after insertion, overriding the automatic placement (which otherwise lands right before whatever `#&` captured, or falls back to the next placeholder / end of the inserted structure). Useful when that default isn't where editing should continue. If a literal `\placeholder{}` immediately follows `#|` in the template, it's selected rather than just landed next to, so typing replaces it right away.

    ```javascript
    // value: '12|34' (cursor between '2' and '3')
    mf.executeCommand(['insert', '\\frac{#@}{#&}']);
    // -> '\frac{12}{34}', cursor lands right before '34'

    // #| overrides where the cursor stops, independent of #&:
    mf.executeCommand(['insert', '\\log_{#|\\placeholder{}} (#&)']);
    // -> cursor stays on the base placeholder, even though #& still
    //    captured the argument that follows
    ```

    See `test/playwright-tests/insert-templates.spec.ts` for the full set of supported template shapes (power, sqrt, nth root, log-with-base, etc.) and edge cases.

17. **Casio-fx991EX-style delete.** Backspace now always removes something — the navigate-only steps that used to consume a keypress are folded into the delete that follows:
    - Backspacing from just outside a structure enters its last branch **and** removes one atom (`123^{4}|` → `123^{\placeholder{}}`, `\frac{12}{34}|` → `\frac{12}{3}`).
    - When the caret is on an already-empty branch, the press moves to the adjacent branch **and** removes one atom there, so a `\mixfraction` is emptied one branch at a time and only disappears once all three are empty. A press never *skips* an empty branch to find something to delete further along: arriving at one is the whole of that press.
    - An empty branch is a hole, not content, so it doesn't count when deciding whether there is anything to the left. `\mixfraction{\placeholder{}}{\placeholder{}}{3}` with the caret in the numerator has nothing to its left, and backspace deletes forward from there.
    - Stepping *out* of a structure stays navigation-only: `1+\mixfraction{|2}{3}{4}` → `1+|\mixfraction{2}{3}{4}`.
    - "Auto delete right": if there is no atom anywhere to the left of the caret, backspace deletes forward instead (`|12345` → `|2345`, `|\frac{12}{34}` → `\frac{|2}{34}`).
    - A superscript or subscript dissolves at the start of its branch — the `^` / `_` is what gets deleted and the content is hoisted into the parent (`123^{|45}` → `123|45`), matching what `\sqrt`, `\boxed` and `\repeatingpart` already do.
    - `\repeatingpart` now deletes exactly like `\sqrt`. It previously teleported the caret to the end of its own body when backspacing at the body start.

    See `test/playwright-tests/casio-delete.spec.ts` for the full rule set and edge cases.

18. Two new cursor commands, `moveToNextCharLoop` and `moveToPreviousCharLoop`. They behave like `moveToNextChar` / `moveToPreviousChar`, but wrap around the ends of the mathfield instead of stopping there, so the caret can be cycled through the whole expression with a single key. Not bound to any key by default.

    ```javascript
    mf.executeCommand(['moveToNextCharLoop']); // at the end -> jumps to offset 0
    mf.executeCommand(['moveToPreviousCharLoop']); // at offset 0 -> jumps to the end
    ```
