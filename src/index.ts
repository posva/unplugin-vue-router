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
// TODO: export standalone createRoutesContext that resolves partial options
import { Options, resolveOptions, DEFAULT_OPTIONS } from './options'
import { createViteContext } from './core/vite'
import { createFilter } from '@rollup/pluginutils'
import { join } from 'pathe'

export * from './types'

export { DEFAULT_OPTIONS }

export default createUnplugin<Options | undefined>((opt = {}, meta) => {
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
    },

    buildStart() {
      // TODO: how do we properly check if we are in dev mode?
      return ctx.scanPages(true)
    },

    buildEnd() {
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

    // loadInclude is necessary for webpack
    loadInclude(id) {
      if (id === ROUTE_BLOCK_ID) return true
      const resolvedId = getVirtualId(id)
      return (
        resolvedId === MODULE_ROUTES_PATH || resolvedId === MODULE_VUE_ROUTER
      )
    },

    load(id) {
      // remove the <route> block as it's parsed by the plugin
      if (id === ROUTE_BLOCK_ID) {
        return {
          code: `export default {}`,
          map: null,
        }
      }

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

// Route Tree and edition
// FIXME: deprecated, remove in next major
export { createPrefixTree } from './core/tree'
export { createTreeNodeValue } from './core/treeNodeValue'
export { EditableTreeNode } from './core/extendRoutes'

// FIXME: deprecated, remove in next major
/**
 * @deprecated use `VueRouterAutoImports` instead
 */
export const VueRouterExports: Array<string | [string, string]> = [
  'useRoute',
  'useRouter',
  // FIXME: remove after deprecation
  'defineLoader',
  'defineBasicLoader',
  'onBeforeRouteUpdate',
  'onBeforeRouteLeave',
  // NOTE: the typing seems broken locally, so instead we export it directly from unplugin-vue-router/runtime
  // 'definePage',
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
export const VueRouterAutoImports: Record<
  string,
  Array<string | [string, string]>
> = {
  'vue-router/auto': VueRouterExports,
  'unplugin-vue-router/runtime': [['_definePage', 'definePage']],
}
