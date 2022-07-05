import { createUnplugin } from 'unplugin'
import { createRoutesContext } from './core/context'
import {
  MODULE_ROUTES_PATH,
  MODULE_VUE_ROUTER,
  getVirtualId as _getVirtualId,
  asVirtualId as _asVirtualId,
} from './core/moduleConstants'
import { DEFAULT_OPTIONS, Options, ResolvedOptions } from './options'
import { createViteContext } from './core/vite'

export default createUnplugin<Options>((opt, meta) => {
  const options: ResolvedOptions = { ...DEFAULT_OPTIONS, ...opt }
  const ctx = createRoutesContext(options)

  function getVirtualId(id: string) {
    if (options._inspect) return id
    return _getVirtualId(id)
  }

  function asVirtualId(id: string) {
    // for inspection
    if (options._inspect) return id
    return _asVirtualId(id)
  }

  return {
    name: 'unplugin-vue-router',
    enforce: 'pre',

    resolveId(id) {
      if (id === MODULE_ROUTES_PATH) {
        // virtual module
        return asVirtualId(id)
      }
      // NOTE: it wasn't possible to override or add new exports to vue-router
      // so we need to override it with a different package name
      if (id === MODULE_VUE_ROUTER) {
        return asVirtualId(id)
      }
      return null
    },

    buildStart() {
      return ctx.scanPages()
    },

    buildEnd() {
      if (options.logs) {
        console.log('🛑 stopping watcher')
      }
      ctx.stopWatcher()
    },

    load(id) {
      const resolvedId = getVirtualId(id)
      if (resolvedId === MODULE_ROUTES_PATH) {
        return ctx.generateRoutes()
      }

      // we need to use a virtual module so that vite resolves the @vue-router/routes
      // dependency correctly
      if (resolvedId === MODULE_VUE_ROUTER) {
        return ctx.generateVueRouterProxy()
      }

      // fallback
      return null
    },

    vite: {
      configureServer(server) {
        ctx.setServerContext(createViteContext(server))
      },
    },
  }
})

export { createRoutesContext }
export { getFileBasedRouteName, getPascalCaseRouteName } from './core/utils'

export type {
  _RouteMapGeneric,
  RouteRecordInfo,
} from './codegen/generateRouteMap'
export type {
  RouteLocationNormalizedTyped,
  RouteLocationNormalizedLoadedTyped,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationAsRelativeTyped,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsPathTyped,
  RouteLocationAsPathTypedList,
  RouteLocationAsString,
} from './typeExtensions/routeLocation'
export type { NavigationGuard } from './typeExtensions/navigationGuards'
export type { _RouterTyped } from './typeExtensions/router'
export type { RouterLinkTyped } from './typeExtensions/RouterLink'
export type {
  ParamValue,
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,
} from './codegen/generateRouteParams'
