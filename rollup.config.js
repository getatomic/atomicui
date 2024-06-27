import typescript from "@rollup/plugin-typescript";
import replace from '@rollup/plugin-replace';

export default {
  input: "./src/index.ts",
  cache: false,
  output: {
    dir: "./dist",
    format: "es",
  },
  plugins: [
    typescript({
      tsconfig: "tsconfig.json",
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || 'development'),
      preventAssignment: true,
    }),
  ],
};
