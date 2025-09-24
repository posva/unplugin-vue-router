import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import type { RouteRecordInfo, ParamValue } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

function addRedirects() {
  router.addRoute({
    path: '/new-about',
    redirect: '/about?from=hoho',
  })
}

if (import.meta.hot) {
  handleHotUpdate(router, (routes) => {
    console.log('🔥 HMR with', routes)
    addRedirects()
  })
} else {
  // production
  addRedirects()
}

/* prettier-ignore */

// manual extension of route types
declare module 'vue-router/auto-routes' {
  export interface RouteNamedMap {
    'custom-dynamic-name': RouteRecordInfo<
      'custom-dynamic-name',
      '/added-during-runtime/[...path]',
      { path: ParamValue<true> },
      { path: ParamValue<false> },
      | 'custom-dynamic-child-name'
    >
    'custom-dynamic-child-name': RouteRecordInfo<
      'custom-dynamic-child-name',
      '/added-during-runtime/[...path]/child',
      { path: ParamValue<true> },
      { path: ParamValue<false> },
      | never
    >
  }
}
