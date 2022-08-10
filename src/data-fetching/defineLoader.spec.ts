import {
  Router,
  useRoute,
  useRouter,
  RouteLocationNormalizedLoaded,
  // @ts-expect-error: mocked
  resetRouter,
  // @ts-expect-error: mocked
  resetRoute,
  // @ts-expect-error: mocked
  _setRoute,
} from 'vue-router'
import { Ref, shallowRef } from 'vue'
import { defineLoader } from './defineLoader'
import { expectType } from 'ts-expect'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { setCurrentContext } from './dataCache'

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
    _setRoute: (newRoute: Partial<RouteLocationNormalizedLoaded>) =>
      (route = { ...route, ...newRoute }),
  }
})

const setRoute = _setRoute as (
  route: Partial<RouteLocationNormalizedLoaded>
) => RouteLocationNormalizedLoaded

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
    // invalidate current context
    setCurrentContext(undefined)
  })

  // we use fake timers to ensure debugging tests do not rely on timers
  const now = new Date(2000, 0, 1).getTime() // 1 Jan 2000 in local time as number of milliseconds
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('initial fetch', () => {
    it('sets the value', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(async () => {
        return spy()
      })
      expect(spy).not.toHaveBeenCalled()
      await useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      const { data: user } = useLoader()
      expect(user.value).toEqual({ name: 'edu' })
    })

    it('can be lazy', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(
        async () => {
          return spy()
        },
        { lazy: true }
      )
      expect(spy).not.toHaveBeenCalled()
      // await but non blocking
      await useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      const { data, pendingLoad } = useLoader()
      // still not there
      expect(data.value).toEqual(undefined)
      resolve()
      await pendingLoad()
      expect(data.value).toEqual({ name: 'edu' })
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
    })

    describe('sequential loading', () => {
      it('can call nested loaders', async () => {
        const spy = vi
          .fn<any[], Promise<{ name: string }>>()
          .mockResolvedValue({ name: 'edu' })
        const useOne = defineLoader(spy)
        const useLoader = defineLoader(async () => {
          const { data: user } = await useOne()
          return { user: user.value, local: user.value.name }
        })
        expect(spy).not.toHaveBeenCalled()
        await useLoader._.load(route, router)
        expect(spy).toHaveBeenCalledTimes(1)
        const { data } = useLoader()
        // even though we returned a ref
        expectType<{ name: string }>(data.value.user)
        expect(data.value.user).toEqual({ name: 'edu' })
      })

      it('can call deeply nested loaders', async () => {
        const one = vi
          .fn<any[], Promise<{ name: string }>>()
          .mockResolvedValue({ name: 'edu' })
        const useOne = defineLoader(one)
        const two = vi
          .fn<any[], Promise<{ name: string; local: string }>>()
          .mockImplementation(async () => {
            const { data: user } = await useOne()
            // force the type for the mock
            return {
              name: user.value.name,
              local: user.value.name,
            }
          })
        const useTwo = defineLoader(two)
        const useLoader = defineLoader(async () => {
          const { data: user } = await useOne()
          const { data: local } = await useTwo()
          return { user, local, when: Date.now() }
        })

        expect(one).not.toHaveBeenCalled()
        expect(two).not.toHaveBeenCalled()
        await useLoader._.load(route, router)
        expect(one).toHaveBeenCalledTimes(1)
        expect(two).toHaveBeenCalledTimes(1)
        const { data } = useLoader()
        expect(data.value.user).toEqual({ name: 'edu' })
      })

      it('only calls reused loaders once', async () => {
        const spy = vi
          .fn<any[], Promise<{ name: string }>>()
          .mockResolvedValue({ name: 'edu' })
        const useOne = defineLoader(spy)
        const useLoader = defineLoader(async () => {
          const { data: user } = await useOne()
          return { user, local: user.value.name }
        })

        let p = useLoader._.load(route, router)
        await useOne._.load(route, router)
        await p
        expect(spy).toHaveBeenCalledTimes(1)

        useOne().invalidate()
        useLoader().invalidate()

        // the reverse order
        await useOne._.load(route, router)
        p = useLoader._.load(route, router)
        expect(spy).toHaveBeenCalledTimes(2)
      })

      it('invalidated nested loaders invalidate a loader (by cache)', async () => {
        const spy = vi
          .fn<any[], Promise<{ name: string }>>()
          .mockResolvedValue({ name: 'edu' })
        const useOne = defineLoader(spy)
        const useLoader = defineLoader(async () => {
          const { data: user } = await useOne()
          return { user, local: user.value.name }
        })
        await useLoader._.load(route, router)
        const { refresh } = useLoader()
        const { invalidate } = useOne()
        expect(spy).toHaveBeenCalledTimes(1)
        invalidate() // the child
        await refresh() // the parent
        expect(spy).toHaveBeenCalledTimes(2)
      })

      it('invalidated nested loaders invalidate a loader (by route params)', async () => {
        const spy = vi
          .fn<any[], Promise<{ name: string }>>()
          .mockImplementation(async (route: RouteLocationNormalizedLoaded) => ({
            name: route.params.id as string,
          }))
        const useOne = defineLoader(spy)
        const useLoader = defineLoader(async () => {
          const { data: user } = await useOne()
          return { user, local: user.value.name }
        })
        await useLoader._.load(setRoute({ params: { id: 'edu' } }), router)
        expect(spy).toHaveBeenCalledTimes(1)
        // same id
        await useLoader._.load(setRoute({ params: { id: 'edu' } }), router)
        expect(spy).toHaveBeenCalledTimes(1)
        // same id
        await useLoader._.load(setRoute({ params: { id: 'bob' } }), router)
        expect(spy).toHaveBeenCalledTimes(2)
      })

      it('nested loaders changes propagate to parent', async () => {
        const spy = vi
          .fn<any[], Promise<{ name: string }>>()
          .mockResolvedValue({ name: 'edu' })
        const useOne = defineLoader(spy)
        const useLoader = defineLoader(async () => {
          const { data: user } = await useOne()
          return { user, local: user.value.name }
        })
        await useLoader._.load(route, router)
        const { data } = useLoader()
        const { invalidate, refresh, data: userFromOne } = useOne()
        expect(data.value).toEqual({ local: 'edu', user: { name: 'edu' } })
        expect(userFromOne.value).toEqual({ name: 'edu' })
        spy.mockResolvedValueOnce({ name: 'bob' })
        invalidate()
        await refresh()
        expect(data.value.user).toEqual({ name: 'bob' })
        // old value because we only refreshed the parent
        expect(data.value.local).toEqual('edu')
        expect(userFromOne.value).toEqual({ name: 'bob' })
      })

      it('tracks cached nested loaders', async () => {
        const spy = vi
          .fn<[RouteLocationNormalizedLoaded], Promise<{ name: string }>>()
          .mockImplementation(async (route) => ({
            name: route.params.id as string,
          }))
        const useOne = defineLoader(spy)
        const useLoader = defineLoader(async () => {
          const { data: user } = await useOne()
          return { local: user.value.name }
        })

        // start the useOne first
        let pOne = useOne._.load(route, router)
        let p = useLoader._.load(route, router)
        await p
        expect(spy).toHaveBeenCalledTimes(1)

        useOne().invalidate()

        p = useLoader._.load(route, router)
        expect(spy).toHaveBeenCalledTimes(2)
      })
    })

    it('can be refreshed and awaited', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(async () => {
        return spy()
      })
      expect(spy).not.toHaveBeenCalled()
      let p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      resolve()
      await p
      const { data: user, refresh, pending, error } = useLoader()

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
        return spy()
      })
      let p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      resolve()
      await p

      const { data: user, refresh, pending, error, invalidate } = useLoader()

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
          return spy()
        },
        { cacheTime: 0 }
      )

      let p = useLoader._.load(route, router)
      // simulate a second navigation with a new route
      p = useLoader._.load({ ...route }, router)
      expect(spy).toHaveBeenCalledTimes(2)
      resolve({ name: 'bob' })
      await p
      const { data: user, refresh, pending, error } = useLoader()

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(user.value).toEqual({ name: 'bob' })
    })

    it('reuse loads within same navigation', async () => {
      const [spy, resolve, reject] = mockPromise({ name: 'edu' })
      const useLoader = defineLoader(
        async ({ params }) => {
          return spy()
        },
        // force a no cache policy
        { cacheTime: 0 }
      )

      let p = useLoader._.load(route, router)
      // simulate a second navigation with a new route
      p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      resolve({ name: 'bob' })
      await p
      expect(spy).toHaveBeenCalledTimes(1)
      const { data: user, refresh, pending, error } = useLoader()

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
        return spy(params.id)
      })

      let p = useLoader._.load(setRoute({ params: { id: 'edu' } }), router)

      // handle the second fetch
      let resolveFirst: (obj: any) => void
      spy.mockImplementationOnce(() => {
        return new Promise((res, rej) => {
          resolveFirst = res
        })
      })
      // simulate a second navigation
      p = useLoader._.load(setRoute({ params: { id: 'bob' } }), router)
      expect(spy).toHaveBeenCalledTimes(2)
      resolveFirst!({ name: 'bob' })
      resolveSecond!({ name: 'nope' })
      await p
      const { data: user, refresh, pending, error } = useLoader()

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(user.value).toEqual({ name: 'bob' })
    })

    it('skips loader if used params/query/hash did not change', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(async ({ params, query }) => {
        return spy(params.id, query.other)
      })

      await useLoader._.load(setRoute({ params: { id: 'edu' } }), router)
      // same param as before
      await useLoader._.load(setRoute({ params: { id: 'edu' } }), router)
      // other param changes
      await useLoader._.load(
        setRoute({ params: { id: 'edu', other: 'new' } }),
        router
      )
      await useLoader._.load(
        setRoute({ params: { id: 'edu', other: 'newnew' } }),
        router
      )
      // new unused query id
      await useLoader._.load(
        setRoute({ params: { id: 'edu' }, query: { notused: 'hello' } }),
        router
      )
      // remove the query
      await useLoader._.load(
        setRoute({ params: { id: 'edu' }, query: {} }),
        router
      )
      expect(spy).toHaveBeenCalledTimes(1)

      // new query id
      await useLoader._.load(
        setRoute({ params: { id: 'edu' }, query: { other: 'hello' } }),
        router
      )
      expect(spy).toHaveBeenCalledTimes(2)
      // change param
      await useLoader._.load(
        setRoute({ params: { id: 'bob' }, query: { other: 'hello' } }),
        router
      )
      expect(spy).toHaveBeenCalledTimes(3)
      // change query
      await useLoader._.load(
        setRoute({ params: { id: 'bob' }, query: { other: 'new' } }),
        router
      )
      expect(spy).toHaveBeenCalledTimes(4)
      // change both
      await useLoader._.load(
        setRoute({ params: { id: 'new one' }, query: { other: 'new one' } }),
        router
      )
      expect(spy).toHaveBeenCalledTimes(5)

      const { refresh, pending, error, data: user } = useLoader()
      expect(spy).toHaveBeenCalledTimes(5)

      expect(pending.value).toBe(false)
      expect(error.value).toBeFalsy()
      expect(user.value).toEqual({ name: 'edu' })
    })

    it('skips loader if used hash did not change', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(async ({ params, query, hash }) => {
        return spy(hash)
      })

      await useLoader._.load(setRoute({ hash: '#one' }), router)
      // same param as before
      await useLoader._.load(setRoute({}), router)
      // new hash
      await useLoader._.load(setRoute({ hash: '' }), router)
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('skips nested loader if route is unused', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useOne = defineLoader(async () => {
        return spy()
      })

      const useLoader = defineLoader(async () => {
        const { data: user } = await useOne()
        return { name: user.value.name }
      })

      await useLoader._.load(setRoute({ hash: '#one' }), router)
      // same param as before
      await useLoader._.load(setRoute({}), router)
      // new hash
      await useLoader._.load(setRoute({ hash: '' }), router)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('reloads if lazy loader is called with different params', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(
        async ({ params, query }) => {
          return spy(params.id, query.other)
        },
        { lazy: true }
      )

      route.params.id = 'one'
      expect(spy).toHaveBeenCalledTimes(0)
      const { data, pendingLoad } = useLoader()
      expect(spy).toHaveBeenCalledTimes(1)
      await pendingLoad()
      expect(data.value).toEqual({ name: 'edu' })
      expect(spy).toHaveBeenCalledTimes(1)

      // simulate a navigation
      spy.mockResolvedValue({ name: 'bob' })
      await useLoader._.load(setRoute({ params: { id: 'two' } }), router)
      await pendingLoad()
      expect(spy).toHaveBeenCalledTimes(2)
      expect(data.value).toEqual({ name: 'bob' })
    })

    it('skips if lazy loader is called with same params', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(
        async ({ params, query }) => {
          return spy(params.id, query.other)
        },
        { lazy: true }
      )

      route.params.id = 'one'
      const { data, pendingLoad } = useLoader()
      await pendingLoad()

      // simulate a navigation
      spy.mockResolvedValue({ name: 'bob' })
      await useLoader._.load({ ...route }, router)
      await pendingLoad()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual({ name: 'edu' })
    })
  })

  it('sets errors on refresh', async () => {
    const [spy, resolve, reject] = mockPromise({ name: 'edu' })
    const useLoader = defineLoader(async () => {
      return spy()
    })
    let p = useLoader._.load(route, router)
    // we need to initially resolve once
    resolve()
    await p
    const { data: user, refresh, pending, error } = useLoader()
    // expect(error.value).toBeFalsy()
    // expect(pending.value).toBe(false)

    p = refresh()

    expect(pending.value).toBe(true)
    expect(error.value).toBeFalsy()
    expect(user.value).toEqual({ name: 'edu' })

    const e = new Error()
    reject(e)
    // refresh doesn't reject
    await expect(p).resolves.toBe(undefined)

    expect(error.value).toBe(e)
    expect(pending.value).toBe(false)
    // old value
    expect(user.value).toEqual({ name: 'edu' })

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
        return spy()
      },
      { cacheTime: 0 }
    )
    let p = useLoader._.load(route, router)
    // we need to initially resolve once
    resolve()
    await p
    const { data: user, refresh, pending, error, invalidate } = useLoader()

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

  describe('cache', () => {
    it('waits for cache expiration', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(
        async () => {
          return { user: await spy() }
        },
        { cacheTime: 1000 }
      )
      expect(spy).toHaveBeenCalledTimes(0)
      // do one initial load
      let p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
      await p

      vi.setSystemTime(now + 999)
      p = useLoader._.load(route, router)
      // used the cache
      expect(spy).toHaveBeenCalledTimes(1)
      await p

      vi.setSystemTime(now + 1000) // hit expiration time
      p = useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(2)
      await p

      // hits cache again
      vi.setSystemTime(now + 1999)
      p = useLoader._.load(route, router)
      // used the cache
      expect(spy).toHaveBeenCalledTimes(2)
      await p

      // hit expiration time again
      vi.setSystemTime(now + 2000)
      p = useLoader._.load(route, router)
      // used the cache
      expect(spy).toHaveBeenCalledTimes(3)
      await p
    })

    it('can have no cache', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(
        async () => {
          return { user: await spy() }
        },
        { cacheTime: 0 }
      )
      expect(spy).toHaveBeenCalledTimes(0)
      // do one initial load
      await useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)

      await useLoader._.load(route, router)
      // used the cache
      expect(spy).toHaveBeenCalledTimes(2)

      await useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(3)
    })
  })

  describe('ssr initialState', () => {
    it('skips the load function if there is an initial state', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(spy, { key: 'id' })

      await useLoader._.load(route, router, undefined, { id: { name: 'edu' } })
      expect(spy).toHaveBeenCalledTimes(0)
    })

    it('always calls the loader after hydration', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(spy, { key: 'id' })

      await useLoader._.load(route, router, undefined, { id: { name: 'edu' } })
      await useLoader._.load(route, router)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('calls the loader with refresh', async () => {
      const spy = vi.fn().mockResolvedValue({ name: 'edu' })
      const useLoader = defineLoader(spy, { key: 'id' })

      await useLoader._.load(route, router, undefined, { id: { name: 'edu' } })
      const { refresh } = useLoader()
      await refresh()
      expect(spy).toHaveBeenCalledTimes(1)
    })
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

    return user
  })

  const { data: user, error, pending } = useDataLoader()

  expectType<{
    data: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useDataLoader())

  const useWithRef = defineLoader(async (route) => {
    const user = shallowRef<UserData>({
      id: route.params.id as string,
      name: 'Edu',
    })

    return user
  })

  expectType<{
    data: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useWithRef())

  async function loaderUser() {
    const user = {
      id: 'one',
      name: 'Edu',
    }

    return user
  }

  expectType<{ data: Ref<UserData | undefined> }>(
    defineLoader(loaderUser, { lazy: true })()
  )
  expectType<{ data: Ref<UserData> }>(
    defineLoader(loaderUser, { cacheTime: 20000 })()
  )
  expectType<{ data: Ref<UserData> }>(
    defineLoader(loaderUser, { cacheTime: 20000, lazy: false })()
  )
  expectType<{ data: Ref<UserData> }>(
    defineLoader(loaderUser, { lazy: false })()
  )
})
