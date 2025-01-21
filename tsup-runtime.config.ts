import { defineConfig } from 'tsup'
import { commonOptions } from './tsup.config'

export default defineConfig([
  {
    ...commonOptions,
    entry: ['./src/runtime.ts'],
    external: [...commonOptions.external, 'unplugin-vue-router/types'],
  },

  {
    ...commonOptions,
    entry: ['./src/data-loaders/entries/*'],
    // to work with node10 moduleResolution mode
    outDir: 'dist/data-loaders',
    external: [
      ...commonOptions.external,
      'unplugin-vue-router/types',
      'unplugin-vue-router/runtime',
      'unplugin-vue-router/data-loaders',
    ],
  },
])
