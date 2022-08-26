import { createUnplugin } from 'unplugin'
import { createRoutesContext } from './core/context'
import {
  MODULE_ROUTES_PATH,
  MODULE_VUE_ROUTER,
  getVirtualId as _getVirtualId,
  asVirtualId as _asVirtualId,
  routeBlockQueryRE,
  ROUTE_BLOCK_ID,
} from './core/moduleConstants'
import { Options, resolveOptions } from './options'
import { createViteContext } from './core/vite'
import { createFilter } from '@rollup/pluginutils'
import { join } from 'pathe'

export { Options }

export default createUnplugin<Options>((opt, meta) => {
  const options = resolveOptions(opt)
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

  // create the transform filter to detect `definePage()` inside page component
  const pageFilePattern =
    `**/*` +
    (options.extensions.length === 1
      ? options.extensions[0]
      : `.{${options.extensions
          .map((extension) => extension.replace('.', ''))
          .join(',')}}`)
  const filterPageComponents = createFilter(
    [
      ...options.routesFolder.map((routeOption) =>
        join(routeOption.src, pageFilePattern)
      ),
      // importing the definePage block
      /definePage\&vue$/,
    ],
    options.exclude
  )

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

      // this allows us to skip the route block module as a whole since we already parse it
      if (routeBlockQueryRE.test(id)) {
        return ROUTE_BLOCK_ID
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

    // we only need to transform page components
    transformInclude(id) {
      // console.log('filtering ' + id, filterPageComponents(id) ? '✅' : '❌')
      return filterPageComponents(id)
    },

    transform(code, id) {
      // console.log('👋 ', id)
      return ctx.definePageTransform(code, id)
    },

    // TODO: is it worth having a loadInclude?

    load(id) {
      // we need to use a virtual module so that vite resolves the vue-router/auto/routes
      // dependency correctly
      const resolvedId = getVirtualId(id)

      // vue-router/auto/routes
      if (resolvedId === MODULE_ROUTES_PATH) {
        return ctx.generateRoutes()
      }

      // vue-router/auto
      if (resolvedId === MODULE_VUE_ROUTER) {
        return ctx.generateVueRouterProxy()
      }

      // remove the <route> block as it's parsed by the plugin
      if (id === ROUTE_BLOCK_ID) {
        return {
          code: `export default {}`,
          map: null,
        }
      }

      // fallback
      // return null
    },

    // improves DX
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
  // TODO: mark all of these as internals since the dynamically exposed versions are fully typed, these are just helpers
  // to generate the convenient types
  RouteLocationAsRelativeTyped,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsPathTyped,
  RouteLocationAsPathTypedList,
  RouteLocationAsString,
  RouteLocationTyped,
  RouteLocationTypedList,
  RouteLocationResolvedTyped,
  RouteLocationResolvedTypedList,
  RouteLocationNormalizedTyped,
  RouteLocationNormalizedTypedList,
  RouteLocationNormalizedLoadedTyped,
  RouteLocationNormalizedLoadedTypedList,
} from './typeExtensions/routeLocation'
export type { NavigationGuard } from './typeExtensions/navigationGuards'
export type { _RouterTyped } from './typeExtensions/router'
export type {
  RouterLinkTyped,
  UseLinkFnTyped,
  _UseLinkReturnTyped,
} from './typeExtensions/RouterLink'
export type {
  ParamValue,
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,
} from './codegen/generateRouteParams'

export { TreeNode, createPrefixTree } from './core/tree'
export {
  createTreeNodeValue,
  TreeNodeValueParam,
  TreeNodeValueStatic,
} from './core/treeNodeValue'

// expose for generated type extensions
export type {
  DefineLoaderOptions as _DefineLoaderOptions,
  DataLoader as _DataLoader,
} from './data-fetching/defineLoader'

// TODO: THIS IS JUST FOR TESTING
export { DefinePage } from './core/definePage'

/**
 * @deprecated use `VueRouterAutoImports` instead
 */
export const VueRouterExports: Array<string | [string, string]> = [
  'useRoute',
  'useRouter',
  'defineLoader',
  'definePage',
]

/**
 * Adds useful auto imports to the AutoImport config:
 * @example
 * ```js
 * import { VueRouterAutoImports } from 'unplugin-vue-router'
 *
 * AutoImport({
 *   imports: [VueRouterAutoImports],
 * }),
 * ```
 */
export const VueRouterAutoImports = {
  'vue-router/auto': VueRouterExports,
}
