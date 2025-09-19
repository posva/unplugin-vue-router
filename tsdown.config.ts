import { defineConfig, type Options } from 'tsdown'

export const commonOptions = {
  format: ['cjs', 'esm'],
  external: [
    '@vue/compiler-sfc',
    'vue',
    'vue-router',
    'vue-demi',
    '@pinia/colada',
    'pinia',
  ],
} satisfies Options

export default defineConfig([
  {
    ...commonOptions,
    outputOptions: {
      // TODO: check if everthing works with this to remove the warning
      // exports: 'named',
    },
    entry: [
      './src/index.ts',
      './src/options.ts',
      './src/esbuild.ts',
      './src/rolldown.ts',
      './src/rollup.ts',
      './src/vite.ts',
      './src/webpack.ts',
      './src/types.ts',
    ],
  },
])
