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
