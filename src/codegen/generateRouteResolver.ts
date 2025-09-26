import { getLang } from '@vue-macros/common'
import { PrefixTree, type TreeNode } from '../core/tree'
import { ImportsMap } from '../core/utils'
import { type ResolvedOptions } from '../options'
import { ts } from '../utils'
import { generateParamsOptions, ParamParsersMap } from './generateParamParsers'
import { generatePageImport, formatMeta } from './generateRouteRecords'

/**
 * Compare two score arrays for sorting routes by priority.
 * Higher scores should come first (more specific routes).
 */
function compareRouteScore(a: number[][], b: number[][]): number {
  const maxLength = Math.max(a.length, b.length)

  for (let i = 0; i < maxLength; i++) {
    const aSegment = a[i] || []
    const bSegment = b[i] || []

    // Compare segment by segment, but consider the "minimum" score of each segment
    // since mixed segments with params should rank lower than pure static
    const aMinScore = aSegment.length > 0 ? Math.min(...aSegment) : 0
    const bMinScore = bSegment.length > 0 ? Math.min(...bSegment) : 0

    if (aMinScore !== bMinScore) {
      return bMinScore - aMinScore // Higher minimum score wins
    }

    // If minimum scores are equal, compare average scores
    const aAvgScore =
      aSegment.length > 0
        ? aSegment.reduce((sum, s) => sum + s, 0) / aSegment.length
        : 0
    const bAvgScore =
      bSegment.length > 0
        ? bSegment.reduce((sum, s) => sum + s, 0) / bSegment.length
        : 0

    if (aAvgScore !== bAvgScore) {
      return bAvgScore - aAvgScore // Higher average score wins
    }

    // If averages are equal, prefer fewer subsegments (less complexity)
    if (aSegment.length !== bSegment.length) {
      return aSegment.length - bSegment.length
    }
  }

  // If all segments are equal, prefer fewer segments (shorter paths)
  return a.length - b.length
}

interface GenerateRouteResolverState {
  id: number
  matchableRecords: {
    path: string
    varName: string
    score: number[][]
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

  importsMap.add('vue-router/experimental', 'createFixedResolver')
  importsMap.add('vue-router/experimental', 'MatcherPatternPathStatic')
  importsMap.add('vue-router/experimental', 'MatcherPatternPathDynamic')
  importsMap.add('vue-router/experimental', 'normalizeRouteRecord')

  return ts`
${records.join('\n\n')}

export const resolver = createFixedResolver([
${state.matchableRecords
  .sort((a, b) => compareRouteScore(a.score, b.score))
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
  const isMatchable = node.isMatchable()

  // we want to skip adding routes that add no options (components, meta, props, etc)
  // that simplifies the generated tree
  const shouldSkipNode = !isMatchable && !node.meta

  let varName: string | null = null
  let recordDeclaration = ''

  // Handle definePage imports
  const definePageDataList: string[] = []
  if (node.hasDefinePage) {
    for (const [name, filePath] of node.value.components) {
      const pageDataImport = `_definePage_${name}_${importsMap.size}`
      definePageDataList.push(pageDataImport)
      const lang = getLang(filePath)
      importsMap.addDefault(
        // TODO: apply the language used in the sfc
        `${filePath}?definePage&` +
          (lang === 'vue' ? 'vue&lang.tsx' : `lang.${lang}`),
        pageDataImport
      )
    }
  }

  if (!shouldSkipNode) {
    varName = `r_${state.id++}`

    let recordName: string
    let recordComponents: string

    if (isMatchable) {
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

    const routeRecordObject = `{
  ${recordName}
  ${generateRouteRecordPath({ node, importsMap, paramParsersMap })}${formatMeta(node, '  ')}
  ${recordComponents}${parentVar ? `\n  parent: ${parentVar},` : ''}
}`

    recordDeclaration =
      definePageDataList.length > 0
        ? `
const ${varName} = normalizeRouteRecord(
  ${generateRouteRecordMerge(routeRecordObject, definePageDataList, importsMap)}
)
`
        : `
const ${varName} = normalizeRouteRecord(${routeRecordObject})
`
            .trim()
            .split('\n')
            // remove empty lines
            .filter((l) => l.trimStart().length > 0)
            .join('\n')
  }

  const children = node.getChildrenSorted().map((child) =>
    generateRouteRecord({
      node: child,
      // If we skipped this node, pass the parent var from above, otherwise use our var
      parentVar: shouldSkipNode ? parentVar : varName,
      state,
      options,
      importsMap,
      paramParsersMap,
    })
  )

  return (
    recordDeclaration +
    (children.length
      ? (recordDeclaration ? '\n' : '') + children.join('\n')
      : '')
  )
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
    return `path: new MatcherPatternPathDynamic(
    ${node.regexp},
    ${generateParamsOptions(node.params, importsMap, paramParsersMap)},
    ${JSON.stringify(node.matcherPatternPathDynamicParts)},
  ),`
  } else {
    return `path: new MatcherPatternPathStatic('${node.fullPath}'),`
  }
}

/**
 * Generates a merge call for route records with definePage data in the experimental resolver format.
 */
function generateRouteRecordMerge(
  routeRecordObject: string,
  definePageDataList: string[],
  importsMap: ImportsMap
): string {
  if (definePageDataList.length === 0) {
    return routeRecordObject
  }

  importsMap.add('vue-router/experimental', '_mergeRouteRecord')

  // Re-indent the route object to be 4 spaces (2 levels from normalizeRouteRecord)
  const indentedRouteObject = routeRecordObject
    .split('\n')
    .map((line) => {
      return line && `    ${line}`
    })
    .join('\n')

  return `_mergeRouteRecord(
${indentedRouteObject},
${definePageDataList.map((name) => `    ${name}`).join(',\n')}
  )`
}
