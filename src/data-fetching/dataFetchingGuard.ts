import { DataLoader, isDataLoader } from './defineLoader'
import type { Router } from 'vue-router'

// Symbol used to detect if a route has loaders
export const LoaderSymbol = Symbol()

declare module 'vue-router' {
  export interface RouteMeta {
    /**
     * List of lazy imports of modules that might have a loader. We need to extract the exports that are actually
     * loaders.
     */
    [LoaderSymbol]?: Array<
      () => Promise<Record<string, DataLoader<unknown> | unknown>>
    >
  }
}

export interface DataFetchingOptions {
  /**
   * If true, fetching won't block the navigation. If a number is passed, the fetching will block that many milliseconds
   * before letting the navigation continue.
   */
  lazy?: boolean | number | (() => boolean | number)
}

// dev only check
let added: boolean = false

export function setupDataFetchingGuard(router: Router) {
  // TODO: dev only
  if (added) {
    console.warn(
      '[vue-router]: Data fetching guard added twice. Make sure to remove the extra call'
    )
    return
  }
  added = true
  return router.beforeEach((to) => {
    // We run all loaders in parallel
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

                // fetch all the loaders
                return Promise.all(
                  // load will ensure only one request is happening at a time
                  loaders.map((loader) => {
                    return loader._.load(to, router)
                  })
                )
              })
          )
      )
        // let the navigation go through
        .then(() => true)
    )
  })
}
