import { createApp } from 'vue'
import App from './App.vue'
import {
  createWebHistory,
  createRouter,
  setupDataFetchingGuard,
  setupLoaderGuard,
} from 'vue-router/auto'

const router = createRouter({
  history: createWebHistory(),
  extendRoutes: (routes) => {
    // routes.find((r) => r.name === '/')!.meta = {}
    return routes
  },
})

// setupDataFetchingGuard(router)
setupLoaderGuard(router)

const app = createApp(App)

app.use(router)

app.mount('#app')
