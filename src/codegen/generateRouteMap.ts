import type { TreeNode } from '../core/tree'
import { generateRouteParams } from './generateRouteParams'

export function generateRouteNamedMap(node: TreeNode): string {
  // root
  if (node.isRoot()) {
    return `export interface RouteNamedMap {
${node.getSortedChildren().map(generateRouteNamedMap).join('')}}`
  }

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be referenced in the RouteNamedMap
    // otherwise it should be skipped to avoid navigating to a route that doesn't render anything
    (node.value.components.size
      ? `  '${node.name}': ${generateRouteRecordInfo(node)},\n`
      : '') +
    (node.children.size > 0
      ? node.getSortedChildren().map(generateRouteNamedMap).join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(node: TreeNode) {
  return `RouteRecordInfo<'${node.name}', '${
    node.fullPath
  }', ${generateRouteParams(node, true)}, ${generateRouteParams(node, false)}>`
}
