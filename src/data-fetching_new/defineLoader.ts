import type {
  RouteLocationNormalizedLoaded,
  RouteRecordName,
  Router,
} from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
import {
  DataLoaderEntryBase,
  DefineDataLoaderOptionsBase,
  UseDataLoader,
  UseDataLoaderResult,
  createDataLoader,
} from './createDataLoader'
import { IS_USE_DATA_LOADER_KEY, LOADER_ENTRIES_KEY } from './symbols'
import { getCurrentContext, withinScope } from './utils'
import { ref, shallowRef } from 'vue'

export function defineLoader<
  P extends Promise<unknown>,
  isLazy extends boolean
>(
  name: RouteRecordName,
  loader: (route: RouteLocationNormalizedLoaded) => P,
  options?: DefineDataLoaderOptions<isLazy>
): UseDataLoader<isLazy, Awaited<P>>
export function defineLoader<
  P extends Promise<unknown>,
  isLazy extends boolean
>(
  loader: (route: RouteLocationNormalizedLoaded) => P,
  options?: DefineDataLoaderOptions<isLazy>
): UseDataLoader<isLazy, Awaited<P>>

export function defineLoader<
  P extends Promise<unknown>,
  isLazy extends boolean
>(
  nameOrLoader: RouteRecordName | DefineLoaderFn<P>,
  _loaderOrOptions?: DefineDataLoaderOptions<isLazy> | DefineLoaderFn<P>,
  opts?: DefineDataLoaderOptions<isLazy>
): UseDataLoader<isLazy, Awaited<P>> {
  // TODO: make it DEV only and remove the first argument in production mode
  // resolve option overrides
  const loader =
    typeof nameOrLoader === 'function'
      ? nameOrLoader
      : (_loaderOrOptions! as DefineLoaderFn<P>)
  opts = typeof _loaderOrOptions === 'object' ? _loaderOrOptions : opts
  const options: Required<DefineDataLoaderOptions<isLazy>> = {
    ...DEFAULT_DEFINE_LOADER_OPTIONS,
    ...opts,
  } as any // because of the isLazy generic

  function load(
    to: RouteLocationNormalizedLoaded,
    router: Router,
    parent?: DataLoaderEntryBase,
    initialRootData?: Record<string, unknown>
  ): Promise<void> {
    // FIXME: duplicated code
    const entries = router[LOADER_ENTRIES_KEY]!
    if (!entries.has(loader)) {
      entries.set(loader, createDefineLoaderEntry<boolean>(options))
    }
    const entry = entries.get(loader)!

    const { data, error, isReady, pending, pendingLoad } = entry

    error.value = null
    pending.value = true
    // Promise.resolve() allows loaders to also be sync
    const currentLoad = (pendingLoad.value = Promise.resolve(loader(to))
      .then((d) => {
        if (pendingLoad.value === currentLoad) {
          data.value = d
        }
      })
      .catch((e) => {
        if (pendingLoad.value === currentLoad) {
          error.value = e
        }
      })
      .finally(() => {
        if (pendingLoad.value === currentLoad) {
          pending.value = false
          pendingLoad.value = null
        }
      }))

    return pendingLoad.value
  }

  // @ts-expect-error: requires the internals and symbol
  const useDataLoader: // for ts
  UseDataLoader<isLazy, Awaited<P>> = () => {
    // work with nested data loaders
    let [parentEntry, _router, _route] = getCurrentContext()
    // fallback to the global router and routes
    const router = _router || useRouter()
    const route = _route || useRoute()

    const entries = router[LOADER_ENTRIES_KEY]!
    if (!entries.has(loader)) {
      entries.set(loader, createDefineLoaderEntry<boolean>(options))
    }

    const entry = entries.get(loader)!
    const { data, error, pending } = entry

    // TODO: Merged promise like before
    return {
      data,
      error,
      pending,
      refresh: async () => {
        return load(router.currentRoute.value, router)
      },
      pendingLoad: () => null,
    } satisfies UseDataLoaderResult
  }

  // mark it as a data loader
  useDataLoader[IS_USE_DATA_LOADER_KEY] = true

  // add the internals
  useDataLoader._ = {
    load,
    options,
  }

  return useDataLoader
}

export interface DefineDataLoaderOptions<isLazy extends boolean>
  extends DefineDataLoaderOptionsBase<isLazy> {}

/**
 * Loader function that can be passed to `defineLoader()`.
 */
export interface DefineLoaderFn<T> {
  (route: RouteLocationNormalizedLoaded): T extends Promise<unknown>
    ? T
    : Promise<T>
}

const DEFAULT_DEFINE_LOADER_OPTIONS: Required<
  DefineDataLoaderOptions<boolean>
> = {
  lazy: false,
}

// TODO: move to a different file
export function createDefineLoaderEntry<
  isLazy extends boolean = boolean,
  Data = unknown
>(
  options: Required<DefineDataLoaderOptions<isLazy>>,
  initialData?: Data
): DataLoaderEntryBase<isLazy, Data> {
  return withinScope<DataLoaderEntryBase<isLazy, Data>>(() => ({
    pending: ref(false),
    error: ref<any>(),
    children: new Set(),
    // @ts-expect-error: data always start as empty
    data: ref(initialData),
    params: {},
    query: {},
    hash: null,
    isReady: false,
    pendingLoad: shallowRef(null),
  }))
}
