import { PrefixTree, type TreeNode } from '../core/tree'
import { ImportsMap } from '../core/utils'
import { type ResolvedOptions } from '../options'
import { ts } from '../utils'
import { generateParamsOptions, ParamParsersMap } from './generateParamParsers'
import { generatePageImport } from './generateRouteRecords'

interface GenerateRouteResolverState {
  id: number
  matchableRecords: {
    path: string
    varName: string
    score: number
  }[]
}

export function generateRouteResolver(
  tree: PrefixTree,
  options: ResolvedOptions,
  importsMap: ImportsMap,
  paramParsersMap: ParamParsersMap
): string {
  const state: GenerateRouteResolverState = { id: 0, matchableRecords: [] }
  const records = tree.getChildrenSorted().map((node) =>
    generateRouteRecord({
      node,
      parentVar: null,
      state,
      options,
      importsMap,
      paramParsersMap,
    })
  )

  importsMap.add('vue-router/experimental', 'createStaticResolver')
  importsMap.add('vue-router/experimental', 'MatcherPatternPathStatic')
  importsMap.add('vue-router/experimental', 'MatcherPatternPathCustomParams')
  importsMap.add('vue-router/experimental', 'MatcherPatternPathStar')
  importsMap.add('vue-router/experimental', 'normalizeRouteRecord')

  return ts`
${records.join('\n\n')}

export const resolver = createStaticResolver([
${state.matchableRecords
  .sort((a, b) => b.score - a.score)
  .map(
    ({ varName, path }) =>
      `  ${varName},  ${' '.repeat(String(state.id).length - varName.length + 2)}// ${path}`
  )
  .join('\n')}
])
`
}

/**
 * Generates the route record in the format expected by the static resolver.
 */
export function generateRouteRecord({
  node,
  parentVar,
  state,
  options,
  importsMap,
  paramParsersMap,
}: {
  node: TreeNode
  parentVar: string | null | undefined
  state: GenerateRouteResolverState
  options: ResolvedOptions
  importsMap: ImportsMap
  paramParsersMap: ParamParsersMap
}): string {
  // TODO: skip nodes that add no value. Maybe it should be done at the level of the tree?
  const varName = `r_${state.id++}`

  let recordName: string
  let recordComponents: string

  // TODO: what about groups?
  if (node.isMatchable()) {
    state.matchableRecords.push({
      path: node.fullPath,
      varName,
      score: node.score,
    })
    recordName = `name: '${node.name}',`
    recordComponents = generateRouteRecordComponent(
      node,
      '  ',
      options.importMode,
      importsMap
    )
  } else {
    recordName = node.name ? `/* internal name: '${node.name}' */` : ``
    recordComponents = ''
  }

  const recordDeclaration = `
const ${varName} = normalizeRouteRecord({
  ${recordName}
  ${generateRouteRecordPath({ node, importsMap, paramParsersMap })}
  ${recordComponents}
  ${parentVar ? `parent: ${parentVar},` : ''}
})
`
    .trim()
    .split('\n')
    // remove empty lines
    .filter((l) => l.trimStart().length > 0)
    .join('\n')

  const children = node.getChildrenSorted().map((child) =>
    generateRouteRecord({
      node: child,
      parentVar: varName,
      state,
      options,
      importsMap,
      paramParsersMap,
    })
  )

  return recordDeclaration + (children.length ? '\n' + children.join('\n') : '')
}

function generateRouteRecordComponent(
  node: TreeNode,
  indentStr: string,
  importMode: ResolvedOptions['importMode'],
  importsMap: ImportsMap
): string {
  const files = Array.from(node.value.components)
  return `components: {
${files
  .map(
    ([key, path]) =>
      `${indentStr + '  '}'${key}': ${generatePageImport(
        path,
        importMode,
        importsMap
      )}`
  )
  .join(',\n')}
${indentStr}},`
}

/**
 * Generates the `path` property of a route record for the static resolver.
 */
export function generateRouteRecordPath({
  node,
  importsMap,
  paramParsersMap,
}: {
  node: TreeNode
  importsMap: ImportsMap
  paramParsersMap: ParamParsersMap
}) {
  if (!node.isMatchable()) {
    return ''
  }
  const params = node.params
  if (params.length > 0) {
    return `path: new MatcherPatternPathCustomParams(
    ${node.regexp},
    ${generateParamsOptions(node.params, importsMap, paramParsersMap)},
    ${JSON.stringify(node.matcherParts)},
  ),`
  } else {
    return `path: new MatcherPatternPathStatic('${node.fullPath}'),`
  }
}
