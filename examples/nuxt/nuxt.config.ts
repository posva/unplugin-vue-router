// TODO: remove the import in nuxt 3
import { defineNuxtConfig } from 'nuxt'
import { _HasDataLoaderMeta } from 'unplugin-vue-router/runtime'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    shim: false,
  },

  build: { transpile: [/unplugin-vue-router\/runtime/] },

  pageTransition: null,
})
