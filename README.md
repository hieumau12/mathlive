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
