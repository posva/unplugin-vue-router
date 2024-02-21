import type {
  RouteMeta,
  RouteParamsRaw,
  RouteParams,
  RouterLinkProps as _RouterLinkProps,
  RouteRecord,
} from 'vue-router'
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

/**
 * Helper type to define a Typed `RouteRecord`
 * @see {@link RouteRecord}
 */
export interface RouteRecordInfo<
  Name extends string = string,
  Path extends string = string,
  // TODO: could probably be inferred from the Params
  ParamsRaw extends RouteParamsRaw = RouteParamsRaw,
  Params extends RouteParams = RouteParams,
  Meta extends RouteMeta = RouteMeta,
> {
  name: Name
  path: Path
  paramsRaw: ParamsRaw
  params: Params
  // TODO: implement meta with a defineRoute macro
  meta: Meta
}

/**
 * Generic version of RouteNamedMap.
 * @internal
 */
export type _RouteMapGeneric = Record<string, RouteRecordInfo>
