import { relative } from 'node:path'
import type { PrefixTree, TreeNode } from '../core/tree'

export function generateRouteFileInfoMap(
  node: PrefixTree,
  {
    root,
  }: {
    root: string
  }
): string {
  if (!node.isRoot()) {
    throw new Error('The provided node is not a root node')
  }

  // FIXME: move the isRoot check

  return `export interface RouteFileInfoMap {
${generateRouteFileInfoLines(node, root)
  // pad the lines for indentation
  .split('\n')
  .map((line) => line && '  ' + line)
  .join('\n')}
}`
}

/**
 * Generate the route file info for a non-root node.
 */
function generateRouteFileInfoLines(node: TreeNode, rootDir: string): string {
  // FIXME: remove check and call the function correctly
  if (node.isRoot()) {
    return node
      .getSortedChildren()
      .map((child) => generateRouteFileInfoLines(child, rootDir))
      .join('\n')
  }

  const children = node.children.size > 0 ? node.getSortedChildrenDeep() : null

  const childrenNamedViewsUnion = children
    ? Array.from(
        new Set(
          children
            .map((child) => Array.from(child.value.components.keys()))
            .flat()
        )
      ).map((name) => `'${name}'`)
    : null

  // FIXME: inline to avoid unnamed routes to compute it
  const routeNames = [node, ...node.getSortedChildrenDeep()]
    // an unnamed route cannot be accessed in types
    .filter((node) => node.name)
    // to form a union of all route names later
    .map((child) => `'${child.name}'`)

  // Most of the time we only have one view, but with named views we can have multiple.
  const currentRouteInfo =
    routeNames.length === 0
      ? []
      : Array.from(node.value.components.values()).map((file) =>
          generateRouteFileInfoEntry(
            file,
            routeNames,
            childrenNamedViewsUnion,
            rootDir
          )
        )

  const childrenRouteInfo = node
    // if we recurse all children, we end up with duplicated entries
    // so we must go only with direct children
    .getSortedChildren()
    .map((child) => generateRouteFileInfoLines(child, rootDir))

  return currentRouteInfo.concat(childrenRouteInfo).join('\n')
}

function generateRouteFileInfoEntry(
  file: string,
  routesNames: string[],
  namedViews: string[] | null,
  rootDir: string
): string {
  // TODO: use correct tools
  const relativeFilePath = (file: string) =>
    relative(rootDir, file).replaceAll('\\', '/')

  // TODO: check 'views' implementation
  // FIXME: this
  return `
'${relativeFilePath(file)}': {
  routes: ${routesNames.join(' | ')}
  views: ${namedViews?.join(' | ') || 'never'}
}
`.trim()
}
