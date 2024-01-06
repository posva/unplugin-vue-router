import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // '~': resolve(__dirname),
      '~/': new URL('./', import.meta.url).pathname,
    },
  },

  plugins: [Vue()],

  test: {
    setupFiles: ['./tests/router-mock.ts'],
    typecheck: {
      enabled: true,
      // FIXME: this shouldn't be needed. Currently vitest seems to ignore failing tests
      // without this, it seems to be including too many things
      // ignoreSourceErrors: true,
      // only: true,
      include: ['./src/**/*.test-d.ts'],
      // exclude: ['./client.d.ts'],
      tsconfig: './tsconfig.typecheck.json',
    },
  },
})
