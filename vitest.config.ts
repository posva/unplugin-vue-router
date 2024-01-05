import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname),
    },
  },

  plugins: [Vue()],

  test: {
    setupFiles: ['./tests/router-mock.ts'],
    typecheck: {
      enabled: true,
      // FIXME: this shouldn't be needed. Currently vitest seems to ignore failing tests
      ignoreSourceErrors: true,
      // include: ['./src/**/*.test-d.ts'],
      // exclude: ['./src/**/*.spec.ts'],
      tsconfig: './tsconfig.typecheck.json',
    },
  },
})
