import {
  EffectScope,
  ref,
  ToRefs,
  effectScope,
  Ref,
  unref,
  UnwrapRef,
} from 'vue'
import { LocationQuery, RouteParams } from 'vue-router'
import { DefineLoaderOptions } from './defineLoader'

export interface _DataLoaderCacheEntryBase {
  /**
   * When was the data loaded in ms (Date.now()).
   * @internal
   */
  when: number

  params: Partial<RouteParams>
  query: Partial<LocationQuery>

  /**
   * Whether there is an ongoing request.
   */
  pending: Ref<boolean>

  // TODO: allow delaying pending? maybe

  /**
   * Error if there was an error.
   */
  error: Ref<any> // any is simply more convenient for errors
}

export interface DataLoaderCacheEntryNonLazy<T = unknown>
  extends _DataLoaderCacheEntryBase {
  /**
   * Data stored in the cache.
   */
  data: ToRefs<T>
}

export interface DataLoaderCacheEntryLazy<T = unknown>
  extends _DataLoaderCacheEntryBase {
  /**
   * Data stored in the cache.
   */
  data: { data: Ref<UnwrapRef<T>> }
}

export type DataLoaderCacheEntry<T = unknown> =
  | DataLoaderCacheEntryNonLazy<T>
  | DataLoaderCacheEntryLazy<T>

export function isCacheExpired(
  entry: DataLoaderCacheEntry,
  { cacheTime }: Required<DefineLoaderOptions>
) {
  return !cacheTime || Date.now() - entry.when >= cacheTime
}

export function createOrUpdateDataCacheEntry<T>(
  entry: DataLoaderCacheEntry<T> | undefined,
  data: T,
  params: Partial<RouteParams>,
  query: Partial<LocationQuery>,
  { lazy }: Required<DefineLoaderOptions>
): DataLoaderCacheEntry<T> {
  if (!entry) {
    return withinScope(() => ({
      pending: ref(false),
      error: ref<any>(),
      when: Date.now(),
      data: lazy ? { data: ref<T>(data) } : refsFromObject(data),
      params,
      query,
      // this was just to annoying to type
    })) as DataLoaderCacheEntry<T>
  } else {
    entry.when = Date.now()
    entry.params = params
    entry.query = query
    if (lazy) {
      ;(entry as DataLoaderCacheEntryLazy<T>).data.data.value =
        data as UnwrapRef<T>
    } else {
      transferData(entry as DataLoaderCacheEntryNonLazy<T>, data)
    }
    return entry
  }
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

export function transferData<T>(
  entry: DataLoaderCacheEntryNonLazy<T>,
  data: T
) {
  for (const key in data) {
    entry.data[key].value =
      // user can pass in a ref, but we want to make sure we only get the data out of it
      unref(data[key])
  }
}

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
