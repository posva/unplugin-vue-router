import {
  generateTransform,
  isCallOf,
  parseSFC,
  MagicString,
  checkInvalidScopeReference,
} from '@vue-macros/common'
import type { Thenable, TransformResult } from 'unplugin'
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
import { ParsedStaticImport, findStaticImports, parseStaticImport } from 'mlly'

const MACRO_DEFINE_PAGE = 'definePage'
export const MACRO_DEFINE_PAGE_QUERY = /[?&]definePage\b/

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
  // are we extracting only the definePage object
  const isExtractingDefinePage = MACRO_DEFINE_PAGE_QUERY.test(id)

  if (!code.includes(MACRO_DEFINE_PAGE)) {
    // avoid having an invalid module that is just empty
    // https://github.com/posva/unplugin-vue-router/issues/338
    return isExtractingDefinePage ? 'export default {}' : undefined
  }

  // TODO: handle also non SFC

  const sfc = parseSFC(code, id)
  if (!sfc.scriptSetup) return

  const { scriptSetup, getSetupAst } = sfc
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

  const definePageNode = definePageNodes[0]!
  const setupOffset = scriptSetup.loc.start.offset

  // we only want the page info
  if (isExtractingDefinePage) {
    const s = new MagicString(code)
    // remove everything except the page info

    const routeRecord = definePageNode.arguments[0]

    if (!routeRecord) {
      throw new SyntaxError(
        `[${id}]: definePage() expects an object expression as its only argument`
      )
    }

    const scriptBindings = setupAst?.body ? getIdentifiers(setupAst.body) : []

    // this will throw if a property from the script setup is used in definePage
    checkInvalidScopeReference(routeRecord, MACRO_DEFINE_PAGE, scriptBindings)

    s.remove(setupOffset + routeRecord.end!, code.length)
    s.remove(0, setupOffset + routeRecord.start!)
    s.prepend(`export default `)

    // find all static imports and filter out the ones that are not used
    const staticImports = findStaticImports(code)

    const usedIds = new Set<string>()
    const localIds = new Set<string>()

    walkAST(routeRecord, {
      enter(node) {
        // skip literal keys from object properties
        if (
          this.parent?.type === 'ObjectProperty' &&
          this.parent.key === node &&
          // still track computed keys [a + b]: 1
          !this.parent.computed &&
          node.type === 'Identifier'
        ) {
          this.skip()
        } else if (
          // filter out things like 'log' in console.log
          this.parent?.type === 'MemberExpression' &&
          this.parent.property === node &&
          !this.parent.computed &&
          node.type === 'Identifier'
        ) {
          this.skip()
          // types are stripped off so we can skip them
        } else if (node.type === 'TSTypeAnnotation') {
          this.skip()
          // track everything else
        } else if (node.type === 'Identifier' && !localIds.has(node.name)) {
          usedIds.add(node.name)
          // track local ids that could shadow an import
        } else if ('scopeIds' in node && node.scopeIds instanceof Set) {
          // avoid adding them to the usedIds list
          for (const id of node.scopeIds as Set<string>) {
            localIds.add(id)
          }
        }
      },
      leave(node) {
        if ('scopeIds' in node && node.scopeIds instanceof Set) {
          // clear out local ids
          for (const id of node.scopeIds as Set<string>) {
            localIds.delete(id)
          }
        }
      },
    })

    for (const imp of staticImports) {
      const importCode = generateFilteredImportStatement(
        parseStaticImport(imp),
        usedIds
      )
      if (importCode) {
        s.prepend(importCode + '\n')
      }
    }

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

  const definePageNode = definePageNodes[0]!

  const routeRecord = definePageNode.arguments[0]
  if (!routeRecord) {
    throw new SyntaxError(
      `[${id}]: definePage() expects an object expression as its only argument`
    )
  }

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

// TODO: use
export function extractRouteAlias(
  aliasValue: ObjectProperty['value'],
  id: string
): string[] | void {
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

/**
 * Generate a filtere import statement based on a set of identifiers that should be kept.
 *
 * @param parsedImports - parsed imports with mlly
 * @param usedIds - set of used identifiers
 * @returns `null` if no import statement should be generated, otherwise the import statement as a string without a newline
 */
function generateFilteredImportStatement(
  parsedImports: ParsedStaticImport,
  usedIds: Set<string>
) {
  if (!parsedImports || usedIds.size < 1) return null

  const { namedImports, defaultImport, namespacedImport } = parsedImports

  if (namespacedImport && usedIds.has(namespacedImport)) {
    return `import * as ${namespacedImport} from '${parsedImports.specifier}'`
  }

  let importListCode = ''
  if (defaultImport && usedIds.has(defaultImport)) {
    importListCode += defaultImport
  }

  let namedImportListCode = ''
  for (const importName in namedImports) {
    if (usedIds.has(importName)) {
      // add comma if we have more than one named import
      namedImportListCode += namedImportListCode ? `, ` : ''

      namedImportListCode +=
        importName === namedImports[importName]
          ? importName
          : `${importName} as ${namedImports[importName]}`
    }
  }

  importListCode += importListCode && namedImportListCode ? ', ' : ''
  importListCode += namedImportListCode ? `{${namedImportListCode}}` : ''

  if (!importListCode) return null

  return `import ${importListCode} from '${parsedImports.specifier}'`
}
