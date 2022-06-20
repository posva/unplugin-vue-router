import { resolve } from 'path'
import { createUnplugin } from 'unplugin'
import { createRoutesContext } from './core/context'
import { isArray } from './core/utils'
import { DEFAULT_OPTIONS, Options } from './types'

export default createUnplugin<Options>((opt) => {
  const options: Required<Options> = { ...DEFAULT_OPTIONS, ...opt }
  const ctx = createRoutesContext(options)
  const root = process.cwd()

  return {
    name: 'unplugin-vue-router',
    enforce: 'pre',

    transformInclude(id) {
      return id === '~routes' || id === '~router'
    },
    resolveId(id, importer?) {
      if (id === '~routes' || id === '~router') {
        return id
      }
      return null
    },

    buildStart() {
      // stop watcher
      ctx.start()
    },

    load(id) {
      if (id === '~routes') {
        return ctx.generateRoutes()
      }

      // fallback
      return null
    },

    transform(code) {
      return code.replace(
        '__UNPLUGIN__',
        `Hello Unplugin! ${options || 'no options'}`
      )
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
