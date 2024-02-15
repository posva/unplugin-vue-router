// original is

import type { NavigationGuardNext, NavigationFailure } from 'vue-router'
import type { _RouteMapGeneric } from '../codegen/generateRouteMap'
import type {
  _RouteRecordName,
  _RouteLocationNormalized,
  _RouteLocationRaw,
  _RouteLocationNormalizedLoaded,
  RouteLocationNormalizedTypedList,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationAsString,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsPathTypedList,
} from './routeLocation'
import type { _Router } from './router'
import type { RouteNamedMap, _TypesConfig } from './types-config'
import type { _MaybePromise } from '../data-fetching/utils'

/**
 * Return types for a Navigation Guard. Accepts a type param for the RouteMap.
 */
type NavigationGuardReturnTyped<RouteMap extends _RouteMapGeneric> =
  | void
  | Error
  | boolean
  | RouteLocationAsString<RouteMap>
  | RouteLocationAsRelativeTypedList<RouteMap>[keyof RouteMap]
  | RouteLocationAsPathTypedList<RouteMap>[keyof RouteMap]

/**
 * Return types for a Navigation Guard. Based on `_TypesConfig`
 *
 * @see {@link _TypesConfig}
 * @see {@link NavigationGuardReturnTyped}
 */
export type NavigationGuardReturn = NavigationGuardReturnTyped<RouteNamedMap>

/**
 * Typed Navigation Guard with a type parameter for `this` and another for the route map.
 */
export interface NavigationGuardWithThisTyped<
  T,
  RouteMap extends _RouteMapGeneric
> {
  (
    this: T,
    to: RouteLocationNormalizedTypedList<RouteMap>[keyof RouteMap],
    from: RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap],
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _MaybePromise<NavigationGuardReturnTyped<RouteMap>>
}

/**
 * Typed Navigation Guard with a type parameter for `this`. Based on `_TypesConfig`
 * @see {@link _TypesConfig}
 * @see {@link NavigationGuardWithThisTyped}
 */
export interface NavigationGuardWithThis<T>
  extends NavigationGuardWithThisTyped<T, RouteNamedMap> {}

/**
 * In `router.beforeResolve((to) => {})`, the `to` is typed as `RouteLocationNormalizedLoaded`, not
 * `RouteLocationNormalized` like in `router.beforeEach()`. In practice it doesn't change much as users do not rely on
 * the difference between them but if we update the type in vue-router, we will have to update this type too.
 * @internal
 */
export interface _NavigationGuardResolved {
  (
    this: undefined,
    to: _RouteLocationNormalizedLoaded,
    from: _RouteLocationNormalizedLoaded,
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _MaybePromise<NavigationGuardReturn>
}

/**
 * Typed Navigation Guard. Accepts a type param for the RouteMap.
 */
export interface NavigationGuardTyped<RouteMap extends _RouteMapGeneric> {
  (
    to: RouteLocationNormalizedTypedList<RouteMap>[keyof RouteMap],
    from: RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap],
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _MaybePromise<NavigationGuardReturnTyped<RouteMap>>
}

/**
 * Typed Navigation Guard. Based on `_TypesConfig`.
 * @see {@link _TypesConfig}
 * @see {@link NavigationGuardWithThisTyped}
 */
export interface NavigationGuard extends NavigationGuardTyped<RouteNamedMap> {}

/**
 * Typed Navigation Hook After. Accepts a type param for the RouteMap.
 */
export interface NavigationHookAfterTyped<RouteMap extends _RouteMapGeneric> {
  (
    to: RouteLocationNormalizedTypedList<RouteMap>[keyof RouteMap],
    from: RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap],
    failure?: NavigationFailure | void
  ): unknown
}

/**
 * Typed Navigation Hook After. Based on `_TypesConfig`.
 * @see {@link _TypesConfig}
 * @see {@link NavigationHookAfterTyped}
 */
export interface NavigationHookAfter
  extends NavigationHookAfterTyped<RouteNamedMap> {}
