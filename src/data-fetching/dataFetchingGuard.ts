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

// dev only check
const ADDED_SYMBOL = Symbol()

export function setupDataFetchingGuard(
  router: Router,
  initialState?: Record<string, unknown>
) {
  // TODO: dev only
  if (ADDED_SYMBOL in router) {
    console.warn(
      '[vue-router]: Data fetching guard added twice. Make sure to remove the extra call.'
    )
    return
  }
  // @ts-expect-error: doesn't exist
  router[ADDED_SYMBOL] = true

  const fetchedState: Record<string, unknown> = {}

  router.beforeEach((to) => {
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
                    const {
                      options: { key },
                      cache,
                    } = loader._
                    return loader._.load(
                      to,
                      router,
                      undefined,
                      initialState
                    ).then(() => {
                      if (!initialState) {
                        // TODO: warn if we have an incomplete initialState
                        if (key) {
                          fetchedState[key] = cache.get(router)!.data.value
                        }
                      }
                    })
                  })
                )
              })
          )
      )
        // let the navigation go through by returning true or void
        .then(() => {
          // reset the initial state as it can only be used once
          initialState = undefined
        })
    )
  })

  return initialState ? null : fetchedState
}
