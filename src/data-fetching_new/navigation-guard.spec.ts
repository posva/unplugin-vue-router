/**
 * @vitest-environment happy-dom
 */
import { App, Ref, defineComponent, shallowRef } from 'vue'
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
import { setCurrentContext } from './utils'
import { mount } from '@vue/test-utils'
import { getRouter } from 'vue-router-mock'
import { setupRouter } from './navigation-guard'
import { UseDataLoader } from './createDataLoader'
import { mockPromise } from '~/tests/utils'
import { LOADER_SET_KEY } from './symbols'
import {
  useData,
  useOtherData,
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
    expect([...set!]).toEqual([useData, useOtherData])
  })
})
