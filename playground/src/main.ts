import { createApp } from 'vue'
import App from './App.vue'
import { createWebHistory, createRouter } from '@vue-router'
import type { Route, RouteParams, RouteParamsRaw } from '@vue-router'

const router = createRouter({
  history: createWebHistory(),
})

console.log(router)

const app = createApp(App)

app.use(router)

app.mount('#app')
