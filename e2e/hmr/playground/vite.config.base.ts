import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  root,
  clearScreen: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
      'unplugin-vue-router/runtime': fileURLToPath(
        new URL('../../../src/runtime.ts', import.meta.url)
      ),
    },
  },
  build: {
    sourcemap: true,
  },
})
