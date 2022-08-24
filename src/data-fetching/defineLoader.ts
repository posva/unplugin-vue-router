import {
  RouteLocationNormalizedLoaded,
  LocationQuery,
  Router,
  RouteRecordName,
  useRouter,
  useRoute,
} from 'vue-router'
import type { Ref, UnwrapRef } from 'vue'
import {
  createDataCacheEntry,
  DataLoaderCacheEntry,
  getCurrentContext,
  isCacheExpired,
  setCurrentContext,
  updateDataCacheEntry,
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

  /**
   * SSR Key to store the data in an object that can be serialized later to the HTML page.
   */
  key?: string
}

const DEFAULT_DEFINE_LOADER_OPTIONS: Required<DefineLoaderOptions> = {
  cacheTime: 1000 * 5,
  lazy: false,
  key: '',
  // cacheTime: 1000 * 60 * 5,
}

/**
 * Loader function that can be passed to `defineLoader()`.
 */
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
    let [parentEntry, _router, _route] = getCurrentContext()
    const router = _router || useRouter()
    const route = _route || useRoute()

    if (
      // no cache: we need to load
      !cache.has(router) ||
      // invoked by the parent, we should try to load again
      parentEntry
    ) {
      load(route, router, parentEntry)
    }

    // after calling load, we always have an entry
    const entry = cache.get(router)!

    // TODO: reload the page and figure out a way of detecting it

    // if (lazy) {
    // } else {
    //   // TODO: dev only
    //   // TODO: detect if this happens during HMR or if the loader is wrongly being used without being exported by a route we are navigating to
    //   if (!entry) {
    //     // NOTE: maybe call load here? and return a combined object of the promise and the data?
    //     if (import.meta.hot) {
    //       // reload the page if the loader is new and we have no way to
    //       // TODO: test with webpack
    //       import.meta.hot.invalidate()
    //     }
    //     // with HMR, if the user changes the script section, there is a new cache entry
    //     // we need to transfer the old cache and call refresh
    //     throw new Error('No cache entry: reloading the page')
    //   }
    // }

    const promise = Promise.resolve(pendingPromise)
      .then(() => dataLoaderResult)
      .finally(() => {
        // loader still needs to load again if this was a nested loader, we need to tell the parent they depend on us
        if (parentEntry) {
          parentEntry.loaders.add(entry)
        }
        // set the correct context for other nested loaders
        setCurrentContext(parentEntry && [parentEntry, router, route])
      })

    // entry exists because it's created synchronously in `load()`
    const { data, pending, error } = entry

    function refresh() {
      invalidate()
      // we cannot return the load because in the case of lazy loads it resolves right away
      load(route, router, parentEntry)
      // discard any error so users can call refresh() in event handlers
      return pendingPromise!.catch(() => {})
    }

    function invalidate() {
      entry.when = 0
    }

    const dataLoaderResult: _DataLoaderResult<Awaited<P>, isLazy> = {
      data,
      pending,
      error,
      refresh,
      invalidate,
      pendingLoad,
    }

    return Object.assign(promise, dataLoaderResult)
  }) as DataLoader<Awaited<P>, isLazy>

  // force the boolean so the code must work with both versions and it's also easier to type
  const cache = new WeakMap<Router, DataLoaderCacheEntry<Awaited<P>, boolean>>()

  let pendingPromise: Promise<void> | undefined | null
  let currentNavigation: RouteLocationNormalizedLoaded | undefined | null

  const pendingLoad = () => pendingPromise

  function load(
    route: RouteLocationNormalizedLoaded,
    router: Router,
    parent?: DataLoaderCacheEntry,
    initialRootData?: Record<string, unknown>
  ): Promise<void> {
    const hasCacheEntry = cache.has(router)

    const initialData =
      initialRootData && (initialRootData[options.key] as Awaited<P>)

    if (!hasCacheEntry) {
      cache.set(router, createDataCacheEntry(options, initialData))
    }

    const entry = cache.get(router)!

    if (initialData) {
      // invalidate the entry because we don't have the params it was created with
      entry.when = 0
      return Promise.resolve()
    }

    const needsNewLoad = !hasCacheEntry || shouldFetchAgain(entry, route)

    const { isReady, pending, error } = entry
    const { lazy } = options

    const isExpired = isCacheExpired(entry, options)

    // the request was already made before, let's try to reuse it
    if (
      pendingPromise &&
      // if we need to fetch again due to param/query changes
      !needsNewLoad &&
      // if it's a new navigation and there is no entry, we cannot rely on the pendingPromise as we don't know what
      // params and query were used and could have changed. If we had an entry, then we can rely on the result of
      // `needsNewLoad`
      currentNavigation === route &&
      // if we are not ready but we have a pendingPromise, we are already fetching so we can reuse it
      (!isReady || !isExpired)
    ) {
      return lazy ? Promise.resolve() : pendingPromise
    }

    // TODO: refactor the ifs, there seems to be duplications

    if (
      needsNewLoad ||
      // if we never finished loading we cannot rely on needsNewLoad
      (!isReady && currentNavigation !== route) ||
      // we did a load but the cache expired
      (isReady && isExpired)
    ) {
      pending.value = true
      error.value = null
      // remember what was the last navigation we fetched this with
      currentNavigation = route

      const [trackedRoute, params, query, hash] = trackRoute(route)
      // if there isn't a pending promise, we set the current context so nested loaders can use it
      if (!pendingPromise) {
        // we could use trackedRoute here but that would break the comparison between currentRoute and route
        // we could also just add a private property to check if it's the same navigation, but we actually need
        // each loader to have its own tracked route and check nested loaders tracked properties within each loader
        setCurrentContext([entry, router, route])
      }
      const thisPromise = (pendingPromise = loader(trackedRoute)
        .then((data) => {
          if (pendingPromise === thisPromise) {
            updateDataCacheEntry(entry, data, params, query, hash)
          }
        })
        .catch((err) => {
          error.value = err
          // propagate the error so navigation guards can abort
          return Promise.reject(err)
        })
        .finally(() => {
          // reset the state if we were the last promise
          if (pendingPromise === thisPromise) {
            pendingPromise = null
            pending.value = false
          }

          // NOTE: unfortunately we need to duplicate this part here and on the `finally()` above
          // to handle different call scenarios
          setCurrentContext(parent && [parent, router, route])
        }))
    }

    // lazy resolves immediately to not block navigation guards
    return lazy || !pendingPromise
      ? Promise.resolve()
      : // pendingPromise is thisPromise
        pendingPromise
  }

  // add the context as one single object
  dataLoader._ = {
    loader,
    cache,
    load,
    options,
  }
  dataLoader[IsLoader] = true

  return dataLoader
}

