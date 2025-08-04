/**
 * @vitest-environment happy-dom
 */
import { App, defineComponent } from 'vue'
import {
  type DefineDataLoaderOptions_LaxData,
  DefineDataLoaderOptions_DefinedData,
  INITIAL_DATA_KEY,
  SERVER_INITIAL_DATA_KEY,
  defineBasicLoader,
} from './defineLoader'
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
  NavigationResult,
  UseDataLoader,
  setCurrentContext,
} from 'unplugin-vue-router/data-loaders'
import { testDefineLoader } from '../../tests/data-loaders'
import { getRouter } from 'vue-router-mock'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import RouterViewMock from '../../tests/data-loaders/RouterViewMock.vue'
import { mockPromise } from '../../tests/utils'
import { type RouteLocationNormalizedLoaded } from 'vue-router'

function mockedLoader<T = string | NavigationResult>(
  // boolean is easier to handle for router mock
  options:
    | DefineDataLoaderOptions_LaxData
    | DefineDataLoaderOptions_DefinedData = {}
) {
  const [spy, resolve, reject] = mockPromise<T, unknown>(
    // not correct as T could be something else
    'ok' as T,
    new Error('ko')
  )
  return {
    spy,
    resolve,
    reject,
    loader: defineBasicLoader(async () => await spy(), options),
  }
}

describe(
  'defineBasicLoader',
  // change it during dev while working on features
  // CI might need higher timeout
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
      ({ fn, ...options }) => defineBasicLoader(fn, { ...options }),
      {
        beforeEach() {
          // invalidate current context
          setCurrentContext(undefined)
          // reset data used for SSR
          const router = getRouter()
          delete router[INITIAL_DATA_KEY]
          delete router[SERVER_INITIAL_DATA_KEY]
        },
      }
    )

    function singleLoaderOneRoute<Loader extends UseDataLoader>(
      useData: Loader,
      pluginOptions?: Omit<DataLoaderPluginOptions, 'router'>
    ) {
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
          plugins: [[DataLoaderPlugin, { router, ...pluginOptions }]],
        },
      })

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

    describe('initialData', () => {
      it.skip('stores initialData', async () => {
        const router = getRouter()
        const spy1 = vi.fn().mockResolvedValue('f1')
        const spy2 = vi.fn().mockResolvedValue('f2')
        const l1 = defineBasicLoader(spy1, { key: 'd1' })
        const l2 = defineBasicLoader(spy2, { key: 'd2' })
        router.addRoute({
          name: '_test',
          path: '/fetch',
          component: defineComponent({
            setup() {
              const { data: d1 } = l1()
              const { data: d2 } = l2()
              return { d1, d2 }
            },
            template: `<p>{{ d1 }} {{ d2 }}</p>`,
          }),
          meta: {
            loaders: [l1, l2],
          },
        })

        mount(RouterViewMock, {
          global: {
            plugins: [
              [
                DataLoaderPlugin,
                {
                  router,
                },
              ],
            ],
          },
        })

        await router.push('/fetch?p=one')
        expect(spy1).toHaveBeenCalledTimes(1)
        expect(spy2).toHaveBeenCalledTimes(1)
        expect(router[SERVER_INITIAL_DATA_KEY]).toEqual({
          d1: 'f1',
          d2: 'f2',
        })
      })

      it('uses initialData if present', async () => {
        const spy = vi
          .fn<(to: RouteLocationNormalizedLoaded) => Promise<string>>()
          .mockResolvedValue('initial')
        const { router, useData } = singleLoaderOneRoute(
          defineBasicLoader(spy, { key: 'root' })
        )
        router[INITIAL_DATA_KEY] = { root: 'initial' }

        await router.push('/fetch?p=one')
        const { data } = useData()
        expect(data.value).toEqual('initial')
        expect(spy).toHaveBeenCalledTimes(0)
      })

      it('ignores initialData on subsequent navigations', async () => {
        const spy = vi
          .fn<(to: RouteLocationNormalizedLoaded) => Promise<string>>()
          .mockImplementation(async (to) => to.query.p as string)
        const { router, useData } = singleLoaderOneRoute(
          defineBasicLoader(spy, { key: 'root' })
        )

        router[INITIAL_DATA_KEY] = { root: 'initial' }

        await router.push('/fetch?p=one')
        await router.push('/fetch?p=two')
        const { data } = useData()
        expect(spy).toHaveBeenCalledTimes(1)
        expect(data.value).toEqual('two')
      })

      it('can use initialData on nested loaders that are not exported', async () => {
        const router = getRouter()
        const l1 = mockedLoader({ key: 'root' })
        const l2 = mockedLoader({ key: 'nested' })
        router.addRoute({
          name: '_test',
          path: '/fetch',
          component: defineComponent({
            setup() {
              const { data } = l1.loader()
              const { data: nested } = l2.loader()
              return { data, nested }
            },
            template: `<p>{{ data }} {{ nested }}</p>`,
          }),
          meta: {
            loaders: [
              // we purposely only expose the 1st loader
              l1.loader,
              // l2.loader,
            ],
          },
        })
        const wrapper = mount(RouterViewMock, {
          global: {
            plugins: [
              [
                DataLoaderPlugin,
                {
                  router,
                },
              ],
            ],
          },
        })
        const app: App = wrapper.vm.$.appContext.app
        router[INITIAL_DATA_KEY] = { root: 'initial', nested: 'nested-initial' }

        await router.push('/fetch?p=one')
        const { data: root, isLoading: rootPending } = app.runWithContext(() =>
          l1.loader()
        )
        const { data: nested, isLoading: nestedPending } = app.runWithContext(
          () => l2.loader()
        )
        expect(l1.spy).toHaveBeenCalledTimes(0)
        expect(l2.spy).toHaveBeenCalledTimes(0)
        expect(wrapper.text()).toBe('initial nested-initial')
        expect(root.value).toEqual('initial')
        expect(nested.value).toEqual('nested-initial')
        expect(rootPending.value).toEqual(false)
        expect(nestedPending.value).toEqual(false)
      })
    })
  }
)

