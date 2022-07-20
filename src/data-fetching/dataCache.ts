import { EffectScope, ref, ToRefs, effectScope, Ref, unref } from 'vue'

export interface DataLoaderCacheEntry<T> {
  /**
   * load key associated with a navigation.
   * @internal
   */
  key: symbol

  /**
   * When was the data loaded in ms (Date.now()).
   * @internal
   */
  when: number

  /**
   * Data stored in the cache.
   */
  data: ToRefs<T>

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

export function createDataCacheEntry<T>(
  loadKey: symbol,
  data: T
): DataLoaderCacheEntry<T> {
  return withinScope(() => ({
    pending: ref(false),
    error: ref<any>(),
    key: loadKey,
    when: Date.now(),
    data: refsFromObject(data),
  }))
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

export function transferData<T>(entry: DataLoaderCacheEntry<T>, data: T) {
  for (const key in data) {
    entry.data[key].value =
      // user can pass in a ref, but we want to make sure we only get the data out of it
      unref(data[key])
  }
}

export let scope: EffectScope | undefined

export function withinScope<T>(fn: () => T): T {
  scope = scope || effectScope(true)

  return scope.run(fn)!
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
