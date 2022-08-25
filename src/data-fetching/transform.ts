import {
  getTransformResult,
  isCallOf,
  parseSFC,
  MagicString,
} from '@vue-macros/common'
import { createUnplugin } from 'unplugin'
import { createFilter } from '@rollup/pluginutils'
import type {
  CallExpression,
  ExportNamedDeclaration,
  Node,
  Statement,
} from '@babel/types'
import type { RouteRecordRaw } from 'vue-router'

export function transform(code: string, id: string) {
  if (!code.includes('definePage')) return

  const sfc = parseSFC(code, id)

  if (!sfc.scriptSetup) return

  const { script, scriptSetup, scriptCompiled } = sfc

  const setupOffset = scriptSetup.loc.start.offset

  const namedExports = (scriptCompiled.scriptAst as Statement[])
    .filter(
      (node: Node): node is ExportNamedDeclaration =>
        node.type === 'ExportNamedDeclaration'
    )
    .map((node) => {
      if (node.declaration && node.declaration.type === 'VariableDeclaration') {
        return node.declaration.declarations
      } else if (node.specifiers.length) {
        return node.specifiers[0]
      }
    })

  // console.log('namedExports', namedExports)

  const definePageNodes = (scriptCompiled.scriptSetupAst as Node[])
    .map((node) => {
      if (node.type === 'ExpressionStatement') node = node.expression
      return isCallOf(node, 'definePage') ? node : null
    })
    .filter((node): node is CallExpression => !!node)

  if (!definePageNodes.length) {
    return
  } else if (definePageNodes.length > 1) {
    throw new SyntaxError(`duplicate definePage() call`)
  }

  console.log('!!!', definePageNodes[0])

  const s = new MagicString(code)

  return getTransformResult(s, id)
}

const filter = createFilter(/\.vue$/, undefined)

export const DefinePage = createUnplugin(() => {
  return {
    name: 'unplugin-define-page',
    transformInclude(id) {
      return filter(id)
    },
    transform(code, id) {
      return transform(code, id)
    },
  }
})
