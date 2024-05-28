import { createRouter, createWebHistory } from 'vue-router/auto'
import { routes } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

if (import.meta.hot) {
  // How to trigger this? tried virtual: /@id/
  import.meta.hot.accept('vue-router/auto-routes', (mod) => {
    console.log('✨ got new routes', mod)
  })
  import.meta.hot.accept((mod) => {
    console.log('🔁 reloading routes from router...', mod)
    console.log(mod!.router.getRoutes())
  })
}
