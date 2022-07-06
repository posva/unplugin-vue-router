import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
// @ts-ignore: the plugin should not be checked in the playground
import VueRouter from '../src/vite'
import { getFileBasedRouteName, getPascalCaseRouteName } from '../src'
import Vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  clearScreen: false,
  plugins: [
    Vue({}),
    VueRouter({
      manualChunks: (id) => {
        if(id.includes('[id]')) {
          console.log({
            id
          })
          return 'idididid'
        }
        // return id
      },
      logs: true,
      // getRouteName: getPascalCaseRouteName,
      exclude: [
        'ignored',
        // resolve(__dirname, './src/routes/ignored'),
        //
        // './src/routes/**/*.spec.ts',
      ],
    }),
    Inspect(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks: () => {}
        // a : 1
      },
      // s: 2,
    }
  }
})
