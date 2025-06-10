import type { UnpluginOptions } from 'unplugin'
import type { VariableDeclarator, ImportDeclaration } from 'estree'

function nameFromDeclaration(node?: VariableDeclarator) {
  return node?.id.type === 'Identifier' ? node.id.name : ''
}

function getRouterDeclaration(nodes?: VariableDeclarator[]) {
  return nodes?.find(
    (x) =>
      x.init?.type === 'CallExpression' &&
      x.init.callee.type === 'Identifier' &&
      x.init.callee.name === 'createRouter'
  )
}

function getHandleHotUpdateDeclaration(node?: ImportDeclaration, modulePath?: string) {
  return (
    node?.type === 'ImportDeclaration' &&
    node.source.value === modulePath &&
    node.specifiers.some(
      (x) =>
        x.type === 'ImportSpecifier' &&
        x.imported.type === 'Identifier' &&
        x.imported.name === 'handleHotUpdate'
    )
  )
}

interface AutoHmrPluginOptions {
  modulePath: string
}

export function createAutoHmrPlugin({ modulePath }: AutoHmrPluginOptions): UnpluginOptions {
  const handleHotUpdateCallRegex = /handleHotUpdate\([\s\S]*?\)/

  return {
    name: 'unplugin-vue-router-auto-hmr',
    enforce: 'post',

    transform(code, id) {
      if (id.startsWith('\x00')) return

      // If you don't use automatically generated routes,
      // maybe it will be meaningless to deal with hmr?
      if (!code.includes('createRouter(') && !code.includes(modulePath)) {
        return
      }

      const ast = this.parse(code)

      let isImported: boolean = false
      let routerName: string | undefined
      let routerDeclaration: VariableDeclarator | undefined

      // @ts-expect-error
      for (const node of ast.body) {
        if (
          node.type === 'ExportNamedDeclaration' ||
          node.type === 'VariableDeclaration'
        ) {
          if (!routerName) {
            routerDeclaration = getRouterDeclaration(node.type === 'VariableDeclaration'
              ? node.declarations
              : node.declaration?.type === 'VariableDeclaration'
                ? node.declaration?.declarations
                : undefined)

            routerName = nameFromDeclaration(routerDeclaration)
          }
        } else if (node.type === 'ImportDeclaration') {
          isImported ||= getHandleHotUpdateDeclaration(node, modulePath)
        }
      }

      if (routerName) {
        const isHandleHotUpdateCalled = handleHotUpdateCallRegex.test(code)

        const handleHotUpdateCode = [code]

        // add import if not imported
        if (!isImported) {
          handleHotUpdateCode.unshift(
            `import { handleHotUpdate } from '${modulePath}'`
          )
        }

        // add handleHotUpdate call if not called
        if (!isHandleHotUpdateCalled) {
          handleHotUpdateCode.push(`handleHotUpdate(${routerName})`)
        }

        return {
          code: handleHotUpdateCode.join('\n')
        }
      }

      return
    }
  }
}
