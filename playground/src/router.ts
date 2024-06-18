import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import type { RouteRecordInfo, ParamValue } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// let removeRoutes: Array<() => void> = []
// for (const route of routes) {
//   removeRoutes.push(router.addRoute(route))
// }

if (import.meta.hot) {
  // How to trigger this? tried virtual: /@id/
  const id = 'vue-router/auto-routes'
  // import.meta.hot.accept('vue-router/auto-routes', (mod) => {
  //   console.log('✨ got new routes', mod)
  // })
  // import.meta.hot.accept(id, (mod) => {
  //   console.log('✨ got new routes', mod)
  // })
  // import.meta.hot.accept((mod) => {
  //   console.log('🔁 reloading routes from router...', mod)
  //   console.log(mod!.router.getRoutes())
  // })

  // NOTE: this approach doesn't make sense and doesn't work anyway: it seems to fetch an outdated version of the file
  // import.meta.hot.on('vite:beforeUpdate', async (payload) => {
  //   console.log('🔁 vite:beforeUpdate', payload)
  //   const routesUpdate = payload.updates.find(
  //     (update) => update.path === 'virtual:vue-router/auto-routes'
  //   )
  //   if (routesUpdate) {
  //     console.log('🔁 reloading routes from router...')
  //     const { routes } = await import(
  //       '/@id/' + routesUpdate.path + `?t=${routesUpdate.timestamp}`
  //     )
  //     for (const removeRoute of removeRoutes) {
  //       console.log('Removing route...')
  //       removeRoute()
  //     }
  //     removeRoutes = []
  //     for (const route of routes) {
  //       removeRoutes.push(router.addRoute(route))
  //     }
  //     router.replace('')
  //   }
  // })
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
