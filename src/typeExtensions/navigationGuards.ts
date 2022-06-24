// original is

import type { NavigationGuardNext, NavigationFailure } from 'vue-router'
import type { _RouteMapGeneric } from '../codegen/generateRouteMap'
import type {
  RouteLocationAsPathTypedList,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsString,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationNormalizedTypedList,
} from './routeLocation'

// type NavigationGuardReturn = void | Error | RouteLocationRaw | boolean | NavigationGuardNextCallback;
type NavigationGuardReturn<RouteMap extends _RouteMapGeneric> =
  | void
  // | Error
  | boolean
  | RouteLocationAsString<RouteMap>
  // | RouteLocationAsRelativeTyped<RouteMap, Name>
  | RouteLocationAsRelativeTypedList<RouteMap>[keyof RouteMap]
  | RouteLocationAsPathTypedList<RouteMap>[keyof RouteMap]
// type NavigationGuardReturn = Exclude<ReturnType<NavigationGuard>, Promise<any> | RouteLocationRaw>

export interface NavigationGuardWithThis<T, RouteMap extends _RouteMapGeneric> {
  (
    this: T,
    to: RouteLocationNormalizedTypedList<RouteMap>[keyof RouteMap],
    from: RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap],
    // intentionally not typed to make people use the other version
    next: NavigationGuardNext
  ): NavigationGuardReturn<RouteMap> | Promise<NavigationGuardReturn<RouteMap>>
}

export interface NavigationGuard<RouteMap extends _RouteMapGeneric> {
  (
    to: RouteLocationNormalizedTypedList<RouteMap>[keyof RouteMap],
    from: RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap],
    // intentionally not typed to make people use the other version
    next: NavigationGuardNext
  ): NavigationGuardReturn<RouteMap> | Promise<NavigationGuardReturn<RouteMap>>
}

export interface NavigationHookAfter<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> {
  (
    to: RouteLocationNormalizedTypedList<RouteMap>[keyof RouteMap],
    from: RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap],
    failure?: NavigationFailure | void
  ): any
}
