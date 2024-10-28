import { PiniaColada, type PiniaColadaOptions } from '@pinia/colada'

export default defineNuxtPlugin({
  dependsOn: ['pinia'],
  setup(nuxtApp) {
    nuxtApp.vueApp.use(PiniaColada, {
      // for some reason there is no autocomplete
    } satisfies PiniaColadaOptions)
  },
})
