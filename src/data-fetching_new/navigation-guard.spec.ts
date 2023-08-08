/**
 * @vitest-environment happy-dom
 */
import { defineComponent } from 'vue'
import { DefineDataLoaderOptions, defineLoader } from './defineLoader'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { setCurrentContext } from './utils'
import { getRouter } from 'vue-router-mock'
import { setupLoaderGuard } from './navigation-guard'
import { mockPromise, mockedLoader } from '~/tests/utils'
import { LOADER_SET_KEY } from './symbols'
import {
  useDataOne,
  useDataTwo,
} from '~/tests/data-loaders/ComponentWithLoader.vue'
import * as _utils from '~/src/data-fetching_new/utils'

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
  let removeGuards = () => {}
  beforeEach(() => {
    // @ts-expect-error: normally not allowed
    _utils.IS_CLIENT = true
    removeGuards()
    removeGuards = setupLoaderGuard(getRouter())
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

  const component = defineComponent({})
  const loader1 = defineLoader(async () => {})
  const loader2 = defineLoader(async () => {})
  const loader3 = defineLoader(async () => {})
  const loader4 = defineLoader(async () => {})
  const loader5 = defineLoader(async () => {})

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

  it(' does not run loaders on server side if server: false', async () => {
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
})
