import { PrefixTree, type TreeNode } from '../core/tree'
import { ImportsMap } from '../core/utils'
import { type ResolvedOptions } from '../options'
import { ts } from '../utils'
import { generateParamOptions } from './generateParamParsers'
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
  importsMap: ImportsMap
): string {
  const state: GenerateRouteResolverState = { id: 0, matchableRecords: [] }
  const records = tree
    .getChildrenSorted()
    .map((node) =>
      generateRouteRecord({ node, parentVar: null, state, options, importsMap })
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

export function generateRouteRecord({
  node,
  parentVar,
  state,
  options,
  importsMap,
}: {
  node: TreeNode
  parentVar: string | null | undefined
  state: GenerateRouteResolverState
  options: ResolvedOptions
  importsMap: ImportsMap
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
  ${generateRouteRecordPathMatcher({ node, importsMap })}
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

export function generateRouteRecordPathMatcher({
  node,
  importsMap,
}: {
  node: TreeNode
  importsMap: ImportsMap
}) {
  if (!node.isMatchable()) {
    return ''
    // TODO: do we really need isGroup?
  } else if (node.value.isStatic() || node.value.isGroup()) {
    return `path: new MatcherPatternPathStatic('${node.fullPath}'),`
  } else if (node.value.isParam()) {
    return `path: new MatcherPatternPathCustomParams(
    ${node.regexp},
    ${generateParamOptions(node.params, importsMap)},
    ${JSON.stringify(node.matcherParts)},
  ),`
  }

  return `/* UNSUPPORTED path matcher for: "${node.fullPath}" */`
}
