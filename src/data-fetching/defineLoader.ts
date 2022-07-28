import {
  RouteLocationNormalizedLoaded,
  LocationQuery,
  Router,
  RouteRecordName,
  useRoute,
  useRouter,
} from 'vue-router'
import type { Ref, ToRefs } from 'vue'
import {
  createOrUpdateDataCacheEntry,
  DataLoaderCacheEntry,
  isCacheExpired,
} from './dataCache'
import { _RouteMapGeneric } from '../codegen/generateRouteMap'

export interface DefineLoaderOptions<isLazy extends boolean = boolean> {
  /**
   * How long should we wait to consider the fetched data expired. Amount in ms. Defaults to 5 minutes. A value of 0
   * means no cache while a value of `Infinity` means cache forever.
   */
  cacheTime?: number

  /**
   * Whether the data should be lazy loaded without blocking the navigation or not. Defaults to false. When set to true
   * or a function, the loader will no longer block the navigation and the returned composable can be called even
   * without having the data ready. This also means that the data will be available as one single `ref()` named `data`
   * instead of all the individual properties returned by the loader.
   */
  lazy?: isLazy
}

const DEFAULT_DEFINE_LOADER_OPTIONS: Required<DefineLoaderOptions> = {
  cacheTime: 1000 * 5,
  lazy: false,
  // cacheTime: 1000 * 60 * 5,
}

export interface DefineLoaderFn<T> {
  (route: RouteLocationNormalizedLoaded): T extends Promise<any>
    ? T
    : Promise<T>
}

export function defineLoader<
  P extends Promise<any>,
  isLazy extends boolean = false
>(
  name: RouteRecordName,
  loader: DefineLoaderFn<P>,
  options?: DefineLoaderOptions<isLazy>
): DataLoader<Awaited<P>, isLazy>

export function defineLoader<
  P extends Promise<any>,
  isLazy extends boolean = false
>(
  loader: DefineLoaderFn<P>,
  options?: DefineLoaderOptions<isLazy>
): DataLoader<Awaited<P>, isLazy>

export function defineLoader<P extends Promise<any>, isLazy extends boolean>(
  nameOrLoader: RouteRecordName | ((route: RouteLocationNormalizedLoaded) => P),
  _loaderOrOptions?: DefineLoaderOptions<isLazy> | DefineLoaderFn<P>,
  opts?: DefineLoaderOptions<isLazy>
): DataLoader<Awaited<P>, isLazy> {
  // TODO: make it DEV only and remove the first argument in production mode
  const loader =
    typeof nameOrLoader === 'function'
      ? nameOrLoader
      : (_loaderOrOptions! as DefineLoaderFn<P>)
  opts = typeof _loaderOrOptions === 'object' ? _loaderOrOptions : opts
  const options = { ...DEFAULT_DEFINE_LOADER_OPTIONS, ...opts }

  const dataLoader: DataLoader<Awaited<P>, isLazy> = (() => {
    const route = useRoute()
    const router = useRouter()
    let entry = cache.get(router)

    const { lazy } = options

    if (lazy) {
      // we ensure an entry exists
      load(route, router)
      // we are sure that the entry exists now
      entry = cache.get(router)!
    } else {
      // TODO: dev only
      // TODO: detect if this happens during HMR or if the loader is wrongly being used without being exported by a route we are navigating to
      if (!entry) {
        if (import.meta.hot) {
          // reload the page if the loader is new and we have no way to
          // TODO: test with webpack
          import.meta.hot.invalidate()
        }
        // with HMR, if the user changes the script section, there is a new cache entry
        // we need to transfer the old cache and call refresh
        throw new Error('No cache entry: reloading the page')
      }
    }

    const { data, pending, error } = entry!

    function refresh() {
      invalidate()
      // discard any error so users can call refresh() in event handlers
      return load(route, router).catch(() => {})
    }

    function invalidate() {
      entry!.when = 0
    }

    const commonData: _DataLoaderResult = {
      pending,
      error,
      refresh,
      invalidate,
      pendingLoad,
    }

    return Object.assign(commonData, data)
  }) as DataLoader<Awaited<P>, isLazy>

  const cache = new WeakMap<Router, DataLoaderCacheEntry<Awaited<P>>>()

  let pendingPromise: Promise<void> | undefined | null
  let currentNavigation: RouteLocationNormalizedLoaded | undefined | null

  const pendingLoad = () => pendingPromise

  function load(route: RouteLocationNormalizedLoaded, router: Router) {
    let entry = cache.get(router)
    const { lazy } = options

    const needsNewLoad = shouldFetchAgain(entry, route)

    // the request was already made before, let's try to reuse it
    if (
      pendingPromise &&
      // if we need to fetch again due to param/query changes
      !needsNewLoad &&
      // if it's a new navigation and there is no entry, we cannot rely on the pendingPromise as we don't know what
      // params and query were used and could have changed. If we had an entry, then we can rely on the result of
      // needsToFetchAgain()
      (currentNavigation === route || entry) &&
      true
      // the lazy request still need to create the entry
      // (!lazy || entry)
    ) {
      // lazy should just resolve
      return lazy ? Promise.resolve() : pendingPromise
    }

    // remember what was the last navigation we fetched this with
    currentNavigation = route

    if (!entry || isCacheExpired(entry, options) || needsNewLoad) {
      if (entry) {
        entry.pending.value = true
        entry.error.value = null
        // lazy loaders need to create an entry right away to give access to pending and error states
      } else if (lazy) {
        entry = createOrUpdateDataCacheEntry<any>(
          entry,
          // initial value of the data
          undefined,
          {},
          {},
          options
        )
        cache.set(router, entry)
      }

      // TODO: ensure others useUserData() (loaders) can be called with a similar approach as pinia
      // TODO: error handling + refactor to do it in refresh
      const [trackedRoute, params, query] = trackRoute(route)
      const thisPromise = (pendingPromise = loader(trackedRoute)
        .then((data) => {
          if (pendingPromise === thisPromise) {
            entry = createOrUpdateDataCacheEntry(
              entry,
              data,
              params,
              query,
              options
            )
            cache.set(router, entry)
          }
        })
        .catch((err) => {
          if (entry) {
            entry.error.value = err
          }
          return Promise.reject(err)
        })
        .finally(() => {
          // reset the state if we were the last promise
          if (pendingPromise === thisPromise) {
            pendingPromise = null
            if (entry) {
              entry.pending.value = false
            }
          }
        }))
    }

    // lazy should just resolve
    return lazy
      ? Promise.resolve()
      : // pendingPromise is thisPromise
        pendingPromise ||
          // the data is already loaded and we don't want to load again so we just resolve right away
          (pendingPromise = Promise.resolve().finally(
            () => (pendingPromise = null)
          ))
  }

  // add the context as one single object

  dataLoader._ = {
    loader,
    cache,
    load,
  }
  dataLoader[IsLoader] = true

  return dataLoader
}

