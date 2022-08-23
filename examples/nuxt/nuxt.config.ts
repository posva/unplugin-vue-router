import { defineNuxtConfig } from 'nuxt'
import { _LoaderSymbol } from 'unplugin-vue-router/runtime'

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    shim: false,
  },

  pageTransition: null,
})
