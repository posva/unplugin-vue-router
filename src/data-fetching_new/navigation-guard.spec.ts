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
import { setupRouter } from './navigation-guard'
import { mockPromise } from '~/tests/utils'
import { LOADER_SET_KEY } from './symbols'
import {
  useDataOne,
  useDataTwo,
} from '~/tests/data-loaders/ComponentWithLoader.vue'

describe('navigation-guard', () => {
  let removeGuards = () => {}
  beforeEach(() => {
    removeGuards()
    removeGuards = setupRouter(getRouter())
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

  function mockedLoader<isLazy extends boolean>(
    options?: DefineDataLoaderOptions<isLazy>
  ) {
    const [spy, resolve, reject] = mockPromise('ok', 'ko')
    return {
      spy,
      resolve,
      reject,
      loader: defineLoader(async () => await spy(), options),
    }
  }

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
    const l2 = mockedLoader({ lazy: true })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [
          // @ts-expect-error: FIXME: ???
          l1.loader,
          // @ts-expect-error: FIXME: ???
          l2.loader,
          // defineLoader(async () => {}, { lazy: true }),
        ],
      },
    })

    const p = router.push('/fetch')
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).toBe('/fetch')
    l1.resolve()
    l2.resolve()
    await vi.runAllTimersAsync()
    expect(router.currentRoute.value.path).toBe('/fetch')
  })
})
