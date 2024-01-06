// original is

import type { NavigationGuardNext, NavigationFailure } from 'vue-router'
import type { _RouteMapGeneric } from '../codegen/generateRouteMap'
import type {
  _RouteRecordName,
  _RouteLocationNormalized,
  _RouteLocationRaw,
  _RouteLocationNormalizedLoaded,
} from './routeLocation'
import { _Router } from './router'

// type NavigationGuardReturn = void | Error | RouteLocationRaw | boolean | NavigationGuardNextCallback;
type NavigationGuardReturn =
  | void
  // | Error
  | boolean
  | _RouteLocationRaw
// type NavigationGuardReturn = Exclude<ReturnType<NavigationGuard>, Promise<any> | RouteLocationRaw>

export interface NavigationGuardWithThis<T> {
  (
    this: T,
    to: _RouteLocationNormalized,
    from: _RouteLocationNormalizedLoaded,
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): NavigationGuardReturn | Promise<NavigationGuardReturn>
}

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
  ): NavigationGuardReturn | Promise<NavigationGuardReturn>
}

export interface NavigationGuard {
  (
    to: _RouteLocationNormalized,
    from: _RouteLocationNormalizedLoaded,
    // intentionally not typed to make people use the other version
    next: NavigationGuardNext
  ): NavigationGuardReturn | Promise<NavigationGuardReturn>
}

export interface NavigationHookAfter {
  (
    to: _RouteLocationNormalizedLoaded,
    from: _RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void
  ): any
}