describe('defineBasicLoader - additional edge cases', () => {
  it('should handle loader function throwing synchronous errors', async () => {
    const error = new Error('Synchronous error')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(
        () => {
          throw error
        },
        { key: 'sync-error' }
      )
    )

    await router.push('/fetch').catch(() => {})
    const { data, error: loaderError, isLoading } = useData()

    expect(data.value).toBeUndefined()
    expect(loaderError.value).toBe(error)
    expect(isLoading.value).toBe(false)
  })

  it('should handle empty string return values from loader', async () => {
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => '', { key: 'empty-string' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe('')
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle boolean return values from loader', async () => {
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => false, { key: 'boolean-false' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe(false)
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle zero return values from loader', async () => {
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => 0, { key: 'zero-value' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe(0)
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle complex object return values', async () => {
    const complexData = {
      users: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
      metadata: { total: 2, page: 1 },
      nested: { deep: { value: 'test' } },
    }

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => complexData, { key: 'complex-data' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toEqual(complexData)
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle loader with route parameter dependencies', async () => {
    const spy = vi
      .fn()
      .mockImplementation(async (route) => `user-${route.params.id}`)
    const router = getRouter()

    // Create a parameterized route
    router.addRoute({
      name: '_test_params',
      path: '/fetch/:id',
      component: defineComponent({
        setup() {
          const loader = defineBasicLoader(spy, { key: 'route-params' })
          const result = loader()
          return result
        },
        template: '<div>{{ data }}</div>',
      }),
      meta: { loaders: [defineBasicLoader(spy, { key: 'route-params' })] },
    })

    mount(RouterViewMock, {
      global: {
        plugins: [[DataLoaderPlugin, { router }]],
      },
    })

    await router.push('/fetch/123')
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        params: { id: '123' },
      })
    )
  })

  it('should handle loader with query parameter dependencies', async () => {
    const spy = vi
      .fn()
      .mockImplementation(async (route) => `search-${route.query.q}`)
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'query-params' })
    )

    await router.push('/fetch?q=test-query')
    const { data } = useData()

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: { q: 'test-query' },
      })
    )
    expect(data.value).toBe('search-test-query')
  })

  it('should handle very large data payloads', async () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: `item-${i}`,
      nested: { value: i * 2 },
    }))

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => largeArray, { key: 'large-data' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toHaveLength(1000)
    expect(data.value[0]).toEqual({
      id: 0,
      data: 'item-0',
      nested: { value: 0 },
    })
    expect(data.value[999]).toEqual({
      id: 999,
      data: 'item-999',
      nested: { value: 1998 },
    })
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle circular reference in data', async () => {
    const circularData: any = { name: 'test' }
    circularData.self = circularData

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => circularData, { key: 'circular' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value.name).toBe('test')
    expect(data.value.self).toBe(data.value)
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle Date objects in loader data', async () => {
    const testDate = new Date('2023-01-01T00:00:00.000Z')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => ({ timestamp: testDate }), {
        key: 'date-data',
      })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value.timestamp).toBe(testDate)
    expect(data.value.timestamp instanceof Date).toBe(true)
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle Map and Set objects in loader data', async () => {
    const testMap = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ])
    const testSet = new Set([1, 2, 3, 4, 5])

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => ({ map: testMap, set: testSet }), {
        key: 'collections',
      })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value.map).toBe(testMap)
    expect(data.value.set).toBe(testSet)
    expect(data.value.map.get('key1')).toBe('value1')
    expect(data.value.set.has(3)).toBe(true)
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle NavigationResult return values', async () => {
    const navigationResult = new NavigationResult('/')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => navigationResult, {
        key: 'navigation-result',
      })
    )

    await router.push('/fetch')
    const { data, isLoading } = useData()

    // NavigationResult should not be set as data but handled by the navigation system
    expect(data.value).toBeUndefined()
    expect(isLoading.value).toBe(false)
  })
})

