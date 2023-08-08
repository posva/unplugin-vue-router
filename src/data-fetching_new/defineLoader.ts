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
import {
  IS_USE_DATA_LOADER_KEY,
  LOADER_ENTRIES_KEY,
  PENDING_LOCATION_KEY,
} from './symbols'
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

  let _entry: DataLoaderEntryBase<isLazy, Awaited<P>> | undefined

  function load(
    to: RouteLocationNormalizedLoaded,
    router: Router,
    parent?: DataLoaderEntryBase,
    initialRootData?: Record<string, unknown>
  ): Promise<void> {
    const entries = router[LOADER_ENTRIES_KEY]!
    if (!entries.has(loader)) {
      entries.set(loader, createDefineLoaderEntry<boolean>(options, commit))
    }
    const entry =
      // @ts-expect-error: isLazy again
      (_entry =
        // ...
        entries.get(loader)!)

    const { data, error, isReady, pending } = entry

    error.value = null
    pending.value = true
    // save the current context to restore it later
    const currentContext = getCurrentContext()

    if (process.env.NODE_ENV === 'development') {
      if (parent !== currentContext[0]) {
        console.warn(
          `❌👶 "${options.key}" has a different parent than the current context.`
        )
      }
    }
    // set the current context before loading so nested loaders can use it
    setCurrentContext([entry, router, to])
    // console.log(
    //   `😎 Loading context to "${to.fullPath}" with current "${currentContext[2]?.fullPath}"`
    // )
    // Currently load for this loader
    entry.pendingTo = to
    // Promise.resolve() allows loaders to also be sync
    const currentLoad = Promise.resolve(loader(to))
      .then((d) => {
        // console.log(
        //   `✅ resolved ${options.key}`,
        //   to.fullPath,
        //   `accepted: ${entry.pendingLoad === currentLoad} =`,
        //   d
        // )
        if (entry.pendingLoad === currentLoad) {
          entry.staged = d
        }
      })
      .catch((e) => {
        // console.log(
        //   '‼️ rejected',
        //   to.fullPath,
        //   `accepted: ${entry.pendingLoad === currentLoad} =`,
        //   e
        // )
        if (entry.pendingLoad === currentLoad) {
          error.value = e
        }
      })
      .finally(() => {
        setCurrentContext(currentContext)
        // console.log(
        //   `😩 restored context ${options.key}`,
        //   currentContext?.[2]?.fullPath
        // )
        if (entry.pendingLoad === currentLoad) {
          pending.value = false
          // we must run commit here so nested loaders are ready before used by their parents
          if (options.lazy || options.commit === 'immediate') {
            commit(to)
          }
        }
      })

    // restore the context after the first tick to avoid lazy loaders to use their own context as parent
    setCurrentContext(currentContext)

    // this still runs before the promise resolves even if loader is sync
    entry.pendingLoad = currentLoad
    // console.log(`🔶 Promise set to pendingLoad "${options.key}"`)

    return currentLoad
  }

  function commit(to: RouteLocationNormalizedLoaded) {
    if (!_entry) {
      if (process.env.NODE_ENV === 'development') {
        throw new Error(
          `Loader "${options.key}"'s "commit()" was called before it was loaded once. This will fail in production.`
        )
      }
      return
    }

    if (_entry.pendingTo === to) {
      // console.log('👉 commit', _entry.staged)
      if (process.env.NODE_ENV === 'development') {
        if (_entry.staged === null) {
          console.warn(
            `Loader "${options.key}"'s "commit()" was called but there is no staged data.`
          )
        }
      }
      // if the entry is null, it means the loader never resolved, maybe there was an error
      if (_entry.staged !== null) {
        // @ts-expect-error: staged starts as null but should always be set at this point
        _entry.data.value = _entry.staged
      }
      _entry.staged = null
      _entry.pendingTo = null

      // children entries cannot be committed from the navigation guard, so the parent must tell them
      _entry.children.forEach((childEntry) => {
        childEntry.commit(to)
      })
    }
  }

  // should only be called after load
  const pendingLoad = () => _entry!.pendingLoad

  // @ts-expect-error: requires the internals and symbol
  const useDataLoader: // for ts
  UseDataLoader<isLazy, Awaited<P>> = () => {
    // work with nested data loaders
    let [parentEntry, _router, _route] = getCurrentContext()
    // TODO: tell parent entry about the child
    // fallback to the global router and routes for useDataLoaders used within components
    const router = _router || useRouter()
    const route = _route || useRoute()

    const entries = router[LOADER_ENTRIES_KEY]!
    let entry = entries.get(loader)

    // console.log(`-- useDataLoader called ${options.key} --`)
    // console.log(
    //   'router pending location',
    //   router[PENDING_LOCATION_KEY]?.fullPath
    // )
    // console.log('target route', route.fullPath)
    // console.log('has parent', !!parentEntry)
    // console.log('has entry', !!entry)
    // console.log('entryLatestLoad', entry?.pendingTo?.fullPath)
    // console.log('is same route', entry?.pendingTo === route)
    // console.log('-- END --')

    if (process.env.NODE_ENV === 'development') {
      if (!parentEntry && !entry) {
        console.error(
          `Some "useDataLoader()" was called outside of a component's setup or a data loader.`
        )
      }

      // TODO: we can probably get around this by returning the staged data
      if (parentEntry && options.commit === 'after-load') {
        console.warn(
          `🚨 "${options.key}" is used used as a nested loader and its commit option is set to "after-load" but nested loaders are always immediate to be able to give a value to their parent loader.`
        )
      }
    }

    // TODO: skip if route is not the router pending location
    if (
      // if the entry doesn't exist, create it with load and ensure it's loading
      !entry ||
      // the existing pending location isn't good, we need to load again
      // TODO: only load if the target route is the global pending location
      (parentEntry && entry.pendingTo !== route)
    ) {
      // console.log(
      //   `🔁 loading from useData for "${options.key}": "${route.fullPath}"`
      // )
      load(route, router, parentEntry)
    }

    entry = entries.get(loader)!

    if (parentEntry) {
      if (parentEntry === entry) {
        console.warn(`👶❌ "${options.key}" has itself as parent`)
      }
      console.log(`👶 "${options.key}" has parent ${parentEntry}`)
      parentEntry.children.add(entry!)
    }

    const { data, error, pending } = entry

    const useDataLoaderResult = {
      data,
      error,
      pending,
      refresh: (
        to: RouteLocationNormalizedLoaded = router.currentRoute.value
      ) => load(to, router).then(() => commit(to)),
      pendingLoad,
    } satisfies UseDataLoaderResult

    // load ensures there is a pending load
    const promise = entry.pendingLoad!.then(() => {
      return useDataLoaderResult
    })

    return Object.assign(promise, useDataLoaderResult)
  }

  // mark it as a data loader
  useDataLoader[IS_USE_DATA_LOADER_KEY] = true

  // add the internals
  useDataLoader._ = {
    load,
    options,
    commit,
    get entry() {
      return _entry!
    },
  }

  return useDataLoader
}

export interface DefineDataLoaderOptions<isLazy extends boolean>
  extends DefineDataLoaderOptionsBase<isLazy> {
  /**
   * Key to use for SSR state.
   */
  key?: string
}

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
  key: '',
  server: true,
  commit: 'immediate',
}

// TODO: move to a different file
export function createDefineLoaderEntry<
  isLazy extends boolean = boolean,
  Data = unknown
>(
  options: Required<DefineDataLoaderOptions<isLazy>>,
  commit: (to: RouteLocationNormalizedLoaded) => void,
  initialData?: Data
): DataLoaderEntryBase<isLazy, Data> {
  // TODO: the scope should be passed somehow and be unique per application
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
        pendingTo: null,
        staged: null,
        commit,
      } satisfies DataLoaderEntryBase<isLazy, Data>)
  )
}

/**
 * TODO:
 * - `refreshData()` -> refresh one or all data loaders
 * - `invalidateData()` / `clearData()` -> clear one or all data loaders (only useful if there is a cache strategy)
 */
