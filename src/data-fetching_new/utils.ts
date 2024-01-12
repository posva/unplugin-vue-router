import type { DataLoaderEntryBase, UseDataLoader } from './createDataLoader'
import { IS_USE_DATA_LOADER_KEY } from './meta-extensions'
import { type _Router } from '../type-extensions/router'
import { type _RouteLocationNormalizedLoaded } from '../type-extensions/routeLocation'

/**
 * Check if a value is a `DataLoader`.
 *
 * @param loader - the object to check
 */
export function isDataLoader(loader: any): loader is UseDataLoader {
  return loader && loader[IS_USE_DATA_LOADER_KEY]
}

export let currentContext:
  | readonly [
      entry: DataLoaderEntryBase,
      router: _Router,
      route: _RouteLocationNormalizedLoaded
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
export type _PromiseMerged<PromiseType, RawType = PromiseType> = RawType &
  Promise<PromiseType>

export const IS_CLIENT = typeof window !== 'undefined'

export const assign = Object.assign

/**
 * @internal
 */
export type _MaybePromise<T> = T | Promise<T>
