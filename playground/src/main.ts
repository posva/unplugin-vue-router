import { createApp } from 'vue'
import App from './App.vue'
import { createWebHistory, createRouter } from '@vue-router'

const router = createRouter({
  extendRoutes: (routes) => {
    routes.find((r) => r.name === '/')!.meta = {}
    return routes
  },
  history: createWebHistory(),
})

console.log(router)

const app = createApp(App)

app.use(router)

app.mount('#app')
