import { rm } from 'node:fs/promises'
import { defineConfig, type Options } from 'tsup'

export const commonOptions = {
  clean: false,
  format: ['cjs', 'esm'],
  dts: true,
  external: [
    '@vue/compiler-sfc',
    'vue',
    'vue-router',
    'vue-demi',
    '@pinia/colada',
    'pinia',
  ],
  cjsInterop: true,
  splitting: true,
} satisfies Options

export default defineConfig(async () => {
  await rm('dist', { recursive: true, force: true })

  return [
    {
      ...commonOptions,
      entry: [
        './src/index.ts',
        './src/options.ts',
        './src/esbuild.ts',
        './src/rollup.ts',
        './src/vite.ts',
        './src/webpack.ts',
      ],
    },
    {
      ...commonOptions,
      dts: { only: true },
      entry: ['./src/types.ts'],
    },
  ]
})
