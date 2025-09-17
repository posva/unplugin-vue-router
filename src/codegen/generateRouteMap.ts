import type { TreeNode, TreeNodeNamed } from '../core/tree'
import { generateRouteParams } from './generateRouteParams'
import { pad, formatMultilineUnion, stringToStringType } from '../utils'

export function generateRouteNamedMap(node: TreeNode): string {
  if (node.isRoot()) {
    return `export interface RouteNamedMap {
${node.getChildrenSorted().map(generateRouteNamedMap).join('')}}`
  }

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be referenced in the RouteNamedMap
    // otherwise it should be skipped to avoid navigating to a route that doesn't render anything
    (node.value.components.size && node.isNamed()
      ? pad(
          2,
          `${stringToStringType(node.name)}: ${generateRouteRecordInfo(node)},\n`
        )
      : '') +
    (node.children.size > 0
      ? node.getChildrenSorted().map(generateRouteNamedMap).join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(node: TreeNodeNamed): string {
  const typeParams = [
    stringToStringType(node.name),
    stringToStringType(node.fullPath),
    generateRouteParams(node, true),
    generateRouteParams(node, false),
  ]

  const childRouteNames: string[] =
    node.children.size > 0
      ? // TODO: remove Array.from() once Node 20 support is dropped
        Array.from(node.getChildrenDeep())
          // skip routes that are not added to the types
          .reduce<string[]>((acc, childRoute) => {
            if (childRoute.value.components.size && childRoute.isNamed()) {
              acc.push(childRoute.name)
            }
            return acc
          }, [])
          .sort()
      : []

  typeParams.push(
    formatMultilineUnion(childRouteNames.map(stringToStringType), 4)
  )

  return `RouteRecordInfo<
${typeParams.map((line) => pad(4, line)).join(',\n')}
  >`
}
