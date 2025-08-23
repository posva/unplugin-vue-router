import { TreePathParam, TreeQueryParam } from '../core/treeNodeValue'
import { ImportsMap } from '../core/utils'
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

export function warnMissingParamParsers(
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
  params: (TreePathParam | TreeQueryParam)[],
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

export function generateParamParserOptions(
  param: TreePathParam | TreeQueryParam,
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
    // the path params have more options, the query params are passed as an argument
    return 'modifier' in param ? ` ...PARAM_PARSER_INT, ` : `PARAM_PARSER_INT`
  }
  return ''
}

export function generatePathParamsOptions(
  params: TreePathParam[],
  importsMap: ImportsMap,
  paramParsers: ParamParsersMap
) {
  const paramOptions = params.map((param) => {
    const repeatable = param.repeatable ? `repeat: true, ` : ''
    return `
${param.paramName}: {${generateParamParserOptions(param, importsMap, paramParsers)}${repeatable}},
`.slice(1, -1)
  })

  return `{
      ${paramOptions.join('\n      ')}
    }`
}
