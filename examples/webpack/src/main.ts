import { createApp } from 'vue'
import App from './App.vue'
// @ts-expect-error
import { createWebHistory, createRouter } from '@vue-router'

const router = createRouter({

  history: createWebHistory(),
})

const app = createApp(App)
app.use(router)
app.mount('#app')
