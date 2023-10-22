import { createApp } from 'vue'
import App from './App.vue'
import {
  createWebHistory,
  createRouter,
  DataLoaderPlugin,
} from 'vue-router/auto'
import { VueQueryPlugin } from '@tanstack/vue-query'

const router = createRouter({
  history: createWebHistory(),
  extendRoutes: (routes) => {
    // routes.find((r) => r.name === '/')!.meta = {}
    return routes
  },
})

const app = createApp(App)

app.use(DataLoaderPlugin, { router })
app.use(router)
app.use(VueQueryPlugin, {})

app.mount('#app')
