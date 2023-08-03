import type { RouteLocationNormalizedLoaded, RouteRecordName } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
import {
  DataLoaderEntryBase,
  DefineDataLoaderOptionsBase,
  UseDataLoader,
  createDataLoader,
} from './createDataLoader'
import { IS_USE_DATA_LOADER_KEY, LOADER_ENTRIES_KEY } from './symbols'
import { Router } from 'vue-router/auto'
import { getCurrentContext } from './utils'

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

  const useDataLoader: UseDataLoader<isLazy, Awaited<P>> = (() => {
    let [parentEntry, _router, _route] = getCurrentContext()
    const router = _router || useRouter()
    const route = _route || useRoute()

    const entries = router[LOADER_ENTRIES_KEY]!
    if (!entries.has(loader)) {
      entries.set(loader, {})
    }

    const entry = entries.get(loader)!

    return {}
  }) as any // we force the type because we are missing the extra properties on the function object

  function load(
    route: RouteLocationNormalizedLoaded,
    router: Router,
    parent?: DataLoaderEntryBase,
    initialRootData?: Record<string, unknown>
  ): Promise<void> {}

  // mark it as a data loader
  useDataLoader[IS_USE_DATA_LOADER_KEY] = true

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
