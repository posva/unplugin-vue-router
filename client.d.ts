declare module '@vue-router/routes' {
  import type { RouteRecordRaw } from 'vue-router'
  export const routes: RouteRecordRaw[]
}

declare module '@vue-router' {
  import type { RouterOptions, Router } from 'vue-router'
  export * from 'vue-router'
  export function createRouter(options: Omit<RouterOptions, 'routes'>): Router
}
