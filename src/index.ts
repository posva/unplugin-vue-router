import { resolve } from 'path'
import { createUnplugin } from 'unplugin'
import { createRoutesContext } from './core/context'
import type { Options } from './types'
import { watch } from 'chokidar'

const root = process.cwd()
export default createUnplugin<Options>((options) => {
  const ctx = createRoutesContext(options)

  return {
    name: 'unplugin-vue-router',
    enforce: 'pre',

    // should we transform the file id?
    transformInclude(id) {
      // console.log(id)
      return id.endsWith('main.ts')
    },

    buildStart() {
      ctx.setupWatcher()
    },

    watchChange(id, change) {
      console.log('we watch', { id, change })
      process.exit(0)
    },

    // load(id) {
    //   console.log('load', { id })
    //   return null
    // },

    transform(code) {
      return code.replace(
        '__UNPLUGIN__',
        `Hello Unplugin! ${options || 'no options'}`
      )
    },
  }
})
