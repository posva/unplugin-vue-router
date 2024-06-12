import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import type { RouteRecordInfo, ParamValue } from 'vue-router'

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

// manual extension of route types
declare module 'vue-router/auto-routes' {
  export interface RouteNamedMap {
    'custom-dynamic-name': RouteRecordInfo<
      'custom-dynamic-name',
      '/added-during-runtime/[...path]',
      { path: ParamValue<true> },
      { path: ParamValue<false> }
    >
  }
}
