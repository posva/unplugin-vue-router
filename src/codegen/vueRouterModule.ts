// NOTE: this code needs to be generated because otherwise it doesn't go through transforms and `vue-router/auto-routes`

import type { ResolvedOptions } from '../options'

// cannot be resolved.
export function generateVueRouterProxy(
  routesModule: string,
  options: ResolvedOptions,
  { addPiniaColada }: { addPiniaColada: boolean }
) {
  return `
import { routes } from '${routesModule}'
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
  const { extendRoutes } = options
  // use Object.assign for better browser support
  const router = _createRouter(Object.assign(
    options,
    { routes: typeof extendRoutes === 'function' ? extendRoutes(routes) : routes },
  ))

  return router
}
`.trimStart()
}
