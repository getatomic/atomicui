import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import obfuscator from 'rollup-plugin-obfuscator';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';

const sharedPlugins = [
  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: !isProd,
  }),
  babel({
    extensions: ['.js', '.ts', '.tsx', '.jsx'],
    babelHelpers: 'bundled',
    presets: ['@babel/preset-react'],
    sourceMaps: !isProd,
  }),
  nodeResolve({
    preferBuiltins: true,
    exportConditions: ['node'],
  }),
  commonjs(),
  json(),
  alias({
    entries: [
      { find: '@atomic', replacement: path.resolve(__dirname, 'src') },
    ]
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    preventAssignment: true,
  }),
]

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
  sharedPlugins.push(terser());
}

export default {
  input: {
    'core': 'src/core/index.ts',
    'react': 'src/react/index.ts',
    'utils': 'src/utils/index.ts',
  },
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: !isProd,
    entryFileNames: '[name]/index.js',
  },
  plugins: sharedPlugins,
  external: [
    'react', 'react-dom'
  ],
};
