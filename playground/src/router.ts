import { createWebHistory } from 'vue-router'
import { routes, createRouter } from 'vue-router/auto-routes'
import type { RouteRecordInfo, ParamValue } from 'vue-router'

export const router = createRouter(
  {
    history: createWebHistory(),
    routes,
  },
  (routes) => {
    console.log('🔥 HMR', routes)
  }
)

function addRedirects() {
  router.addRoute({
    path: '/new-about',
    redirect: '/about?from=hoho',
  })
}

addRedirects()

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