function shouldFetchAgain(
  entry: DataLoaderCacheEntry<any>,
  route: RouteLocationNormalizedLoaded
): boolean {
  return (
    // manually invalidated
    !entry.when ||
    !includesParams(route.params, entry.params) ||
    !includesParams(route.query, entry.query) ||
    (entry.hash != null && entry.hash !== route.hash) ||
    Array.from(entry.loaders).some((childEntry) =>
      shouldFetchAgain(childEntry, route)
    )
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
/**
 * Check if a value is a `DataLoader`.
 *
 * @param loader - the object to check
 */
export function isDataLoader(loader: any): loader is DataLoader<unknown> {
  return loader && loader[IsLoader]
}

type _PromiseMerged<T> = T & Promise<T>
export interface DataLoader<T, isLazy extends boolean = boolean> {
  (): _PromiseMerged<_DataLoaderResult<T, isLazy>>

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
  load: (
    route: RouteLocationNormalizedLoaded,
    router: Router,
    parent?: DataLoaderCacheEntry,
    initialRootData?: Record<string, unknown>
  ) => Promise<void>

  /**
   * The data loaded by the loader associated with the router instance. As one router instance can only be used for one
   * app, it ensures the cache is not shared among requests.
   */
  cache: WeakMap<Router, DataLoaderCacheEntry<T>>

  /**
   * Resolved options for the loader.
   */
  options: Required<DefineLoaderOptions>
}

export interface _DataLoaderResult<T = unknown, isLazy = boolean> {
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

  /**
   * Data returned by the loader.
   */
  data: false extends isLazy ? Ref<UnwrapRef<T>> : Ref<UnwrapRef<T> | undefined>
}

function trackRoute(route: RouteLocationNormalizedLoaded) {
  const [params, paramReads] = trackObjectReads(route.params)
  const [query, queryReads] = trackObjectReads(route.query)
  let hash: { v: string | null } = { v: null }
  return [
    {
      ...route,
      // track the hash
      get hash() {
        return (hash.v = route.hash)
      },
      params,
      query,
    },
    paramReads,
    queryReads,
    hash,
  ] as const
}

function trackObjectReads<T extends Record<string, any>>(obj: T) {
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
