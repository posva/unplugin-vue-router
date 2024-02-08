import { useRoute, useRouter } from 'vue-router'
import type {
  _RouteLocationNormalizedLoaded,
  _RouteRecordName,
} from '../type-extensions/routeLocation'
import type { _Router } from '../type-extensions/router'
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
  _DefineLoaderEntryMap,
} from './meta-extensions'
import {
  IS_CLIENT,
  assign,
  getCurrentContext,
  setCurrentContext,
} from './utils'
import { Ref, ShallowRef, ref, shallowRef } from 'vue'
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
  Name extends _RouteRecordName,
  Data,
  isLazy extends boolean
>(
  name: Name,
  options: DefineDataLoaderOptions<isLazy, Name, Data>
): UseDataLoader<isLazy, Data>
export function defineColadaLoader<Data, isLazy extends boolean>(
  options: DefineDataLoaderOptions<isLazy, _RouteRecordName, Data>
): UseDataLoader<isLazy, Data>

export function defineColadaLoader<Data, isLazy extends boolean>(
  nameOrOptions:
    | _RouteRecordName
    | DefineDataLoaderOptions<isLazy, _RouteRecordName, Data>,
  _options?: DefineDataLoaderOptions<isLazy, _RouteRecordName, Data>
): UseDataLoader<isLazy, Data> {
  // TODO: make it DEV only and remove the first argument in production mode
  // resolve option overrides
  _options =
    _options ||
    (nameOrOptions as DefineDataLoaderOptions<isLazy, _RouteRecordName, Data>)
  const loader = _options.query

  const options = {
    ...DEFAULT_DEFINE_LOADER_OPTIONS,
    ..._options,
    commit: _options?.commit || 'immediate',
  } as DefineDataLoaderOptions<isLazy, _RouteRecordName, Data>

  let isInitial = true

  function load(
    to: _RouteLocationNormalizedLoaded,
    router: _Router,
    parent?: DataLoaderEntryBase,
    reload?: boolean
  ): Promise<void> {
    const entries = router[
      LOADER_ENTRIES_KEY
    ]! as unknown as _DefineLoaderEntryMap<
      // @ts-expect-error: FIXME: once pendingTo is removed from DataLoaderEntryBase
      DataLoaderColadaEntry<boolean, unknown>
    >
    const key = keyText(options.key(to))
    if (!entries.has(loader)) {
      const pendingTo = shallowRef<_RouteLocationNormalizedLoaded>(to)
      entries.set(loader, {
        // force the type to match
        data: ref() as Ref<_DataMaybeLazy<Data, isLazy>>,
        isLoading: ref(false),
        error: shallowRef<any>(),

        options,
        children: new Set(),
        cancelPending() {
          this._pendingTo = null
          this.pendingLoad = null
        },
        staged: STAGED_NO_VALUE,
        stagedError: null,
        // @ts-expect-error: FIXME: once pendingTo is removed from DataLoaderEntryBase
        commit,

        ext: null,

        pendingTo,
        _pendingTo: null,
        pendingLoad: null,
      })
    }
    const entry = entries.get(loader)!

    // Nested loaders might get called before the navigation guard calls them, so we need to manually skip these calls
    if (entry._pendingTo === to && entry.pendingLoad) {
      console.log(`🔁 already loading "${key}"`)
      return entry.pendingLoad
    }

    if (!entry.ext) {
      console.log(`🚀 creating query for "${key}"`)
      entry.ext = useQuery({
        ...options,
        // FIXME: type Promise<Data> instead of Promise<unknown>
        query: () =>
          // TODO: run within app context?
          loader(entry.pendingTo.value, {
            signal: entry.pendingTo.value.meta[ABORT_CONTROLLER_KEY]!.signal,
          }),
        key: () => options.key(entry.pendingTo.value),
      })
    }

    const { error, isLoading, data, ext } = entry

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
    if (entry.pendingTo.value !== to) {
      // TODO: test
      entry.pendingTo.value.meta[ABORT_CONTROLLER_KEY]!.abort()
      // ensure we call refetch instead of refresh
      // TODO: only if to is different from the pendintTo **consumed** properties
      reload = true
    }

    // Currently load for this loader
    entry.pendingTo.value = entry._pendingTo = to

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
    // @ts-expect-error: FIXME: once pendingTo is removed from DataLoaderEntryBase
    setCurrentContext([entry, router, to])

    const currentLoad = ext[reload ? 'refetch' : 'refresh']()
      .then((d) => {
        console.log(
          `✅ resolved ${key}`,
          to.fullPath,
          `accepted: ${
            entry.pendingLoad === currentLoad
          }; data:\n${JSON.stringify(d)}\n${JSON.stringify(ext.data.value)}`
        )
        if (entry.pendingLoad === currentLoad) {
          // propagate the error
          if (ext.error.value) {
            // console.log(
            //   '‼️ rejected',
            //   to.fullPath,
            //   `accepted: ${entry.pendingLoad === currentLoad} =`,
            //   e
            // )
            // in this case, commit will never be called so we should just drop the error
            if (options.lazy || options.commit !== 'after-load') {
              entry.stagedError = ext.error.value
            }
            // propagate error if non lazy or during SSR
            if (!options.lazy || !IS_CLIENT) {
              return Promise.reject(ext.error.value)
            }
          } else {
            entry.staged = ext.data.value
          }
        }
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
          if (options.lazy || options.commit === 'immediate') {
            // @ts-expect-error: FIXME: once pendingTo is removed from DataLoaderEntryBase
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
    this: DataLoaderColadaEntry<isLazy, Data>,
    to: _RouteLocationNormalizedLoaded
  ) {
    const key = keyText(options.key(to))
    console.log(`👉 commit "${key}"`)
    if (this._pendingTo === to) {
      console.log(' ->', this.staged)
      if (process.env.NODE_ENV === 'development') {
        if (this.staged === STAGED_NO_VALUE) {
          console.warn(
            `Loader "${key}"'s "commit()" was called but there is no staged data.`
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
      // The navigation was changed so avoid resetting the error
      if (!(this.staged instanceof NavigationResult)) {
        this.error.value = this.stagedError
      }
      this.staged = STAGED_NO_VALUE
      this.stagedError = null
      this._pendingTo = null

      // children entries cannot be committed from the navigation guard, so the parent must tell them
      this.children.forEach((childEntry) => {
        childEntry.commit(to)
      })
    } else {
      console.log(` -> skipped`)
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

    const entries = router[
      LOADER_ENTRIES_KEY
    ]! as unknown as _DefineLoaderEntryMap<
      // @ts-expect-error: FIXME: once pendingTo is removed from DataLoaderEntryBase
      DataLoaderColadaEntry<boolean, unknown>
    >
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
      // we are nested and the parent is loading a different route than us
      (parentEntry && entry._pendingTo !== route)
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
      // @ts-expect-error: TODO:
      if (parentEntry === entry) {
        console.warn(`👶❌ "${options.key}" has itself as parent`)
      }
      // console.log(`👶 "${options.key}" has parent ${parentEntry}`)
      // @ts-expect-error: TODO:
      parentEntry.children.add(entry!)
    }

    const { data, error, isLoading, ext } = entry

    const useDataLoaderResult = {
      data,
      error,
      isLoading,
      // TODO: add pinia colada stuff
      reload: (
        // @ts-expect-error: FIXME: should be fixable
        to: _RouteLocationNormalizedLoaded = router.currentRoute.value
      ) =>
        router[APP_KEY].runWithContext(() =>
          load(to, router, undefined, true)
        ).then(() =>
          // @ts-expect-error: FIXME:
          entry!.commit(to)
        ),
    } satisfies UseDataLoaderResult

    // load ensures there is a pending load
    const promise = entry.pendingLoad!.then(() => {
      // nested loaders might wait for all loaders to be ready before setting data
      // so we need to return the staged value if it exists as it will be the latest one
      return entry!.staged === STAGED_NO_VALUE ? ext!.data.value : entry!.staged
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

export interface DefineDataLoaderOptions<
  isLazy extends boolean,
  Name extends _RouteRecordName,
  Data
> extends DefineDataLoaderOptionsBase<isLazy>,
    Omit<UseQueryOptions<unknown>, 'query' | 'key'> {
  /**
   * Key associated with the data and passed to pinia colada
   * @param to - Route to load the data
   */
  key: (to: _RouteLocationNormalizedLoaded<Name>) => UseQueryKey[]

  /**
   * Function that returns a promise with the data.
   */
  query: DefineLoaderFn<
    Data,
    DataLoaderContext,
    _RouteLocationNormalizedLoaded<Name>
  >
}

export interface DataLoaderContext extends DataLoaderContextBase {}

export interface UseDataLoaderColadaResult<isLazy extends boolean, Data>
  extends UseDataLoaderResult<isLazy, Data> {}

export interface DataLoaderColadaEntry<isLazy extends boolean, Data>
  // TODO: remove Omit once pendingTo is removed from DataLoaderEntryBase
  extends Omit<DataLoaderEntryBase<isLazy, Data>, 'pendingTo'> {
  pendingTo: ShallowRef<_RouteLocationNormalizedLoaded>
  _pendingTo: _RouteLocationNormalizedLoaded | null

  /**
   * Extended options for pinia colada
   */
  ext: UseQueryReturn<Data> | null
}

const DEFAULT_DEFINE_LOADER_OPTIONS = {
  lazy: false,
  server: true,
  commit: 'immediate',
} satisfies Omit<
  DefineDataLoaderOptions<boolean, _RouteRecordName, unknown>,
  'key' | 'query'
>

/**
 * TODO:
 * - `refreshData()` -> refresh one or all data loaders
 * - `invalidateData()` / `clearData()` -> clear one or all data loaders (only useful if there is a cache strategy)
 */

// DEBUG ONLY
const keyText = (key: UseQueryOptions['key']): string[] => {
  const keys = Array.isArray(key) ? key : [key]
  return keys.map(stringifyFlatObject)
}
export function stringifyFlatObject(obj: unknown): string {
  return obj && typeof obj === 'object'
    ? JSON.stringify(obj, Object.keys(obj).sort())
    : String(obj)
}
