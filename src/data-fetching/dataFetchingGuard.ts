import { DataLoader, isDataLoader } from './defineLoader'
import type { RouteLocationNormalized, Router } from 'vue-router'
import { Awaitable, __DEV__ } from '../core/utils'

// Symbol used to detect if a route has loaders
export const HasDataLoaderMeta = Symbol()

declare module 'vue-router' {
  export interface RouteMeta {
    /**
     * List of lazy imports of modules that might have a loader. We need to extract the exports that are actually
     * loaders.
     */
    [HasDataLoaderMeta]?: Array<
      () => Promise<Record<string, DataLoader<unknown> | unknown>>
    >
  }
}

// dev only check
const ADDED_SYMBOL = Symbol()

// TODO:
type NavigationResult = any

export interface SetupDataFetchingGuardOptions {
  /**
   * Initial data to skip the initial data loaders. This is useful for SSR and should be set only on client side.
   */
  initialData?: Record<string, unknown>

  /**
   * Hook that is called before each data loader is called. Can return a promise to delay the data loader call.
   */
  beforeLoad?: (route: RouteLocationNormalized) => Promise<unknown>

  /**
   * Called if any data loader returns a `NavigationResult` with an array of them. Should decide what is the outcome of
   * the data fetching guard. Note this isn't called if no data loaders return a `NavigationResult`.
   */
  selectNavigationResult?: (
    results: NavigationResult[]
  ) => Awaitable<NavigationResult | undefined | void>
}

export function setupDataFetchingGuard(
  router: Router,
  { initialData }: SetupDataFetchingGuardOptions = {}
) {
  if (__DEV__) {
    if (ADDED_SYMBOL in router) {
      console.warn(
        '[vue-router]: Data fetching guard added twice. Make sure to remove the extra call.'
      )
      return
    }
    // @ts-expect-error: doesn't exist
    router[ADDED_SYMBOL] = true
  }

  const fetchedState: Record<string, unknown> = {}
  let isFetched: undefined | boolean

  router.beforeEach((to) => {
    // We run all loaders in parallel
    return (
      Promise.all(
        // retrieve all loaders as a flat array
        to.matched
          .flatMap((route) => route.meta[HasDataLoaderMeta])
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
                      initialData
                    ).then(() => {
                      if (!initialData) {
                        // TODO: warn if we have an incomplete initialData
                        if (key) {
                          fetchedState[key] = cache.get(router)!.data.value
                        }
                      } else if (__DEV__ && !key && !isFetched) {
                        // TODO: find a way to warn on client when initialData is empty when it shouldn't
                        // console.warn()
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
          initialData = undefined
          // NOTE: could this be dev only?
          isFetched = true
        })
    )
  })

  return initialData ? null : fetchedState
}
