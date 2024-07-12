import { type ShallowRef } from 'vue'
import type { IS_USE_DATA_LOADER_KEY, STAGED_NO_VALUE } from './meta-extensions'
import { type _PromiseMerged } from './utils'
import { type NavigationResult } from './navigation-guard'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { type _Awaitable } from '../utils'

/**
 * Base type for a data loader entry. Each Data Loader has its own entry in the `loaderEntries` (accessible via `[LOADER_ENTRIES_KEY]`) map.
 */
export interface DataLoaderEntryBase<
  isLazy extends boolean = boolean,
  Data = unknown,
> {
  /**
   * Data stored in the entry.
   */
  data: ShallowRef<_DataMaybeLazy<Data, isLazy>>

  /**
   * Error if there was an error.
   */
  error: ShallowRef<any> // any is simply more convenient for errors

  /**
   * Location the data was loaded for or `null` if the data is not loaded.
   */
  to: RouteLocationNormalizedLoaded | null

  /**
   * Whether there is an ongoing request.
   */
  isLoading: ShallowRef<boolean>

  options: DefineDataLoaderOptionsBase<isLazy>

  /**
   * Called by the navigation guard when the navigation is duplicated. Should be used to reset pendingTo and pendingLoad and any other property that should be reset.
   */
  resetPending: () => void

  /**
   * The latest pending load. Allows to verify if the load is still valid when it resolves.
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

  /**
   * Error that was staged by a loader. This is used to avoid showing the old error while the new data is loading.
   * Calling the internal `commit()` function will replace the error with the staged error.
   */
  stagedError: any | null

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
  commit(to: RouteLocationNormalizedLoaded): void
}

export interface CreateDataLoaderOptions<
  Context extends DataLoaderContextBase,
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
  lazy?:
    | isLazy
    | ((
        to: RouteLocationNormalizedLoaded,
        from?: RouteLocationNormalizedLoaded
      ) => boolean)

  /**
   * Whether this loader should be awaited on the server side or not. Combined with the `lazy` option, this gives full
   * control over how to await for the data.
   *
   * @defaultValue `true`
   */
  server?: boolean

  /**
   * When the data should be committed to the entry. In the case of lazy loaders, the loader will try to commit the data
   * after all non-lazy loaders have finished loading, but it might not be able to if the lazy loader hasn't been
   * resolved yet.
   *
   * @see {@link DefineDataLoaderCommit}
   * @defaultValue `'after-load'`
   */
  commit?: DefineDataLoaderCommit

  /**
   * List of _expected_ errors that shouldn't abort the navigation (for non-lazy loaders). Provide a list of
   * constructors that can be checked with `instanceof`.
   */
  errors?: Array<new (...args: any) => any>
}

export const toLazyValue = (
  lazy:
    | boolean
    | undefined
    | ((
        to: RouteLocationNormalizedLoaded,
        from?: RouteLocationNormalizedLoaded
      ) => boolean),
  to: RouteLocationNormalizedLoaded,
  from?: RouteLocationNormalizedLoaded
) => (typeof lazy === 'function' ? lazy(to, from) : lazy)

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
  signal: AbortSignal | undefined
}

export interface DefineDataLoader<Context extends DataLoaderContextBase> {
  <isLazy extends boolean, Data>(
    fn: DefineLoaderFn<Data, Context>,
    options?: DefineDataLoaderOptionsBase<isLazy>
    // TODO: or a generic that allows a more complex UseDataLoader
  ): UseDataLoader<isLazy, Data>
}

// TODO: should be in each data loader. Refactor the base type to accept the needed generics

/**
 * Data Loader composable returned by `defineLoader()`.
 * @see {@link DefineDataLoader}
 */
export interface UseDataLoader<
  isLazy extends boolean = boolean,
  Data = unknown,
> {
  [IS_USE_DATA_LOADER_KEY]: true

  /**
   * Data Loader composable returned by `defineLoader()`.
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
    UseDataLoaderResult<isLazy, Exclude<Data, NavigationResult>>
  >

  /**
   * Internals of the data loader.
   * @internal
   */
  _: UseDataLoaderInternals<isLazy, Exclude<Data, NavigationResult>>
}

/**
 * Internal properties of a data loader composable. Used by the internal implementation of `defineLoader()`. **Should
 * not be used in application code.**
 */
export interface UseDataLoaderInternals<
  isLazy extends boolean = boolean,
  Data = unknown,
> {
  /**
   * Loads the data from the cache if possible, otherwise loads it from the loader and awaits it.
   *
   * @param to - route location to load the data for
   * @param router - router instance
   * @param from - route location we are coming from
   * @param parent - parent data loader entry
   */
  load: (
    to: RouteLocationNormalizedLoaded,
    router: Router,
    from?: RouteLocationNormalizedLoaded,
    parent?: DataLoaderEntryBase
  ) => Promise<void>

  /**
   * Resolved options for the loader.
   */
  options: DefineDataLoaderOptionsBase<isLazy>

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
  Data = unknown,
> {
  /**
   * Data returned by the loader. If the data loader is lazy, it will be undefined until the first load.
   */
  data: ShallowRef<_DataMaybeLazy<Data, isLazy>>

  /**
   * Whether there is an ongoing request.
   */
  isLoading: ShallowRef<boolean>

  /**
   * Error if there was an error.
   */
  error: ShallowRef<any> // any is simply more convenient for errors

  /**
   * Reload the data using the current route location. Returns a promise that resolves when the data is reloaded. This
   * method should not be called during a navigation as it can conflict with an ongoing load and lead to
   * inconsistencies.
   */
  reload(): Promise<void>
  /**
   * Reload the data using the route location passed as argument. Returns a promise that resolves when the data is reloaded.
   *
   * @param route - route location to load the data for
   */
  reload(route: RouteLocationNormalizedLoaded): Promise<void>
}

/**
 * Loader function that can be passed to `defineLoader()`.
 */
export interface DefineLoaderFn<
  Data,
  Context extends DataLoaderContextBase = DataLoaderContextBase,
  Route = RouteLocationNormalizedLoaded,
> {
  (route: Route, context: Context): Promise<Data>
}
