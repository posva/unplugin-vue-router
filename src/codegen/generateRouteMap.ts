import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteMeta,
  RouteParams,
  RouteParamsRaw,
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
      ? `  '${node.value.routeName}': ${generateRouteRecordInfo(node)},\n`
      : '') +
    (node.children.size > 0
      ? Array.from(node.children.values()).map(generateRouteNamedMap).join('\n')
      : '')
  )
}

export function generateRouteRecordInfo(node: TreeLeaf) {
  return `RouteRecordInfo<'${node.value.routeName}', '${
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

export interface RouteLocationNormalizedTyped<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteLocationNormalized {
  name: RouteMap[Name]['name']
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export interface RouteLocationNormalizedLoadedTyped<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >,
  Name extends keyof RouteMap = string
> extends RouteLocationNormalizedLoaded {
  name: RouteMap[Name]['name']
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export type RouteLocationNormalizedLoadedTypedList<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >
> = string extends keyof RouteMap
  ? // simplify the resulting type
    { [name: string]: RouteLocationNormalizedLoaded }
  : { [N in keyof RouteMap]: RouteLocationNormalizedLoadedTyped<RouteMap, N> }
