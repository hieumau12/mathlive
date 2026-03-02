#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import { build } from 'esbuild';
import less from '@arnog/esbuild-plugin-less';

import pkg from '../package.json' with { type: 'json' };

process.env.BUILD = process.env.BUILD || 'development';
const PRODUCTION = process.env.BUILD.toLowerCase() === 'production';
const SDK_VERSION = pkg.version || 'v?.?.?';

// UMD wrapper
// (while iife works for `<script>` loading, sadly, some environemnts use
// `require()` which needs the UMD wrapper. See #1833)
const UMD_OPTIONS = {
  banner: {
    js: `/** MathLive ${SDK_VERSION} ${
      process.env.GIT_VERSION ? ' -- ' + process.env.GIT_VERSION : ''
    }*/
    (function(global,factory){typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'],factory):(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MathLive = {}));})(this, (function (exports) { 'use strict';`,
  },
  footer: {
    js: `Object.assign(exports, MathLive); Object.defineProperty(exports, '__esModule', { value: true });}));`,
  },
};

const BUILD_OPTIONS = {
  banner: {
    js: `/** MathLive ${SDK_VERSION} ${
      process.env.GIT_VERSION ? ' -- ' + process.env.GIT_VERSION : ''
    }*/`,
  },
  bundle: true,
  define: {
    ENV: JSON.stringify(process.env.BUILD),
    SDK_VERSION: JSON.stringify(SDK_VERSION),
    GIT_VERSION: JSON.stringify(process.env.GIT_VERSION || '?.?.?'),
  },
  plugins: [less()],
  loader: { '.ts': 'ts' },
  sourcemap: !PRODUCTION,
  sourceRoot: '../src',
  sourcesContent: false,
  target: ['es2017'],
  external: ['@cortex-js/compute-engine'],
};

// Build and serve the library
build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.mjs',
  format: 'esm',
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.js',
  format: 'iife',
  ...UMD_OPTIONS,
  globalName: 'MathLive',
});

build({
  ...BUILD_OPTIONS,
  drop: ['debugger'],
  pure: ['console.assert', 'console.log'],
  entryPoints: ['./src/mathlive.ts'],
  outfile: './dist/mathlive.min.mjs',
  format: 'esm',
  minify: true,
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/mathlive.ts'],
  drop: ['debugger'],
  pure: ['console.assert', 'console.log'],
  outfile: './dist/mathlive.min.js',
  format: 'iife',
  ...UMD_OPTIONS,
  globalName: 'MathLive',
  minify: true,
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/public/mathlive-ssr.ts'],
  drop: ['debugger'],
  pure: ['console.assert', 'console.log'],
  outfile: './dist/mathlive-ssr.min.mjs',
  format: 'esm',
  minify: true,
});

build({
  ...BUILD_OPTIONS,
  entryPoints: ['./src/vue-mathlive.js'],
  outfile: './dist/vue-mathlive.mjs',
  format: 'esm',
  minify: true,
});

// ─── Light build (insert + LaTeX render only, no VK / speech / menus) ────────

import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const stubDir = resolve(__dirname, '../src/light-stubs');

/**
 * esbuild plugin: redirect specific source files to their light-stub equivalents.
 *
 * Handles all three import styles observed in debug output:
 *  1. Relative:  './keyboard-input'  '../editor/speech'
 *  2. tsconfig baseUrl (bare):  'editor/environment-popover'  'ui/menu/context-menu'
 */
function lightStubsPlugin() {
  const srcDir = resolve(__dirname, '../src');

  // Map: src-relative path (no extension) → stub absolute path
  const STUB_MAP = {
    'virtual-keyboard/commands':           resolve(stubDir, 'virtual-keyboard-commands.ts'),
    'virtual-keyboard/global':             resolve(stubDir, 'virtual-keyboard-global.ts'),
    'virtual-keyboard/virtual-keyboard':   resolve(stubDir, 'virtual-keyboard-class.ts'),
    'virtual-keyboard/proxy':              resolve(stubDir, 'virtual-keyboard-proxy.ts'),
    'virtual-keyboard/mathfield-proxy':    resolve(stubDir, 'virtual-keyboard-proxy.ts'),
    'editor/speech':                       resolve(stubDir, 'speech.ts'),
    'editor/speech-read-aloud':            resolve(stubDir, 'speech-read-aloud.ts'),
    'editor/suggestion-popover':           resolve(stubDir, 'suggestion-popover.ts'),
    'editor/environment-popover':          resolve(stubDir, 'environment-popover.ts'),
    'ui/menu/context-menu':                resolve(stubDir, 'context-menu.ts'),
    'ui/menu/menu':                        resolve(stubDir, 'menu.ts'),
    'editor/default-menu':                 resolve(stubDir, 'default-menu.ts'),
    'editor-mathfield/keyboard-input':     resolve(stubDir, 'keyboard-input.ts'),
    'editor-mathfield/keystroke-caption':  resolve(stubDir, 'keystroke-caption.ts'),
    'editor-mathfield/autocomplete':       resolve(stubDir, 'autocomplete.ts'),
    'editor/l10n-strings':                 resolve(stubDir, 'l10n-strings.ts'),
    'editor/more-l10n-strings':            resolve(stubDir, 'more-l10n-strings.ts'),
    'addons/definitions-metadata':         resolve(stubDir, 'definitions-metadata.ts'),
  };

  // Pre-build a map keyed by absolute resolved path too (for relative imports)
  const ABS_STUB_MAP = {};
  for (const [rel, stub] of Object.entries(STUB_MAP)) {
    ABS_STUB_MAP[resolve(srcDir, rel + '.ts')] = stub;
  }

  return {
    name: 'light-stubs',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.kind === 'entry-point') return null;
        if (!args.importer) return null;

        // 1. Try bare (baseUrl-rooted) import  e.g. 'editor/environment-popover'
        if (!args.path.startsWith('.')) {
          const stub = STUB_MAP[args.path];
          if (stub) return { path: stub };
        }

        // 2. Try relative import  e.g. './keyboard-input' '../editor/speech'
        const absImporter = args.importer;
        const absResolved = resolve(dirname(absImporter), args.path) + '.ts';
        const stub = ABS_STUB_MAP[absResolved];
        if (stub) return { path: stub };

        return null;
      });
    },
  };
}

const LIGHT_BUILD_OPTIONS = {
  ...BUILD_OPTIONS,
  plugins: [...BUILD_OPTIONS.plugins, lightStubsPlugin()],
};

build({
  ...LIGHT_BUILD_OPTIONS,
  entryPoints: ['./src/mathlive-light.ts'],
  outfile: './dist/mathlive-light.mjs',
  format: 'esm',
});

build({
  ...LIGHT_BUILD_OPTIONS,
  drop: ['debugger'],
  pure: ['console.assert', 'console.log'],
  entryPoints: ['./src/mathlive-light.ts'],
  outfile: './dist/mathlive-light.min.mjs',
  format: 'esm',
  minify: true,
});

// Light CSS (no virtual-keyboard, keystroke-caption, suggestion/environment popovers)
build({
  ...BUILD_OPTIONS,
  entryPoints: ['./css/mathlive-light-static.less'],
  outfile: './dist/mathlive-light-static.css',
  format: 'esm',
});
