// NOTE: this code needs to be generated because otherwise it doesn't go through transforms and `vue-router/auto-routes`

import type { ResolvedOptions } from '../options'

// cannot be resolved.
export function generateVueRouterProxy(
  routesModule: string,
  options: ResolvedOptions,
  { addPiniaColada }: { addPiniaColada: boolean }
) {
  return `
import { createRouter as _createRouter } from 'vue-router'

export * from 'vue-router'
export {
  definePage,
  // new data fetching
  DataLoaderPlugin,
  NavigationResult,
} from 'unplugin-vue-router/runtime'

export * from 'unplugin-vue-router/data-loaders/basic'
${addPiniaColada ? "export * from 'unplugin-vue-router/data-loaders/pinia-colada'" : ''}

export function createRouter(options) {
  const { extendRoutes, routes } = options
  // use Object.assign for better browser support
  if (extendRoutes) {
    console.warn('"extendRoutes()" is deprecated, please modify the routes directly. See')
  }
  const router = _createRouter(Object.assign(
    options,
    { routes: typeof extendRoutes === 'function' ? (extendRoutes(routes) || routes) : routes },
  ))

  return router
}
`.trimStart()
}

// FIXME: remove `extendRoutes()` in the next major version
