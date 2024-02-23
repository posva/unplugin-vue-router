import {
  useRoute,
  useRouter,
  type LocationQuery,
  type Router as UntypedRouter,
} from 'vue-router'
import type {
  RouteLocationNormalizedLoaded,
  RouteRecordName,
  Router,
} from 'unplugin-vue-router/types'
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
  PENDING_LOCATION_KEY,
  STAGED_NO_VALUE,
  _DefineLoaderEntryMap,
} from './meta-extensions'
import {
  IS_CLIENT,
  _PromiseMerged,
  assign,
  getCurrentContext,
  isSubsetOf,
  setCurrentContext,
  trackRoute,
} from './utils'
import { type ShallowRef, shallowRef, watch } from 'vue'
import { NavigationResult } from './navigation-guard'
import {
  UseQueryKey,
  UseQueryOptions,
  UseQueryReturn,
  useQuery,
} from '@pinia/colada'

/**
 * Creates a data loader composable that can be exported by pages to attach the data loading to a route. This returns a
 * composable that can be used in any component.
 *
 * @experimental
 * Still under development and subject to change. See https://github.com/vuejs/rfcs/discussions/460
 *
 * @param name - name of the route to have typed routes
 * @param loader - function that returns a promise with the data
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<
  Name extends RouteRecordName,
  Data,
  isLazy extends boolean,
>(
  name: Name,
  options: DefineDataColadaLoaderOptions<isLazy, Name, Data>
): UseDataLoaderColada<isLazy, Data>
export function defineColadaLoader<Data, isLazy extends boolean>(
  options: DefineDataColadaLoaderOptions<isLazy, RouteRecordName, Data>
): UseDataLoaderColada<isLazy, Data>

export function defineColadaLoader<Data, isLazy extends boolean>(
  nameOrOptions:
    | RouteRecordName
    | DefineDataColadaLoaderOptions<isLazy, RouteRecordName, Data>,
  _options?: DefineDataColadaLoaderOptions<isLazy, RouteRecordName, Data>
): UseDataLoaderColada<isLazy, Data> {
  // TODO: make it DEV only and remove the first argument in production mode
  // resolve option overrides
  _options =
    _options ||
    (nameOrOptions as DefineDataColadaLoaderOptions<
      isLazy,
      RouteRecordName,
      Data
    >)
  const loader = _options.query

  const options = {
    ...DEFAULT_DEFINE_LOADER_OPTIONS,
    ..._options,
    commit: _options?.commit || 'after-load',
  } as DefineDataColadaLoaderOptions<isLazy, RouteRecordName, Data>

  let isInitial = true

  function load(
    to: RouteLocationNormalizedLoaded,
    router: UntypedRouter,
    parent?: DataLoaderEntryBase,
    reload?: boolean
  ): Promise<void> {
    const entries = router[
      LOADER_ENTRIES_KEY
    ]! as unknown as _DefineLoaderEntryMap<
      DataLoaderColadaEntry<boolean, unknown>
    >
    const key = keyText(options.key(to))
    if (!entries.has(loader)) {
      const route = shallowRef<RouteLocationNormalizedLoaded>(to)
      entries.set(loader, {
        // force the type to match
        data: shallowRef<_DataMaybeLazy<Data, isLazy>>(),
        isLoading: shallowRef(false),
        error: shallowRef<any>(),

        options,
        children: new Set(),
        resetPending() {
          this.pendingTo = null
          this.pendingLoad = null
          this.isLoading.value = false
        },
        staged: STAGED_NO_VALUE,
        stagedError: null,
        commit,

        tracked: new Map(),
        ext: null,

        route,
        pendingTo: null,
        pendingLoad: null,
      })
    }
    const entry = entries.get(loader)!

    // Nested loaders might get called before the navigation guard calls them, so we need to manually skip these calls
    if (entry.pendingTo === to && entry.pendingLoad) {
      // console.log(`🔁 already loading "${key}"`)
      return entry.pendingLoad
    }

    if (!entry.ext) {
      // console.log(`🚀 creating query for "${key}"`)
      entry.ext = useQuery({
        ...options,
        // FIXME: type Promise<Data> instead of Promise<unknown>
        query: () => {
          const route = entry.route.value
          const [trackedRoute, params, query, hash] = trackRoute(route)
          entry.tracked.set(options.key(trackedRoute).join('|'), {
            ready: false,
            params,
            query,
            hash,
          })

          return loader(trackedRoute, {
            signal: route.meta[ABORT_CONTROLLER_KEY]!.signal,
          })
        },
        key: () => options.key(entry.route.value),
      })
    }

    const { isLoading, data, error, ext } = entry

    // we are rendering for the first time and we have initial data
    // we need to synchronously set the value so it's available in components
    // even if it's not exported
    if (isInitial) {
      isInitial = false
      if (ext.data.value !== undefined) {
        data.value = ext.data.value
        // pendingLoad is set for guards to work
        return (entry.pendingLoad = Promise.resolve())
      }
    }

    // console.log(
    //   `😎 Loading context to "${to.fullPath}" with current "${currentContext[2]?.fullPath}"`
    // )
    if (entry.route.value !== to) {
      // ensure we call refetch instead of refresh
      const tracked = entry.tracked.get(key.join('|'))
      reload = !tracked || hasRouteChanged(to, tracked)
    }

    // Currently load for this loader
    entry.route.value = entry.pendingTo = to

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
    entry.staged = STAGED_NO_VALUE
    // preserve error until data is committed
    entry.stagedError = error.value

    const currentLoad = ext[reload ? 'refetch' : 'refresh']()
      .then(() => {
        // console.log(
        //   `✅ resolved ${key}`,
        //   to.fullPath,
        //   `accepted: ${
        //     entry.pendingLoad === currentLoad
        //   }; data:\n${JSON.stringify(d)}\n${JSON.stringify(ext.data.value)}`
        // )
        if (entry.pendingLoad === currentLoad) {
          const newError = ext.error.value
          // propagate the error
          if (newError) {
            // console.log(
            //   '‼️ rejected',
            //   to.fullPath,
            //   `accepted: ${entry.pendingLoad === currentLoad} =`,
            //   e
            // )
            // in this case, commit will never be called so we should just drop the error
            entry.stagedError = newError
            // propagate error if non lazy or during SSR
            // NOTE: Cannot be handled at the guard level because of nested loaders
            if (!options.lazy || !IS_CLIENT) {
              throw newError
            }
          } else {
            // let the navigation guard collect the result
            const newData = ext.data.value
            if (newData instanceof NavigationResult) {
              to.meta[NAVIGATION_RESULTS_KEY]!.push(newData)
            } else {
              entry.staged = newData
              entry.stagedError = null
            }
          }
        }
        // else if (newError) {
        // TODO: Figure out cases where this was needed and test it
        // console.log(`❌ Discarded old result for "${key}"`, d, ext.data.value)
        // ext.data.value = data.value
        // ext.error.value = error.value
        // }
      })
      .finally(() => {
        setCurrentContext(currentContext)
        // console.log(
        //   `😩 restored context ${key}`,
        //   currentContext?.[2]?.fullPath
        // )
        if (entry.pendingLoad === currentLoad) {
          isLoading.value = false
          // we must run commit here so nested loaders are ready before used by their parents
          if (
            options.commit === 'immediate' ||
            // outside of a navigation
            !router[PENDING_LOCATION_KEY]
          ) {
            entry.commit(to)
          }
        } else {
          // For debugging purposes and refactoring the code
          // console.log(
          //   to.meta[ABORT_CONTROLLER_KEY]!.signal.aborted ? '✅' : '❌'
          // )
        }
      })

    // restore the context after the first tick to avoid lazy loaders to use their own context as parent
    setCurrentContext(currentContext)

    // this still runs before the promise resolves even if loader is sync
    entry.pendingLoad = currentLoad

    return currentLoad
  }

  function commit(
    this: DataLoaderColadaEntry<isLazy, Data>,
    to: RouteLocationNormalizedLoaded
  ) {
    const key = keyText(options.key(to))
    // console.log(`👉 commit "${key}"`)
    if (this.pendingTo === to) {
      // console.log(' ->', this.staged)
      if (process.env.NODE_ENV === 'development') {
        if (this.staged === STAGED_NO_VALUE) {
          console.warn(
            `Loader "${key}"'s "commit()" was called but there is no staged data.`
          )
        }
      }
      // if the entry is null, it means the loader never resolved, maybe there was an error
      if (this.staged !== STAGED_NO_VALUE) {
        this.data.value = this.staged
        this.tracked.get(key.join('|'))!.ready = true
      }
      // we always commit the error unless the navigation was cancelled
      this.error.value = this.stagedError

      // reset the staged values so they can't be commit
      this.staged = STAGED_NO_VALUE
      // preserve error until data is committed
      this.stagedError = this.error.value
      this.pendingTo = null
      // we intentionally keep pendingLoad so it can be reused until the navigation is finished

      // children entries cannot be committed from the navigation guard, so the parent must tell them
      for (const childEntry of this.children) {
        childEntry.commit(to)
      }
    } else {
      // console.log(` -> skipped`)
    }
  }

  // @ts-expect-error: requires the internals and symbol that are added later
  const useDataLoader: // for ts
  UseDataLoaderColada<isLazy, Data> = () => {
    // work with nested data loaders
    const [parentEntry, _router, _route] = getCurrentContext()
    // fallback to the global router and routes for useDataLoaders used within components
    const router = (_router as UntypedRouter) || useRouter()
    const route = _route || (useRoute() as RouteLocationNormalizedLoaded)

    const entries = router[
      LOADER_ENTRIES_KEY
    ]! as unknown as _DefineLoaderEntryMap<
      DataLoaderColadaEntry<boolean, unknown>
    >
    let entry = entries.get(loader)

    if (process.env.NODE_ENV === 'development') {
      if (!parentEntry && !entry) {
        console.error(
          `Some "useDataLoader()" was called outside of a component's setup or a data loader.`
        )
      }
    }

    if (
      // if the entry doesn't exist, create it with load and ensure it's loading
      !entry ||
      // we are nested and the parent is loading a different route than us
      (parentEntry && entry.pendingTo !== route)
    ) {
      // console.log(
      //   `🔁 loading from useData for "${options.key}": "${route.fullPath}"`
      // )
      router[APP_KEY].runWithContext(() =>
        load(route, router, parentEntry, true)
      )
    }

    entry = entries.get(loader)!

    // add ourselves to the parent entry children
    if (parentEntry) {
      if (parentEntry === entry) {
        console.warn(
          `👶❌ "${options.key}" has itself as parent.  This shouldn't be happening. Please report a bug with a reproduction to https://github.com/posva/unplugin-vue-router/`
        )
      }
      // console.log(`👶 "${options.key}" has parent ${parentEntry}`)
      parentEntry.children.add(entry!)
    }

    const { data, error, isLoading, ext } = entry

    // update the data when pinia colada updates it e.g. after visibility change
    watch(ext!.data, (newData) => {
      // only if we are not in the middle of a navigation
      if (!router[PENDING_LOCATION_KEY]) {
        data.value = newData
      }
    })

    watch(ext!.isFetching, (isFetching) => {
      if (!router[PENDING_LOCATION_KEY]) {
        isLoading.value = isFetching
      }
    })

    watch(ext!.error, (newError) => {
      if (!router[PENDING_LOCATION_KEY]) {
        error.value = newError
      }
    })

    const useDataLoaderResult = {
      data,
      error,
      isLoading,
      reload: (to: RouteLocationNormalizedLoaded = router.currentRoute.value) =>
        router[APP_KEY].runWithContext(() =>
          load(to, router, undefined, true)
        ).then(() => entry!.commit(to)),
      // pinia colada
      refetch: (
        to: RouteLocationNormalizedLoaded = router.currentRoute.value
      ) =>
        router[APP_KEY].runWithContext(() =>
          load(to, router, undefined, true)
        ).then(() => entry!.commit(to)),
      refresh: (
        to: RouteLocationNormalizedLoaded = router.currentRoute.value
      ) =>
        router[APP_KEY].runWithContext(() => load(to, router)).then(() =>
          entry!.commit(to)
        ),
      isPending: ext!.isPending,
      status: ext!.status,
    } satisfies UseDataLoaderColadaResult<boolean, unknown>

    // load ensures there is a pending load
    const promise = entry
      .pendingLoad!.then(() => {
        // nested loaders might wait for all loaders to be ready before setting data
        // so we need to return the staged value if it exists as it will be the latest one
        return entry!.staged === STAGED_NO_VALUE
          ? ext!.data.value
          : entry!.staged
      })
      // we only want the error if we are nesting the loader
      // otherwise this will end up in "Unhandled promise rejection"
      .catch((e) => (parentEntry ? Promise.reject(e) : null))

    return assign(promise, useDataLoaderResult)
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

export interface DefineDataColadaLoaderOptions<
  isLazy extends boolean,
  Name extends RouteRecordName,
  Data,
> extends DefineDataLoaderOptionsBase<isLazy>,
    Omit<UseQueryOptions<unknown>, 'query' | 'key'> {
  /**
   * Key associated with the data and passed to pinia colada
   * @param to - Route to load the data
   */
  key: (to: RouteLocationNormalizedLoaded<Name>) => UseQueryKey

  /**
   * Function that returns a promise with the data.
   */
  query: DefineLoaderFn<
    Data,
    DataColadaLoaderContext,
    RouteLocationNormalizedLoaded<Name>
  >

  // TODO: option to skip refresh if the used properties of the route haven't changed
}

