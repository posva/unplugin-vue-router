import { camelCase } from 'scule'
import { TreeRouteParam } from '../core/treeNodeValue'
import { ImportsMap } from '../core/utils'
import { ts } from '../utils'
import { PrefixTree } from '../core/tree'

export type ParamParsersMap = Map<
  string,
  {
    name: string
    typeName: `Param_${string}`
    relativePath: string
    absolutePath: string
  }
>

export async function warnMissingParamParsers(
  tree: PrefixTree,
  paramParsers: ParamParsersMap
) {
  for (const node of tree.getChildrenDeepSorted()) {
    for (const param of node.params) {
      if (param.parser && !paramParsers.has(param.parser)) {
        if (param.parser !== 'int') {
          console.warn(
            `Parameter parser "${param.parser}" not found for route "${node.fullPath}".`
          )
        }
      }
    }
  }
}

/**
 * Generates the import statement for a parameter parser type.
 *
 * @param paramParserPath - The path to the parameter parser file.
 */
export function generateParamParserType(param: TreeRouteParam): string | null {
  if (!param.parser) {
    return null
  }
  // TODO: actualpath
  // const nameWithExtension = basename(param.paramName)
  const name = camelCase(param.parser)

  // TODO: treat custom parsers first

  // native parsers
  if (name === 'int') {
    return 'number'
  }

  return `Param_${name}`
}

export function generateParamParsersTypesDeclarations(
  paramParsers: ParamParsersMap
) {
  return Array.from(paramParsers.values())
    .map(
      ({ typeName, relativePath }) =>
        `type ${typeName} = ReturnType<NonNullable<typeof import('./${relativePath}').parser['get']>>`
    )
    .join('\n')
}

export function generateParamsTypes(
  params: TreeRouteParam[],
  parparsersMap: ParamParsersMap
): Array<string | null> {
  return params.map((param) => {
    if (param.parser) {
      if (parparsersMap.has(param.parser)) {
        return parparsersMap.get(param.parser)!.typeName
      } else if (param.parser === 'int') {
        return 'number'
      }
    }
    return null
  })
}

function generateParamParserOptions(
  param: TreeRouteParam,
  importsMap: ImportsMap,
  paramParsers: ParamParsersMap
): string {
  // we prioritize custom parsers to let users override them
  if (param.parser && paramParsers.has(param.parser)) {
    const { name, absolutePath } = paramParsers.get(param.parser)!
    const varName = `PARAM_PARSER__${name}`
    importsMap.add(absolutePath, { name: 'parser', as: varName })
    return ` ...${varName}, `
  } else if (param.parser === 'int') {
    importsMap.add('vue-router/experimental', `PARAM_PARSER_INT`)
    return ` ...PARAM_PARSER_INT, `
  }
  return ''
}

export function generateParamsOptions(
  params: TreeRouteParam[],
  importsMap: ImportsMap,
  paramParsers: ParamParsersMap
) {
  if (!paramParsers) {
    throw new Error('what')
  }
  const paramOptions = params.map((param) => {
    const repeatable = param.repeatable ? `repeat: true, ` : ''
    return `
      ${param.paramName}: {${generateParamParserOptions(param, importsMap, paramParsers)}${repeatable}},
`
  })

  return `{
${paramOptions.join('\n')}
    }`
}

export function generateParamParserListTypes(parserNames: string[]) {
  return parserNames.length
    ? ts`
declare module 'vue-router' {
  export interface TypesConfig {
    ParamParsers:
${parserNames.map((name) => `      | '${name}'`).join('\n')}
  }
}
`.trimStart()
    : ''
}
