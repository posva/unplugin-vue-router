import type { UnpluginOptions } from 'unplugin'
import type { VariableDeclarator } from 'estree'
import {
  nameFromDeclaration,
  getRouterDeclaration,
  getHandleHotUpdateDeclaration,
  hasHandleHotUpdateCall,
} from './ast'

interface AutoHmrPluginOptions {
  modulePath: string
}

export function createAutoHmrPlugin({
  modulePath,
}: AutoHmrPluginOptions): UnpluginOptions {
  const hasCreateRouterFnCallRegex =
    /\w+\s*=\s*(?:experimental_)?createRouter\(/

  return {
    name: 'unplugin-vue-router-auto-hmr',
    enforce: 'post',

    transform(code, id) {
      if (id.startsWith('\x00')) return

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

      return
    },
  }
}
