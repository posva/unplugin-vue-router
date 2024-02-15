import { defineConfig, configDefaults } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [Vue()],

  test: {
    setupFiles: ['./tests/router-mock.ts'],
    // open: false,
    typecheck: {
      enabled: true,
      checker: 'vue-tsc',
      // only: true,
      ignoreSourceErrors: true,
      // by default it includes all specs too
      include: ['**/*.test-d.ts'],
      // tsconfig: './tsconfig.typecheck.json',
    },
  },
})
