import { createApp } from 'vue'
import App from './App.vue'
import {
  createRouter,
  createWebHistory,
  DataLoaderPlugin,
} from 'vue-router/auto'
import { VueQueryPlugin } from '@tanstack/vue-query'
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
app.use(VueQueryPlugin, {})
app.use(DataLoaderPlugin, { router })
app.use(router)

app.mount('#app')
