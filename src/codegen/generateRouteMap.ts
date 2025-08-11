import type { TreeNode } from '../core/tree'
import { ResolvedOptions } from '../options'
import {
  generateParamsTypeDeclarations,
  ParamParserTypeInfo,
} from './generateParamParsers'
import {
  EXPERIMENTAL_generateRouteParams,
  generateRouteParams,
} from './generateRouteParams'

export function generateRouteNamedMap(
  node: TreeNode,
  options: ResolvedOptions
): string {
  if (node.isRoot()) {
    return `export interface RouteNamedMap {
${node
  .getChildrenSorted()
  .map((n) => generateRouteNamedMap(n, options))
  .join('')}}`
  }

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be referenced in the RouteNamedMap
    // otherwise it should be skipped to avoid navigating to a route that doesn't render anything
    (node.value.components.size > 0 && node.name
      ? `  '${node.name}': ${generateRouteRecordInfo(node, options)},\n`
      : '') +
    (node.children.size > 0
      ? node
          .getChildrenSorted()
          .map((n) => generateRouteNamedMap(n, options))
          .join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(
  node: TreeNode,
  options: ResolvedOptions
): string {
  const params = node.params
  let paramParsers: Array<ParamParserTypeInfo | null> = []
  let paramType: string = ''
  if (options.experimental.paramMatchers) {
    paramParsers = generateParamsTypeDeclarations(params)
    console.log(paramParsers)
    paramType = EXPERIMENTAL_generateRouteParams(node, paramParsers)
  }
  const typeParams = [
    `'${node.name}'`,
    `'${node.fullPath}'`,
    paramType || generateRouteParams(node, true),
    paramType || generateRouteParams(node, false),
  ]

  if (node.children.size > 0) {
    // TODO: remove Array.from() once Node 20 support is dropped
    const deepNamedChildren = Array.from(node.getChildrenDeep())
      // skip routes that are not added to the types
      .filter(
        (childRoute) => childRoute.value.components.size > 0 && childRoute.name
      )
      .map((childRoute) => `'${childRoute.name}'`)
      .sort()

    if (deepNamedChildren.length > 0) {
      typeParams.push(deepNamedChildren.join(' | '))
    }
  }

  return `RouteRecordInfo<${typeParams.join(', ')}>`
}
