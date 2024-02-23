import { defineConfig } from 'tsup'
import { commonOptions } from './tsup.config'

export default defineConfig([
  {
    ...commonOptions,
    clean: false,
    entry: ['./src/runtime.ts'],
    external: [...commonOptions.external, 'unplugin-vue-router/types'],
  },
])
