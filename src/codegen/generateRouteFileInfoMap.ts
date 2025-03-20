import { relative } from 'node:path'
import type { PrefixTree, TreeNode } from '../core/tree'

export type GenerateRouteFileInfoMapOptions = {
  root: string
}

export function generateRouteFileInfoMap(
  node: PrefixTree,
  options: GenerateRouteFileInfoMapOptions
): string {
  if (!node.isRoot()) {
    throw new Error('The provided node is not a root node')
  }

  return `export interface RouteFileInfoMap {
${generateRouteFileInfoLines(node, options)}}`
}

function generateRouteFileInfoLines(
  node: TreeNode,
  options: GenerateRouteFileInfoMapOptions
): string {
  const children = node.children.size > 0 ? node.getSortedChildren() : null

  const routeNamesUnion = recursiveGetRouteNames(node)
    .map((name) => `'${name}'`)
    .join(' | ')

  const childrenNamedViewsUnion = children
    ? Array.from(
        new Set(
          children
            .map((child) => Array.from(child.value.components.keys()))
            .flat()
        )
      )
        .map((name) => `'${name}'`)
        .join(' | ')
    : null

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be
    // referenced in the RouteFileInfoMap otherwise it should be skipped
    // TODO: can we use `RouteNameWithChildren` from https://github.com/vuejs/router/pull/2475 here if merged?
    Array.from(node.value.components.values())
      .map((file) =>
        generateRouteFileInfoEntry(
          file,
          { routes: routeNamesUnion, namedViews: childrenNamedViewsUnion },
          options
        )
      )
      .join('') +
    (children
      ?.map((child) => generateRouteFileInfoLines(child, options))
      .join('\n') ?? '')
  )
}

type GenerateRouteFileInfoEntryData = {
  /** A union of possible route names in the route component file  */
  routes: string
  namedViews: string | null
}

function generateRouteFileInfoEntry(
  file: string,
  data: GenerateRouteFileInfoEntryData,
  options: GenerateRouteFileInfoMapOptions
): string {
  const relativeFilePath = (file: string) => relative(options.root, file)

  // TODO: check 'views' implementation
  return `  '${relativeFilePath(file)}': {
    routes: ${data.routes},
    views: ${data.namedViews ?? 'never'},
  },\n`
}

/**
 * Gets the name of the provided node and all of its children
 */
function recursiveGetRouteNames(node: TreeNode): TreeNode['name'][] {
  return [
    node.name,
    ...node.getSortedChildren().map((child) => recursiveGetRouteNames(child)),
  ].flat()
}
