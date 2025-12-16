import type { VariableDeclarator } from 'estree'
import {
  nameFromDeclaration,
  getRouterDeclaration,
  getHandleHotUpdateDeclaration,
  hasHandleHotUpdateCall,
} from './ast'
import { StringFilter, FilterPattern, type UnpluginOptions } from 'unplugin'
import { createFilter } from 'unplugin-utils'

export interface AutoHmrOptions {
  /**
   * Whether to enable auto HMR for Vue Router.
   * @default `true`
   */
  enabled?: boolean

  /**
   * Filter to determine which files to process.
   */
  filter?: Exclude<StringFilter, FilterPattern>

  /**
   * Name of the module to import the handleHotUpdate function from.
   * @default `'vue-router/auto-routes'`
   */
  modulePath?: string
}

export const DEFAULT_AUTO_HMR_OPTIONS = {
  enabled: true,
  modulePath: 'vue-router/auto-routes',
  filter: {
    include: ['**/router.{js,ts}', '**/router/index.{js,ts}'],
    exclude: [],
  },
} satisfies AutoHmrOptions

export function createAutoHmrPlugin({
  filter,
  modulePath = DEFAULT_AUTO_HMR_OPTIONS.modulePath,
}: AutoHmrOptions): UnpluginOptions {
  const hasCreateRouterFnCallRegex =
    /\w+\s*=\s*(?:experimental_)?createRouter\(/

  const shouldProcessId = createFilter(
    filter?.include ?? DEFAULT_AUTO_HMR_OPTIONS.filter.include,
    filter?.exclude ?? DEFAULT_AUTO_HMR_OPTIONS.filter.exclude
  )

  return {
    name: 'unplugin-vue-router-auto-hmr',
    enforce: 'post',
    transform(code, id) {
      if (id.startsWith('\x00')) return

      if (!shouldProcessId(id)) return

      if (!hasCreateRouterFnCallRegex.test(code)) {
        return
      }

      const ast = this.parse(code)

      let isImported = false
      let routerName: string | undefined
      let routerDeclaration: VariableDeclarator | undefined

      // @ts-expect-error
      for (const node of ast.body) {
        if (
          node.type === 'ExportNamedDeclaration' ||
          node.type === 'VariableDeclaration'
        ) {
          if (!routerName) {
            routerDeclaration = getRouterDeclaration(
              node.type === 'VariableDeclaration'
                ? node.declarations
                : node.declaration?.type === 'VariableDeclaration'
                  ? node.declaration?.declarations
                  : undefined
            )

            routerName = nameFromDeclaration(routerDeclaration)
          }
        } else if (node.type === 'ImportDeclaration') {
          isImported ||= getHandleHotUpdateDeclaration(node, modulePath)
        }
      }

      if (routerName) {
        const isCalledHandleHotUpdate = hasHandleHotUpdateCall(ast)

        const handleHotUpdateCode = [code]

        // add import if not imported
        if (!isImported) {
          handleHotUpdateCode.unshift(
            `import { handleHotUpdate } from '${modulePath}'`
          )
        }

        // add handleHotUpdate call if not called
        if (!isCalledHandleHotUpdate) {
          handleHotUpdateCode.push(`handleHotUpdate(${routerName})`)
        }

        return {
          code: handleHotUpdateCode.join('\n'),
        }
      }

      return undefined
    },
  }
}
