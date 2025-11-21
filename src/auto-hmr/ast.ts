import type { AstNode } from 'rollup'
import type { VariableDeclarator, ImportDeclaration } from 'estree'

export function nameFromDeclaration(node?: VariableDeclarator) {
  return node?.id.type === 'Identifier' ? node.id.name : ''
}

export function getRouterDeclaration(nodes?: VariableDeclarator[]) {
  return nodes?.find(
    (x) =>
      x.init?.type === 'CallExpression' &&
      x.init.callee.type === 'Identifier' &&
      (x.init.callee.name === 'createRouter' ||
        x.init.callee.name === 'experimental_createRouter')
  )
}

export function getHandleHotUpdateDeclaration(node?: ImportDeclaration, modulePath?: string) {
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

export function hasHandleHotUpdateCall(ast: AstNode) {
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
