import { relative } from 'pathe'
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

  // the root node is not a route
  const routesInfoList = node
    .getSortedChildren()
    .flatMap((child) => generateRouteFileInfoLines(child, root))

  // because the same file can be used for multiple routes, we need to group them
  const routesInfo = new Map<string, { routes: string[]; views: string[] }>()
  for (const routeInfo of routesInfoList) {
    // ensure we have an entry for the file
    let info = routesInfo.get(routeInfo.key)
    if (!info) {
      routesInfo.set(
        routeInfo.key,
        (info = {
          routes: [],
          views: [],
        })
      )
    }

    info.routes.push(...routeInfo.routeNames)
    info.views.push(...(routeInfo.childrenNamedViews || []))
  }

  const code = Array.from(routesInfo.entries())
    .map(
      ([file, { routes, views }]) =>
        `
  '${file}': {
    routes: ${routes.map((name) => `'${name}'`).join(' | ')}
    views: ${views.length > 0 ? views.map((view) => `'${view}'`).join(' | ') : 'never'}
  }
`
    )
    .join('\n')

  return `export interface RouteFileInfoMap {
${code}
}`
}

/**
 * Generate the route file info for a non-root node.
 */
function generateRouteFileInfoLines(
  node: TreeNode,
  rootDir: string
): Array<{
  key: string
  routeNames: string[]
  childrenNamedViews: string[] | null
}> {
  const children = node.children.size > 0 ? node.getSortedChildrenDeep() : null

  const childrenNamedViews = children
    ? Array.from(
        new Set(
          children.flatMap((child) => Array.from(child.value.components.keys()))
        )
      )
    : null

  const routeNames = [node, ...node.getSortedChildrenDeep()]
    // an unnamed route cannot be accessed in types
    .filter((node) => node.name)
    .map((node) => node.name)

  // Most of the time we only have one view, but with named views we can have multiple.
  const currentRouteInfo =
    routeNames.length === 0
      ? []
      : Array.from(node.value.components.values()).map((file) => ({
          key: relative(rootDir, file).replaceAll('\\', '/'),
          routeNames,
          childrenNamedViews,
        }))

  const childrenRouteInfo = node
    // if we recurse all children, we end up with duplicated entries
    // so we must go only with direct children
    .getSortedChildren()
    .flatMap((child) => generateRouteFileInfoLines(child, rootDir))

  return currentRouteInfo.concat(childrenRouteInfo)
}
