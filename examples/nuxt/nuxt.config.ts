export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  experimental: {
    typedPages: true,
  },

  compatibilityDate: '2024-09-10',
})
