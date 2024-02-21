/**
 * @vitest-environment happy-dom
 */
import { App, defineComponent } from 'vue'
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
import { DataLoaderPlugin, DataLoaderPluginOptions } from './navigation-guard'
import { testDefineLoader } from '../../tests/data-loaders'
import { setCurrentContext } from './utils'
import { UseDataLoader } from './createDataLoader'
import { getRouter } from 'vue-router-mock'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import RouterViewMock from '../../tests/data-loaders/RouterViewMock.vue'
import { setActivePinia, createPinia, getActivePinia } from 'pinia'
import { QueryPlugin, useQuery } from '@pinia/colada'
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
        plugins: ({ pinia }) => [pinia, QueryPlugin],
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
          plugins: [
            [DataLoaderPlugin, { router, ...pluginOptions }],
            createPinia(),
            QueryPlugin,
          ],
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
      const query = vi.fn().mockResolvedValue('data')

      const { router, useData, app } = singleLoaderOneRoute(
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
            return useQuery({
              query,
              key: ['id'],
            })
          },
          template: `<div>{{ data }}</div>`,
        }),
        {
          global: {
            plugins: [getActivePinia()!, QueryPlugin],
          },
        }
      )
      query.mockResolvedValue('new')
      await wrapper.vm.refetch()
      await vi.runAllTimersAsync()
      expect(query).toHaveBeenCalledTimes(2)
      expect(wrapper.vm.data).toBe('new')
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
  }
)
