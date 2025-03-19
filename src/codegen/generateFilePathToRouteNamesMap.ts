import { relative } from 'node:path'
import type { TreeNode } from '../core/tree'

export function generateFilePathToRouteNamesMap(
  node: TreeNode,
  options: { root: string }
): string {
  if (node.isRoot()) {
    return `export interface FilePathToRouteNamesMap {
${node
  .getSortedChildren()
  .map((child) => generateFilePathToRouteNamesMap(child, options))
  .join('')}}`
  }

  function getRelativeFilePath(file: string) {
    return relative(options.root, file)
  }

  const routeNamesUnion = recursiveGetRouteNames(node)
    .map((name) => `'${name}'`)
    .join(' | ')

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be
    // referenced in the FilePathToRouteNamesMap otherwise it should be skipped
    // TODO: can we use `RouteNameWithChildren` from https://github.com/vuejs/router/pull/2475 here if merged?
    Array.from(
      node.value.components
        .values()
        .map(
          (file) => `  '${getRelativeFilePath(file)}': ${routeNamesUnion},\n`
        )
    ).join('') +
    (node.children.size > 0
      ? node
          .getSortedChildren()
          .map((child) => generateFilePathToRouteNamesMap(child, options))
          .join('\n')
      : '')
  )
}

/**
 * Gets the name of the provided node and all of its children
 */
function recursiveGetRouteNames(node: TreeNode): TreeNode['name'][] {
  return [
    node.name,
    ...node
      .getSortedChildren()
      .values()
      .map((child) => recursiveGetRouteNames(child)),
  ].flat()
}
