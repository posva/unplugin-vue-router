import type { UnpluginOptions } from 'unplugin'
import type { VariableDeclarator, ImportDeclaration } from 'estree'
import type { AstNode } from 'rollup'

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

function hasHandleHotUpdateCall(ast: AstNode) {
  function traverse(node: any) {
    if (!node) return false;

    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      node.callee.name === 'handleHotUpdate'
    ) {
      return true;
    }

    // e.g.: autoRouter.handleHotUpdate()
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      node.callee.property.type === 'Identifier' &&
      node.callee.property.name === 'handleHotUpdate'
    ) {
      return true;
    }

    if (typeof node !== 'object') return false;

    for (const key in node) {
      if (key === 'type' || key === 'loc' || key === 'range') continue;

      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (traverse(item)) return true;
        }
      } else if (typeof child === 'object' && child !== null) {
        if (traverse(child)) return true;
      }
    }

    return false;
  }

  return traverse(ast);
}

interface AutoHmrPluginOptions {
  modulePath: string
}

export function createAutoHmrPlugin({ modulePath }: AutoHmrPluginOptions): UnpluginOptions {
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
          code: handleHotUpdateCode.join('\n')
        }
      }

      return
    }
  }
}
