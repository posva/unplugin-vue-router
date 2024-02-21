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
  NAVIGATION_RESULTS_KEY,
  STAGED_NO_VALUE,
} from './meta-extensions'
import {
  IS_CLIENT,
  assign,
  getCurrentContext,
  setCurrentContext,
} from './utils'
import { type Ref, ref, shallowRef } from 'vue'
import { NavigationResult } from './navigation-guard'
import {
  type QueryObserverOptions,
  type UseQueryOptions,
  type UseQueryReturnType,
  useQuery,
} from '@tanstack/vue-query'
import type {
  _RouteLocationNormalizedLoaded,
  _RouteRecordName,
} from '../type-extensions/routeLocation'
import type { _Router } from '../type-extensions/router'

export function defineQueryLoader<
  Name extends _RouteRecordName,
  Data,
  isLazy extends boolean
>(
  name: Name,
  loader: DefineLoaderFn<
    Data,
    QueryLoaderContext,
    _RouteLocationNormalizedLoaded<Name>
  >,
  options?: DefineQueryLoaderOptions<isLazy, Data>
): UseDataLoader<isLazy, Data>
export function defineQueryLoader<Data, isLazy extends boolean>(
  loader: DefineLoaderFn<
    Data,
    QueryLoaderContext,
    _RouteLocationNormalizedLoaded
  >,
  options?: DefineQueryLoaderOptions<isLazy, Data>
): UseDataLoader<isLazy, Data>

