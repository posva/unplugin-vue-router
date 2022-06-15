import { createUnplugin } from 'unplugin'
import type { Options } from './types'

export default createUnplugin<Options>(options => ({
  name: 'unplugin-starter',
  transformInclude(id) {
    return id.endsWith('main.ts')
  },
  transform(code) {
    return code.replace('__UNPLUGIN__', `Hello Unplugin! ${options}`)
  },
}))
