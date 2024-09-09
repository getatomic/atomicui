import typescript from "@rollup/plugin-typescript";
import replace from '@rollup/plugin-replace';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import obfuscator from 'rollup-plugin-obfuscator';

const isProd = process.env.NODE_ENV === 'production';

const sharedPlugins = [
  nodeResolve({
    preferBuiltins: true,
    exportConditions: ['node'],
  }),
  commonjs(),
  json(),
  replace({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    preventAssignment: true,
  }),
];

if (isProd) {
  sharedPlugins.push(
    obfuscator({
      compact: true,
      controlFlowFlattening: true,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: true,
      deadCodeInjectionThreshold: 0.4,
      debugProtection: false,
      debugProtectionInterval: false,
      disableConsoleOutput: true,
      identifierNamesGenerator: 'hexadecimal',
      log: false,
      renameGlobals: false,
      rotateStringArray: true,
      selfDefending: true,
      shuffleStringArray: true,
      splitStrings: true,
      splitStringsChunkLength: 10,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      transformObjectKeys: true,
      unicodeEscapeSequence: false
    })
  );
  sharedPlugins.push(terser({
    ecma: 2020,
    mangle: true,
    compress: {
      dead_code: true,
      drop_debugger: true,
      conditionals: true,
      evaluate: true,
      booleans: true,
      loops: true,
      unused: true,
      hoist_funs: true,
      keep_fargs: false,
      hoist_vars: true,
      if_return: true,
      join_vars: true,
      side_effects: true,
      warnings: false,
    },
  }));
}

const safeTreeShake = {
  moduleSideEffects: 'no-external',
  tryCatchDeoptimization: false,
};

export default [
  {
    input: "./src/core/index.ts",
    output: {
      file: "./dist/core/index.js",
      format: "es",
      sourcemap: isProd ? false : 'inline',
    },
    plugins: [
      ...sharedPlugins,
      typescript({
        tsconfig: "tsconfig.json",
        outDir: "./dist/core",
      })
    ],
    treeshake: safeTreeShake,
  },
  {
    input: "./src/react/index.ts",
    output: {
      file: "./dist/react/index.js",
      format: "es",
      sourcemap: isProd ? false : 'inline',
    },
    plugins: [
      ...sharedPlugins,
      typescript({
        tsconfig: "tsconfig.json",
        outDir: "./dist/react",
      })
    ],
    treeshake: safeTreeShake,
    external: ['react', 'react-dom'],
  },
  {
    input: "./src/bin/index.ts",
    output: {
      file: "./dist/bin/index.js",
      format: "cjs",
      exports: "auto",
      sourcemap: isProd ? false : 'inline',
    },
    external: [
      'fs', 'path', 'os', 'child_process',
      'commander', 'chalk', 'prompts', 'ora',
      'execa', 'fs-extra', '@antfu/ni', 'chalk',
      'tsconfig-paths'
    ],
    plugins: [
      commonjs(),
      json(),
      typescript({
        tsconfig: "tsconfig.json",
        outDir: "./dist/bin",
      }),
      replace({
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || 'development'),
        preventAssignment: true,
      })
    ],
  }
];