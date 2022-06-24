import type {
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteLocationOptions,
  RouteQueryAndHash,
  RouteRecordName,
} from 'vue-router'
import type {
  RouteRecordInfo,
  _RouteMapGeneric,
} from '../codegen/generateRouteMap'
import type { LiteralStringUnion } from '../core/utils'

export interface RouteLocationNormalizedTyped<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteLocationNormalized {
  name: Extract<Name, RouteRecordName>
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export type RouteLocationNormalizedTypedList<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>
> = { [N in keyof RouteMap]: RouteLocationNormalizedTyped<RouteMap, N> }

export interface RouteLocationNormalizedLoadedTyped<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteLocationNormalizedLoaded {
  name: Extract<Name, RouteRecordName>
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export type RouteLocationNormalizedLoadedTypedList<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>
> = { [N in keyof RouteMap]: RouteLocationNormalizedLoadedTyped<RouteMap, N> }

export interface RouteLocationAsRelativeTyped<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteQueryAndHash,
    RouteLocationOptions {
  name?: Name
  params?: RouteMap[Name]['paramsRaw']
}

export type RouteLocationAsRelativeTypedList<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>
> = { [N in keyof RouteMap]: RouteLocationAsRelativeTyped<RouteMap, N> }

export interface RouteLocationAsPathTyped<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteQueryAndHash,
    RouteLocationOptions {
  path: LiteralStringUnion<RouteMap[Name]['path']>
}

export type RouteLocationAsPathTypedList<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>
> = { [N in keyof RouteMap]: RouteLocationAsPathTyped<RouteMap, N> }

export type RouteLocationAsString<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>
> = LiteralStringUnion<RouteMap[keyof RouteMap]['path'], string>

export interface RouteLocationTyped<
  RouteMap extends _RouteMapGeneric,
  Name extends keyof RouteMap
> extends RouteLocation {
  name: Extract<Name, RouteRecordName>
  params: RouteMap[Name]['params']
}

export interface RouteLocationResolvedTyped<
  RouteMap extends _RouteMapGeneric,
  Name extends keyof RouteMap
> extends RouteLocationTyped<RouteMap, Name> {
  href: string
}

export type RouteLocationResolvedTypedList<
  RouteMap extends _RouteMapGeneric = Record<string, RouteRecordInfo>
> = { [N in keyof RouteMap]: RouteLocationResolvedTyped<RouteMap, N> }
