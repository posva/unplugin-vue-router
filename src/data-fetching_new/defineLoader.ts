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
  _DataMaybeLazy,
  createDataLoader,
} from './createDataLoader'
import { IS_USE_DATA_LOADER_KEY, LOADER_ENTRIES_KEY } from './symbols'
import { getCurrentContext, setCurrentContext, withinScope } from './utils'
import { Ref, UnwrapRef, ref, shallowRef } from 'vue'

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

    const { data, error, isReady, pending } = entry

    error.value = null
    pending.value = true
    const currentContext = getCurrentContext()
    setCurrentContext([entry, router, to])
    // Promise.resolve() allows loaders to also be sync
    const currentLoad = Promise.resolve(loader(to))
      .then((d) => {
        if (entry.pendingLoad === currentLoad) {
          data.value = d
        }
      })
      .catch((e) => {
        if (entry.pendingLoad === currentLoad) {
          error.value = e
        }
      })
      .finally(() => {
        setCurrentContext(currentContext)
        if (entry.pendingLoad === currentLoad) {
          pending.value = false
          // pendingLoad.delete(to)
        }
      })

    entry.pendingLoad = currentLoad

    return currentLoad
  }

  // @ts-expect-error: requires the internals and symbol
  const useDataLoader: // for ts
  UseDataLoader<isLazy, Awaited<P>> = () => {
    // work with nested data loaders
    let [parentEntry, _router, _route] = getCurrentContext()
    // TODO: tell parent entry about the child
    // fallback to the global router and routes
    const router = _router || useRouter()
    const route = _route || useRoute()

    const entries = router[LOADER_ENTRIES_KEY]!
    // if the entry doesn't exist, create it with load and ensure it's loading
    if (!entries.has(loader)) {
      load(route, router, parentEntry)
    }

    const entry = entries.get(loader)!
    const { data, error, pending } = entry

    const useDataLoaderResult = {
      data,
      error,
      pending,
      refresh: async () => {
        return load(router.currentRoute.value, router)
      },
      pendingLoad: () => entry.pendingLoad,
    } satisfies UseDataLoaderResult

    // load ensures there is a pending load
    const promise = entry.pendingLoad!.then(() => useDataLoaderResult)
    // TODO: finally restore current loader?

    return Object.assign(promise, useDataLoaderResult)
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
  return withinScope<DataLoaderEntryBase<isLazy, Data>>(
    () =>
      ({
        pending: ref(false),
        error: ref<any>(),
        children: new Set(),
        // force the type to match
        data: ref(initialData) as Ref<_DataMaybeLazy<UnwrapRef<Data>, isLazy>>,
        params: {},
        query: {},
        hash: null,
        isReady: false,
        pendingLoad: null,
      } satisfies DataLoaderEntryBase<isLazy, Data>)
  )
}
