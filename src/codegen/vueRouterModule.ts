// NOTE: this code needs to be generated because otherwise it doesn't go through transforms and `vue-router/auto/routes`

import type { ResolvedOptions } from '../options'

// cannot be resolved.
export function generateVueRouterProxy(
  routesModule: string,
  options: ResolvedOptions
) {
  return `
import { routes } from '${routesModule}'
import { createRouter as _createRouter } from 'vue-router'

export * from 'vue-router'
export {
  _defineLoader as defineLoader,
  _definePage as definePage,
  _HasDataLoaderMeta as HasDataLoaderMeta,
  _setupDataFetchingGuard as setupDataFetchingGuard,
  _stopDataFetchingScope as stopDataFetchingScope,

  _setupLoaderGuard as setupLoaderGuard,
} from 'unplugin-vue-router/runtime'

export function createRouter(options) {
  const { extendRoutes } = options
  // use Object.assign for better browser support
  const router = _createRouter(Object.assign(
    options,
    { routes: typeof extendRoutes === 'function' ? extendRoutes(routes) : routes },
  ))

  return router
}
`
}
