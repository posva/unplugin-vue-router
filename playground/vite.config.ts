import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
// @ts-ignore: the plugin should not be checked in the playground
import VueRouter from '../src/vite'
import {
  getFileBasedRouteName,
  getPascalCaseRouteName,
  VueRouterExports,
} from '../src'
import Vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  clearScreen: false,
  plugins: [
    Vue({}),
    VueRouter({
      extensions: ['.md', '.vue'],
      logs: true,
      // getRouteName: getPascalCaseRouteName,
      exclude: [
        'ignored',
      ],
    }),
    AutoImport({
      imports: [
        {
          '@vue-router': VueRouterExports,
        },
      ],
    }),
    Inspect(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