describe('defineBasicLoader - options edge cases', () => {
  it('should handle loader with empty key string', async () => {
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => 'test-data', { key: '' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe('test-data')
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle loader with special characters in key', async () => {
    const specialKey = 'key-with-!@#$%^&*()_+{}[]|\\:";\'<>?,./'
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => 'special-key-data', { key: specialKey })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe('special-key-data')
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle loader with very long key', async () => {
    const longKey = 'a'.repeat(1000)
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => 'long-key-data', { key: longKey })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe('long-key-data')
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle loader with unicode characters in key', async () => {
    const unicodeKey = '测试-🎉-🚀-key-العربية-русский'
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => 'unicode-data', { key: unicodeKey })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe('unicode-data')
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle loader with different commit strategies', async () => {
    const spy = vi.fn().mockResolvedValue('immediate-commit-data')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'immediate', commit: 'immediate' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe('immediate-commit-data')
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle loader with server option disabled', async () => {
    const spy = vi.fn().mockResolvedValue('client-only-data')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'client-only', server: false })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toBe('client-only-data')
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })
})

describe('defineBasicLoader - server-side rendering scenarios', () => {
  it('should handle server initial data with missing keys', async () => {
    const spy = vi.fn().mockResolvedValue('fallback-data')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'missing-ssr-key' })
    )

    router[INITIAL_DATA_KEY] = { 'different-key': 'different-data' }

    await router.push('/fetch')
    const { data } = useData()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(data.value).toBe('fallback-data')
  })

  it('should handle corrupted server initial data', async () => {
    const spy = vi.fn().mockResolvedValue('fallback-data')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'corrupted-key' })
    )

    // Simulate corrupted data - set to null
    router[INITIAL_DATA_KEY] = null

    await router.push('/fetch')
    const { data } = useData()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(data.value).toBe('fallback-data')
  })

  it('should handle server initial data with null values', async () => {
    const spy = vi.fn().mockResolvedValue('fallback-data')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'null-ssr' })
    )

    router[INITIAL_DATA_KEY] = { 'null-ssr': null }

    await router.push('/fetch')
    const { data } = useData()

    expect(spy).toHaveBeenCalledTimes(0)
    expect(data.value).toBeNull()
  })

  it('should prioritize INITIAL_DATA_KEY over SERVER_INITIAL_DATA_KEY', async () => {
    const spy = vi.fn().mockResolvedValue('fallback-data')
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'priority-test' })
    )

    router[SERVER_INITIAL_DATA_KEY] = { 'priority-test': 'server-data' }
    router[INITIAL_DATA_KEY] = { 'priority-test': 'initial-data' }

    await router.push('/fetch')
    const { data } = useData()

    // Should use INITIAL_DATA_KEY and not call the loader
    expect(spy).toHaveBeenCalledTimes(0)
    expect(data.value).toBe('initial-data')
  })
})

