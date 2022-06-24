import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
// @ts-ignore: the plugin should not be checked in the playground
import VueRouter from '../src/vite'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  clearScreen: false,
  plugins: [Vue({}), VueRouter(), Inspect()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
