import { createApp } from 'vue'
import App from './App.vue'
import { createWebHistory, createRouter } from 'vue-router/auto'
// import { meta } from './pages/index.vue?macro=.vue'
// import { meta as meta2 } from './pages/[name].vue?macro=.vue'

// console.log({ meta, meta2 })

const router = createRouter({
  extendRoutes: (routes) => {
    // routes.find((r) => r.name === '/')!.meta = {}
    return routes
  },
  history: createWebHistory(),
})

const app = createApp(App)

app.use(router)

app.mount('#app')