/**
 * @internal
 */
export interface DataColadaLoaderContext extends DataLoaderContextBase {}

export interface UseDataLoaderColadaResult<isLazy extends boolean, Data>
  extends UseDataLoaderResult<isLazy, Data>,
    Pick<
      UseQueryReturn<Data, any>,
      'isPending' | 'refetch' | 'refresh' | 'status'
    > {}

/**
 * Data Loader composable returned by `defineColadaLoader()`.
 */
export interface UseDataLoaderColada<isLazy extends boolean, Data>
  extends UseDataLoader<isLazy, Data> {
  /**
   * Data Loader composable returned by `defineColadaLoader()`.
   *
   * @example
   * Returns the Data loader data, isLoading, error etc. Meant to be used in `setup()` or `<script setup>` **without `await`**:
   * ```vue
   * <script setup>
   * const { data, isLoading, error } = useUserData()
   * </script>
   * ```
   *
   * @example
   * It also returns a promise of the data when used in nested loaders. Note this `data` is **not a ref**. This is not meant to be used in `setup()` or `<script setup>`.
   * ```ts
   * export const useUserConnections = defineLoader(async () => {
   *   const user = await useUserData()
   *   return fetchUserConnections(user.id)
   * })
   * ```
   */
  (): _PromiseMerged<
    // we can await the raw data
    // excluding NavigationResult allows to ignore it in the type of Data when doing
    // `return new NavigationResult()` in the loader
    Exclude<Data, NavigationResult>,
    // or use it as a composable
    UseDataLoaderColadaResult<isLazy, Exclude<Data, NavigationResult>>
  >
}