function shouldFetchAgain(
  entry: DataLoaderCacheEntry<any> | undefined | null,
  route: RouteLocationNormalizedLoaded
) {
  return (
    entry &&
    // manually invalidated
    (!entry.when ||
      !includesParams(route.params, entry.params) ||
      !includesParams(route.query, entry.query))
  )
}

// FIXME: this exists in vue-router
/**
 * Returns true if `inner` is a subset of `outer`
 *
 * @param outer - the bigger params
 * @param inner - the smaller params
 */
function includesParams(
  outer: LocationQuery,
  inner: Partial<LocationQuery>
): boolean {
  for (const key in inner) {
    const innerValue = inner[key]
    const outerValue = outer[key]
    if (typeof innerValue === 'string') {
      if (innerValue !== outerValue) return false
    } else if (!innerValue || !outerValue) {
      // if one of them is undefined, we need to check if the other is undefined too
      if (innerValue !== outerValue) return false
    } else {
      if (
        !Array.isArray(outerValue) ||
        outerValue.length !== innerValue.length ||
        innerValue.some((value, i) => value !== outerValue[i])
      )
        return false
    }
  }

  return true
}

const IsLoader = Symbol()

export interface DataLoader<T, isLazy extends boolean = boolean> {
  (): true extends isLazy
    ? _DataLoaderResultLazy<T>
    : _DataLoaderResult & ToRefs<T>

  [IsLoader]: true

  /**
   * Internal context for the loader.
   * @internal
   */
  _: _DataLoaderInternals<T>
}

/**
 * Holds internal state of a loader.
 *
 * @internal
 */
export interface _DataLoaderInternals<T> {
  // the loader passed to defineLoader as is
  loader: (route: RouteLocationNormalizedLoaded) => Promise<T>

  /**
   * Loads the data from the cache if possible, otherwise loads it from the loader and awaits it.
   */
  load: (route: RouteLocationNormalizedLoaded, router: Router) => Promise<void>

  /**
   * The data loaded by the loader associated with the router instance. As one router instance can only be used for one
   * app, it ensures the cache is not shared among requests.
   */
  cache: WeakMap<Router, DataLoaderCacheEntry<T>>
}

export interface _DataLoaderResult {
  /**
   * Whether there is an ongoing request.
   */
  pending: Ref<boolean>

  // TODO: allow delaying pending? maybe

  /**
   * Error if there was an error.
   */
  error: Ref<any> // any is simply more convenient for errors

  /**
   * Refresh the data. Returns a promise that resolves when the data is refreshed.
   */
  refresh: () => Promise<void>

  /**
   * Invalidates the data so it is reloaded on the next request.
   */
  invalidate: () => void

  /**
   * Get the promise of the current loader if there is one, returns a falsy value otherwise.
   */
  pendingLoad: () => Promise<void> | undefined | null
}

export interface _DataLoaderResultLazy<T> extends _DataLoaderResult {
  data: Ref<T>
}

export function isDataLoader(loader: any): loader is DataLoader<unknown> {
  return loader && loader[IsLoader]
}

function trackRoute(route: RouteLocationNormalizedLoaded) {
  const [params, paramReads] = trackReads(route.params)
  const [query, queryReads] = trackReads(route.query)
  return [
    {
      ...route,
      params,
      query,
    },
    paramReads,
    queryReads,
  ] as const
}

function trackReads<T extends Record<string, any>>(obj: T) {
  const reads: Partial<T> = {}
  return [
    new Proxy(obj, {
      get(target, p: Extract<keyof T, string>, receiver) {
        const value = Reflect.get(target, p, receiver)
        reads[p] = value
        return value
      },
    }),
    reads,
  ] as const
}
