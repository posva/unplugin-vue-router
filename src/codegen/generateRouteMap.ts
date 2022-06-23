import type {
  RouteLocation,
  RouteQueryAndHash,
  RouteLocationOptions,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteMeta,
  RouteParams,
  RouteParamsRaw,
  Router,
} from 'vue-router'
import type { Ref } from 'vue'
import type { TreeLeaf } from '../core/tree'
import { generateRouteParams } from './generateRouteParams'
import type { LiteralStringUnion } from '../core/utils'
import { RouteRecordName } from '@vue-router'

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
  name: Extract<Name, RouteRecordName>
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export interface RouteLocationNormalizedLoadedTyped<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteLocationNormalizedLoaded {
  name: Extract<Name, RouteRecordName>
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export type RouteLocationNormalizedLoadedTypedList<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >
> = { [N in keyof RouteMap]: RouteLocationNormalizedLoadedTyped<RouteMap, N> }

export interface RouteLocationAsRelativeTyped<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteQueryAndHash,
    RouteLocationOptions {
  name?: Name
  params?: RouteMap[Name]['paramsRaw']
}

export type RouteLocationAsRelativeTypedList<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >
> = { [N in keyof RouteMap]: RouteLocationAsRelativeTyped<RouteMap, N> }

export interface RouteLocationAsPathTyped<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteQueryAndHash,
    RouteLocationOptions {
  path: LiteralStringUnion<RouteMap[Name]['path']>
}

export type RouteLocationAsPathTypedList<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >
> = { [N in keyof RouteMap]: RouteLocationAsPathTyped<RouteMap, N> }

export type RouteLocationAsString<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >
> = LiteralStringUnion<RouteMap[keyof RouteMap]['path'], string>

export interface RouteLocationTyped<
  RouteMap extends Record<string, RouteRecordInfo>,
  Name extends keyof RouteMap
> extends RouteLocation {
  name: Extract<Name, RouteRecordName>
  params: RouteMap[Name]['params']
}

export interface RouteLocationResolvedTyped<
  RouteMap extends Record<string, RouteRecordInfo>,
  Name extends keyof RouteMap
> extends RouteLocationTyped<RouteMap, Name> {
  href: string
}

export type RouteLocationResolvedTypedList<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >
> = { [N in keyof RouteMap]: RouteLocationResolvedTyped<RouteMap, N> }

export interface _RouterTyped<
  RouteMap extends Record<string, RouteRecordInfo> = Record<
    string,
    RouteRecordInfo
  >
> extends Router {
  currentRoute: Ref<
    RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap]
  >

  resolve(
    to: RouteLocationAsString<RouteMap>,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocationResolvedTypedList<RouteMap>[keyof RouteMap]
  resolve(
    to: RouteLocationAsPathTyped<RouteMap>,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocationResolvedTypedList<RouteMap>[keyof RouteMap]
  resolve<L extends RouteLocationAsRelativeTypedList<RouteMap>[keyof RouteMap]>(
    to: L,
    currentLocation?: RouteLocationNormalizedLoaded
  ): L extends RouteLocationAsRelativeTyped<RouteMap, infer Name>
    ? //
      RouteLocationResolvedTyped<RouteMap, Name>
    : RouteLocationResolvedTypedList<RouteMap>[keyof RouteMap]
}

// export function useRoute
//   Name extends keyof RouteNamedMap = keyof RouteNamedMap
// >(name?: Name): RouteLocationNormalizedLoadedTypedList<RouteNamedMap>[Name]
