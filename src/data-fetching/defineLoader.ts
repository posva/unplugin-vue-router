import {
  RouteLocationNormalizedLoaded,
  Router,
  useRoute,
  useRouter,
} from 'vue-router'
import { Ref, ToRefs } from 'vue'
import { DataLoaderCacheEntry, transferData } from './dataCache'

export function defineLoader<P extends Promise<any>>(
  loader: (route: RouteLocationNormalizedLoaded) => P
): DataLoader<Awaited<P>> {
  const dataLoader: DataLoader<Awaited<P>> = (() => {
    const route = useRoute()
    const entry = cache.get(useRouter())

    // TODO: dev only
    if (!entry) {
      throw new Error('no cache entry')
    }

    const { data, pending, error } = entry

    function refresh() {
      pending.value = true
      error.value = null
      loader(route)
        .then((_data) => {
          transferData(entry!, _data)
        })
        .catch((err) => {
          error.value = err
        })
        .finally(() => {
          pending.value = false
        })
    }

    return Object.assign(
      {
        pending,
        error,
        refresh,
      },
      data
    )
  }) as DataLoader<Awaited<P>>

  const cache = new WeakMap<Router, DataLoaderCacheEntry<Awaited<P>>>()

  // add the context as one single object
  dataLoader._ = {
    loader,
    cache,
    load(route: RouteLocationNormalizedLoaded, loadKey: symbol) {
      // TODO: actual implementation
      return loader(route)
    },
  }

  return dataLoader
}

export interface DataLoader<T> {
  (): _DataLoaderResult & ToRefs<T>

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
  // the loader passed to defineLoader
  loader: (route: RouteLocationNormalizedLoaded) => Promise<T>

  load: (route: RouteLocationNormalizedLoaded, loadKey: symbol) => Promise<T>

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
}
