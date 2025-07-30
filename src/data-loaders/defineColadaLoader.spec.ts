/**
 * @vitest-environment happy-dom
 */
import { App, defineComponent, nextTick } from 'vue'
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
import {
  PiniaColada,
  useQueryCache,
  serializeQueryCache,
  hydrateQueryCache,
} from '@pinia/colada'
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

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], pinia, PiniaColada],
        },
      })

      const serializedCache = {
        // entry with successful data for id
        '["id"]': ['data', null, 0],
      } satisfies ReturnType<typeof serializeQueryCache>

      wrapper.vm.$.appContext.app.runWithContext(() => {
        hydrateQueryCache(useQueryCache(pinia), serializedCache)
      })

      await router.push('/fetch')
      expect(query).toHaveBeenCalledTimes(0)

      await expect(useDataResult!.reload()).resolves.toBeUndefined()
      expect(query).toHaveBeenCalledTimes(1)
    })

    // NOTE: this test should fail if the `setCurrentContext(currentContext)` is not called in the `if (isInitial)` branch
    // Shouldn't this be directly in tester?
    it('restores the context after using a loader', async () => {
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

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], pinia, PiniaColada],
        },
      })

      const serializedCache = {
        // entry with successful data for id
        '["id"]': ['data', null, 0],
      } satisfies ReturnType<typeof serializeQueryCache>

      wrapper.vm.$.appContext.app.runWithContext(() => {
        hydrateQueryCache(useQueryCache(pinia), serializedCache)
      })

      await router.push('/fetch')

      expect(useDataResult?.data.value).toBe('data')

      expect(getCurrentContext()).toEqual([])
    })

    it('can refetch nested loaders on invalidation', async () => {
      const nestedQuery = vi.fn(async () => [{ id: 0 }, { id: 1 }])
      const useListData = defineColadaLoader({
        query: nestedQuery,
        key: () => ['items'],
      })

      const useDetailData = defineColadaLoader({
        key: (to) => ['items', to.params.id as string],
        async query(to) {
          const list = await useListData()
          const item = list.find(
            (item) => String(item.id) === (to.params.id as string)
          )
          if (!item) {
            throw new Error('Not Found')
          }
          return { ...item, when: Date.now() }
        },
      })

      const component = defineComponent({
        setup() {
          return { ...useDetailData() }
        },
        template: `<p/>`,
      })

      const router = getRouter()
      router.addRoute({
        name: 'item-id',
        path: '/items/:id',
        meta: { loaders: [useDetailData] },
        component,
      })

      const pinia = createPinia()

      mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], pinia, PiniaColada],
        },
      })

      await router.push('/items/0')
      const queryCache = useQueryCache(pinia)

      expect(nestedQuery).toHaveBeenCalledTimes(1)
      await expect(
        queryCache.invalidateQueries({ key: ['items'] })
      ).resolves.toBeDefined()
      expect(nestedQuery).toHaveBeenCalledTimes(2)

      await router.push('/items/1')
      // FIXME:
      // expect(nestedQuery).toHaveBeenCalledTimes(2)
    })

    it('handles query function errors gracefully', async () => {
      const error = new Error('Query failed')
      const query = vi.fn().mockRejectedValue(error)
      const useData = defineColadaLoader({
        query,
        key: () => ['error-test'],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      await router.push('/fetch')
      const { error: loaderError, isLoading } = useDataFn()

      expect(query).toHaveBeenCalledTimes(1)
      expect(loaderError.value).toBe(error)
      expect(isLoading.value).toBe(false)
    })

    it('handles dynamic key changes correctly', async () => {
      const query = vi
        .fn()
        .mockImplementation(async (to) => `data-${to.params.id}`)
      const useData = defineColadaLoader({
        query,
        key: (to) => ['dynamic', to.params.id as string],
      })

      let useDataResult: ReturnType<typeof useData> | undefined
      const component = defineComponent({
        setup() {
          useDataResult = useData()
          const { data, error, isLoading } = useDataResult
          return { data, error, isLoading }
        },
        template: `<p/>`,
      })

      const router = getRouter()
      router.addRoute({
        name: 'dynamic-test',
        path: '/items/:id',
        meta: { loaders: [useData] },
        component,
      })

      mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], createPinia(), PiniaColada],
        },
      })

      await router.push('/items/1')
      expect(query).toHaveBeenCalledTimes(1)
      expect(useDataResult!.data.value).toBe('data-1')

      await router.push('/items/2')
      expect(query).toHaveBeenCalledTimes(2)
      expect(useDataResult!.data.value).toBe('data-2')
    })

    it('handles concurrent navigation correctly', async () => {
      const query = vi.fn().mockImplementation(async (to) => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return `data-${to.query.id}`
      })
      const useData = defineColadaLoader({
        query,
        key: (to) => ['concurrent', to.query.id as string],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      // Start multiple concurrent navigations
      const navigation1 = router.push('/fetch?id=1')
      const navigation2 = router.push('/fetch?id=2')
      const navigation3 = router.push('/fetch?id=3')

      await Promise.all([navigation1, navigation2, navigation3])
      await vi.runAllTimersAsync()

      const { data } = useDataFn()
      // Should have the data from the last navigation
      expect(data.value).toBe('data-3')
      // Query should be called for each unique key
      expect(query).toHaveBeenCalledTimes(3)
    })

    it('properly manages loading state transitions', async () => {
      let resolveQuery: (value: string) => void
      const query = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveQuery = resolve
          })
      )

      const useData = defineColadaLoader({
        query,
        key: () => ['loading-test'],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      const navigationPromise = router.push('/fetch')
      const { isLoading, data } = useDataFn()

      // Should be loading initially
      expect(isLoading.value).toBe(true)
      expect(data.value).toBeUndefined()

      // Resolve the query
      resolveQuery!('loaded-data')
      await navigationPromise
      await nextTick()

      // Should no longer be loading
      expect(isLoading.value).toBe(false)
      expect(data.value).toBe('loaded-data')
    })

    it('handles error recovery scenarios', async () => {
      const error = new Error('Network error')
      const query = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('recovery-data')

      const useData = defineColadaLoader({
        query,
        key: () => ['error-recovery'],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      await router.push('/fetch')
      const { data, error: loaderError, reload } = useDataFn()

      expect(query).toHaveBeenCalledTimes(1)
      expect(loaderError.value).toBe(error)
      expect(data.value).toBeUndefined()

      // Attempt recovery
      await reload()
      expect(query).toHaveBeenCalledTimes(2)
      expect(loaderError.value).toBe(null)
      expect(data.value).toBe('recovery-data')
    })

    it('handles different data types correctly', async () => {
      const complexData = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
        meta: { total: 2, page: 1 },
        nested: { deep: { value: 'test' } },
      }

      const query = vi.fn().mockResolvedValue(complexData)
      const useData = defineColadaLoader({
        query,
        key: () => ['complex-data'],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      await router.push('/fetch')
      const { data } = useDataFn()

      expect(query).toHaveBeenCalledTimes(1)
      expect(data.value).toEqual(complexData)
      expect(data.value?.users).toHaveLength(2)
      expect(data.value?.nested.deep.value).toBe('test')
    })

    it('handles null and undefined data correctly', async () => {
      const query = vi.fn().mockResolvedValue(null)
      const useData = defineColadaLoader({
        query,
        key: () => ['null-data'],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      await router.push('/fetch')
      const { data } = useDataFn()

      expect(query).toHaveBeenCalledTimes(1)
      expect(data.value).toBe(null)
    })

    it('handles route parameter changes in key function', async () => {
      const query = vi
        .fn()
        .mockImplementation(async (to) => `user-${to.params.userId}`)
      const useData = defineColadaLoader({
        query,
        key: (to) => [
          'user',
          to.params.userId as string,
          to.query.version as string,
        ],
      })

      let useDataResult: ReturnType<typeof useData> | undefined
      const component = defineComponent({
        setup() {
          useDataResult = useData()
          return { ...useDataResult }
        },
        template: `<p/>`,
      })

      const router = getRouter()
      router.addRoute({
        name: 'user-profile',
        path: '/users/:userId',
        meta: { loaders: [useData] },
        component,
      })

      mount(RouterViewMock, {
        global: {
          plugins: [[DataLoaderPlugin, { router }], createPinia(), PiniaColada],
        },
      })

      await router.push('/users/123?version=v1')
      expect(query).toHaveBeenCalledTimes(1)
      expect(useDataResult!.data.value).toBe('user-123')

      // Change version - should fetch again due to key change
      await router.push('/users/123?version=v2')
      expect(query).toHaveBeenCalledTimes(2)
      expect(useDataResult!.data.value).toBe('user-123')

      // Change user ID - should fetch again
      await router.push('/users/456?version=v2')
      expect(query).toHaveBeenCalledTimes(3)
      expect(useDataResult!.data.value).toBe('user-456')
    })

    it('handles cache invalidation correctly', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce('cached-data')
        .mockResolvedValueOnce('fresh-data')

      const useData = defineColadaLoader({
        query,
        key: () => ['cache-invalidation'],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      await router.push('/fetch')
      const { data } = useDataFn()

      expect(query).toHaveBeenCalledTimes(1)
      expect(data.value).toBe('cached-data')

      // Create a new mount with same cache to test cache persistence
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

      // Invalidate cache
      await wrapper.vm.caches.invalidateQueries({ key: ['cache-invalidation'] })

      const { data: freshData, reload } = useDataFn()
      await reload()

      expect(query).toHaveBeenCalledTimes(2)
      expect(freshData.value).toBe('fresh-data')
    })

    it('handles multiple loaders with same key correctly', async () => {
      const sharedQuery = vi.fn().mockResolvedValue('shared-data')

      const useData1 = defineColadaLoader({
        query: sharedQuery,
        key: () => ['shared'],
      })

      const useData2 = defineColadaLoader({
        query: sharedQuery,
        key: () => ['shared'],
      })

      const { router: router1, useData: useDataFn1 } =
        singleLoaderOneRoute(useData1)
      const { router: router2, useData: useDataFn2 } =
        singleLoaderOneRoute(useData2)

      await router1.push('/fetch')
      await router2.push('/fetch')

      const { data: data1 } = useDataFn1()
      const { data: data2 } = useDataFn2()

      // Should only call query once due to shared cache
      expect(sharedQuery).toHaveBeenCalledTimes(1)
      expect(data1.value).toBe('shared-data')
      expect(data2.value).toBe('shared-data')
    })

    it('handles empty key arrays', async () => {
      const query = vi.fn().mockResolvedValue('empty-key-data')
      const useData = defineColadaLoader({
        query,
        key: () => [],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      await router.push('/fetch')
      const { data } = useDataFn()

      expect(query).toHaveBeenCalledTimes(1)
      expect(data.value).toBe('empty-key-data')
    })

    it('handles special characters in keys', async () => {
      const specialKey = [
        'special',
        'key-with/slashes',
        'key with spaces',
        'key@with#symbols',
      ]
      const query = vi.fn().mockResolvedValue('special-key-data')
      const useData = defineColadaLoader({
        query,
        key: () => specialKey,
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      await router.push('/fetch')
      const { data } = useDataFn()

      expect(query).toHaveBeenCalledTimes(1)
      expect(data.value).toBe('special-key-data')
    })

    it('supports manual reload functionality', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce('initial-data')
        .mockResolvedValueOnce('reloaded-data')

      const useData = defineColadaLoader({
        query,
        key: () => ['reload-test'],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      await router.push('/fetch')
      const { data, reload } = useDataFn()

      expect(query).toHaveBeenCalledTimes(1)
      expect(data.value).toBe('initial-data')

      await reload()
      expect(query).toHaveBeenCalledTimes(2)
      expect(data.value).toBe('reloaded-data')
    })

    it('handles stale data scenarios correctly', async () => {
      let resolveQuery: (value: string) => void
      let queryCount = 0
      const query = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            queryCount++
            resolveQuery = (value) => resolve(`${value}-${queryCount}`)
          })
      )
      const useData = defineColadaLoader({
        query,
        key: (to) => ['stale', to.query.v as string],
      })

      const { router, useData: useDataFn } = singleLoaderOneRoute(useData)

      // Start first navigation
      const firstNavigation = router.push('/fetch?v=1')
      expect(query).toHaveBeenCalledTimes(1)

      // Start second navigation before first completes
      const secondNavigation = router.push('/fetch?v=2')
      expect(query).toHaveBeenCalledTimes(2)

      // Complete second query first
      resolveQuery!('data')
      await secondNavigation
      await vi.runAllTimersAsync()

      const { data } = useDataFn()
      // Should have data from the second query
      expect(data.value).toBe('data-2')
    })
  }
)
