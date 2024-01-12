import type { Ref } from 'vue'
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'
import type {
  RouteLocationResolvedTypedList,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationAsString,
  RouteLocationAsRelativeTyped,
  RouteLocationAsPathTyped,
} from './routeLocation'
import type { _RouteMapGeneric } from '../codegen/generateRouteMap'
import type {
  NavigationGuardWithThis,
  NavigationGuardWithThisTyped,
  NavigationHookAfter,
  NavigationHookAfterTyped,
} from './navigationGuards'
import type { RouteNamedMap, _TypesConfig } from './types-config'

export interface _RouterTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> extends Omit<
    Router,
    | 'resolve'
    | 'push'
    | 'replace'
    | 'beforeEach'
    | 'beforeResolve'
    | 'afterEach'
  > {
  currentRoute: Ref<
    RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap]
  >

  push<Name extends keyof RouteMap = keyof RouteMap>(
    to:
      | RouteLocationAsString<RouteMap>
      | RouteLocationAsRelativeTyped<RouteMap, Name>
      | RouteLocationAsPathTyped<RouteMap, Name>
  ): ReturnType<Router['push']>

  replace<Name extends keyof RouteMap = keyof RouteMap>(
    to:
      | RouteLocationAsString<RouteMap>
      | RouteLocationAsRelativeTyped<RouteMap, Name>
      | RouteLocationAsPathTyped<RouteMap, Name>
  ): ReturnType<Router['replace']>

  resolve<Name extends keyof RouteMap = keyof RouteMap>(
    to:
      | RouteLocationAsString<RouteMap>
      | RouteLocationAsRelativeTyped<RouteMap, Name>
      | RouteLocationAsPathTyped<RouteMap, Name>,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocationResolvedTypedList<RouteMap>[Name]

  beforeEach(
    guard: NavigationGuardWithThisTyped<undefined, RouteMap>
  ): ReturnType<Router['beforeEach']>
  beforeResolve(
    guard: NavigationGuardWithThisTyped<undefined, RouteMap>
  ): ReturnType<Router['beforeResolve']>
  afterEach(
    guard: NavigationHookAfterTyped<RouteMap>
  ): ReturnType<Router['beforeEach']>
}

/**
 * Type safe version of `Router`.
 * @see {@link Router}
 */
export type _Router = _TypesConfig extends Record<'RouteNamedMap', any>
  ? _RouterTyped<RouteNamedMap>
  : Router
