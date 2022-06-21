import { resolve } from 'path'
import { createUnplugin } from 'unplugin'
import { createRoutesContext } from './core/context'
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
    },

    load(id) {
      const resolvedId = getVirtualId(id)
      if (resolvedId === '~routes') {
        return ctx.generateRoutes()
      }

      // fallback
      return null
    },
  }
})
