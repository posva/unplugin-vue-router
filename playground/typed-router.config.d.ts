import type {
  _RouterOptions,
  NavigationGuardTyped,
  NavigationGuardWithThisTyped,
  RouteLocationNormalizedLoadedTypedList,
  _RouterTyped,
  RouterLinkTyped,
} from 'unplugin-vue-router/types'
import type { RouteNamedMap } from 'vue-router/auto/routes'

declare module 'unplugin-vue-router/types' {
  export interface _TypesConfig {
    RouteNamedMap: RouteNamedMap
  }
}

declare module 'vue-router' {
  export interface TypesConfig {
    beforeRouteEnter: NavigationGuardWithThisTyped<undefined, RouteNamedMap>
    beforeRouteUpdate: NavigationGuardTyped<RouteNamedMap>
    beforeRouteLeave: NavigationGuardTyped<RouteNamedMap>

    $route: RouteLocationNormalizedLoadedTypedList<RouteNamedMap>[keyof RouteNamedMap]
    $router: _RouterTyped<RouteNamedMap>

    RouterLink: RouterLinkTyped<RouteNamedMap>
  }
}
