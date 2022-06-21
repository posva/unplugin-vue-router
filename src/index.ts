import { resolve } from 'path'
import { createUnplugin } from 'unplugin'
import { createRoutesContext } from './core/context'
import { isArray } from './core/utils'
import { DEFAULT_OPTIONS, Options } from './types'

const VIRTUAL_PREFIX = 'virtual:'

export default createUnplugin<Options>((opt) => {
  const options: Required<Options> = { ...DEFAULT_OPTIONS, ...opt }
  const ctx = createRoutesContext(options)
  const root = process.cwd()

  function getVirtualId(id: string) {
    if (options._inspect) return id
    return id.startsWith(VIRTUAL_PREFIX)
      ? id.slice(VIRTUAL_PREFIX.length)
      : null
  }

  function asVirtualId(id: string) {
    // for inspection
    if (options._inspect) return id
    return VIRTUAL_PREFIX + id
  }

  return {
    name: 'unplugin-vue-router',
    enforce: 'pre',

    resolveId(id) {
      if (id === '~routes' || id === '~router') {
        // virtual module
        return asVirtualId(id)
      }
      return null
    },

    buildStart() {
      // TODO: detect watch or build to not create
      // stop watcher
      ctx.start()
    },

    load(id) {
      const resolvedId = getVirtualId(id)
      if (resolvedId === '~routes') {
        return ctx.generateRoutes()
      }

      // fallback
      return null
    },

    vite: {
      async config(config) {
        // TODO: do we need to use a vite util to merge the config?
        config.resolve ??= {}
        config.resolve.alias ??= {}
        // TODO: ensure this can be done in all versions (rollup and webpack)
        if (isArray(config.resolve.alias)) {
          config.resolve.alias = config.resolve.alias.concat({
            find: '~routerPages',
            replacement: resolve(root, options.routesFolder),
          })
        } else {
          config.resolve.alias['~routerPages'] = resolve(
            root,
            options.routesFolder
          )
        }
      },
    },
  }
})
