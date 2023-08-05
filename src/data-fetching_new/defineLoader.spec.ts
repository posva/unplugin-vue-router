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
import RouterViewMock from '~/tests/data-loaders/RouterViewMock.vue'
import ComponentWithNestedLoader from '~/tests/data-loaders/ComponentWithNestedLoader.vue'
import {
  dataOneSpy,
  dataTwoSpy,
  useDataOne,
} from '~/tests/data-loaders/loaders'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

describe('defineLoader', () => {
  let removeGuards = () => {}
  beforeEach(() => {
    removeGuards()
    removeGuards = setupRouter(getRouter())
    // invalidate current context
    setCurrentContext(undefined)
    dataOneSpy.mockClear()
    dataTwoSpy.mockClear()
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
    let useDataResult: ReturnType<Loader>
    const component = defineComponent({
      setup() {
        // @ts-expect-error: wat?
        useDataResult = useData()

        const { data, error, pending } = useDataResult
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

    const wrapper = mount(RouterViewMock, {})

    const app: App = wrapper.vm.$.appContext.app

    return {
      wrapper,
      router,
      useData: () => {
        if (useDataResult) {
          return useDataResult
        }
        // forced to ensure similar running context to within a component
        // this is for tests that call useData() before the navigation is finished
        setCurrentContext(undefined)
        return app.runWithContext(() => useData()) as ReturnType<Loader>
      },
      app,
    }
  }

  describe('Basic defineLoader', () => {
    it('sets the value during navigation', async () => {
      const spy = vi
        .fn<unknown[], Promise<string>>()
        .mockResolvedValueOnce('resolved')
      const { wrapper, useData, router } = singleLoaderOneRoute(
        // TODO: should allow sync loaders too?
        defineLoader(async () => spy())
      )
      expect(spy).not.toHaveBeenCalled()
      await router.push('/fetch')
      expect(wrapper.get('#error').text()).toBe('')
      expect(wrapper.get('#pending').text()).toBe('false')
      expect(wrapper.get('#data').text()).toBe('resolved')
      expect(spy).toHaveBeenCalledTimes(1)
      const { data } = useData()
      expect(data.value).toEqual('resolved')
    })

    it('blocks navigation by default', async () => {
      const [spy, resolve, reject] = mockPromise('resolved')
      const { useData, router } = singleLoaderOneRoute(defineLoader(spy))
      const p = router.push('/fetch')
      await vi.runAllTimersAsync()
      expect(spy).toHaveBeenCalled()
      const { data } = useData()
      expect(data.value).toEqual(undefined)
      expect(router.currentRoute.value.fullPath).toEqual('/')
      resolve()
      await p
      expect(router.currentRoute.value.fullPath).toEqual('/fetch')
    })

    it('does not block navigation when lazy loaded', async () => {
      const [spy, resolve, reject] = mockPromise('resolved')
      const { wrapper, useData, router } = singleLoaderOneRoute(
        defineLoader(async () => spy(), { lazy: true })
      )
      expect(spy).not.toHaveBeenCalled()
      await router.push('/fetch')
      expect(router.currentRoute.value.fullPath).toEqual('/fetch')
      expect(spy).toHaveBeenCalled()
      expect(wrapper.get('#error').text()).toBe('')
      expect(wrapper.get('#pending').text()).toBe('true')
      expect(wrapper.get('#data').text()).toBe('')
      const { data } = useData()
      expect(data.value).toEqual(undefined)
      resolve()
      await vi.runAllTimersAsync()
      expect(data.value).toEqual('resolved')
      expect(wrapper.get('#pending').text()).toBe('false')
      expect(wrapper.get('#data').text()).toBe('resolved')
    })

    it('should abort the navigation if the loader throws', async () => {
      const { wrapper, useData, router } = singleLoaderOneRoute(
        defineLoader(async () => {
          throw new Error('nope')
        })
      )
      await router.push('/fetch')
      expect(wrapper.get('#error').text()).toBe('Error: nope')
      expect(wrapper.get('#pending').text()).toBe('false')
      expect(wrapper.get('#data').text()).toBe('')
      const { data } = useData()
      expect(data.value).toEqual(undefined)
    })

    it('can be forced refreshed', async () => {
      const spy = vi
        .fn<unknown[], Promise<string>>()
        .mockResolvedValueOnce('resolved 1')
      const { wrapper, router, useData } = singleLoaderOneRoute(
        defineLoader(async () => spy())
      )
      await router.push('/fetch')
      expect(spy).toHaveBeenCalledTimes(1)
      const { data, refresh } = useData()
      expect(data.value).toEqual('resolved 1')
      spy.mockResolvedValueOnce('resolved 2')
      await refresh()
      expect(spy).toHaveBeenCalledTimes(2)
      expect(data.value).toEqual('resolved 2')
      spy.mockResolvedValueOnce('resolved 3')
      await refresh()
      expect(spy).toHaveBeenCalledTimes(3)
      expect(data.value).toEqual('resolved 3')
    })

    it('discards a pending load if a new navigation happens', async () => {
      let calls = 0
      let resolveFirstCall!: (val?: unknown) => void
      let resolveSecondCall!: (val?: unknown) => void
      const p1 = new Promise((r) => (resolveFirstCall = r))
      const p2 = new Promise((r) => (resolveSecondCall = r))
      const { wrapper, useData, router } = singleLoaderOneRoute(
        defineLoader(async (to) => {
          calls++
          if (calls === 1) {
            await p1
          } else if (calls === 2) {
            await p2
          }
          return to.query.p
        })
      )
      const firstNavigation = router.push('/fetch?p=one')
      // if we don't wait a little bit, the first navigation won't have the time to trigger the loader once
      await vi.runAllTimersAsync()
      const secondNavigation = router.push('/fetch?p=two')
      await vi.runAllTimersAsync()
      resolveSecondCall()
      await secondNavigation
      const { data } = useData()
      expect(data.value).toEqual('two')
      resolveFirstCall('ko')
      await firstNavigation
      expect(data.value).toEqual('two')
      expect(calls).toEqual(2)
    })

    it('runs nested loaders from new navigations with the correct route', async () => {
      let nestedCalls = 0
      let resolveNestedFirstCall!: (val?: unknown) => void
      let resolveNestedSecondCall!: (val?: unknown) => void
      const nestedP1 = new Promise((r) => (resolveNestedFirstCall = r))
      const nestedP2 = new Promise((r) => (resolveNestedSecondCall = r))
      const nestedLoaderSpy = vi
        .fn<[to: RouteLocationNormalizedLoaded], Promise<unknown>>()
        .mockImplementation(async (to) => {
          nestedCalls++
          if (nestedCalls === 1) {
            await nestedP1
          } else {
            await nestedP2
          }
          return to.query.p
        })
      const useNestedLoader = defineLoader(nestedLoaderSpy, {
        key: 'nested',
      })

      let rootCalls = 0
      let resolveRootFirstCall!: (val?: unknown) => void
      let resolveRootSecondCall!: (val?: unknown) => void
      const rootP1 = new Promise((r) => (resolveRootFirstCall = r))
      const rootP2 = new Promise((r) => (resolveRootSecondCall = r))

      const rootLoaderSpy = vi
        .fn<[to: RouteLocationNormalizedLoaded], Promise<unknown>>()
        .mockImplementation(async (to) => {
          rootCalls++
          const { data } = await useNestedLoader()
          if (rootCalls === 1) {
            await rootP1
          } else {
            await rootP2
          }
          return `${data.value},${to.query.p}`
        })

      const { wrapper, useData, router, app } = singleLoaderOneRoute(
        defineLoader(rootLoaderSpy, { key: 'root' })
      )
      const firstNavigation = router.push('/fetch?p=one')
      // we resolve the first root to give the nested loader a chance to run
      resolveRootFirstCall()
      // allows root loader to run
      await vi.runAllTimersAsync()

      expect(rootLoaderSpy).toHaveBeenCalledTimes(1)
      // using toHaveBeenCalledWith yields an error that is difficult to debug
      // so this is for debugging purposes
      // expect(rootLoaderSpy.mock.calls[0][0].fullPath).toBe('/fetch?one')
      expect(rootLoaderSpy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          fullPath: '/fetch?p=one',
        })
      )

      expect(nestedLoaderSpy).toHaveBeenCalledTimes(1)
      expect(nestedLoaderSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fullPath: '/fetch?p=one',
        })
      )

      // now trigger the second navigation while the nested loader is pending
      const secondNavigation = router.push('/fetch?p=two')
      await vi.runAllTimersAsync()

      expect(rootLoaderSpy).toHaveBeenCalledTimes(2)
      // expect(rootLoaderSpy.mock.calls[1][0].fullPath).toBe('/fetch?two')
      expect(rootLoaderSpy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          fullPath: '/fetch?p=two',
        })
      )

      resolveRootSecondCall()
      await vi.runAllTimersAsync()

      expect(nestedLoaderSpy).toHaveBeenCalledTimes(2)
      // expect(nestedLoaderSpy.mock.calls.at(-1)?.[0].fullPath).toBe(
      //   '/fetch?p=two'
      // )
      expect(nestedLoaderSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          fullPath: '/fetch?p=two',
        })
      )

      // the nested gets called for the first time
      resolveNestedFirstCall()
      resolveNestedSecondCall()
      await vi.runAllTimersAsync()

      // explicitly wait for both navigations to ensure everything ran
      await firstNavigation
      await secondNavigation

      // only the data from the second navigation should be preserved
      const { data } = useData()
      const { data: nestedData } = app.runWithContext(() => useNestedLoader())
      expect(nestedData.value).toEqual('two')
      expect(data.value).toEqual('two,two')

      expect(rootCalls).toEqual(2)
      expect(nestedCalls).toEqual(2)
    })

    it('discards a pending load from a previous navigation that resolved later', async () => {
      let nestedCalls = 0
      let resolveNestedFirstCall!: (val?: unknown) => void
      let resolveNestedSecondCall!: (val?: unknown) => void
      const nestedP1 = new Promise((r) => (resolveNestedFirstCall = r))
      const nestedP2 = new Promise((r) => (resolveNestedSecondCall = r))
      const useNestedLoader = defineLoader(async (to) => {
        nestedCalls++
        if (nestedCalls === 1) {
          // expect(to.fullPath).toEqual('/fetch?two')
          await nestedP1
        } else {
          // since the first root resolve takes longer than the second nested resolve, the nested loader is called
          // TODO:
          // expect(to.fullPath).toEqual('/fetch?one')
          await nestedP2
        }
        return to.query.p
      })

      let rootCalls = 0
      let resolveRootFirstCall!: (val?: unknown) => void
      let resolveRootSecondCall!: (val?: unknown) => void
      const rootP1 = new Promise((r) => (resolveRootFirstCall = r))
      const rootP2 = new Promise((r) => (resolveRootSecondCall = r))

      const { wrapper, useData, router, app } = singleLoaderOneRoute(
        defineLoader(async (to) => {
          rootCalls++
          const { data } = await useNestedLoader()
          if (rootCalls === 1) {
            await rootP1
          } else {
            await rootP2
          }
          return `${data.value},${to.query.p}`
        })
      )
      const firstNavigation = router.push('/fetch?p=one')
      await vi.runAllTimersAsync()
      const secondNavigation = router.push('/fetch?p=two')
      await vi.runAllTimersAsync()
      resolveRootSecondCall()
      // the nested gets called for the first time
      resolveNestedFirstCall()

      await vi.runAllTimersAsync()
      resolveRootFirstCall()
      resolveNestedSecondCall()
      await vi.runAllTimersAsync()

      // explicitly wait for both navigations to ensure everything ran
      await firstNavigation
      await secondNavigation
      const { data } = useData()
      const { data: nestedData } = app.runWithContext(() => useNestedLoader())
      expect(data.value).toEqual('two,two')
      expect(nestedData.value).toEqual('two')

      expect(rootCalls).toEqual(2)
      // expect(nestedCalls).toEqual(2)
    })

    it('loader result can be awaited for the data to be ready', async () => {
      const [spy, resolve, reject] = mockPromise('resolved')

      const { wrapper, app, useData, router } = singleLoaderOneRoute(
        defineLoader(async () => spy())
      )
      router.push('/fetch')
      // ensures the useData is called first
      await vi.runAllTimersAsync()
      const useDataPromise = app.runWithContext(() => useData())
      await vi.runAllTimersAsync()
      expect(useDataPromise).toBeInstanceOf(Promise)
      resolve()
      const { data } = await useDataPromise
      // await router.getPendingNavigation()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual('resolved')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual('resolved')
    })

    it('can nest loaders', async () => {
      const spyOne = vi
        .fn<unknown[], Promise<string>>()
        .mockResolvedValueOnce('one')
      const spyTwo = vi
        .fn<unknown[], Promise<string>>()
        .mockResolvedValueOnce('two')
      const useLoaderOne = defineLoader(async () => spyOne())
      const useLoaderTwo = defineLoader(async () => {
        const { data: one } = await useLoaderOne()
        const two = await spyTwo()
        return `${one.value},${two}`
      })
      const { wrapper, useData, router } = singleLoaderOneRoute(useLoaderTwo)
      await router.push('/fetch')
      const { data } = useData()
      expect(spyOne).toHaveBeenCalledTimes(1)
      expect(spyTwo).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual('one,two')
    })

    it('fetches once with lazy across components', async () => {
      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component: ComponentWithNestedLoader,
      })
      const wrapper = mount(RouterViewMock, {})
      const app: App = wrapper.vm.$.appContext.app

      expect(dataOneSpy).toHaveBeenCalledTimes(0)
      await router.push('/fetch')
      const { pendingLoad } = app.runWithContext(() => useDataOne())
      await pendingLoad()
      expect(dataOneSpy).toHaveBeenCalledTimes(1)
      expect(wrapper.text()).toMatchInlineSnapshot('"resolved 1resolved 1"')
    })
  })
})

// dts testing
function dts(_fn: () => unknown) {}

dts(async () => {
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

  expectType<{
    data: Ref<UserData>
    error: Ref<unknown>
    pending: Ref<boolean>
    refresh: () => Promise<void>
  }>(useDataLoader())

  // TODO: do we really need to support this usage?
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
    const user: UserData = {
      id: 'one',
      name: 'Edu',
    }

    return user
  }

  expectType<{ data: Ref<UserData | undefined> }>(
    defineLoader(loaderUser, { lazy: true })()
  )
  expectType<{ data: Ref<UserData> }>(defineLoader(loaderUser, {})())
  expectType<{ data: Ref<UserData> }>(
    defineLoader(loaderUser, { lazy: false })()
  )
  expectType<{ data: Ref<UserData> }>(
    defineLoader(loaderUser, { lazy: false })()
  )
})
