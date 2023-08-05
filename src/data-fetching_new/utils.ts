import { EffectScope, effectScope } from 'vue'
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'
import type { DataLoaderEntryBase, UseDataLoader } from './createDataLoader'
import { IS_USE_DATA_LOADER_KEY } from './symbols'

/**
 * Check if a value is a `DataLoader`.
 *
 * @param loader - the object to check
 */
export function isDataLoader(loader: any): loader is UseDataLoader {
  return loader && loader[IS_USE_DATA_LOADER_KEY]
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
  | readonly [
      entry: DataLoaderEntryBase,
      router: Router,
      route: RouteLocationNormalizedLoaded
    ]
  | undefined
  | null

export function getCurrentContext() {
  // an empty array allows destructuring without checking if it's undefined
  return currentContext || ([] as const)
}

// TODO: rename parentContext
export function setCurrentContext(
  context: typeof currentContext | readonly []
) {
  currentContext = context ? (context.length ? context : null) : null
}

/**
 * Restore the current context after a promise is resolved.
 * @param promise - promise to wrap
 */
export function withLoaderContext<P extends Promise<unknown>>(promise: P): P {
  const context = currentContext
  return promise.finally(() => (currentContext = context)) as P
}

/**
 * Object and promise of the object itself. Used when we can await some of the properties of an object to be loaded.
 * @internal
 */
export type _PromiseMerged<T> = T & Promise<T>