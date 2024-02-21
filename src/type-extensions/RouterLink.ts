import type {
  AllowedComponentProps,
  ComponentCustomProps,
  VNodeProps,
  VNode,
  ComputedRef,
  UnwrapRef,
  Ref,
} from 'vue'
import type {
  NavigationFailure,
  RouteLocationRaw,
  RouterLinkProps as _RouterLinkProps,
} from 'vue-router'
import type { _RouterTyped } from './router'

// TODO: could this have a name generic to type the slot? is it possible

import type { _RouteMapGeneric } from '../codegen/generateRouteMap'
import type {
  RouteLocationAsPathTyped,
  RouteLocationAsPathTypedList,
  RouteLocationAsRelativeTyped,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsString,
  RouteLocationResolvedTypedList,
} from './routeLocation'

/**
 * Typed version of `RouterLinkProps`.
 */
export interface RouterLinkPropsTyped<
  RouteMap extends _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap,
> extends Omit<_RouterLinkProps, 'to'> {
  to:
    | RouteLocationAsString<RouteMap>
    | RouteLocationAsRelativeTypedList<RouteMap>[Name]
    | RouteLocationAsPathTypedList<RouteMap>[Name]
}

/**
 * Typed version of `<RouterLink>` component.
 */
export interface RouterLinkTyped<RouteMap extends _RouteMapGeneric> {
  new (): {
    $props: AllowedComponentProps &
      ComponentCustomProps &
      VNodeProps &
      RouterLinkPropsTyped<RouteMap>

    $slots: {
      default: (arg: UnwrapRef<_UseLinkReturnTyped<RouteMap>>) => VNode[]
    }
  }
}

// TODO: should be exposed by the router instead
/**
 * Return type of `useLink()`. Should be exposed by the router instead.
 * @internal
 */
export interface _UseLinkReturnTyped<
  RouteMap extends _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap,
> {
  route: ComputedRef<RouteLocationResolvedTypedList<RouteMap>[Name]>
  href: ComputedRef<string>
  isActive: ComputedRef<boolean>
  isExactActive: ComputedRef<boolean>
  navigate(e?: MouseEvent): Promise<void | NavigationFailure>
}

/**
 * Typed version of `useLink()`.
 */
export interface UseLinkFnTyped<RouteMap extends _RouteMapGeneric> {
  <Name extends keyof RouteMap = keyof RouteMap>(props: {
    to:
      | RouteLocationAsString<RouteMap>
      | RouteLocationAsRelativeTyped<RouteMap, Name>
      | RouteLocationAsPathTyped<RouteMap, Name>
      | Ref<RouteLocationRaw>
    replace?: boolean | undefined | Ref<boolean | undefined>
  }): _UseLinkReturnTyped<RouteMap, Name>
}
