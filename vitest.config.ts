import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  resolve: {
    alias: {
      '~/': fileURLToPath(new URL('./', import.meta.url)),
    },
  },

  plugins: [Vue()],

  test: {
    setupFiles: ['./tests/router-mock.ts'],
  },
})
