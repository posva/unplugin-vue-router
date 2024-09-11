/**
 * @vitest-environment happy-dom
 */
import { App, defineComponent, markRaw, nextTick } from 'vue'
import { defineColadaLoader } from './defineColadaLoader'
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest'
import {
  DataLoaderPlugin,
  DataLoaderPluginOptions,
  getCurrentContext,
  setCurrentContext,
  UseDataLoader,
} from 'unplugin-vue-router/data-loaders'
import { testDefineLoader } from '../../tests/data-loaders'
import { getRouter } from 'vue-router-mock'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import RouterViewMock from '../../tests/data-loaders/RouterViewMock.vue'
import { setActivePinia, createPinia, getActivePinia } from 'pinia'
import { PiniaColada, useQueryCache, reviveTreeMap } from '@pinia/colada'
import { RouteLocationNormalizedLoaded } from 'vue-router'

describe(
  'defineColadaLoader',
  // fail faster on unresolved promises
  { timeout: process.env.CI ? 1000 : 100 },
  () => {
    enableAutoUnmount(afterEach)

    // we use fake timers to ensure debugging tests do not rely on timers
    const now = new Date(2000, 0, 1).getTime() // 1 Jan 2000 in local time as number of milliseconds
    beforeAll(() => {
      vi.useFakeTimers()
      vi.setSystemTime(now)
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    testDefineLoader(
      ({ fn, key, ...options }) =>
        defineColadaLoader({ ...options, query: fn, key: () => [key ?? 'id'] }),
      {
        beforeEach() {
          const pinia = createPinia()
          // invalidate current context
          setCurrentContext(undefined)
          setActivePinia(pinia)
          return { pinia }
        },
        plugins: ({ pinia }) => [pinia, PiniaColada],
      }
    )

    function singleLoaderOneRoute<Loader extends UseDataLoader>(
      useData: Loader,
      pluginOptions?: Omit<DataLoaderPluginOptions, 'router'>
    ): {
      wrapper: ReturnType<typeof mount>
      router: ReturnType<typeof getRouter>
      // technically it should be () => ReturnType<Loader> but it doesn't infer all the types
      useData: Loader
      app: App
    } {
      let useDataResult: ReturnType<Loader>
      const component = defineComponent({
        setup() {
          // @ts-expect-error: wat?
          useDataResult = useData()

          const { data, error, isLoading } = useDataResult
          return { data, error, isLoading }
        },
        template: `\
<div>
  <p id="route">{{ $route.path }}</p>
  <p id="data">{{ data }}</p>
  <p id="error">{{ error }}</p>
  <p id="isLoading">{{ isLoading }}</p>
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

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [
            [DataLoaderPlugin, { router, ...pluginOptions }],
            createPinia(),
            PiniaColada,
          ],
        },
      })

      const app: App = wrapper.vm.$.appContext.app

      return {
        wrapper,
        router,
        // @ts-expect-error: not exactly Loader
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

    it('avoids refetching fresh data when navigating', async () => {
      const query = vi.fn().mockResolvedValue('data')
      const useData = defineColadaLoader({
        query,
        key: (to) => [to.query.q as string],
      })

      const { router } = singleLoaderOneRoute(useData)

      // same key
      await router.push('/fetch?q=1&v=1')
      expect(query).toHaveBeenCalledTimes(1)
      await router.push('/fetch?q=1&v=2')
      expect(query).toHaveBeenCalledTimes(1)

      // different key
      await router.push('/fetch?q=2&v=3')
      expect(query).toHaveBeenCalledTimes(2)
      // already fetched
      await router.push('/fetch?q=1&v=4')
      expect(query).toHaveBeenCalledTimes(2)
    })

    it('updates data loader data if internal data changes', async () => {
      const query = vi.fn(async () => 'data')

      const { router, useData } = singleLoaderOneRoute(
        defineColadaLoader({
          query,
          key: () => ['id'],
        })
      )

      await router.push('/fetch?v=1')
      expect(query).toHaveBeenCalledTimes(1)
      const { data: loaderData } = useData()
      // we use a full mount to ensure we can use inject and onScopeDispose in useQuery
      // and avoid warning
      const wrapper = mount(
        defineComponent({
          setup() {
            const caches = useQueryCache()
            return { caches }
          },
          template: `<div></div>`,
        }),
        {
          global: {
            plugins: [getActivePinia()!, PiniaColada],
          },
        }
      )
      wrapper.vm.caches.setQueryData(['id'], 'new')
      await nextTick()
      expect(loaderData.value).toBe('new')
    })

    it('restores previous data if fetching succeeds but navigation is cancelled', async () => {
      const query = vi.fn(
        async (to: RouteLocationNormalizedLoaded) => to.query.v
      )

      const { router, useData } = singleLoaderOneRoute(
        defineColadaLoader({
          query,
          key: () => ['id'],
        })
      )

      await router.push('/fetch?v=1')
      expect(query).toHaveBeenCalledTimes(1)
      const { data: loaderData } = useData()

      // cancel next navigation after running loaders
      // it cannot be a beforeEach because it wouldn't run the loaders
      router.beforeResolve(() => false)
      await router.push('/fetch?v=2')
      await vi.runAllTimersAsync()
      // we ensure that it was called
      expect(query).toHaveBeenCalledTimes(2)
      expect(loaderData.value).toBe('1')
    })

    it('hydrates without calling the query on the initial navigation', async () => {
      // setups the loader
      const query = vi.fn().mockResolvedValue('data')
      const useData = defineColadaLoader({
        query,
        key: () => ['id'],
      })

      // sets up the page
      let useDataResult: ReturnType<typeof useData> | undefined
      const component = defineComponent({
        setup() {
          useDataResult = useData()

          const { data, error, isLoading } = useDataResult
          return { data, error, isLoading }
        },
        template: `<p/>`,
      })

      // add the page to the router
      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        meta: {
          loaders: [useData],
        },
        component,
      })

      // sets up the cache
      const pinia = createPinia()
      const treeMap = reviveTreeMap([
        // entry with successful data for id
        ['id', ['data', null, Date.now()], undefined],
      ])
      pinia.state.value[useQueryCache.$id] = { caches: markRaw(treeMap) }

      mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], pinia, PiniaColada],
        },
      })

      await router.push('/fetch')
      expect(query).toHaveBeenCalledTimes(0)

      await expect(async () => useDataResult!.reload()).not.toThrow()
      expect(query).toHaveBeenCalledTimes(1)
    })

    // NOTE: this test should fail if the `setCurrentContext(currentContext)` is not called in the `if (isInitial)` branch
    it.todo('restores the context after using a loader', async () => {
      const query = vi.fn().mockResolvedValue('data')

      const useData = defineColadaLoader({
        query,
        key: () => ['id'],
      })

      let useDataResult: ReturnType<typeof useData> | undefined
      const component = defineComponent({
        setup() {
          useDataResult = useData()
          expect(getCurrentContext()).toEqual([])

          const { data, error, isLoading } = useDataResult
          return { data, error, isLoading }
        },
        template: `<p/>`,
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

      const pinia = createPinia()

      const treeMap = reviveTreeMap([
        ['id', ['data', null, Date.now()], undefined],
      ])
      pinia.state.value[useQueryCache.$id] = { caches: markRaw(treeMap) }

      mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], pinia, PiniaColada],
        },
      })

      await router.push('/fetch')

      expect(useDataResult?.data.value).toBe('data')

      expect(getCurrentContext()).toEqual([])
    })
  }
)
