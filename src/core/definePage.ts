import {
  getTransformResult,
  isCallOf,
  parseSFC,
  MagicString,
  checkInvalidScopeReference,
} from '@vue-macros/common'
import { Thenable, TransformResult } from 'unplugin'
import type { CallExpression, Node, Statement } from '@babel/types'
import { walkAST } from 'ast-walker-scope'

const MACRO_DEFINE_PAGE = 'definePage'

export function definePageTransform({
  code,
  id,
}: {
  code: string
  id: string
}): Thenable<TransformResult> {
  if (!code.includes(MACRO_DEFINE_PAGE)) return

  const sfc = parseSFC(code, id)

  if (!sfc.scriptSetup) return

  const { script, scriptSetup, scriptCompiled } = sfc

  const definePageNodes = (scriptCompiled.scriptSetupAst as Node[])
    .map((node) => {
      if (node.type === 'ExpressionStatement') node = node.expression
      return isCallOf(node, MACRO_DEFINE_PAGE) ? node : null
    })
    .filter((node): node is CallExpression => !!node)

  if (!definePageNodes.length) {
    return
  } else if (definePageNodes.length > 1) {
    throw new SyntaxError(`duplicate definePage() call`)
  }

  const definePageNode = definePageNodes[0]
  const setupOffset = scriptSetup.loc.start.offset

  // we only want the page info
  if (id.includes(MACRO_DEFINE_PAGE)) {
    const s = new MagicString(code)
    // remove everything except the page info

    const routeRecord = definePageNode.arguments[0]

    const scriptBindings = sfc.scriptCompiled.scriptSetupAst
      ? getIdentifiers(sfc.scriptCompiled.scriptSetupAst as any)
      : []

    checkInvalidScopeReference(routeRecord, MACRO_DEFINE_PAGE, scriptBindings)

    // NOTE: this doesn't seem to be any faster than using MagicString
    // return (
    //   'export default ' +
    //   code.slice(
    //     setupOffset + routeRecord.start!,
    //     setupOffset + routeRecord.end!
    //   )
    // )

    s.remove(setupOffset + routeRecord.end!, code.length)
    s.remove(0, setupOffset + routeRecord.start!)
    s.prepend(`export default `)

    return getTransformResult(s, id)
  } else {
    // console.log('!!!', definePageNode)

    const s = new MagicString(code)

    // s.removeNode(definePageNode, { offset: setupOffset })
    s.remove(
      setupOffset + definePageNode.start!,
      setupOffset + definePageNode.end!
    )

    return getTransformResult(s, id)
  }
}

const getIdentifiers = (stmts: Statement[]) => {
  let ids: string[] = []
  walkAST(
    {
      type: 'Program',
      body: stmts,
      directives: [],
      sourceType: 'module',
      sourceFile: '',
    },
    {
      enter(node) {
        if (node.type === 'BlockStatement') {
          this.skip()
        }
      },
      leave(node) {
        if (node.type !== 'Program') return
        ids = Object.keys(this.scope)
      },
    }
  )

  return ids
}
