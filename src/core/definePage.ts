import {
  generateTransform,
  isCallOf,
  parseSFC,
  MagicString,
  checkInvalidScopeReference,
  babelParse,
  getLang,
} from '@vue-macros/common'
import type { Thenable, TransformResult } from 'unplugin'
import type {
  CallExpression,
  Node,
  ObjectProperty,
  Program,
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

/**
 * Generate the ast from a code string and an id. Works with SFC and non-SFC files.
 */
function getCodeAst(code: string, id: string) {
  let offset = 0
  let ast: Program | undefined
  const lang = getLang(id.split(MACRO_DEFINE_PAGE_QUERY)[0]!)
  
  try {
    if (lang === 'vue') {
      const sfc = parseSFC(code, id)
      if (sfc.scriptSetup) {
        ast = sfc.getSetupAst()
        offset = sfc.scriptSetup.loc.start.offset
      } else if (sfc.script) {
        ast = sfc.getScriptAst()
        offset = sfc.script.loc.start.offset
      }
    } else if (/[jt]sx?$/.test(lang)) {
      ast = babelParse(code, lang)
    }
  } catch (error) {
    // If there's a syntax error in parsing, we can't extract definePage
    // Return undefined AST to indicate parsing failure
    ast = undefined
  }

  const definePageNodes: CallExpression[] = (ast?.body || [])
    .map((node) => {
      const definePageCallNode =
        node.type === 'ExpressionStatement' ? node.expression : node
      return isCallOf(definePageCallNode, MACRO_DEFINE_PAGE)
        ? definePageCallNode
        : null
    })
    .filter((node) => !!node)

  return { ast, offset, definePageNodes }
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

  try {
    const { ast, offset, definePageNodes } = getCodeAst(code, id)
    if (!ast) return isExtractingDefinePage ? 'export default {}' : undefined

    if (!definePageNodes.length) {
      return isExtractingDefinePage
        ? // e.g. index.vue?definePage that contains a commented `definePage()
          'export default {}'
        : // e.g. index.vue that contains a commented `definePage()
          null
    } else if (definePageNodes.length > 1) {
      warn(`duplicate definePage() call in ${id}`)
      return isExtractingDefinePage ? 'export default {}' : undefined
    }

    const definePageNode = definePageNodes[0]!

    // we only want the page info
    if (isExtractingDefinePage) {
      const s = new MagicString(code)
      // remove everything except the page info

      const routeRecord = definePageNode.arguments[0]

      if (!routeRecord) {
        warn(`[${id}]: definePage() expects an object expression as its only argument`)
        return 'export default {}'
      }

      const scriptBindings = ast.body ? getIdentifiers(ast.body) : []

      // this will throw if a property from the script setup is used in definePage
      try {
        checkInvalidScopeReference(routeRecord, MACRO_DEFINE_PAGE, scriptBindings)
      } catch (error) {
        warn(`[${id}]: ${error instanceof Error ? error.message : 'Invalid scope reference in definePage'}`)
        return 'export default {}'
      }

      s.remove(offset + routeRecord.end!, code.length)
      s.remove(0, offset + routeRecord.start!)
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

      // s.removeNode(definePageNode, { offset })
      s.remove(offset + definePageNode.start!, offset + definePageNode.end!)

      return generateTransform(s, id)
    }
  } catch (error) {
    // Handle any syntax errors or parsing errors gracefully
    warn(`[${id}]: Failed to process definePage: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return isExtractingDefinePage ? 'export default {}' : undefined
  }
}

export function extractDefinePageNameAndPath(
  sfcCode: string,
  id: string
): { name?: string | false; path?: string } | null | undefined {
  if (!sfcCode.includes(MACRO_DEFINE_PAGE)) return

  try {
    const { ast, definePageNodes } = getCodeAst(sfcCode, id)
    if (!ast) return

    if (!definePageNodes.length) {
      return
    } else if (definePageNodes.length > 1) {
      warn(`duplicate definePage() call in ${id}`)
      return
    }

    const definePageNode = definePageNodes[0]!

    const routeRecord = definePageNode.arguments[0]
    if (!routeRecord) {
      warn(`[${id}]: definePage() expects an object expression as its only argument`)
      return
    }

    if (routeRecord.type !== 'ObjectExpression') {
      warn(`[${id}]: definePage() expects an object expression as its only argument`)
      return
    }

    const routeInfo: Pick<CustomRouteBlock, 'name' | 'path'> = {}

    for (const prop of routeRecord.properties) {
      if (prop.type === 'ObjectProperty' && prop.key.type === 'Identifier') {
        if (prop.key.name === 'name') {
          if (
            prop.value.type !== 'StringLiteral' &&
            (prop.value.type !== 'BooleanLiteral' || prop.value.value !== false)
          ) {
            warn(
              `route name must be a string literal or false. Found in "${id}".`
            )
          } else {
            // TODO: why does TS not narrow down the type?
            routeInfo.name = prop.value.value as string | false
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
  } catch (error) {
    // Handle any syntax errors or parsing errors gracefully
    warn(`[${id}]: Failed to extract definePage info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return
  }
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
