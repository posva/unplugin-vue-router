import { TypeEqual, expectType } from 'ts-expect'
import { Ref, UnwrapRef, effectScope, ref } from 'vue'
import type {
  LocationQuery,
  RouteParams,
  RouteLocationNormalizedLoaded,
  Router,
} from 'vue-router'
import { IS_USE_DATA_LOADER_KEY } from './symbols'
import { _Awaitable } from '../core/utils'

/**
 * Base type for a data loader entry. Each Data Loader has its own entry in the `loaderEntries` (accessible via `[LOADER_ENTRIES_KEY]`) map.
 */
export interface DataLoaderEntryBase<
  isLazy extends boolean = boolean,
  Data = unknown
> {
  /**
   * Location's params that were used to load the data.
   */
  params: Partial<RouteParams>
  /**
   * Location's query that was used to load the data.
   */
  query: Partial<LocationQuery>
  /**
   * Location's hash that was used to load the data.
   */
  hash: string | null

  /**
   * Other data loaders that depend on this one. This is used to invalidate the data when a dependency is invalidated.
   */
  children: Set<DataLoaderEntryBase>

  /**
   * Whether there is an ongoing request.
   */
  pending: Ref<boolean>
  // TODO: should it be just a promise ref?

  // TODO: allow delaying pending? maybe

  /**
   * Error if there was an error.
   */
  error: Ref<any> // any is simply more convenient for errors

  /**
   * Is the entry ready with data. This is set to `true` the first time the entry is updated with data.
   */
  isReady: boolean

  /**
   * Data stored in the entry.
   */
  data: Ref<_DataMaybeLazy<UnwrapRef<Data>, isLazy>>
}

export function createDataLoader<Context extends DataLoaderContextBase>({
  before,
  after,
}: CreateDataLoaderOptions<Context>): DefineDataLoader<Context> {
  const defineLoader: DefineDataLoader<Context> = (dataLoader, options) => {
    const { pending, error, data } = effectScope(true).run(() => ({
      pending: ref(false),
      // TODO: allow generic for error type
      error: ref<unknown | null>(null),
      data: ref<unknown | undefined>(),
    }))!

    const useDataLoader: UseDataLoader<boolean, unknown> = (() => {
      const promise = Promise.resolve(before({}))
        .then((preloadResult) => {
          // TODO: allow cancelling? 404 and stuff
          return dataLoader(preloadResult)
        })
        .catch((err: any) => {
          error.value = err
        })
        .finally(() => {
          pending.value = false
        })

      // TODO: merge promise

      return {
        data: data,
        pending,
        error,
      }
      // we need this cast because we add extra properties to the function object itself
    }) as UseDataLoader<boolean, unknown>

    useDataLoader[IS_USE_DATA_LOADER_KEY] = true

    // useDataLoader._fn = dataLoader

    // FIXME: TS bug? Says isLazy could be something that boolean is not assignable to but I don't see how...
    return useDataLoader as any
  }

  return defineLoader
}

export interface CreateDataLoaderOptions<
  Context extends DataLoaderContextBase
> {
  // TODO: should return a different value than context to know if we should skip the data loader execution
  // TODO: rename to make more sense e.g. load, preload
  before: (context: DataLoaderContextBase) => _Awaitable<Context>
  // TODO: rename to make more sense e.g. ready, postload
  after: <Data = unknown>(data: Data, context: Context) => unknown
}

export interface DefineDataLoaderOptionsBase<isLazy extends boolean> {
  /**
   * Whether the data should be lazy loaded without blocking the navigation or not. Defaults to false. When set to true
   * or a function, the loader will no longer block the navigation and the returned composable can be called even
   * without having the data ready.
   */
  lazy?: isLazy
}

export interface DataLoaderContextBase {}
// export interface DataLoaderContext {}

export interface DefineDataLoader<Context extends DataLoaderContextBase> {
  <isLazy extends boolean, Data>(
    fn: (context: Context) => _Awaitable<Data>,
    options?: DefineDataLoaderOptionsBase<isLazy>
    // TODO: or a generic that allows a more complex UseDataLoader
  ): UseDataLoader<isLazy, Data>
}

export interface UseDataLoader<
  isLazy extends boolean = boolean,
  Data = unknown
> {
  [IS_USE_DATA_LOADER_KEY]: true
  // TODO: with context argument and stuff, probably generic
  // maybe a context argument
  // _fn: () => _Awaitable<Data>

  (): UseDataLoaderResult<isLazy, Data>

  _: UseDataLoaderInternals<isLazy, Data>
}

export interface UseDataLoaderInternals<
  isLazy extends boolean = boolean,
  Data = unknown
> {
  /**
   * Loads the data from the cache if possible, otherwise loads it from the loader and awaits it.
   */
  load: (
    route: RouteLocationNormalizedLoaded,
    router: Router,
    parent?: DataLoaderEntryBase,
    initialRootData?: Record<string, unknown>
  ) => Promise<void>

  /**
   * The data loaded by the loader associated with the router instance. As one router instance can only be used for one
   * app, it ensures the cache is not shared among requests.
   */
  // TODO: do we need this?
  // entries: WeakMap<Router, DataLoaderEntryBase<isLazy, Data>>

  /**
   * Resolved options for the loader.
   */
  options: Required<DefineDataLoaderOptionsBase<isLazy>>
}

type _DataMaybeLazy<Data, isLazy extends boolean = boolean> =
  // no lazy provided, default value is false
  boolean extends isLazy ? Data : true extends isLazy ? Data | undefined : Data

// TODO: better to pick from the entry?
export interface UseDataLoaderResult<isLazy extends boolean, Data> {
  // TODO: unwrap, p
  data: Ref<_DataMaybeLazy<Data, isLazy>>

  pending: Ref<boolean>
  // TODO: error type as generic
  error: Ref<unknown | null>
}

export function testing() {
  const defineBasicLoader = createDataLoader<DataLoaderContextBase>({
    before: (context) => {
      // do nothing, always reexecute
      return context
    },
    // no caching or anything
    after: (data) => {},
  })

  const useUserData = defineBasicLoader(
    async (context) => {
      return {
        user: {
          name: 'Eduardo',
        },
      }
    },
    {
      // lazy: true
    }
  )

  const { data } = useUserData()
  expectType<TypeEqual<{ user: { name: string } }, typeof data.value>>(true)
}

type B = boolean extends true | false ? 'yes' : 'no'
type A = UseDataLoaderResult<boolean, string>['data']
