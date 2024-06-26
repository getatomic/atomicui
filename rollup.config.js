import typescript from '@rollup/plugin-typescript';

export default {
	input: './src/index.ts',
	output: {
	  dir: './dist',
	  format: 'es'
	},
	plugins: [typescript({
		compilerOptions: {
			lib:["es5", "es6"],
			target: "es6"
		}
	})]
};