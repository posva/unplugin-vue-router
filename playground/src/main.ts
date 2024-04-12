import { createApp } from 'vue'
import App from './App.vue'
import {
  createRouter,
  createWebHistory,
  DataLoaderPlugin,
} from 'vue-router/auto'
import { MutationCache, QueryCache, VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import { QueryPlugin } from '@pinia/colada'

const router = createRouter({
  history: createWebHistory(),
  extendRoutes: (routes) => {
    // routes.find((r) => r.name === '/')!.meta = {}
    return routes
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(QueryPlugin)
app.use(VueQueryPlugin, {
  queryClientConfig: {
    mutationCache: new MutationCache({
      onSuccess(data, vars, context, mutation) {
        // debugger
        mutation
      },
      async onSettled(...args) {
        await new Promise((r) => setTimeout(r, 1000))
        console.log('global onSettled', ...args)
      },
    }),
  },
})
app.use(DataLoaderPlugin, { router })
app.use(router)

app.mount('#app')
