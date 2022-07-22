import { DataLoader, isDataLoader } from './defineLoader'
import type { Router } from 'vue-router'
import { createDataCacheEntry } from './dataCache'

export const LoaderSymbol = Symbol()
export const LoadKeySymbol = Symbol()

declare module 'vue-router' {
  export interface RouteMeta {
    /**
     * List of lazy imports of modules that might have a loader. We need to extract the exports that are actually
     * loaders.
     */
    [LoaderSymbol]?: Array<
      () => Promise<Record<string, DataLoader<unknown> | unknown>>
    >
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
          .filter((moduleImport) => moduleImport)
          // call the dynamic imports to get the loaders
          .map((moduleImport) =>
            moduleImport!()
              // fetch or use the cache
              .then((mod) => {
                // check all the exports of the module and keep the loaders
                const loaders = Object.keys(mod)
                  .filter((exportName) => isDataLoader(mod[exportName]))
                  .map((loaderName) => mod[loaderName] as DataLoader<unknown>)

                return Promise.all(
                  loaders.map((loader) => {
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
                )
              })
              .then((entry) => {})
          )
      )
        // let the navigation go through
        .then(() => true)
    )
  })
}
