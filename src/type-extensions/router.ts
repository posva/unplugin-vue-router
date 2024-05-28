import type { ShallowRef } from 'vue'
import type {
  Router,
  RouteLocationNormalizedLoaded,
  RouteRecordRaw,
  RouterOptions,
} from 'vue-router'
import type {
  RouteLocationResolvedTypedList,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationAsString,
  RouteLocationAsRelativeTyped,
  RouteLocationAsPathTyped,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsPathTypedList,
} from './routeLocation'
import type { _RouteMapGeneric } from '../codegen/generateRouteMap'
import type {
  NavigationGuardWithThisTyped,
  NavigationHookAfterTyped,
} from './navigationGuards'
import type { RouteNamedMap, TypesConfig } from './types-config'

/**
 * NOTE: Ideally, these should be moved to vue-router in the future to enable typed routes in the core. What's left to
 * confirm is if the strategy relying on a `TypesConfig` is the future proof. Moving this to vue-router would also
 * remove the double documentation.
 */

export interface _RouterTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
> extends Omit<
    Router,
    | 'resolve'
    | 'push'
    | 'replace'
    | 'beforeEach'
    | 'beforeResolve'
    | 'afterEach'
    | 'currentRoute'
  > {
  /**
   * Current {@link RouteLocationNormalized}. Prefer using `useRoute()` instead.
   */
  currentRoute: ShallowRef<
    RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap]
  >

  /**
   * Programmatically navigate to a new URL by pushing an entry in the history
   * stack.
   *
   * @param to - Route location to navigate to
   */
  push(
    to:
      | RouteLocationAsString<RouteMap>
      | RouteLocationAsRelativeTypedList<RouteMap>[keyof RouteMap]
      | RouteLocationAsPathTypedList<RouteMap>[keyof RouteMap]
  ): ReturnType<Router['push']>

  /**
   * Programmatically navigate to a new URL by replacing the current entry in
   * the history stack. Equivalent to `router.push({ replace: true })`.
   *
   * @param to - Route location to navigate to
   */
  replace(
    to:
      | RouteLocationAsString<RouteMap>
      | RouteLocationAsRelativeTypedList<RouteMap>[keyof RouteMap]
      | RouteLocationAsPathTypedList<RouteMap>[keyof RouteMap]
  ): ReturnType<Router['replace']>

  /**
   * Returns the {@link RouteLocation | normalized version} of a
   * {@link RouteLocationRaw | route location}. Also includes an `href` property
   * that includes any existing `base`. By default, the `currentLocation` used is
   * `router.currentRoute` and should only be overridden in advanced use cases.
   *
   * @param to - Raw route location to resolve
   * @param currentLocation - Optional current location to resolve against
   */
  resolve<Name extends keyof RouteMap = keyof RouteMap>(
    to:
      | RouteLocationAsString<RouteMap>
      | RouteLocationAsRelativeTyped<RouteMap, Name>
      | RouteLocationAsPathTyped<RouteMap, Name>,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocationResolvedTypedList<RouteMap>[Name]

  /**
   * Add a navigation guard that executes before any navigation. Returns a
   * function that removes the registered guard.
   *
   * @param guard - navigation guard to add
   */
  beforeEach(
    guard: NavigationGuardWithThisTyped<undefined, RouteMap>
  ): ReturnType<Router['beforeEach']>

  /**
   * Add a navigation guard that executes before navigation is about to be
   * resolved. At this state all component have been fetched and other
   * navigation guards have been successful. Returns a function that removes the
   * registered guard.
   *
   * @param guard - navigation guard to add
   * @returns a function that removes the registered guard
   *
   * @example
   * ```js
   * router.beforeResolve(to => {
   *   if (to.meta.requiresAuth && !isAuthenticated) return false
   * })
   * ```
   *
   */
  beforeResolve(
    guard: NavigationGuardWithThisTyped<undefined, RouteMap>
  ): ReturnType<Router['beforeResolve']>

  /**
   * Add a navigation hook that is executed after every navigation. Returns a
   * function that removes the registered hook.
   *
   * @param guard - navigation hook to add
   * @returns a function that removes the registered hook
   *
   * @example
   * ```js
   * router.afterEach((to, from, failure) => {
   *   if (isNavigationFailure(failure)) {
   *     console.log('failed navigation', failure)
   *   }
   * })
   * ```
   */
  afterEach(
    guard: NavigationHookAfterTyped<RouteMap>
  ): ReturnType<Router['beforeEach']>
}

/**
 * Type safe version of `Router`. Used internally by loaders and other methods to provide a typed API without having to pass the RouteNamedMap.
 * @see {@link Router}
 */
export type _Router =
  TypesConfig extends Record<'RouteNamedMap', any>
    ? _RouterTyped<RouteNamedMap>
    : Router

/**
 * unplugin-vue-router version of `RouterOptions`.
 * @deprecated use `RouterOptions` instead. This type is no longer needed.
 * @see {@link RouterOptions}
 */
export interface _RouterOptions extends RouterOptions {
  /**
   * Modify the routes before they are passed to the router. You can modify the existing array or return a
   * new one.
   * @deprecated `routes` is now required, so you can just modify a copy of the array directly.
   *
   * @param routes - The routes generated by this plugin and exposed by `vue-router/auto-routes`
   */
  extendRoutes?: (routes: RouteRecordRaw[]) => RouteRecordRaw[] | void
}
