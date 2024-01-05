import type {
  Router,
  RouteParams,
  RouteParamsRaw,
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
import type { RouteNamedMap } from '../augmented-types'

export type _RouteRecordName = keyof RouteNamedMap

export interface RouteLocationNormalizedTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteLocationNormalized {
  name: Extract<Name, RouteRecordName>
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export type RouteLocationNormalizedTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationNormalizedTyped<RouteMap, N> }

export interface RouteLocationNormalizedLoadedTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteLocationNormalizedLoaded {
  name: Extract<Name, RouteRecordName>
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

export type RouteLocationNormalizedLoadedTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationNormalizedLoadedTyped<RouteMap, N> }

export interface RouteLocationAsRelativeTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteQueryAndHash,
    RouteLocationOptions {
  name?: Name
  params?: RouteMap[Name]['paramsRaw']
}

export type RouteLocationAsRelativeTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationAsRelativeTyped<RouteMap, N> }

export interface RouteLocationAsPathTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteQueryAndHash,
    RouteLocationOptions {
  path: LiteralStringUnion<RouteMap[Name]['path']>
}

export type RouteLocationAsPathTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationAsPathTyped<RouteMap, N> }

export type RouteLocationAsString<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = LiteralStringUnion<RouteMap[keyof RouteMap]['path'], string>

export interface RouteLocationTyped<
  RouteMap extends _RouteMapGeneric,
  Name extends keyof RouteMap
> extends RouteLocation {
  name: Extract<Name, RouteRecordName>
  params: RouteMap[Name]['params']
}

export type RouteLocationTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationTyped<RouteMap, N> }

export interface RouteLocationResolvedTyped<
  RouteMap extends _RouteMapGeneric,
  Name extends keyof RouteMap
> extends RouteLocationTyped<RouteMap, Name> {
  href: string
}

export type RouteLocationResolvedTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationResolvedTyped<RouteMap, N> }

/**
 * Type safe versions of types that are exposed by vue-router
 */

/**
 * Type safe version of `RouteLocationNormalized`. Accepts the name of the route as a type parameter.
 * @see {@link RouteLocationNormalized}
 */
export type _RouteLocationNormalized<
  Name extends _RouteRecordName = _RouteRecordName
> = RouteLocationNormalizedTypedList<RouteNamedMap>[Name]

/**
 * Type safe version of `RouteLocationNormalizedLoaded`. Accepts the name of the route as a type parameter.
 * @see {@link RouteLocationNormalizedLoaded}
 */
export type _RouteLocationNormalizedLoaded<
  Name extends _RouteRecordName = _RouteRecordName
> = RouteLocationNormalizedLoadedTypedList<RouteNamedMap>[Name]

/**
 * Type safe version of `RouteLocationAsRelative`. Accepts the name of the route as a type parameter.
 * @see {@link RouteLocationAsRelative}
 */
export type _RouteLocationAsRelativePath<
  Name extends _RouteRecordName = _RouteRecordName
> = RouteLocationAsRelativeTypedList<RouteNamedMap>[Name]

/**
 * Type safe version of `RouteLocationResolved` (the returned route of `router.resolve()`).
 * Allows passing the name of the route to be passed as a generic.
 * @see {@link Router['resolve']}
 */
export type _RouteLocationResolved<
  Name extends keyof RouteNamedMap = keyof RouteNamedMap
> = RouteLocationResolvedTypedList<RouteNamedMap>[Name]

/**
 * Type safe version of `RouteLocation` . Allows passing the name of the route to be passed as a generic.
 * @see {@link RouteLocation}
 */
export type _RouteLocation<
  Name extends keyof RouteNamedMap = keyof RouteNamedMap
> = RouteLocationTypedList<RouteNamedMap>[Name]

/**
 * Type safe version of `RouteLocationRaw` . Allows passing the name of the route to be passed as a generic.
 * @see {@link RouteLocationRaw}
 */
export type _RouteLocationRaw<
  Name extends keyof RouteNamedMap = keyof RouteNamedMap
> =
  | RouteLocationAsString<RouteNamedMap>
  | RouteLocationAsRelativeTypedList<RouteNamedMap>[Name]
  | RouteLocationAsPathTypedList<RouteNamedMap>[Name]

/**
 * Generate a type safe params for a route location. Requires the name of the route to be passed as a generic.
 * @see {@link RouteParams}
 */
export type _RouteParams<Name extends keyof RouteNamedMap> =
  RouteNamedMap[Name]['params']

/**
 * Generate a type safe raw params for a route location. Requires the name of the route to be passed as a generic.
 * @see {@link RouteParamsRaw}
 */
export type _RouteParamsRaw<Name extends keyof RouteNamedMap> =
  RouteNamedMap[Name]['paramsRaw']
