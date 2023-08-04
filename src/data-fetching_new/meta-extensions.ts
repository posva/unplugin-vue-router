import type {
  DataLoaderEntryBase,
  UseDataLoader,
  _UseLoaderState,
} from './createDataLoader'
import type { LOADER_ENTRIES_KEY, LOADER_SET_KEY } from './symbols'

/**
 * Map type for the entries used by data loaders.
 * @internal
 */
export type _DefineLoaderEntryMap = WeakMap<
  // Depending on the `defineLoader()` they might use a different thing as key
  // e.g. an function for basic defineLoader, a doc instance for VueFire
  object,
  DataLoaderEntryBase
>

declare module 'vue-router' {
  interface Router {
    /**
     * The entries used by data loaders. Put on the router for convenience.
     * @internal
     */
    [LOADER_ENTRIES_KEY]: _DefineLoaderEntryMap
  }

  interface RouteMeta {
    /**
     * The data loaders for a route record. Add any data loader to this array to have it called when the route is
     * navigated to. Note this is only needed when **not** using lazy components (`() => import('./pages/Home.vue')`) or
     * when not explicitly exporting data loaders from page components.
     */
    loaders?: UseDataLoader[]

    /**
     * Set of loaders for the current route. This is built once during navigation and is used to merge the loaders from
     * the lazy import in components or the `loaders` array in the route record.
     * @internal
     */
    [LOADER_SET_KEY]?: Set<UseDataLoader>

    /**
     * The data loaders map for the current application. Referenced here for convenience.
     * @internal
     */
    [LOADER_ENTRIES_KEY]?: _DefineLoaderEntryMap
  }
}

export {}
