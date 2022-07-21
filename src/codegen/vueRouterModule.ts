// NOTE: this code needs to be generated because otherwise it doesn't go through transforms and `@vue-router/routes`
// cannot be resolved.
export function generateVueRouterProxy(routesModule: string) {
  return `
import { routes } from '${routesModule}'
import { createRouter as _createRouter } from 'vue-router'
import {
  _setupDataFetchingGuard,
} from 'unplugin-vue-router/runtime'

export * from 'vue-router'
export {
  _defineLoader as defineLoader,
} from 'unplugin-vue-router/runtime'

export function createRouter(options) {
  const { extendRoutes } = options
  // use Object.assign for better browser support
  const router = _createRouter(Object.assign(
    options,
    { routes: typeof extendRoutes === 'function' ? extendRoutes(routes) : routes },
  ))

  _setupDataFetchingGuard(router)

  return router
}
`
}
