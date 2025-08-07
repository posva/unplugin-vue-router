import { PrefixTree, type TreeNode } from '../core/tree'
import { ImportsMap } from '../core/utils'
import { type ResolvedOptions } from '../options'
import { ts } from '../utils'
import { generatePageImport } from './generateRouteRecords'

export function generateRouteResolver(
  tree: PrefixTree,
  options: ResolvedOptions,
  importsMap: ImportsMap
): string {
  const state = { id: 0, recordVarNames: [] }
  const records = tree
    .getChildrenSorted()
    .map((node) =>
      generateRouteRecord({ node, parentVar: null, state, options, importsMap })
    )

  return ts`
import {
  createStaticResolver,
  MatcherPatternPathStatic,
  MatcherPatternPathCustomParams,
  MatcherPatternPathStar,
  normalizeRouteRecord,
  // param matchers
  PARAM_NUMBER,
} from 'vue-router/experimental'
import type {
  EXPERIMENTAL_RouteRecordNormalized_Matchable,
  MatcherPatternHash,
  MatcherPatternQuery,
  EmptyParams,
} from 'vue-router/experimental'

${records.join('\n\n')}

export const resolver = createStaticResolver([
${state.recordVarNames.map((varName) => `  ${varName},`).join('\n')}
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
  state: {
    id: number
    recordVarNames: string[]
  }
  options: ResolvedOptions
  importsMap: ImportsMap
}): string {
  const varName = `r_${state.id++}`

  let recordName: string
  let recordComponents: string

  if (node.isMatchable()) {
    state.recordVarNames.push(varName)
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
  ${generateRouteRecordPathMatcher({ node })}
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

export function generateRouteRecordPathMatcher({ node }: { node: TreeNode }) {
  if (!node.isMatchable()) {
    return ''
  } else if (node.value.isStatic()) {
    return `path: new MatcherPatternPathStatic('${node.fullPath}'),`
  } else if (node.value.isParam()) {
    return `path: new MatcherPatternPathCustomParams('${node.fullPath}'),`
  }

  return `/* UNSUPPORTED path matcher for: "${node.fullPath}" */`
}
