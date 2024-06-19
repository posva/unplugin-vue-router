import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'
import type { RouteRecordInfo, ParamValue } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

if (import.meta.hot) {
  handleHotUpdate(router)
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
