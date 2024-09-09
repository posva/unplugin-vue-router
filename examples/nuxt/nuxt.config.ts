// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  typescript: {
    shim: false,
  },

  build: {
    transpile: [/unplugin-vue-router\/runtime/],
  },

  app: {
    pageTransition: false,
    layoutTransition: false,
  },

  experimental: {
    typedPages: true,
  },
})
