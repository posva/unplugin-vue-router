import { EffectScope, ref, ToRefs, effectScope, Ref, UnwrapRef } from 'vue'
import {
  LocationQuery,
  RouteParams,
  Router,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import { DefineLoaderOptions } from './defineLoader'

/**
 * `DataLoaderEntry` groups all of the properties that can be relied on by the data fetching guard. Any extended loader
 * should implement this interface. Each loaders has their own set of entries attached to an app instance.
 */
export interface DataLoaderEntry<T = unknown, isLazy = boolean> {
  /**
   * When was the data loaded in ms (Date.now()).
   * @internal
   */
  when: number

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
  children: Set<DataLoaderEntry>

  /**
   * Whether there is an ongoing request.
   */
  pending: Ref<boolean>

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
  data: false extends isLazy ? Ref<UnwrapRef<T>> : Ref<UnwrapRef<T> | undefined>
}

export function isCacheExpired(
  entry: DataLoaderEntry,
  options: Required<DefineLoaderOptions>
): boolean {
  const { cacheTime } = options
  return (
    // cacheTime == 0 means no cache
    !cacheTime ||
    // did we hit the expiration time
    Date.now() - entry.when >= cacheTime ||
    Array.from(entry.children).some((childEntry) =>
      isCacheExpired(childEntry, options)
    )
  )
}

export function createDataCacheEntry<T, isLazy extends boolean = boolean>(
  options: Required<DefineLoaderOptions<isLazy>>,
  initialData?: T
): DataLoaderEntry<T, isLazy> {
  return withinScope<DataLoaderEntry<T, isLazy>>(() => ({
    pending: ref(false),
    error: ref<any>(),
    // set to 0 to when there is an initialData so the next request will always trigger the data loaders
    when: initialData === undefined ? Date.now() : 0,
    children: new Set(),
    // @ts-expect-error: data always start as empty
    data: ref(initialData),
    params: {},
    query: {},
    // hash: null,
    isReady: false,
    // this was just too annoying to type
  }))
}

export function updateDataCacheEntry<T>(
  entry: DataLoaderEntry<T>,
  data: T,
  params: Partial<RouteParams>,
  query: Partial<LocationQuery>,
  hash: { v: string | null }
) {
  entry.when = Date.now()
  entry.params = params
  entry.query = query
  entry.hash = hash.v
  entry.isReady = true
  // @ts-expect-error: unwrapping magic
  entry.data.value = data
}

// local scope

export let scope: EffectScope | undefined

export function withinScope<T>(fn: () => T): T {
  return (scope = scope || effectScope(true)).run(fn)!
}

/**
 * Stop and invalidate the scope used for data. Note this will make any application stop working. It should be used only
 * if there is a need to manually stop a running application without stopping the process.
 */
export function stopScope() {
  if (scope) {
    scope.stop()
    scope = undefined
  }
}

export let currentContext:
  | [DataLoaderEntry, Router, RouteLocationNormalizedLoaded]
  | undefined
  | null

export function getCurrentContext() {
  return currentContext || ([] as const)
}
export function setCurrentContext(context: typeof currentContext) {
  currentContext = context
}

export function withLoaderContext<P extends Promise<any>>(promise: P): P {
  const context = currentContext
  return promise.finally(() => (currentContext = context)) as P
}
