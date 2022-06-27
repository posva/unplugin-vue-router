import type {
  RouteMeta,
  RouteParamsRaw,
  RouteParams,
  RouterLinkProps as _RouterLinkProps,
} from 'vue-router'
import type { TreeLeaf } from '../core/tree'
import { generateRouteParams } from './generateRouteParams'

export function generateRouteNamedMap(node: TreeLeaf): string {
  // root
  if (node.isRoot()) {
    return `export interface RouteNamedMap {
${Array.from(node.children.values()).map(generateRouteNamedMap).join('')}}`
  }

  return (
    // if the node has a filePath, it's a component, it has a routeName and it should be referenced in the RouteNamedMap
    // otherwise it should be skipped to avoid navigating to a route that doesn't render anything
    (node.value.filePath
      ? `  '${node.options.getRouteName(node)}': ${generateRouteRecordInfo(
          node
        )},\n`
      : '') +
    (node.children.size > 0
      ? Array.from(node.children.values()).map(generateRouteNamedMap).join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(node: TreeLeaf) {
  return `RouteRecordInfo<'${node.options.getRouteName(node)}', '${
    node.value.path
  }', ${generateRouteParams(node, true)}, ${generateRouteParams(node, false)}>`
}

export interface RouteRecordInfo<
  Name extends string = string,
  Path extends string = string,
  ParamsRaw extends RouteParamsRaw = RouteParamsRaw,
  Params extends RouteParams = RouteParams,
  Meta extends RouteMeta = RouteMeta
> {
  name: Name
  path: Path
  paramsRaw: ParamsRaw
  params: Params
  // TODO: implement meta with a defineRoute macro
  meta: Meta
}

export type _RouteMapGeneric = Record<string, RouteRecordInfo>
