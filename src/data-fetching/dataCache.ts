import { EffectScope, ref, ToRefs, effectScope, Ref, UnwrapRef } from 'vue'
import {
  LocationQuery,
  RouteParams,
  Router,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import { DefineLoaderOptions } from './defineLoader'

export interface DataLoaderCacheEntry<T = unknown, isLazy = boolean> {
  /**
   * When was the data loaded in ms (Date.now()).
   * @internal
   */
  when: number

  params: Partial<RouteParams>
  query: Partial<LocationQuery>
  hash: string | null
  loaders: Set<DataLoaderCacheEntry>

  /**
   * Whether there is an ongoing request.
   */
  pending: Ref<boolean>

  // TODO: allow delaying pending? maybe

  /**
   * Error if there was an error.
   */
  error: Ref<any> // any is simply more convenient for errors

  isReady: boolean

  /**
   * Data stored in the cache.
   */
  data: false extends isLazy ? Ref<UnwrapRef<T>> : Ref<UnwrapRef<T> | undefined>
}

export function isCacheExpired(
  entry: DataLoaderCacheEntry,
  options: Required<DefineLoaderOptions>
): boolean {
  const { cacheTime } = options
  return (
    // cacheTime == 0 means no cache
    !cacheTime ||
    // did we hit the expiration time
    Date.now() - entry.when >= cacheTime ||
    Array.from(entry.loaders).some((childEntry) =>
      isCacheExpired(childEntry, options)
    )
  )
}

export function createDataCacheEntry<T, isLazy extends boolean = boolean>(
  options: Required<DefineLoaderOptions<isLazy>>
): DataLoaderCacheEntry<T, isLazy> {
  return withinScope<DataLoaderCacheEntry<T, isLazy>>(() => ({
    pending: ref(false),
    error: ref<any>(),
    when: Date.now(),
    loaders: new Set(),
    // @ts-expect-error: data always start as empty
    data: ref(),
    params: {},
    query: {},
    // hash: null,
    isReady: false,
    // this was just too annoying to type
  }))
}

export function updateDataCacheEntry<T>(
  entry: DataLoaderCacheEntry<T>,
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

function refsFromObject<T>(data: T): ToRefs<T> {
  const result = {} as ToRefs<T>
  for (const key in data) {
    // @ts-expect-error: the key is good
    result[key] =
      // to type check this line
      ref(data[key])
  }

  return result
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
  | [DataLoaderCacheEntry, Router, RouteLocationNormalizedLoaded]
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
