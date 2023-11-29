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
  },
})
