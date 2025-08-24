import { experimental_createRouter } from 'vue-router/experimental'
import { resolver, handleHotUpdate } from 'vue-router/auto-resolver'

import {
  type RouteRecordInfo,
  type ParamValue,
  createWebHistory,
} from 'vue-router'

export const router = experimental_createRouter({
  history: createWebHistory(),
  resolver,
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
      { path: ParamValue<false> },
      'custom-dynamic-child-name'
    >
    'custom-dynamic-child-name': RouteRecordInfo<
      'custom-dynamic-child-name',
      '/added-during-runtime/[...path]/child',
      { path: ParamValue<true> },
      { path: ParamValue<false> },
      never
    >
  }
}
