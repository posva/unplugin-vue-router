import {
  generateTransform,
  isCallOf,
  parseSFC,
  MagicString,
  checkInvalidScopeReference,
} from '@vue-macros/common'
import { Thenable, TransformResult } from 'unplugin'
import type {
  CallExpression,
  Node,
  ObjectProperty,
  Statement,
  StringLiteral,
} from '@babel/types'
import { walkAST } from 'ast-walker-scope'
import { CustomRouteBlock } from './customBlock'
import { warn } from './utils'

const MACRO_DEFINE_PAGE = 'definePage'
const MACRO_DEFINE_PAGE_QUERY = /[?&]definePage\b/

function isStringLiteral(node: Node | null | undefined): node is StringLiteral {
  return node?.type === 'StringLiteral'
}

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

  // are we extracting only the definePage object
  const isExtractingDefinePage = MACRO_DEFINE_PAGE_QUERY.test(id)

  const { script, scriptSetup, getSetupAst } = sfc
  const setupAst = getSetupAst()

  const definePageNodes = (setupAst?.body || ([] as Node[]))
    .map((node) => {
      if (node.type === 'ExpressionStatement') node = node.expression
      return isCallOf(node, MACRO_DEFINE_PAGE) ? node : null
    })
    .filter((node): node is CallExpression => !!node)

  if (!definePageNodes.length) {
    return isExtractingDefinePage
      ? // e.g. index.vue?definePage that contains a commented `definePage()
        'export default {}'
      : // e.g. index.vue that contains a commented `definePage()
        null
  } else if (definePageNodes.length > 1) {
    throw new SyntaxError(`duplicate definePage() call`)
  }

  const definePageNode = definePageNodes[0]
  const setupOffset = scriptSetup.loc.start.offset

  // we only want the page info
  if (isExtractingDefinePage) {
    const s = new MagicString(code)
    // remove everything except the page info

    const routeRecord = definePageNode.arguments[0]

    const scriptBindings = setupAst?.body ? getIdentifiers(setupAst.body) : []

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

    return generateTransform(s, id)
  } else {
    // console.log('!!!', definePageNode)

    const s = new MagicString(code)

    // s.removeNode(definePageNode, { offset: setupOffset })
    s.remove(
      setupOffset + definePageNode.start!,
      setupOffset + definePageNode.end!
    )

    return generateTransform(s, id)
  }
}

export function extractDefinePageNameAndPath(
  sfcCode: string,
  id: string
): { name?: string; path?: string } | null | undefined {
  if (!sfcCode.includes(MACRO_DEFINE_PAGE)) return

  const sfc = parseSFC(sfcCode, id)

  if (!sfc.scriptSetup) return

  const { getSetupAst } = sfc
  const setupAst = getSetupAst()

  const definePageNodes = (setupAst?.body ?? ([] as Node[]))
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

  const routeRecord = definePageNode.arguments[0]
  if (routeRecord.type !== 'ObjectExpression') {
    throw new SyntaxError(
      `[${id}]: definePage() expects an object expression as its only argument`
    )
  }

  const routeInfo: Pick<CustomRouteBlock, 'name' | 'path'> = {}

  for (const prop of routeRecord.properties) {
    if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
      if (prop.key.name === 'name') {
        if (prop.value.type !== 'StringLiteral') {
          warn(`route name must be a string literal. Found in "${id}".`)
        } else {
          routeInfo.name = prop.value.value
        }
      } else if (prop.key.name === 'path') {
        if (prop.value.type !== 'StringLiteral') {
          warn(`route path must be a string literal. Found in "${id}".`)
        } else {
          routeInfo.path = prop.value.value
        }
      }
    }
  }

  return routeInfo
}

function extractRouteAlias(
  aliasValue: ObjectProperty['value'],
  id: string
): string[] | undefined {
  if (
    aliasValue.type !== 'StringLiteral' &&
    aliasValue.type !== 'ArrayExpression'
  ) {
    warn(`route alias must be a string literal. Found in "${id}".`)
  } else {
    return aliasValue.type === 'StringLiteral'
      ? [aliasValue.value]
      : aliasValue.elements.filter(isStringLiteral).map((el) => el.value)
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
