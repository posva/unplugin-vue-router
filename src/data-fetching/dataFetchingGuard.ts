import type { DataLoader } from './defineLoader'
import type { Router } from 'vue-router'
import { createDataCacheEntry } from './dataCache'

export const LoaderSymbol = Symbol()
export const LoadKeySymbol = Symbol()

declare module 'vue-router' {
  export interface RouteMeta {
    /**
     * List of loaders associated with the route.
     */
    [LoaderSymbol]?: Array<() => Promise<DataLoader<unknown>>>
    [LoadKeySymbol]?: symbol
  }
}

export function setupDataFetchingGuard(router: Router) {
  return router.beforeEach((to) => {
    // TODO: generate a call id so it can be used to identify and group all the calls together and set up a cache?
    // this allows
    if (!to.meta[LoadKeySymbol]) {
      to.meta[LoadKeySymbol] = Symbol()
    }
    const loadKey = to.meta[LoadKeySymbol]
    /**
     * We run all loaders in parallel
     */
    return (
      Promise.all(
        // retrieve all loaders as a flat array
        to.matched
          .flatMap((route) => route.meta[LoaderSymbol])
          // loaders are optional
          .filter((loaderImport) => loaderImport)
          // call the dynamic imports to get the loaders
          .map((loaderImport) =>
            loaderImport!()
              // fetch or use the cache
              .then((loader) => {
                const cache = loader._.cache.get(router)
                if (
                  !cache ||
                  // we are in another navigation, we revalidate the cache
                  cache.key !== loadKey
                ) {
                  // TODO: ensure others useUserData() (loaders) can be called with a similar approach as pinia
                  // TODO: error handling + refactor to do it in refresh
                  return loader._.load(to, loadKey).then((data) => {
                    const entry = createDataCacheEntry(loadKey, data)
                    loader._.cache.set(router, entry)
                    return entry
                  })
                }

                // TODO: revalidate cache

                return cache
              })
              .then((entry) => {})
          )
      )
        // let the navigation go through
        .then(() => true)
    )
  })
}
