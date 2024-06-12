import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

const __dirname = new URL('.', import.meta.url).pathname
export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'unplugin-vue-router/runtime',
        replacement: fileURLToPath(new URL('src/runtime.ts', import.meta.url)),
      },
    ],
  },
  plugins: [Vue()],

  test: {
    setupFiles: ['./tests/router-mock.ts'],
    // open: false,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test-d.ts', 'src/**/*.spec.ts'],
    },
    typecheck: {
      enabled: true,
      checker: 'vue-tsc',
      // only: true,
      // by default it includes all specs too
      include: ['**/*.test-d.ts'],
      // tsconfig: './tsconfig.typecheck.json',
    },
  },
})
