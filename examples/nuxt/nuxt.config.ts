export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@pinia/colada-nuxt'],

  experimental: {
    typedPages: true,
  },

  compatibilityDate: '2024-09-10',
})
