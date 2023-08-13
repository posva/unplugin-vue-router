import { TypeEqual, expectType } from 'ts-expect'
import { Ref, ShallowRef, UnwrapRef, effectScope, ref } from 'vue'
import type {
  LocationQuery,
  RouteParams,
  RouteLocationNormalizedLoaded,
  Router,
} from 'vue-router'
import { IS_USE_DATA_LOADER_KEY, STAGED_NO_VALUE } from './symbols'
import { _Awaitable } from '../core/utils'
import { _PromiseMerged } from './utils'
import { NavigationResult } from './navigation-guard'

/**
 * Base type for a data loader entry. Each Data Loader has its own entry in the `loaderEntries` (accessible via `[LOADER_ENTRIES_KEY]`) map.
 */
export interface DataLoaderEntryBase<
  isLazy extends boolean = boolean,
  Data = unknown
> {
  // state

  /**
   * Data stored in the entry.
   */
  data: Ref<_DataMaybeLazy<UnwrapRef<Data>, isLazy>>

  /**
   * Error if there was an error.
   */
  error: ShallowRef<any> // any is simply more convenient for errors

  // TODO: allow delaying pending? maybe allow passing a custom ref that can use refDebounced https://vueuse.org/shared/refDebounced/#refdebounced
  /**
   * Whether there is an ongoing request.
   */
  pending: Ref<boolean>

  /**
   * The latest pending load. Used to verify if the load is still valid when it resolves.
   */
  pendingLoad: Promise<void> | null

  /**
   * The latest pending navigation's `to` route. Used to verify if the navigation is still valid when it resolves.
   */
  pendingTo: RouteLocationNormalizedLoaded | null

  /**
   * Data that was staged by a loader. This is used to avoid showing the old data while the new data is loading. Calling
   * the internal `commit()` function will replace the data with the staged data.
   */
  staged: Data | typeof STAGED_NO_VALUE

  // entry instance

  /**
   * Other data loaders that depend on this one. This is used to invalidate the data when a dependency is invalidated.
   */
  children: Set<DataLoaderEntryBase>

  /**
   * Commits the pending data to the entry. This is called by the navigation guard when all non-lazy loaders have
   * finished loading. It should be implemented by the loader. It **must be called** from the entry itself:
   * `entry.commit(to)`.
   */
  commit(
    this: DataLoaderEntryBase<isLazy, Data>,
    to: RouteLocationNormalizedLoaded
  ): void
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
      const promise = Promise.resolve(
        before({
          // FIXME: just to pass the TS while working on this
          signal: new AbortController().signal,
        })
      )
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
   * Whether the data should be lazy loaded without blocking the client side navigation or not. When set to true, the loader will no longer block the navigation and the returned composable can be called even
   * without having the data ready.
   *
   * @defaultValue `false`
   */
  lazy?: isLazy

  /**
   * Whether this loader should be called on the server side or not. Combined with the `lazy` option, this can be useful
   * when the data is not needed on the first render.
   * @defaultValue `true`
   */
  server?: boolean

  /**
   * When the data should be committed to the entry. This only applies to non-lazy loaders.
   *
   * @see {@link DefineDataLoaderCommit}
   * @defaultValue `'immediate'`
   */
  commit?: DefineDataLoaderCommit
}

/**
 * When the data should be committed to the entry.
 * - `immediate`: the data is committed as soon as it is loaded.
 * - `after-load`: the data is committed after all non-lazy loaders have finished loading.
 */
export type DefineDataLoaderCommit = 'immediate' | 'after-load'
// TODO: is after-load fine or is it better to have an after-navigation instead

export interface DataLoaderContextBase {
  /**
   * Signal associated with the current navigation. It is aborted when the navigation is canceled or an error occurs.
   */
  signal: AbortSignal
}

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

  /**
   * Data Loader composable returned by `defineLoader()`.
   *
   * @example
   * Returns the Data loader data, pending, error etc. Meant to be used in `setup()` or `<script setup>` **without `await`**:
   * ```vue
   * <script setup>
   * const { data, pending, error } = useUserData()
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
    Exclude<Data, NavigationResult>,
    UseDataLoaderResult<isLazy, Exclude<Data, NavigationResult>>
  >

  _: UseDataLoaderInternals<isLazy, Exclude<Data, NavigationResult>>
}

/**
 * Internal properties of a data loader composable. Used by the internal implementation of `defineLoader()`. **Should
 * not be used in application code.**
 */
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
    parent?: DataLoaderEntryBase
  ) => Promise<void>

  /**
   * Resolved options for the loader.
   */
  options: Required<DefineDataLoaderOptionsBase<isLazy>>

  /**
   * Gets the entry associated with the router instance. Assumes the data loader has been loaded and that the entry
   * exists.
   *
   * @param router - router instance
   */
  getEntry(router: Router): DataLoaderEntryBase<isLazy, Data>
}

/**
 * Generates the type for a `Ref` of a data loader based on the value of `lazy`.
 * @internal
 */
export type _DataMaybeLazy<Data, isLazy extends boolean = boolean> =
  // no lazy provided, default value is false
  boolean extends isLazy ? Data : true extends isLazy ? Data | undefined : Data

/**
 * Return value of a loader composable defined with `defineLoader()`.
 */
export interface UseDataLoaderResult<
  isLazy extends boolean = boolean,
  Data = unknown
> {
  /**
   * Data returned by the loader. If the data loader is lazy, it will be undefined until the first load.
   */
  data: Ref<UnwrapRef<_DataMaybeLazy<Data, isLazy>>>

  /**
   * Whether there is an ongoing request.
   */
  pending: Ref<boolean>

  /**
   * Error if there was an error.
   */
  error: ShallowRef<any> // any is simply more convenient for errors

  /**
   * Refresh the data using the current route location. Returns a promise that resolves when the data is refreshed. This
   * method should not be called during a navigation as it can conflict with an ongoing load and lead to
   * inconsistencies.
   */
  refresh(): Promise<void>
  /**
   * Refresh the data using the route location passed as argument. Returns a promise that resolves when the data is refreshed.
   *
   * @param route - route location to refresh the data for
   */
  refresh(route: RouteLocationNormalizedLoaded): Promise<void>
}

function _testing() {
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

/**
 * Loader function that can be passed to `defineLoader()`.
 */
export interface DefineLoaderFn<
  P extends Promise<unknown>,
  Context extends DataLoaderContextBase = DataLoaderContextBase,
  Route = RouteLocationNormalizedLoaded
> {
  (route: Route, context: Context): P
}
