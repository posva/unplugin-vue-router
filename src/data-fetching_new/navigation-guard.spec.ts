/**
 * @vitest-environment happy-dom
 */
import { App, createApp, defineComponent } from 'vue'
import { defineBasicLoader } from './defineLoader'
import {
  Mock,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { setCurrentContext } from './utils'
import { getRouter } from 'vue-router-mock'
import { DataLoaderPlugin, NavigationResult } from './navigation-guard'
import { mockedLoader } from '~/tests/utils'
import { ABORT_CONTROLLER_KEY, LOADER_SET_KEY } from './symbols'
import {
  useDataOne,
  useDataTwo,
} from '~/tests/data-loaders/ComponentWithLoader.vue'
import * as _utils from '~/src/data-fetching_new/utils'
import type { NavigationFailure } from 'vue-router'

vi.mock(
  '~/src/data-fetching_new/utils.ts',
  async (
    importOriginal: () => Promise<
      typeof import('~/src/data-fetching_new/utils')
    >
  ) => {
    const mod = await importOriginal()

    // this allows the variable IS_CLIENT to be rewritten
    return {
      ...mod,
    }
  }
)

describe('navigation-guard', () => {
  let app: App | undefined
  let selectNavigationResult!: Mock
  beforeEach(() => {
    // @ts-expect-error: normally not allowed
    _utils.IS_CLIENT = true
    app = createApp({ render: () => null })
    selectNavigationResult = vi
      .fn()
      .mockImplementation((results) => results[0].value)
    app.use(DataLoaderPlugin, {
      router: getRouter(),
      selectNavigationResult,
    })
    // invalidate current context
    setCurrentContext(undefined)
  })

  afterEach(() => {
    if (app) {
      app.mount('body')
      app.unmount()
      app = undefined
    }
  })

  // enableAutoUnmount(afterEach)

  // we use fake timers to ensure debugging tests do not rely on timers
  const now = new Date(2000, 0, 1).getTime() // 1 Jan 2000 in local time as number of milliseconds
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  const component = defineComponent({})
  const loader1 = defineBasicLoader(async () => {})
  const loader2 = defineBasicLoader(async () => {})
  const loader3 = defineBasicLoader(async () => {})
  const loader4 = defineBasicLoader(async () => {})
  const loader5 = defineBasicLoader(async () => {})

  it('creates a set of loaders during navigation', async () => {
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
    })
    await router.push('/fetch')
    const set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect(set).toBeDefined()
    expect(set).toHaveLength(0)
  })

  it('collects loaders from the matched route', async () => {
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [loader1, loader1], // duplicated on purpose
      },
    })
    router.addRoute({
      name: '_test2',
      path: '/fetch2',
      component,
      meta: {
        loaders: [loader2, loader3],
      },
    })
    await router.push('/fetch')
    let set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect([...set!]).toEqual([loader1])
    await router.push('/fetch2')
    set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect([...set!]).toEqual([loader2, loader3])
  })

  it('collect loaders from nested routes', async () => {
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [loader1],
      },
      children: [
        {
          name: '_test2',
          path: 'nested',
          component,
          meta: {
            loaders: [loader2, loader3],
          },
        },
      ],
    })
    await router.push('/fetch/nested')
    const set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect([...set!]).toEqual([loader1, loader2, loader3])
  })

  it('collects all loaders from lazy loaded pages', async () => {
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: () => import('~/tests/data-loaders/ComponentWithLoader.vue'),
    })
    await router.push('/fetch')
    const set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect([...set!]).toEqual([useDataOne, useDataTwo])
  })

  it('awaits for all loaders to be resolved', async () => {
    const router = getRouter()
    const l1 = mockedLoader()
    const l2 = mockedLoader()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.runAllTimersAsync()
    l1.resolve()
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).not.toBe('/fetch')
    l2.resolve()
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).toBe('/fetch')
  })

  it('does not await for lazy loaders on client-side navigation', async () => {
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true })
    const l2 = mockedLoader({ lazy: false })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).not.toBe('/fetch')
    l2.resolve()
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).toBe('/fetch')
    l1.resolve()
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).toBe('/fetch')
  })

  it('awaits for lazy loaders on server-side navigation', async () => {
    // @ts-expect-error: normally not allowed
    _utils.IS_CLIENT = false
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true })
    const l2 = mockedLoader({ lazy: false })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).not.toBe('/fetch')
    l2.resolve()
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).not.toBe('/fetch')
    l1.resolve()
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).toBe('/fetch')
  })

  it('does not run loaders on server side if server: false', async () => {
    // @ts-expect-error: normally not allowed
    _utils.IS_CLIENT = false
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true, server: false })
    const l2 = mockedLoader({ lazy: false, server: false })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).toBe('/fetch')
    expect(l1.spy).not.toHaveBeenCalled()
    expect(l2.spy).not.toHaveBeenCalled()
  })

  it.each([true, false] as const)(
    'throws if a non lazy loader rejects, IS_CLIENT: %s',
    async (isClient) => {
      // @ts-expect-error: normally not allowed
      _utils.IS_CLIENT = isClient
      const router = getRouter()
      const l1 = mockedLoader({ lazy: false })
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader],
        },
      })

      const p = router.push('/fetch')
      await vi.runAllTimersAsync()
      l1.reject()
      await expect(p).rejects.toThrow('ko')
      expect(router.currentRoute.value.path).not.toBe('/fetch')
    }
  )

  it('does not throw if a lazy loader rejects', async () => {
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.runAllTimersAsync()
    l1.reject()
    await expect(p).resolves.toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/fetch')
  })

  it('throws if a lazy loader rejects on server-side', async () => {
    // @ts-expect-error: normally not allowed
    _utils.IS_CLIENT = false
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.runAllTimersAsync()
    l1.reject()
    await expect(p).rejects.toThrow('ko')
    expect(router.currentRoute.value.path).not.toBe('/fetch')
  })

  describe('signal', () => {
    it('aborts the signal if the navigation throws', async () => {
      const router = getRouter()

      router.setNextGuardReturn(new Error('canceled'))
      let signal!: AbortSignal
      router.beforeEach((to) => {
        signal = to.meta[ABORT_CONTROLLER_KEY]!.signal
      })

      await expect(router.push('/#other')).rejects.toThrow('canceled')

      expect(router.currentRoute.value.hash).not.toBe('#other')
      expect(signal.aborted).toBe(true)
      expect(signal.reason).toBeInstanceOf(Error)
      expect(signal.reason!.message).toBe('canceled')
    })

    it('aborts the signal if the navigation is canceled', async () => {
      const router = getRouter()

      router.setNextGuardReturn(false)
      let signal!: AbortSignal
      router.beforeEach((to) => {
        signal = to.meta[ABORT_CONTROLLER_KEY]!.signal
      })

      let reason: NavigationFailure | undefined | void
      router.afterEach((_to, _from, failure) => {
        reason = failure
      })

      await router.push('/#other')

      expect(router.currentRoute.value.hash).not.toBe('#other')
      expect(signal.aborted).toBe(true)
      expect(signal.reason).toBe(reason)
    })
  })

  describe('selectNavigationResult', () => {
    it('can change the navigation result within a loader', async () => {
      const router = getRouter()
      const l1 = mockedLoader()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader],
        },
      })

      router.push('/fetch')
      await vi.runOnlyPendingTimersAsync()
      l1.resolve(new NavigationResult('/#ok'))
      await router.getPendingNavigation()
      expect(router.currentRoute.value.fullPath).toBe('/#ok')
    })

    it('selectNavigationResult is called with an array of all the results returned by the loaders', async () => {
      const router = getRouter()
      const l1 = mockedLoader()
      const l2 = mockedLoader()
      const l3 = mockedLoader()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader, l2.loader, l3.loader],
        },
      })

      router.push('/fetch')
      await vi.runOnlyPendingTimersAsync()
      const r1 = new NavigationResult('/#ok')
      const r2 = new NavigationResult('/#ok2')
      l1.resolve(r1)
      l2.resolve('some data')
      l3.resolve(r2)
      await router.getPendingNavigation()
      expect(selectNavigationResult).toHaveBeenCalledTimes(1)
      expect(selectNavigationResult).toHaveBeenCalledWith([r1, r2])
    })

    it('can change the navigation result returned by multiple loaders', async () => {
      const router = getRouter()
      const l1 = mockedLoader()
      const l2 = mockedLoader()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader, l2.loader],
        },
      })

      selectNavigationResult.mockImplementation(() => true)
      router.push('/fetch')
      await vi.runOnlyPendingTimersAsync()
      const r1 = new NavigationResult('/#ok')
      const r2 = new NavigationResult('/#ok2')
      l1.resolve(r1)
      l2.resolve(r2)
      await router.getPendingNavigation()
      expect(router.currentRoute.value.fullPath).toBe('/fetch')
    })
  })
})