describe('defineBasicLoader - error recovery', () => {
  it('should recover from errors on subsequent navigations', async () => {
    let shouldError = true
    const spy = vi.fn().mockImplementation(async () => {
      if (shouldError) {
        shouldError = false
        throw new Error('First call error')
      }
      return 'success-data'
    })

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'error-recovery', lazy: true })
    )

    // First navigation should error
    await router.push('/fetch?attempt=1')
    let { data, error } = useData()
    await vi.runAllTimersAsync()
    expect(error.value).toBeInstanceOf(Error)
    expect(data.value).toBeUndefined()

    // Second navigation should succeed
    await router.push('/fetch?attempt=2')
    const result = useData()
    await vi.runAllTimersAsync()
    expect(result.error.value).toBeNull()
    expect(result.data.value).toBe('success-data')
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should handle mixed success and error scenarios', async () => {
    const spy = vi.fn().mockImplementation(async (route) => {
      const shouldError = route.query.error === 'true'
      if (shouldError) {
        throw new Error(`Error for ${route.query.id}`)
      }
      return `Success for ${route.query.id}`
    })

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'mixed-results', lazy: true })
    )

    // Success case
    await router.push('/fetch?id=1&error=false')
    let result = useData()
    await vi.runAllTimersAsync()
    expect(result.error.value).toBeNull()
    expect(result.data.value).toBe('Success for 1')

    // Error case
    await router.push('/fetch?id=2&error=true')
    result = useData()
    await vi.runAllTimersAsync()
    expect(result.error.value).toBeInstanceOf(Error)
    expect(result.data.value).toBeUndefined()

    // Success again
    await router.push('/fetch?id=3&error=false')
    result = useData()
    await vi.runAllTimersAsync()
    expect(result.error.value).toBeNull()
    expect(result.data.value).toBe('Success for 3')
  })
})

describe('defineBasicLoader - type safety and validation', () => {
  it('should handle loaders returning different types', async () => {
    interface UserData {
      id: number
      name: string
      active: boolean
    }

    const userData: UserData = { id: 1, name: 'John', active: true }
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async (): Promise<UserData> => userData, {
        key: 'typed-data',
      })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toEqual(userData)
    expect(typeof data.value?.id).toBe('number')
    expect(typeof data.value?.name).toBe('string')
    expect(typeof data.value?.active).toBe('boolean')
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('should handle arrays of different types', async () => {
    const mixedArray = [1, 'string', { obj: true }, [1, 2, 3], null, undefined]
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(async () => mixedArray, { key: 'mixed-array' })
    )

    await router.push('/fetch')
    const { data, error, isLoading } = useData()

    expect(data.value).toEqual(mixedArray)
    expect(Array.isArray(data.value)).toBe(true)
    expect(data.value).toHaveLength(6)
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })
})

describe('defineBasicLoader - reload functionality', () => {
  it('should allow manual reloading of data', async () => {
    const spy = vi
      .fn()
      .mockResolvedValueOnce('initial-data')
      .mockResolvedValueOnce('reloaded-data')

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'reload-test' })
    )

    await router.push('/fetch')
    const { data, reload } = useData()

    expect(data.value).toBe('initial-data')
    expect(spy).toHaveBeenCalledTimes(1)

    // Reload the data
    await reload()

    expect(data.value).toBe('reloaded-data')
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('should handle reload with different route', async () => {
    const spy = vi
      .fn()
      .mockImplementation(async (route) => `data-${route.query.version}`)

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'reload-route-test' })
    )

    await router.push('/fetch?version=1')
    const { data, reload } = useData()

    expect(data.value).toBe('data-1')

    // Navigate to different route first
    await router.push('/fetch?version=2')
    expect(data.value).toBe('data-2')

    // Reload with original route
    const originalRoute = router.resolve('/fetch?version=1')
      .route as RouteLocationNormalizedLoaded
    await reload(originalRoute)
    expect(data.value).toBe('data-1')
  })

  it('should handle reload errors gracefully', async () => {
    const spy = vi
      .fn()
      .mockResolvedValueOnce('initial-data')
      .mockRejectedValueOnce(new Error('Reload error'))

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'reload-error-test' })
    )

    await router.push('/fetch')
    const { data, error, reload } = useData()

    expect(data.value).toBe('initial-data')
    expect(error.value).toBeNull()

    // Reload should handle error
    await reload().catch(() => {}) // Catch to prevent unhandled rejection

    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe('Reload error')
  })
})

