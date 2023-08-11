import type {
  RouteLocationNormalizedLoaded,
  RouteRecordName,
  Router,
} from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
import {
  DataLoaderContextBase,
  DataLoaderEntryBase,
  DefineDataLoaderOptionsBase,
  DefineLoaderFn,
  UseDataLoader,
  UseDataLoaderResult,
  _DataMaybeLazy,
} from './createDataLoader'
import {
  ABORT_CONTROLLER_KEY,
  APP_KEY,
  IS_USE_DATA_LOADER_KEY,
  LOADER_ENTRIES_KEY,
  STAGED_NO_VALUE,
} from './symbols'
import {
  IS_CLIENT,
  assign,
  getCurrentContext,
  setCurrentContext,
  withinScope,
} from './utils'
import { Ref, UnwrapRef, ref } from 'vue'

export function defineLoader<
  P extends Promise<unknown>,
  isLazy extends boolean
>(
  name: RouteRecordName,
  loader: (
    route: RouteLocationNormalizedLoaded,
    context: DataLoaderContext
  ) => P,
  options?: DefineDataLoaderOptions<isLazy>
): UseDataLoader<isLazy, Awaited<P>>
export function defineLoader<
  P extends Promise<unknown>,
  isLazy extends boolean
>(
  loader: (
    route: RouteLocationNormalizedLoaded,
    context: DataLoaderContext
  ) => P,
  options?: DefineDataLoaderOptions<isLazy>
): UseDataLoader<isLazy, Awaited<P>>

export function defineLoader<
  P extends Promise<unknown>,
  isLazy extends boolean
