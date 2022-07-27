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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function mockPromise<T, E>(resolved: T, rejected?: E) {
  let _resolve: null | ((resolvedValue: T) => void) = null
  let _reject: null | ((rejectedValue?: E) => void) = null
  function resolve(resolvedValue?: T) {
    if (!_resolve || !promise)
      throw new Error('Resolve called with no active promise')
    _resolve(resolvedValue ?? resolved)
    _resolve = null
    _reject = null
    promise = null
  }
  function reject(rejectedValue?: E) {
    if (!_reject || !promise)
      throw new Error('Resolve called with no active promise')
    _reject(rejectedValue ?? rejected)
    _resolve = null
    _reject = null
    promise = null
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

    it('can be lazy', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(
        async () => {
          return { user: await spy() }
        },
        { lazy: true }
      )
      expect(spy).not.toHaveBeenCalled()
      // await but non blocking
      await useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      const { data } = useLoader()
      resolve()
      await delay(0)
      expect(data.value).toEqual({ user: { name: 'edu' } })
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

      // cannot use a blocking loader that isn't ready
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

    it('updates states when navigating', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(async () => {
        return { user: await spy() }
      })
      let p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      resolve()
      await p

      const { user, refresh, pending, error, invalidate } = useLoader()

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()
      invalidate()

      p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(2)
      expect(pending.value).toBe(true)

      resolve({ name: 'bob' })
      await p

      expect(pending.value).toBe(false)
      expect(user.value).toEqual({ name: 'bob' })
    })
  })

  // loads that get discarded due to new ones
  describe('discarded loads', () => {
    it('can be interrupted', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(
        async ({ params }) => {
          return { user: await spy() }
        },
        { cacheTime: 0 }
      )

      let p = useLoader._.load(route, router)
      // simulate a second navigation with a new route
      p = useLoader._.load({ ...route }, router)
      expect(spy).toHaveBeenCalledTimes(2)
      resolve({ name: 'bob' })
      await p
      const { user, refresh, pending, error } = useLoader()

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(user.value).toEqual({ name: 'bob' })
    })

    it('reuse loads within same navigation', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(
        async ({ params }) => {
          return { user: await spy() }
        },
        { cacheTime: 0 }
      )

      let p = useLoader._.load(route, router)
      // simulate a second navigation with a new route
      p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      resolve({ name: 'bob' })
      await p
      expect(spy).toHaveBeenCalledTimes(1)
      const { user, refresh, pending, error } = useLoader()

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(user.value).toEqual({ name: 'bob' })
    })

    it('ignores previous, slower fetch', async () => {
      // this will be resolved after
      let resolveSecond: (obj: any) => void
      const spy = vi.fn().mockImplementationOnce(() => {
        return new Promise((res, rej) => {
          resolveSecond = res
        })
      })
      const useLoader = defineLoader(async ({ params }) => {
        return { user: await spy(params.id) }
      })

      let p = useLoader._.load({ ...route, params: { id: 'edu' } }, router)

      // handle the second fetch
      let resolveFirst: (obj: any) => void
      spy.mockImplementationOnce(() => {
        return new Promise((res, rej) => {
          resolveFirst = res
        })
      })
      // simulate a second navigation
      p = useLoader._.load({ ...route, params: { id: 'bob' } }, router)
      expect(spy).toHaveBeenCalledTimes(2)
      resolveFirst!({ name: 'bob' })
      resolveSecond!({ name: 'nope' })
      await p
      const { user, refresh, pending, error } = useLoader()

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(user.value).toEqual({ name: 'bob' })
    })

    it('skips loader if used params did not change', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(async ({ params, query }) => {
        return { user: await spy(params.id, query.other) }
      })

      await useLoader._.load({ ...route, params: { id: 'edu' } }, router)
      // same param as before
      await useLoader._.load({ ...route, params: { id: 'edu' } }, router)
      // other param changes
      await useLoader._.load(
        { ...route, params: { id: 'edu', other: 'new' } },
        router
      )
      await useLoader._.load(
        { ...route, params: { id: 'edu', other: 'newnew' } },
        router
      )
      // new unused query id
      await useLoader._.load(
        { ...route, params: { id: 'edu' }, query: { notused: 'hello' } },
        router
      )
      // remove the query
      await useLoader._.load(
        { ...route, params: { id: 'edu' }, query: {} },
        router
      )
      expect(spy).toHaveBeenCalledTimes(1)

      // new query id
      await useLoader._.load(
        { ...route, params: { id: 'edu' }, query: { other: 'hello' } },
        router
      )
      expect(spy).toHaveBeenCalledTimes(2)
      // change param
      await useLoader._.load(
        { ...route, params: { id: 'bob' }, query: { other: 'hello' } },
        router
      )
      expect(spy).toHaveBeenCalledTimes(3)
      // change query
      await useLoader._.load(
        { ...route, params: { id: 'bob' }, query: { other: 'new' } },
        router
      )
      expect(spy).toHaveBeenCalledTimes(4)
      // change both
      await useLoader._.load(
        { ...route, params: { id: 'new one' }, query: { other: 'new one' } },
        router
      )
      expect(spy).toHaveBeenCalledTimes(5)

      const { user, refresh, pending, error } = useLoader()

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(user.value).toEqual({ name: 'edu' })

      await refresh()
      expect(spy).toHaveBeenCalledTimes(6)
    })
  })

  it('sets errors on refresh', async () => {
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
    // refresh doesn't reject
    await expect(p).resolves.toBe(undefined)

    expect(pending.value).toBe(false)
    // old value
    expect(user.value).toEqual({ name: 'edu' })
    expect(error.value).toBe(e)

    p = refresh()
    expect(pending.value).toBe(true)
    expect(error.value).toBeFalsy()
    expect(user.value).toEqual({ name: 'edu' })

    resolve({ name: 'bob' })
    await p
    expect(pending.value).toBe(false)
    expect(error.value).toBeFalsy()
    expect(user.value).toEqual({ name: 'bob' })
  })

  it('sets errors on new navigations', async () => {
    const [spy, resolve, reject] = mockPromise({ name: 'edu' })
    const useLoader = defineLoader(
      async () => {
        return { user: await spy() }
      },
      { cacheTime: 0 }
    )
    let p = useLoader._.load(route, router)
    // we need to initially resolve once
    resolve()
    await p
    const { user, refresh, pending, error, invalidate } = useLoader()

    p = useLoader._.load(route, router)

    expect(pending.value).toBe(true)
    expect(error.value).toBeFalsy()
    // old value
    expect(user.value).toEqual({ name: 'edu' })

    const e = new Error()
    reject(e)
    await expect(p).rejects.toBe(e)

    expect(pending.value).toBe(false)
    // old value
    expect(user.value).toEqual({ name: 'edu' })
    expect(error.value).toBe(e)

    // it can be put into loading state again
    p = useLoader._.load(route, router)

    expect(pending.value).toBe(true)
    expect(error.value).toBeFalsy()
    // old value
    expect(user.value).toEqual({ name: 'edu' })
    resolve({ name: 'bob' })
    await p

    expect(pending.value).toBe(false)
    // old value
    expect(user.value).toEqual({ name: 'bob' })
    expect(error.value).toBeFalsy()
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

  async function loaderUser() {
    const user = {
      id: 'one',
      name: 'Edu',
    }

    return { user }
  }

  expectType<{ data: Ref<{ user: UserData }> }>(
    defineLoader(loaderUser, { lazy: true })()
  )
  expectType<{ user: Ref<UserData> }>(
    defineLoader(loaderUser, { cacheTime: 20000 })()
  )
  expectType<{ user: Ref<UserData> }>(
    defineLoader(loaderUser, { cacheTime: 20000, lazy: false })()
  )
  expectType<{ user: Ref<UserData> }>(
    defineLoader(loaderUser, { lazy: false })()
  )
})
