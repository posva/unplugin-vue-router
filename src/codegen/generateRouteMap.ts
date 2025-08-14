import type { TreeNode } from '../core/tree'
import type { ResolvedOptions } from '../options'
import { generateParamsTypes, ParamParsersMap } from './generateParamParsers'
import {
  EXPERIMENTAL_generateRouteParams,
  generateRouteParams,
} from './generateRouteParams'
import { indent, formatMultilineUnion, stringToStringType } from '../utils'

export function generateRouteNamedMap(
  node: TreeNode,
  options: ResolvedOptions,
  paramParsersMap: ParamParsersMap
): string {
  if (node.isRoot()) {
    return `export interface RouteNamedMap {
${node
  .getChildrenSorted()
  .map((n) => generateRouteNamedMap(n, options, paramParsersMap))
  .join('')}}`
  }

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be referenced in the RouteNamedMap
    // otherwise it should be skipped to avoid navigating to a route that doesn't render anything
    (node.value.components.size > 0 && node.name
      ? indent(
          2,
          `'${node.name}': ${generateRouteRecordInfo(node, options, paramParsersMap)},\n`
        )
      : '') +
    (node.children.size > 0
      ? node
          .getChildrenSorted()
          .map((n) => generateRouteNamedMap(n, options, paramParsersMap))
          .join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(
  node: TreeNode,
  options: ResolvedOptions,
  paramParsersMap: ParamParsersMap
): string {
  let paramParsers: Array<string | null> = []

  if (options.experimental.paramParsers) {
    paramParsers = generateParamsTypes(node.params, paramParsersMap)
  }
  const typeParams = [
    `'${node.name}'`,
    `'${node.fullPath}'`,
    options.experimental.paramParsers
      ? EXPERIMENTAL_generateRouteParams(node, paramParsers, true)
      : generateRouteParams(node, true),
    options.experimental.paramParsers
      ? EXPERIMENTAL_generateRouteParams(node, paramParsers, false)
      : generateRouteParams(node, false),
  ]

  const childRouteNames: string[] =
    node.children.size > 0
      ? // TODO: remove Array.from() once Node 20 support is dropped
        Array.from(node.getChildrenDeep())
          // skip routes that are not added to the types
          .filter(
            (childRoute): childRoute is TreeNode & { name: string } =>
              childRoute.value.components.size > 0 && !!childRoute.name
          )
          .map((childRoute) => childRoute.name)
          .sort()
      : []

  typeParams.push(
    formatMultilineUnion(childRouteNames.map(stringToStringType), 4)
  )

  return `RouteRecordInfo<
${typeParams.map((line) => indent(4, line)).join(',\n')}
  >`
}
