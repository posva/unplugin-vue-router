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

describe('defineLoader', () => {
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

  function singleLoaderOneRoute<Loader extends UseDataLoader>(useData: Loader) {
    const component = defineComponent({
      setup() {
        const { data, error, pending } = useData()
        return { data, error, pending }
      },
      template: `\
<div>
  <p id="route">{{ $route.path }}</p>
  <p id="data">{{ data }}</p>
  <p id="error">{{ error }}</p>
  <p id="pending">{{ pending }}</p>
</div>`,
    })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      meta: {
        loaders: [useData],
      },
      component,
    })

    const wrapper = mount(component)

    const app: App = wrapper.vm.$.appContext.app

    // forced to ensure similar running context to within a component
    setCurrentContext(undefined)
    const { data, pending, error, refresh } = app.runWithContext(() =>
      useData()
    )

    return {
      wrapper,
      router,
      useData: useData as Loader,
      app,
      refresh,
      data: data as Loader extends UseDataLoader<boolean, infer D>
        ? Ref<D>
        : never,
      pending,
      error,
    }
  }

  describe('Basic defineLoader', () => {
    it('sets the value during navigation', async () => {
      const spy = vi.fn<unknown[], string>().mockResolvedValueOnce('resolved')
      const { wrapper, data, router } = singleLoaderOneRoute(
        // TODO: should allow sync loaders too?
        defineLoader(async () => spy())
      )
      expect(spy).not.toHaveBeenCalled()
      await router.push('/fetch')
      expect(wrapper.get('#error').text()).toBe('')
      expect(wrapper.get('#pending').text()).toBe('false')
      expect(wrapper.get('#data').text()).toBe('resolved')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual('resolved')
    })

    it('blocks navigation by default', async () => {
      const [spy, resolve, reject] = mockPromise('resolved')
      const { data, router } = singleLoaderOneRoute(defineLoader(spy))
      const p = router.push('/fetch')
      await vi.runAllTimersAsync()
      expect(spy).toHaveBeenCalled()
      expect(data.value).toEqual(undefined)
      expect(router.currentRoute.value.fullPath).toEqual('/')
      resolve()
      await p
      expect(router.currentRoute.value.fullPath).toEqual('/fetch')
    })

    it('does not block navigation when lazy loaded', async () => {
      const [spy, resolve, reject] = mockPromise('resolved')
      const { wrapper, data, router } = singleLoaderOneRoute(
        defineLoader(async () => spy(), { lazy: true })
      )
      expect(spy).not.toHaveBeenCalled()
      await router.push('/fetch')
      expect(router.currentRoute.value.fullPath).toEqual('/fetch')
      expect(spy).toHaveBeenCalled()
      expect(wrapper.get('#error').text()).toBe('')
      expect(wrapper.get('#pending').text()).toBe('true')
      expect(wrapper.get('#data').text()).toBe('')
      expect(data.value).toEqual(undefined)
      resolve()
      await vi.runAllTimersAsync()
      expect(data.value).toEqual('resolved')
      expect(wrapper.get('#pending').text()).toBe('false')
      expect(wrapper.get('#data').text()).toBe('resolved')
    })

    it('should abort the navigation if the loader throws', async () => {
      const { wrapper, data, router } = singleLoaderOneRoute(
        defineLoader(async () => {
          throw new Error('nope')
        })
      )
      await router.push('/fetch')
      expect(wrapper.get('#error').text()).toBe('Error: nope')
      expect(wrapper.get('#pending').text()).toBe('false')
      expect(wrapper.get('#data').text()).toBe('')
      expect(data.value).toEqual(undefined)
    })

    it('can be forced refreshed', async () => {
      const spy = vi.fn<unknown[], string>().mockResolvedValueOnce('resolved 1')
      const { wrapper, data, router, refresh } = singleLoaderOneRoute(
        defineLoader(async () => spy())
      )
      await router.push('/fetch')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual('resolved 1')
      spy.mockResolvedValueOnce('resolved 2')
      await refresh()
      expect(spy).toHaveBeenCalledTimes(2)
      expect(data.value).toEqual('resolved 2')
    })

    it('discards a pending load if a new navigation happens', async () => {
      let calls = 0
      let resolveFirstCall!: (val: string) => void
      let resolveSecondCall!: (val: string) => void
      const p1 = new Promise((r) => (resolveFirstCall = r))
      const p2 = new Promise((r) => (resolveSecondCall = r))
      const { wrapper, data, router } = singleLoaderOneRoute(
        defineLoader((to) => {
          calls++
          if (calls === 1) {
            return p1
          } else {
            return p2
          }
        })
      )
      const firstNavigation = router.push('/fetch?one')
      // if we don't wait a little bit, the first navigation won't have the time to trigger the loader once
      await vi.runAllTimersAsync()
      const secondNavigation = router.push('/fetch?two')
      await vi.runAllTimersAsync()
      resolveSecondCall('ok')
      await secondNavigation
      expect(data.value).toEqual('ok')
      resolveFirstCall('ko')
      await firstNavigation
      expect(data.value).toEqual('ok')
    })

    it('should reuse a pending load within the same navigation', async () => {
      const spy = vi.fn<unknown[], string>().mockResolvedValueOnce('resolved')
      const { wrapper, data, router } = singleLoaderOneRoute(
        defineLoader(async () => spy())
      )
      await router.push('/fetch')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual('resolved')
      await router.push('/fetch')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual('resolved')
    })
  })
})
