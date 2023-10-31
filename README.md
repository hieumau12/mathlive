## This is project forked from _[mathlive](https://github.com/arnog/mathlive)_ project

# What is change in this repo?
1. Ability to make **_macro_** like a digit. It can replace by placeholder `#@`</br>
</br>
2. Fix bug: Frac line not expand to full width.
   </br>
  - Comment the line `fracLine.width = Math.max(numerBox.width, denomBox.width);` in **_genfrac.ts_** file
  - Comment the line `this.width = rows.reduce((acc, row) => Math.max(acc, row.width), 0)` in **_v-box.ts_** file
