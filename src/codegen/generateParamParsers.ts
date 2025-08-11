import { camelCase } from 'scule'
import { TreeRouteParam } from '../core/treeNodeValue'
import { ImportsMap } from '../core/utils'

/**
 * Represents the type information for a parameter parser.
 * It includes the type declaration string and the type name.
 */
export type ParamParserTypeInfo = [typeDeclaration: string, type: string]

/**
 * Generates the import statement for a parameter parser type.
 *
 * @param paramParserPath - The path to the parameter parser file.
 */
export function generateParamParserTypeImport(
  param: TreeRouteParam
): ParamParserTypeInfo | null {
  if (!param.parser) {
    return null
  }
  // TODO: actualpath
  // const nameWithExtension = basename(param.paramName)
  const name = camelCase(param.parser)

  // TODO: treat custom parsers first

  // native parsers
  if (name === 'int') {
    return [``, 'number']
  }

  return [
    `type Param_${name} ReturnType<typeof import('./src/params/${param.paramName}').get>`,
    `Param_${name}`,
  ]
}

export function generateParamsTypeDeclarations(
  params: TreeRouteParam[]
): Array<ParamParserTypeInfo | null> {
  return params.map((param) => generateParamParserTypeImport(param))
}

// TODO: generate the whole list of type declarations

function generateParamParser(
  param: TreeRouteParam,
  importsMap: ImportsMap
): string {
  // TODO: lookup into src/params based on options
  // otherwise try native parsers
  if (param.parser === 'int') {
    importsMap.add('vue-router/experimental', `PARAM_PARSER_INT`)
    return ` ...PARAM_PARSER_INT, `
  }
  return ''
}

export function generateParamOptions(
  params: TreeRouteParam[],
  importsMap: ImportsMap
) {
  const paramOptions = params.map((param) => {
    const repeatable = param.repeatable ? `repeat: true, ` : ''
    return `
      ${param.paramName}: {${generateParamParser(param, importsMap)}${repeatable}},
`
  })

  return `{
${paramOptions.join('\n')}
    }`
}
