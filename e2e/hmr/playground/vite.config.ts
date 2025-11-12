import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import VueRouter from '../../../src/vite'
import Vue from '@vitejs/plugin-vue'

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
      'unplugin-vue-router/types': fileURLToPath(
        new URL('../../../src/types.ts', import.meta.url)
      ),
      'unplugin-vue-router/data-loaders/basic': fileURLToPath(
        new URL('../../../src/data-loaders/entries/basic.ts', import.meta.url)
      ),
      'unplugin-vue-router/data-loaders/pinia-colada': fileURLToPath(
        new URL(
          '../../../src/data-loaders/entries/pinia-colada.ts',
          import.meta.url
        )
      ),
      'unplugin-vue-router/data-loaders': fileURLToPath(
        new URL('../../../src/data-loaders/entries/index.ts', import.meta.url)
      ),
    },
  },
  build: {
    sourcemap: true,
  },

  plugins: [
    VueRouter({
      root,
      logs: true,
      // getRouteName: getPascalCaseRouteName,
      experimental: {
        autoExportsDataLoaders: ['src/loaders/**/*', '@/loaders/**/*'],
        paramParsers: false,
      },
    }),
    Vue(),
  ],
})