>(
  nameOrLoader: RouteRecordName | DefineLoaderFn<P, DataLoaderContext>,
  _loaderOrOptions?:
    | DefineDataLoaderOptions<isLazy>
    | DefineLoaderFn<P, DataLoaderContext>,
  opts?: DefineDataLoaderOptions<isLazy>
): UseDataLoader<isLazy, Awaited<P>> {
  // TODO: make it DEV only and remove the first argument in production mode
  // resolve option overrides
  const loader =
    typeof nameOrLoader === 'function'
      ? nameOrLoader
      : (_loaderOrOptions! as DefineLoaderFn<P, DataLoaderContext>)
  opts = typeof _loaderOrOptions === 'object' ? _loaderOrOptions : opts
  const options: Required<DefineDataLoaderOptions<isLazy>> = assign(
    {} as DefineDataLoaderOptions<isLazy>,
    DEFAULT_DEFINE_LOADER_OPTIONS,
    opts
  )

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
    const entry = entries.get(loader)!

    // Nested loaders might get called before the navigation guard calls them, so we need to manually skip these calls
    if (entry.pendingTo === to && entry.pendingLoad) {
      // console.log(`🔁 already loading "${options.key}"`)
      return entry.pendingLoad
    }

    const { error, pending } = entry

    error.value = null
    pending.value = true
    // save the current context to restore it later
    const currentContext = getCurrentContext()

    if (process.env.NODE_ENV === 'development') {
      if (parent !== currentContext[0]) {
        console.warn(
          `❌👶 "${options.key}" has a different parent than the current context. This shouldn't be happening. Please report a bug with a reproduction to https://github.com/posva/unplugin-vue-router/`
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
    const currentLoad = Promise.resolve(
      loader(to, { signal: to.meta[ABORT_CONTROLLER_KEY]!.signal })
    )
      .then((d) => {
        // console.log(
        //   `✅ resolved ${options.key}`,
        //   to.fullPath,
        //   `accepted: ${entry.pendingLoad === currentLoad}; data: ${d}`
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
          // propagate error if non lazy or during SSR
          if (!options.lazy || !IS_CLIENT) {
            return Promise.reject(e)
          }
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
            entry.commit(to)
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

  function commit(
    this: DataLoaderEntryBase,
    to: RouteLocationNormalizedLoaded
  ) {
    if (this.pendingTo === to && !this.error.value) {
      // console.log('👉 commit', this.staged)
      if (process.env.NODE_ENV === 'development') {
        if (this.staged === STAGED_NO_VALUE) {
          console.warn(
            `Loader "${options.key}"'s "commit()" was called but there is no staged data.`
          )
        }
      }
      // if the entry is null, it means the loader never resolved, maybe there was an error
      if (this.staged !== STAGED_NO_VALUE) {
        this.data.value = this.staged
      }
      this.staged = STAGED_NO_VALUE
      this.pendingTo = null

      // children entries cannot be committed from the navigation guard, so the parent must tell them
      this.children.forEach((childEntry) => {
        childEntry.commit(to)
      })
    }
  }

  // @ts-expect-error: requires the internals and symbol that are added later
  const useDataLoader: // for ts
  UseDataLoader<isLazy, Awaited<P>> = () => {
    // work with nested data loaders
    let [parentEntry, _router, _route] = getCurrentContext()
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
    }

    // TODO: skip if route is not the router pending location
    if (
      // if the entry doesn't exist, create it with load and ensure it's loading
      !entry ||
      // the existing pending location isn't good, we need to load again
      (parentEntry && entry.pendingTo !== route)
    ) {
      // console.log(
      //   `🔁 loading from useData for "${options.key}": "${route.fullPath}"`
      // )
      router[APP_KEY].runWithContext(() => load(route, router, parentEntry))
    }

    entry = entries.get(loader)!

    // add ourselves to the parent entry children
    if (parentEntry) {
      if (parentEntry === entry) {
        console.warn(`👶❌ "${options.key}" has itself as parent`)
      }
      // console.log(`👶 "${options.key}" has parent ${parentEntry}`)
      parentEntry.children.add(entry!)
    }

    const { data, error, pending } = entry

    const useDataLoaderResult = {
      data,
      error,
      pending,
      refresh: (
        to: RouteLocationNormalizedLoaded = router.currentRoute.value
      ) =>
        router[APP_KEY].runWithContext(() => load(to, router)).then(() =>
          entry!.commit(to)
        ),
    } satisfies UseDataLoaderResult

    // load ensures there is a pending load
    const promise = entry.pendingLoad!.then(() => {
      // nested loaders might wait for all loaders to be ready before setting data
      // so we need to return the staged value if it exists as it will be the latest one
      return entry!.staged === STAGED_NO_VALUE ? data.value : entry!.staged
    })

    return Object.assign(promise, useDataLoaderResult)
  }

  // mark it as a data loader
  useDataLoader[IS_USE_DATA_LOADER_KEY] = true

  // add the internals
  useDataLoader._ = {
    load,
    options,
    // @ts-expect-error: return type has the generics
    getEntry(router: Router) {
      return router[LOADER_ENTRIES_KEY]!.get(loader)!
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

export interface DataLoaderContext extends DataLoaderContextBase {}

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
  commit: (
    this: DataLoaderEntryBase<isLazy, Data>,
    to: RouteLocationNormalizedLoaded
  ) => void,
  initialData?: Data
): DataLoaderEntryBase<isLazy, Data> {
  // TODO: the scope should be passed somehow and be unique per application
  return withinScope<DataLoaderEntryBase<isLazy, Data>>(
    () =>
      ({
        // force the type to match
        data: ref(initialData) as Ref<_DataMaybeLazy<UnwrapRef<Data>, isLazy>>,
        pending: ref(false),
        error: ref<any>(),

        params: {},
        query: {},
        hash: null,

        children: new Set(),
        pendingLoad: null,
        pendingTo: null,
        staged: STAGED_NO_VALUE,
        commit,
      } satisfies DataLoaderEntryBase<isLazy, Data>)
  )
}

/**
 * TODO:
 * - `refreshData()` -> refresh one or all data loaders
 * - `invalidateData()` / `clearData()` -> clear one or all data loaders (only useful if there is a cache strategy)
 */
