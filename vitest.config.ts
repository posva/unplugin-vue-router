import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [Vue()],

  test: {
    setupFiles: ['./tests/router-mock.ts'],
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true,
      // by default it includes all specs too
      // include: ['./src/**/*.test-d.ts'],
      // exclude: ['./src/**/*.spec.ts'],
      // tsconfig: './tsconfig.typecheck.json',
    },
  },
})
