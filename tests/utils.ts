import { vi } from 'vitest'
import type { NavigationResult } from '../src/data-fetching_new/navigation-guard'
import {
  type DefineDataLoaderOptions,
  defineBasicLoader,
} from '../src/data-fetching_new/defineLoader'

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export function mockPromise<Resolved, Err>(resolved: Resolved, rejected?: Err) {
  let _resolve: null | ((resolvedValue: Resolved) => void) = null
  let _reject: null | ((rejectedValue?: Err) => void) = null
  function resolve(resolvedValue?: Resolved) {
    if (!_resolve || !promise)
      throw new Error('Resolve called with no active promise')
    _resolve(resolvedValue ?? resolved)
    _resolve = null
    _reject = null
    promise = null
  }
  function reject(rejectedValue?: Err) {
    if (!_reject || !promise)
      throw new Error('Resolve called with no active promise')
    _reject(rejectedValue ?? rejected)
    _resolve = null
    _reject = null
    promise = null
  }

  let promise: Promise<Resolved> | null = null
  const spy = vi.fn<unknown[], Promise<Resolved>>().mockImplementation(() => {
    return (promise = new Promise<Resolved>((res, rej) => {
      _resolve = res
      _reject = rej
    }))
  })

  return [spy, resolve, reject] as const
}

export function mockedLoader<T = string | NavigationResult>(
  // boolean is easier to handle for router mock
  options?: DefineDataLoaderOptions<boolean>
) {
  const [spy, resolve, reject] = mockPromise<T, unknown>(
    // not correct as T could be something else
    'ok' as T,
    new Error('ko')
  )
  return {
    spy,
    resolve,
    reject,
    loader: defineBasicLoader(async () => await spy(), options),
  }
}