export function defineQueryLoader<Data, isLazy extends boolean>(
  nameOrLoader: _RouteRecordName | DefineLoaderFn<Data, QueryLoaderContext>,
  _loaderOrOptions?:
    | DefineQueryLoaderOptions<isLazy, Data>
    | DefineLoaderFn<Data, QueryLoaderContext>,
  opts?: DefineQueryLoaderOptions<isLazy, Data>
): UseDataLoader<isLazy, Data> {
  // TODO: make it DEV only and remove the first argument in production mode
  // resolve option overrides
  const loader =
    typeof nameOrLoader === 'function'
      ? nameOrLoader
      : (_loaderOrOptions! as DefineLoaderFn<Data, QueryLoaderContext>)
  opts = typeof _loaderOrOptions === 'object' ? _loaderOrOptions : opts
  const options = assign(
    {} as DefineQueryLoaderOptions<isLazy, Data>,
    DEFAULT_DEFINE_QUERY_LOADER_OPTIONS,
    opts
  ) satisfies DefineQueryLoaderOptions<isLazy, Data>

  function load(
    to: _RouteLocationNormalizedLoaded,
    router: _Router,
    parent?: DataLoaderEntryBase
  ): Promise<void> {
    const entries = router[LOADER_ENTRIES_KEY]!
    if (!entries.has(loader)) {
      // TODO: ensure there is an effectScope
      // @ts-expect-error: FIXME:
      const queryResult = useQuery<Data, Error>({
        ...options,
        queryFn: () =>
          loader(to, { signal: to.meta[ABORT_CONTROLLER_KEY]!.signal }),
      })
      queryResult.data.value
      entries.set(loader, {
        // force the type to match
        data: ref() as Ref<Data>,
        // data: queryResult.data as any,
        isLoading: ref(false),
        error: shallowRef<any>(),

        children: new Set(),
        pendingLoad: null,
        pendingTo: null,
        staged: STAGED_NO_VALUE,
        commit,
        // TODO: could we find a way to make this type safe through the type of loader?
        // @ts-expect-error
        vq: queryResult,
      } satisfies QueryLoaderEntry<boolean, Data>)
    }
    const entry = entries.get(loader)!
    const key: string = options.queryKey?.join('/') || ''

    // Nested loaders might get called before the navigation guard calls them, so we need to manually skip these calls
    if (entry.pendingTo === to && entry.pendingLoad) {
      console.log(`🔁 already loading "${key}"`)
      return entry.pendingLoad
    }

    const { error, isLoading: isLoading, data } = entry

    // FIXME: not needed because vue query has its own state
    const initialRootData: Record<string, unknown> = {}
    const initialData =
      (initialRootData && key in initialRootData && initialRootData[key]) ??
      STAGED_NO_VALUE

    // we are rendering for the first time and we have initial data
    // we need to synchronously set the value so it's available in components
    // even if it's not exported
    if (initialData !== STAGED_NO_VALUE) {
      data.value = initialData
      // pendingLoad is set for guards to work
      return (entry.pendingLoad = Promise.resolve())
    }

    console.log(
      `😎 Loading context to "${to.fullPath}" with current "${entry.pendingTo?.fullPath}"`
    )
    // Currently load for this loader
    entry.pendingTo = to

    error.value = null
    isLoading.value = true
    // save the current context to restore it later
    const currentContext = getCurrentContext()

    if (process.env.NODE_ENV === 'development') {
      if (parent !== currentContext[0]) {
        console.warn(
          `❌👶 "${key}" has a different parent than the current context. This shouldn't be happening. Please report a bug with a reproduction to https://github.com/posva/unplugin-vue-router/`
        )
      }
    }
    // set the current context before loading so nested loaders can use it
    setCurrentContext([entry, router, to])

    // Promise.resolve() allows loaders to also be sync
    const currentLoad = Promise.resolve(
      loader(to, { signal: to.meta[ABORT_CONTROLLER_KEY]!.signal })
    )
      .then((d) => {
        console.log(
          `✅ resolved ${key}`,
          to.fullPath,
          `accepted: ${entry.pendingLoad === currentLoad}; data: ${d}`
        )
        if (entry.pendingLoad === currentLoad) {
          entry.staged = d
        }
      })
      .catch((e) => {
        console.log(
          '‼️ rejected',
          to.fullPath,
          `accepted: ${entry.pendingLoad === currentLoad} =`,
          e
        )
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
        console.log(`😩 restored context ${key}`, currentContext?.[2]?.fullPath)
        if (entry.pendingLoad === currentLoad) {
          isLoading.value = false
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
    console.log(`🔶 Promise set to pendingLoad "${key}"`)

    return currentLoad
  }

  function commit(
    this: QueryLoaderEntry<boolean, Data>,
    to: _RouteLocationNormalizedLoaded
  ) {
    if (this.pendingTo === to && !this.error.value) {
      console.log('👉 commit', this.staged)
      if (process.env.NODE_ENV === 'development') {
        if (this.staged === STAGED_NO_VALUE) {
          console.warn(
            `Loader "${options.queryKey?.join(
              '/'
            )}"'s "commit()" was called but there is no staged data.`
          )
        }
      }
      // if the entry is null, it means the loader never resolved, maybe there was an error
      if (this.staged !== STAGED_NO_VALUE) {
        // collect navigation results instead of setting the data
        if (this.staged instanceof NavigationResult) {
          to.meta[NAVIGATION_RESULTS_KEY]!.push(this.staged)
        } else {
          this.data.value = this.staged
        }
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
  UseDataLoader<isLazy, Data> = () => {
    // work with nested data loaders
    const [parentEntry, _router, _route] = getCurrentContext()
    // fallback to the global router and routes for useDataLoaders used within components
    const router = _router || (useRouter() as _Router)
    const route = _route || (useRoute() as _RouteLocationNormalizedLoaded)

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

    // TODO: skip if route is not the router pending location. Check if it changes anything compared to the current check with only entry.pendingTo
    if (
      // if the entry doesn't exist, create it with load and ensure it's loading
      !entry ||
      // the existing pending location isn't good, we need to load again
      (parentEntry && entry.pendingTo !== route)
    ) {
      console.log(
        `🔁 loading from useData for "${options.queryKey?.join('/')}": "${
          route.fullPath
        }"`
      )
      router[APP_KEY].runWithContext(() => load(route, router, parentEntry))
    }

    entry = entries.get(loader)!

    // add ourselves to the parent entry children
    if (parentEntry) {
      if (parentEntry === entry) {
        console.warn(
          `👶❌ "${options.queryKey?.join('/')}" has itself as parent`
        )
      }
      // console.log(`👶 "${options.key}" has parent ${parentEntry}`)
      parentEntry.children.add(entry!)
    }

    const { data, error, isLoading: isLoading } = entry

    const useDataLoaderResult = {
      data,
      error,
      isLoading: isLoading,
      reload: (
        to: _RouteLocationNormalizedLoaded = router.currentRoute
          .value as _RouteLocationNormalizedLoaded
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
    getEntry(router: _Router) {
      return router[LOADER_ENTRIES_KEY]!.get(loader)!
    },
  }

  return useDataLoader
}

export interface DefineQueryLoaderOptions<isLazy extends boolean, Data>
  extends DefineDataLoaderOptionsBase<isLazy>,
    // NOTE: queryFn is always needed and passed as the first argument
    Omit<QueryObserverOptions<Data>, 'queryFn'> {}

export interface QueryLoaderEntry<
  isLazy extends boolean = boolean,
  Data = unknown
> extends DataLoaderEntryBase<isLazy, Data> {
  vq: UseQueryReturnType<Data, unknown>
}

export interface QueryLoaderContext extends DataLoaderContextBase {}

const DEFAULT_DEFINE_QUERY_LOADER_OPTIONS: DefineQueryLoaderOptions<
  boolean,
  unknown
> = {
  lazy: false,
  server: true,
  commit: 'after-load',

  // keepPreviousData: true,
}
