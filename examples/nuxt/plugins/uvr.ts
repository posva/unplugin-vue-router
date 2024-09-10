import { DataLoaderPlugin, type DataLoaderPluginOptions } from 'unplugin-vue-router/data-loaders'

export default defineNuxtPlugin((nuxtApp) => {
  const appConfig = useAppConfig()

  nuxtApp.vueApp.use(DataLoaderPlugin, {
    router: nuxtApp.vueApp.config.globalProperties.$router,
    isSSR: import.meta.server,
    ...appConfig.dataLoaders,
  } satisfies DataLoaderPluginOptions)
})

declare module 'nuxt/schema' {
  interface AppConfigInput {
    dataLoaders?: Omit<DataLoaderPluginOptions, 'router'>
  }
}
