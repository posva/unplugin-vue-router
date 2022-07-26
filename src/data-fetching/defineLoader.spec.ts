import {
  Router,
  useRoute,
  useRouter,
  RouteLocationNormalizedLoaded,
  // @ts-expect-error: mocked
  resetRouter,
  // @ts-expect-error: mocked
  resetRoute,
} from 'vue-router'
import { Ref, shallowRef } from 'vue'
import { defineLoader } from './defineLoader'
import { expectType } from 'ts-expect'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', async () => {
  const { createRouter, createMemoryHistory, START_LOCATION, ...rest } =
    await vi.importActual('vue-router')

  let route: RouteLocationNormalizedLoaded = { ...START_LOCATION }

  let router = createRouter({
    history: createMemoryHistory(),
    routes: [],
  })
  return {
    ...rest,
    useRoute: () => route,
    useRouter: () => router,
    resetRoute: () => {
      route = { ...START_LOCATION }
    },
    resetRouter: () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [],
      })
    },
  }
})

function mockPromise<T, E>(resolved: T, rejected?: E) {
  let _resolve: null | ((resolvedValue: T) => void) = null
  let _reject: null | ((rejectedValue?: E) => void) = null
  function resolve(resolvedValue?: T) {
    if (!_resolve || !promise)
      throw new Error('Resolve called with no active promise')
    _resolve(resolvedValue ?? resolved)
    const p = promise
    _resolve = null
    _reject = null
    promise = null
    return p
  }
  function reject(rejectedValue?: E) {
    if (!_reject || !promise)
      throw new Error('Resolve called with no active promise')
    _reject(rejectedValue ?? rejected)
    const p = promise
    _resolve = null
    _reject = null
    promise = null
    return p
  }

  let promise: Promise<T> | null = null
  const spy = vi.fn<any[], Promise<T>>().mockImplementation(() => {
    return (promise = new Promise<T>((res, rej) => {
      _resolve = res
      _reject = rej
    }))
  })

  return [spy, resolve, reject] as const
}

describe('defineLoader', () => {
  let router!: Router
  let route!: RouteLocationNormalizedLoaded
  beforeEach(() => {
    resetRoute()
    resetRouter()
    router = useRouter()
    route = useRoute()
  })

  describe('initial fetch', () => {
    it('sets the value', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(async () => {
        return { user: await spy() }
      })
      expect(spy).not.toHaveBeenCalled()
      await useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      const { user } = useLoader()
      expect(user.value).toEqual({ name: 'edu' })
    })

    it('rejects failed initial load', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(async () => {
        return { user: await spy() }
      })
      let p = useLoader._.load(route, router)
      // we need to initially resolve once
      const e = new Error()
      reject(e)
      await expect(p).rejects.toBe(e)

      expect(() => useLoader()).toThrow()
    })

    it('can be refreshed and awaited', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(async () => {
        return { user: await spy() }
      })
      expect(spy).not.toHaveBeenCalled()
      let p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      resolve()
      await p
      const { user, refresh, pending, error } = useLoader()

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()

      p = refresh()

      expect(spy).toHaveBeenCalledTimes(2)
      expect(pending.value).toBe(true)
      expect(user.value).toEqual({ name: 'edu' })

      resolve({ name: 'bob' })
      await p

      expect(pending.value).toBe(false)
      expect(user.value).toEqual({ name: 'bob' })
    })
  })

  it('can be interrupted', async () => {
    const [spy, resolve, reject] = mockPromise({ name: 'edu' })
    const useLoader = defineLoader(async ({ params }) => {
      return { user: await spy(params.id) }
    })

    let p = useLoader._.load({ ...route, params: { id: 'edu' } }, router)
    // simulate a second navigation
    p = useLoader._.load({ ...route, params: { id: 'bob' } }, router)
    expect(spy).toHaveBeenCalledTimes(2)
    resolve({ name: 'bob' })
    await p
    const { user, refresh, pending, error } = useLoader()

    expect(pending.value).toBe(false)
    expect(error.value).toBeFalsy()
    expect(user.value).toEqual({ name: 'bob' })
  })

  it.todo('sets errors', async () => {
    const [spy, resolve, reject] = mockPromise({ name: 'edu' })
    const useLoader = defineLoader(async () => {
      return { user: await spy() }
    })
    let p = useLoader._.load(route, router)
    // we need to initially resolve once
    resolve()
    await p
    const { user, refresh, pending, error } = useLoader()

    p = refresh()

    expect(pending.value).toBe(true)
    expect(error.value).toBeFalsy()
    expect(user.value).toEqual({ name: 'edu' })

    const e = new Error()
    reject(e)
    await expect(p).resolves

    expect(error.value).toBe(e)
    expect(pending.value).toBe(false)
    // old value
    expect(user.value).toEqual({ name: 'edu' })
  })
})

// dts testing
function dts(_fn: () => any) {}

dts(async () => {
  const route = useRoute()
  const router = useRouter()

  interface UserData {
    id: string
    name: string
  }

  const useDataLoader = defineLoader(async (route) => {
    const user = {
      id: route.params.id as string,
      name: 'Edu',
    }

    return { user }
  })

  const { user, error, pending } = useDataLoader()

  expectType<{
    user: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useDataLoader())

  const useWithRef = defineLoader(async (route) => {
    const user = shallowRef({
      id: route.params.id as string,
      name: 'Edu',
    })

    return { user }
  })

  expectType<{
    user: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useWithRef())
})