export interface DataLoaderColadaEntry<isLazy extends boolean, Data>
  extends DataLoaderEntryBase<isLazy, Data> {
  /**
   * Reactive route passed to pinia colada so it automatically refetch
   */
  route: ShallowRef<RouteLocationNormalizedLoaded>

  /**
   * Tracked routes to know when the data should be refreshed. Key is the key of the query.
   */
  tracked: Map<string, TrackedRoute>

  /**
   * Extended options for pinia colada
   */
  ext: UseQueryReturn<Data> | null
}

interface TrackedRoute {
  ready: boolean
  params: Partial<LocationQuery>
  query: Partial<LocationQuery>
  hash: { v: string | null }
}

function hasRouteChanged(
  to: RouteLocationNormalizedLoaded,
  tracked: TrackedRoute
): boolean {
  return (
    !tracked.ready ||
    !isSubsetOf(tracked.params, to.params) ||
    !isSubsetOf(tracked.query, to.query) ||
    (tracked.hash.v != null && tracked.hash.v !== to.hash)
  )
}

const DEFAULT_DEFINE_LOADER_OPTIONS = {
  lazy: false,
  server: true,
  commit: 'after-load',
} satisfies Omit<
  DefineDataColadaLoaderOptions<boolean, RouteRecordName, unknown>,
  'key' | 'query'
>

// DEBUG ONLY
const keyText = (key: UseQueryOptions['key']): string[] => {
  const keys = Array.isArray(key) ? key : [key]
  return keys.map(stringifyFlatObject)
}
// TODO: import from pinia-colada
export function stringifyFlatObject(obj: unknown): string {
  return obj && typeof obj === 'object'
    ? JSON.stringify(obj, Object.keys(obj).sort())
    : String(obj)
}
