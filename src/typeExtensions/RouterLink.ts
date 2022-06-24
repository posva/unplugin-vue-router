import type {
  AllowedComponentProps,
  ComponentCustomProps,
  VNodeProps,
  VNode,
} from 'vue'
import type { RouterLinkProps as _RouterLinkProps } from 'vue-router'
import type { _RouterTyped } from './router'

// TODO: could this have a name generic to type the slot? is it

import { _RouteMapGeneric } from '../codegen/generateRouteMap'
import {
  RouteLocationAsPathTypedList,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsString,
} from './routeLocation'

export interface RouterLinkProps<RouteMap extends _RouteMapGeneric>
  extends Omit<_RouterLinkProps, 'to'> {
  to:
    | RouteLocationAsString<RouteMap>
    | RouteLocationAsRelativeTypedList<RouteMap>[keyof RouteMap]
    | RouteLocationAsPathTypedList<RouteMap>[keyof RouteMap]
}
export interface RouterLinkTyped<RouteMap extends _RouteMapGeneric> {
  new (): {
    $props: AllowedComponentProps &
      ComponentCustomProps &
      VNodeProps &
      RouterLinkProps<RouteMap>

    $slots: {
      // TODO: is it correct to use the resolve tip?
      default: (arg: ReturnType<_RouterTyped<RouteMap>['resolve']>) => VNode[]
    }
  }
}

// TODO: typed useLink()