describe('defineBasicLoader - abort controller scenarios', () => {
  it('should handle aborted requests gracefully', async () => {
    const spy = vi.fn().mockImplementation(async (route, { signal }) => {
      // Simulate checking abort signal
      if (signal?.aborted) {
        throw new Error('Request was aborted')
      }
      return 'success-data'
    })

    const { router } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'abort-test' })
    )

    const navigation = router.push('/fetch')
    // Immediately navigate away to trigger abort
    router.push('/')

    await navigation.catch(() => {}) // Handle potential navigation error

    expect(spy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    )
  })

  it('should pass abort signal to nested loaders', async () => {
    const nestedSpy = vi.fn().mockImplementation(async (route, { signal }) => {
      expect(signal).toBeInstanceOf(AbortSignal)
      return 'nested-data'
    })

    const nestedLoader = defineBasicLoader(nestedSpy, { key: 'nested-abort' })

    const parentSpy = vi.fn().mockImplementation(async (route, context) => {
      const nestedData = await nestedLoader()
      return `parent-${nestedData}`
    })

    const { router } = singleLoaderOneRoute(
      defineBasicLoader(parentSpy, { key: 'parent-abort' })
    )

    await router.push('/fetch')

    expect(nestedSpy).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    )
  })
})

describe('defineBasicLoader - memory management', () => {
  it('should not accumulate memory leaks with repeated navigations', async () => {
    const spy = vi
      .fn()
      .mockImplementation(async (route) => `data-${route.query.iteration}`)
    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'memory-test' })
    )

    // Perform many navigations to test for memory leaks
    for (let i = 0; i < 50; i++) {
      await router.push(`/fetch?iteration=${i}`)
    }

    const { data } = useData()
    expect(data.value).toBe('data-49')
    expect(spy).toHaveBeenCalledTimes(50)
  })

  it('should clean up pending loads when navigation is cancelled', async () => {
    const { spy, resolve } = mockedLoader({ key: 'cleanup-test' })
    const { router, useData } = singleLoaderOneRoute(spy.loader)

    // Start navigation but cancel it immediately
    const navigation = router.push('/fetch')
    router.push('/') // Cancel by navigating elsewhere

    // Even if we resolve later, it shouldn't affect the cancelled navigation
    resolve('should-not-be-used')
    await navigation.catch(() => {})

    const { data, isLoading } = useData()
    expect(isLoading.value).toBe(false)
    expect(data.value).toBeUndefined()
  })
})

describe('defineBasicLoader - edge case scenarios', () => {
  it('should handle loader key collisions between different instances', async () => {
    const spy1 = vi.fn().mockResolvedValue('loader1-data')
    const spy2 = vi.fn().mockResolvedValue('loader2-data')

    const loader1 = defineBasicLoader(spy1, { key: 'shared-key' })
    const loader2 = defineBasicLoader(spy2, { key: 'shared-key' })

    const router = getRouter()
    let result1: any
    let result2: any

    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: defineComponent({
        setup() {
          result1 = loader1()
          result2 = loader2()
          return { data1: result1.data, data2: result2.data }
        },
        template: '<div>{{ data1 }} {{ data2 }}</div>',
      }),
      meta: { loaders: [loader1, loader2] },
    })

    mount(RouterViewMock, {
      global: {
        plugins: [[DataLoaderPlugin, { router }]],
      },
    })

    await router.push('/fetch')

    // Both should be called since they are different loader functions
    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
    expect(result1.data.value).toBe('loader1-data')
    expect(result2.data.value).toBe('loader2-data')
  })

  it('should handle extremely long loading times', async () => {
    const { spy } = mockedLoader({ key: 'long-loading' })
    const { router, useData } = singleLoaderOneRoute(spy.loader)

    await router.push('/fetch')

    // Advance timers to simulate very long loading
    vi.advanceTimersByTime(60000) // 1 minute

    const { isLoading, data } = useData()
    // Should still be loading since we never resolve the promise
    expect(isLoading.value).toBe(true)
    expect(data.value).toBeUndefined()
    expect(spy.spy).toHaveBeenCalledTimes(1)
  })

  it('should handle rapid successive same-route navigations', async () => {
    const spy = vi.fn().mockImplementation(async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      return `data-${route.query.id}`
    })

    const { router, useData } = singleLoaderOneRoute(
      defineBasicLoader(spy, { key: 'rapid-same' })
    )

    // Rapidly trigger the same navigation multiple times
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(router.push('/fetch?id=same'))
    }

    await Promise.all(promises)

    const { data } = useData()
    // Should only call loader once for the same route
    expect(spy).toHaveBeenCalledTimes(1)
    expect(data.value).toBe('data-same')
  })
})
