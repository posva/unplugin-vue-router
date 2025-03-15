/**
 * @vitest-environment happy-dom
 */
import {
  type App,
  defineComponent,
  h,
  inject,
  nextTick,
  type Plugin,
  ref,
} from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { getRouter } from 'vue-router-mock'
import {
  setCurrentContext,
  DataLoaderPlugin,
  NavigationResult,
  type DataLoaderPluginOptions,
  type DataLoaderContextBase,
  type DefineDataLoaderOptionsBase,
  type UseDataLoader,
} from 'unplugin-vue-router/data-loaders'
import { mockPromise } from '../utils'
import RouterViewMock from '../data-loaders/RouterViewMock.vue'
import ComponentWithNestedLoader from '../data-loaders/ComponentWithNestedLoader.vue'
import { dataOneSpy, dataTwoSpy } from '../data-loaders/loaders'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { mockWarn } from '../vitest-mock-warn'

export function testDefineLoader<Context = void>(
  loaderFactory: (
    context: {
      fn: (
        to: RouteLocationNormalizedLoaded,
        context: DataLoaderContextBase
      ) => Promise<unknown>
    } & DefineDataLoaderOptionsBase & { key?: string }
  ) => UseDataLoader,
  {
    plugins,
    beforeEach: _beforeEach,
  }: {
    beforeEach?: () => Context
    plugins?: (
      context: Context
    ) => Array<Plugin | [plugin: Plugin, ...options: unknown[]]>
  } = {}
) {
  let customContext: Context | undefined

  function mockedLoader<T = string | NavigationResult>(
    // boolean is easier to handle for router mock
    options?: DefineDataLoaderOptionsBase & { key?: string }
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
      loader: loaderFactory({ fn: spy, ...options }),
    }
  }

  mockWarn()

  beforeEach(async () => {
    dataOneSpy.mockClear()
    dataTwoSpy.mockClear()
    if (_beforeEach) {
      customContext = await _beforeEach()
    }
  })

  function singleLoaderOneRoute(
    useData: UseDataLoader,
    pluginOptions?: Omit<DataLoaderPluginOptions, 'router'>
  ) {
    let useDataResult: ReturnType<UseDataLoader>
    const component = defineComponent({
      setup() {
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
          ...(plugins?.(customContext!) || []),
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
        return app.runWithContext(() => useData()) as ReturnType<UseDataLoader>
      },
      app,
    }
  }

  const lazyFnTrue = () => true
  const lazyFnFalse = () => false

  describe.each(['immediate', 'after-load'] as const)(
    'commit: %s',
    (commit) => {
      describe.each([true, false, lazyFnFalse, lazyFnTrue] as const)(
        'lazy: %s',
        (lazy) => {
          it(`can resolve a "null" value`, async () => {
            const spy = vi
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValueOnce(null)
            const { useData, router } = singleLoaderOneRoute(
              loaderFactory({ lazy, commit, fn: spy })
            )
            await router.push('/fetch')
            expect(spy).toHaveBeenCalledTimes(1)
            const { data } = useData()
            expect(data.value).toEqual(null)
          })

          it('can reject outside of a navigation', async () => {
            const spy = vi
              .fn<(...args: unknown[]) => Promise<unknown>>()
              .mockResolvedValue('ko')

            const { useData, router } = singleLoaderOneRoute(
              loaderFactory({ lazy, commit, fn: spy })
            )
            // initial navigation
            await router.push('/fetch')
            const { error, reload } = useData()
            spy.mockRejectedValueOnce(new Error('ok'))
            await reload().catch(() => {})
            await vi.runAllTimersAsync()
            expect(spy).toHaveBeenCalledTimes(2)
            expect(error.value).toEqual(new Error('ok'))
          })

          it('can return a NavigationResult without affecting initial data', async () => {
            let calls = 0
            const spy = vi.fn(async (to: RouteLocationNormalizedLoaded) => {
              return calls++ === 0 ? new NavigationResult('/other') : to.query.p
            })
            const { useData, router } = singleLoaderOneRoute(
              loaderFactory({ lazy, commit, fn: spy })
            )
            await router.push('/fetch?p=ko')
            expect(spy).toHaveBeenCalled()
            const { data } = useData()
            expect(data.value).toEqual(undefined)
          })

          it('can return a NavigationResult without affecting loaded data', async () => {
            let calls = 0
            const spy = vi.fn(async (to: RouteLocationNormalizedLoaded) => {
              return calls++ > 0 ? new NavigationResult('/other') : to.query.p
            })
            const { useData, router } = singleLoaderOneRoute(
              loaderFactory({ lazy, commit, fn: spy })
            )
            await router.push('/fetch?p=ok')
            const { data } = useData()
            expect(spy).toHaveBeenCalled()
            expect(data.value).toEqual('ok')
            await router.push('/fetch?p=ko')
            expect(data.value).toEqual('ok')
          })

          // in lazy false, commit after-load, the error prevents the navigation
          // so the error doesn't even get a chance to be used if we navigate. This is why we do a first regular navigation and then a reload: to force the fetch again
          it('can return a NavigationResult without affecting the last error', async () => {
            const spy = vi.fn().mockResolvedValueOnce('ko')
            const { useData, router } = singleLoaderOneRoute(
              loaderFactory({ lazy, commit, fn: spy })
            )
            await router.push('/fetch?p=ok').catch(() => {})
            const { error, reload } = useData()
            spy.mockRejectedValueOnce(new Error('ok'))
            await reload().catch(() => {})
            expect(spy).toHaveBeenCalled()
            expect(error.value).toEqual(new Error('ok'))
            spy.mockResolvedValueOnce(new NavigationResult('/other'))
            await router.push('/fetch?p=ko').catch(() => {})
            expect(error.value).toEqual(new Error('ok'))
          })

          it(`the resolved data is present after navigation`, async () => {
            const spy = vi
              .fn<(...args: unknown[]) => Promise<string>>()
              .mockResolvedValueOnce('resolved')
            const { wrapper, useData, router } = singleLoaderOneRoute(
              // loaders are not require to allow sync return values
              loaderFactory({ lazy, commit, fn: spy })
            )
            expect(spy).not.toHaveBeenCalled()
            await router.push('/fetch')
            expect(wrapper.get('#error').text()).toBe('')
            expect(wrapper.get('#isLoading').text()).toBe('false')
            expect(wrapper.get('#data').text()).toBe('resolved')
            expect(spy).toHaveBeenCalledTimes(1)
            const { data } = useData()
            expect(data.value).toEqual('resolved')
          })

          it(`can be forced reloaded`, async () => {
            const spy = vi
              .fn<(...args: unknown[]) => Promise<string>>()
              .mockResolvedValueOnce('resolved 1')
            const { router, useData } = singleLoaderOneRoute(
              loaderFactory({ lazy, commit, fn: spy })
            )
            await router.push('/fetch')
            expect(spy).toHaveBeenCalledTimes(1)
            const { data, reload } = useData()
            expect(data.value).toEqual('resolved 1')
            spy.mockResolvedValueOnce('resolved 2')
            await reload()
            expect(data.value).toEqual('resolved 2')
            expect(spy).toHaveBeenCalledTimes(2)
            spy.mockResolvedValueOnce('resolved 3')
            await reload()
            expect(spy).toHaveBeenCalledTimes(3)
            expect(data.value).toEqual('resolved 3')
          })

          it('always reloads if the previous result is an error', async () => {
            let calls = 0
            const spy = vi.fn(async () => {
              if (calls++ === 0) {
                throw new Error('nope')
              } else {
                return 'ok'
              }
            })
            const { useData, router } = singleLoaderOneRoute(
              loaderFactory({
                fn: spy,
                lazy,
                commit,
              })
            )
            await router.push('/fetch').catch(() => {})
            // await vi.runAllTimersAsync()
            expect(spy).toHaveBeenCalledTimes(1)

            // for lazy loaders we need to navigate to trigger the loader
            // so we add a hash to enforce that
            await router.push('/fetch#two').catch(() => {})
            const { data, error } = useData()
            // await vi.runAllTimersAsync()
            expect(spy).toHaveBeenCalledTimes(2)
            expect(data.value).toBe('ok')
            expect(error.value).toBe(null)
          })

          it('keeps the existing error until the new data is resolved', async () => {
            const l = mockedLoader({ lazy, commit })
            const { useData, router } = singleLoaderOneRoute(l.loader)
            l.spy.mockResolvedValueOnce('initial')
            // initiate the loader and then force an error
            await router.push('/fetch?p=ko')
            const { data, error, reload } = useData()
            // force the error
            l.spy.mockRejectedValueOnce(new Error('ok'))
            await reload().catch(() => {})
            await vi.runAllTimersAsync()
            expect(error.value).toEqual(new Error('ok'))

            // trigger a new navigation
            router.push('/fetch?p=ok')
            await vi.runAllTimersAsync()
            // we still see the error
            expect(error.value).toEqual(new Error('ok'))
            l.resolve('resolved')
            await vi.runAllTimersAsync()
            // not anymore
            expect(data.value).toBe('resolved')
          })
        }
      )

      it(`should abort the navigation if a non lazy loader throws, commit: ${commit}`, async () => {
        const { router } = singleLoaderOneRoute(
          loaderFactory({
            fn: async () => {
              throw new Error('nope')
            },
            lazy: false,
            commit,
          })
        )
        const onError = vi.fn()
        router.onError(onError)
        await expect(router.push('/fetch')).rejects.toThrow('nope')
        expect(onError).toHaveBeenCalledTimes(1)
        expect(router.currentRoute.value.path).not.toBe('/fetch')
      })

      it(`should complete the navigation if a lazy loader throws, commit: ${commit}`, async () => {
        const { useData, router } = singleLoaderOneRoute(
          loaderFactory({
            fn: async () => {
              throw new Error('nope')
            },
            lazy: true,
            commit,
          })
        )
        await router.push('/fetch').catch(() => {})
        expect(router.currentRoute.value.path).toBe('/fetch')
        const { data, isLoading, error } = useData()
        await flushPromises()
        expect(isLoading.value).toBe(false)
        expect(data.value).toBe(undefined)
        expect(error.value).toEqual(new Error('nope'))
      })

      describe('custom errors', () => {
        class CustomError extends Error {
          override name = 'CustomError'
        }
        it(`should complete the navigation if a non-lazy loader throws an expected error, commit: ${commit}`, async () => {
          const { wrapper, useData, router } = singleLoaderOneRoute(
            loaderFactory({
              fn: async () => {
                throw new CustomError()
              },
              lazy: false,
              commit,
              errors: [CustomError],
            })
          )
          await router.push('/fetch')
          expect(router.currentRoute.value.path).toBe('/fetch')
          const { data, error, isLoading } = useData()
          expect(wrapper.get('#error').text()).toBe('CustomError')
          expect(isLoading.value).toBe(false)
          expect(data.value).toBe(undefined)
          expect(error.value).toBeInstanceOf(CustomError)
        })

        it(`should complete the navigation if a non-lazy loader throws an expected global error, commit: ${commit}`, async () => {
          const { wrapper, useData, router } = singleLoaderOneRoute(
            loaderFactory({
              fn: async () => {
                throw new CustomError()
              },
              lazy: false,
              commit,
              errors: true,
            }),
            { errors: [CustomError] }
          )
          await router.push('/fetch')
          const { data, error, isLoading } = useData()
          expect(wrapper.get('#error').text()).toBe('CustomError')
          expect(isLoading.value).toBe(false)
          expect(data.value).toBe(undefined)
          expect(error.value).toBeInstanceOf(CustomError)
          expect(router.currentRoute.value.path).toBe('/fetch')
        })

        it(`accepts a function as a global setting instead of a constructor, commit: ${commit}`, async () => {
          const { wrapper, useData, router } = singleLoaderOneRoute(
            loaderFactory({
              fn: async () => {
                throw new CustomError()
              },
              lazy: false,
              commit,
              errors: true,
            }),
            { errors: (reason) => reason instanceof CustomError }
          )
          await router.push('/fetch')
          const { data, error, isLoading } = useData()
          expect(wrapper.get('#error').text()).toBe('CustomError')
          expect(isLoading.value).toBe(false)
          expect(data.value).toBe(undefined)
          expect(error.value).toBeInstanceOf(CustomError)
          expect(router.currentRoute.value.path).toBe('/fetch')
        })

        it(`local errors take priority over a global function that returns false, commit: ${commit}`, async () => {
          const { wrapper, useData, router } = singleLoaderOneRoute(
            loaderFactory({
              fn: async () => {
                throw new CustomError()
              },
              lazy: false,
              commit,
              errors: [CustomError],
            }),
            { errors: () => false }
          )
          await router.push('/fetch')
          const { data, error, isLoading } = useData()
          expect(wrapper.get('#error').text()).toBe('CustomError')
          expect(isLoading.value).toBe(false)
          expect(data.value).toBe(undefined)
          expect(error.value).toBeInstanceOf(CustomError)
          expect(router.currentRoute.value.path).toBe('/fetch')
        })
      })

      it(`propagates errors from nested loaders, commit: ${commit}`, async () => {
        const l1 = mockedLoader({
          key: 'nested',
          commit,
          lazy: false,
        })
        const { router } = singleLoaderOneRoute(
          loaderFactory({
            fn: async (to) => {
              const data = await l1.loader()
              return `${data},${to.query.p}`
            },
            key: 'root',
          })
        )

        const p = router.push('/fetch?p=one')
        await vi.runOnlyPendingTimersAsync()

        l1.reject(new Error('nope'))
        await expect(p).rejects.toThrow('nope')
      })
    }
  )

  it('passes a signal to the loader', async () => {
    const spy =
      vi.fn<
        (
          to: RouteLocationNormalizedLoaded,
          context: DataLoaderContextBase
        ) => Promise<unknown>
      >()
    spy.mockResolvedValueOnce('ok')
    const { router } = singleLoaderOneRoute(loaderFactory({ fn: spy }))
    await router.push('/fetch?p=ok')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls.at(0)?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('blocks navigation by default (non lazy)', async () => {
    const [spy, resolve] = mockPromise('resolved')
    const { useData, router } = singleLoaderOneRoute(loaderFactory({ fn: spy }))
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
    const [spy, resolve] = mockPromise('resolved')
    const { wrapper, useData, router } = singleLoaderOneRoute(
      loaderFactory({
        fn: spy,
        lazy: true,
      })
    )
    expect(spy).not.toHaveBeenCalled()
    await router.push('/fetch')
    expect(router.currentRoute.value.fullPath).toEqual('/fetch')
    expect(spy).toHaveBeenCalled()
    expect(wrapper.get('#error').text()).toBe('')
    expect(wrapper.get('#isLoading').text()).toBe('true')
    expect(wrapper.get('#data').text()).toBe('')
    const { data } = useData()
    expect(data.value).toEqual(undefined)
    resolve()
    await vi.runAllTimersAsync()
    expect(data.value).toEqual('resolved')
    expect(wrapper.get('#isLoading').text()).toBe('false')
    expect(wrapper.get('#data').text()).toBe('resolved')
  })

  it('discards a pending load if a new navigation happens', async () => {
    let calls = 0
    let resolveFirstCall!: (val?: unknown) => void
    let resolveSecondCall!: (val?: unknown) => void
    const p1 = new Promise((r) => (resolveFirstCall = r))
    const p2 = new Promise((r) => (resolveSecondCall = r))
    const { useData, router } = singleLoaderOneRoute(
      loaderFactory({
        fn: async (to) => {
          calls++
          if (calls === 1) {
            await p1
          } else if (calls === 2) {
            await p2
          }
          return to.query.p
        },
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
      .fn<(to: RouteLocationNormalizedLoaded) => Promise<unknown>>()
      .mockImplementation(async (to) => {
        nestedCalls++
        if (nestedCalls === 1) {
          await nestedP1
        } else {
          await nestedP2
        }
        return to.query.p
      })
    const useNestedLoader = loaderFactory({
      fn: nestedLoaderSpy,
      key: 'nested',
    })

    let rootCalls = 0
    let resolveRootFirstCall!: (val?: unknown) => void
    let resolveRootSecondCall!: (val?: unknown) => void
    const rootP1 = new Promise((r) => (resolveRootFirstCall = r))
    const rootP2 = new Promise((r) => (resolveRootSecondCall = r))

    const rootLoaderSpy = vi
      .fn<(to: RouteLocationNormalizedLoaded) => Promise<unknown>>()
      .mockImplementation(async (to) => {
        rootCalls++
        const data = await useNestedLoader()
        if (rootCalls === 1) {
          await rootP1
        } else {
          await rootP2
        }
        return `${data},${to.query.p}`
      })

    const { useData, router, app } = singleLoaderOneRoute(
      loaderFactory({ fn: rootLoaderSpy, key: 'root' })
    )
    const firstNavigation = router.push('/fetch?p=one')
    // we resolve the first root to give the nested loader a chance to run
    resolveRootFirstCall()
    // allows root loader to run
    await vi.runAllTimersAsync()

    expect(rootLoaderSpy).toHaveBeenCalledTimes(1)
    // using toHaveBeenCalledWith yields an error that is difficult to debug
    // so this is for debugging purposes
    expect(rootLoaderSpy.mock.calls.at(0)?.at(0)?.fullPath).toBe('/fetch?p=one')

    expect(nestedLoaderSpy).toHaveBeenCalledTimes(1)
    expect(nestedLoaderSpy.mock.calls.at(-1)?.at(0)?.fullPath).toBe(
      '/fetch?p=one'
    )

    // now trigger the second navigation while the nested loader is pending
    const secondNavigation = router.push('/fetch?p=two')
    await vi.runAllTimersAsync()

    expect(rootLoaderSpy).toHaveBeenCalledTimes(2)
    expect(rootLoaderSpy.mock.calls.at(1)?.at(0)?.fullPath).toBe('/fetch?p=two')

    resolveRootSecondCall()
    await vi.runAllTimersAsync()

    expect(nestedLoaderSpy).toHaveBeenCalledTimes(2)
    expect(nestedLoaderSpy.mock.calls.at(-1)?.at(0)?.fullPath).toBe(
      '/fetch?p=two'
    )

    // the nested gets resolved for the first time
    resolveNestedFirstCall()
    resolveNestedSecondCall()
    await vi.runAllTimersAsync()

    // explicitly wait for both navigations to ensure everything ran
    await firstNavigation
    await secondNavigation

    expect(rootCalls).toEqual(2)
    expect(nestedCalls).toEqual(2)

    // only the data from the second navigation should be preserved
    const { data } = useData()
    const { data: nestedData } = app.runWithContext(() => useNestedLoader())

    expect(rootCalls).toEqual(2)
    expect(nestedCalls).toEqual(2)

    expect(nestedData.value).toEqual('two')
    expect(data.value).toEqual('two,two')
  })

  it('discards a pending load from a previous navigation that resolved later', async () => {
    let nestedCalls = 0
    let resolveNestedFirstCall!: (val?: unknown) => void
    let resolveNestedSecondCall!: (val?: unknown) => void
    const nestedP1 = new Promise((r) => (resolveNestedFirstCall = r))
    const nestedP2 = new Promise((r) => (resolveNestedSecondCall = r))
    const useNestedLoader = loaderFactory({
      fn: async (to) => {
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
      },
      key: 'nested',
    })

    let rootCalls = 0
    let resolveRootFirstCall!: (val?: unknown) => void
    let resolveRootSecondCall!: (val?: unknown) => void
    const rootP1 = new Promise((r) => (resolveRootFirstCall = r))
    const rootP2 = new Promise((r) => (resolveRootSecondCall = r))

    const { useData, router, app } = singleLoaderOneRoute(
      loaderFactory({
        fn: async (to) => {
          rootCalls++
          const data = await useNestedLoader()
          if (rootCalls === 1) {
            await rootP1
          } else {
            await rootP2
          }
          return `${data},${to.query.p}`
        },
        key: 'root',
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

  it('discards a pending load if trying to navigate back to the current location', async () => {
    let calls = 0
    let resolveCall1!: (val?: unknown) => void
    let resolveCall2!: (val?: unknown) => void
    let resolveCall3!: (val?: unknown) => void
    const p1 = new Promise((r) => (resolveCall1 = r))
    const p2 = new Promise((r) => (resolveCall2 = r))
    const p3 = new Promise((r) => (resolveCall3 = r))
    const spy = vi
      .fn<(to: RouteLocationNormalizedLoaded) => Promise<unknown>>()
      .mockImplementation(async (to) => {
        calls++
        // the first one should be skipped
        if (calls === 2) {
          await p1
        } else if (calls === 3) {
          await p2
        } else if (calls === 4) {
          await p3
          // this should never happen or be used because the last navigation is considered duplicated
          return 'ko'
        }
        return to.query.p as string
      })
    const { useData, router } = singleLoaderOneRoute(loaderFactory({ fn: spy }))
    // set the initial location
    await router.push('/fetch?p=ok')

    const { data } = useData()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(data.value).toEqual('ok')

    // try running two navigations to a different location
    router.push('/fetch?p=ko')
    await vi.runAllTimersAsync()
    expect(spy).toHaveBeenCalledTimes(2)
    router.push('/fetch?p=ko')
    await vi.runAllTimersAsync()
    expect(spy).toHaveBeenCalledTimes(3)

    // but roll back to the initial one
    router.push('/fetch?p=ok')
    await vi.runAllTimersAsync()
    // it runs 3 times because in vue router, going from /fetch?p=ok to /fetch?p=ok fails right away, so the loader are never called
    // We simply don't test it because it doesn't matter, what matters is what value is preserved in the end
    // expect(spy).toHaveBeenCalledTimes(3)

    resolveCall1()
    resolveCall2()
    resolveCall3()
    await vi.runAllTimersAsync()
    await router.getPendingNavigation()

    // it preserves the initial value
    expect(data.value).toEqual('ok')
  })

  it('loader result can be awaited for the data to be ready', async () => {
    const [spy, resolve] = mockPromise('resolved')

    const { app, useData, router } = singleLoaderOneRoute(
      loaderFactory({ fn: async () => spy(), key: 'a' })
    )
    router.push('/fetch')
    // ensures the useData is called first
    await vi.runAllTimersAsync()
    const useDataPromise = app.runWithContext(() => useData())
    await vi.runAllTimersAsync()
    expect(useDataPromise).toBeInstanceOf(Promise)
    resolve()
    const data = await useDataPromise
    // await router.getPendingNavigation()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(data).toEqual('resolved')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(data).toEqual('resolved')
  })

  it('can nest loaders', async () => {
    const spyOne = vi
      .fn<(...args: unknown[]) => Promise<string>>()
      .mockResolvedValue('ko')
      .mockResolvedValueOnce('one')
    const spyTwo = vi
      .fn<(...args: unknown[]) => Promise<string>>()
      .mockResolvedValue('ko')
      .mockResolvedValueOnce('two')
    const useLoaderOne = loaderFactory({ fn: spyOne, key: 'one' })
    const useLoaderTwo = loaderFactory({
      fn: async () => {
        const one = await useLoaderOne()
        const two = await spyTwo()
        return `${one},${two}`
      },
      key: 'two',
    })
    const { useData, router } = singleLoaderOneRoute(useLoaderTwo)
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
    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
        ],
      },
    })

    expect(dataOneSpy).toHaveBeenCalledTimes(0)
    await router.push('/fetch')
    await vi.runOnlyPendingTimersAsync()
    expect(dataOneSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toMatchInlineSnapshot('"resolved 1resolved 1"')
  })

  it(`reuses loaders when they are both nested and used in navigation`, async () => {
    const l1 = mockedLoader({ key: 'nested' })
    const rootLoader = loaderFactory({
      fn: async (to) => {
        const d = await l1.loader()
        return `${d},${to.query.p}`
      },
      key: 'root',
    })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: defineComponent({
        setup() {
          const { data } = rootLoader()
          return { data }
        },
        template: `<p>{{ data }}</p>`,
      }),
      meta: {
        loaders: [rootLoader, l1.loader],
      },
    })
    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
        ],
      },
    })

    router.push('/fetch?p=one')
    await vi.runOnlyPendingTimersAsync()
    l1.resolve('ok')
    await vi.runOnlyPendingTimersAsync()
    // should have navigated and called the nested loader once
    expect(l1.spy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/fetch?p=one')
    expect(wrapper.text()).toBe(`ok,one`)
  })

  it(`can use a nested loaded directly in the component`, async () => {
    const l1 = mockedLoader({ key: 'nested' })
    const rootLoader = loaderFactory({
      fn: async (to) => {
        const d = await l1.loader()
        return `${d},${to.query.p}`
      },
      key: 'root',
    })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: defineComponent({
        setup() {
          const { data } = l1.loader()
          const { data: root } = rootLoader()
          return { root, data }
        },
        template: `<p>{{ root }} {{ data }}</p>`,
      }),
      meta: {
        loaders: [rootLoader, l1.loader],
      },
    })
    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
        ],
      },
    })

    router.push('/fetch?p=one')
    await vi.runOnlyPendingTimersAsync()
    l1.resolve('ok')
    await vi.runOnlyPendingTimersAsync()
    // should have navigated and called the nested loader once
    expect(l1.spy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/fetch?p=one')
    expect(wrapper.text()).toBe('ok,one ok')
  })

  it('keeps the old data until all loaders are resolved', async () => {
    const router = getRouter()
    const l1 = mockedLoader({ commit: 'after-load', key: 'l1' })
    const l2 = mockedLoader({ commit: 'after-load', key: 'l2' })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: defineComponent({
        template: `<p></p>`,
      }),
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })
    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
        ],
      },
    })
    const app: App = wrapper.vm.$.appContext.app

    const p = router.push('/fetch')
    await vi.runOnlyPendingTimersAsync()
    l1.resolve('one')
    await vi.runOnlyPendingTimersAsync()

    const { data: one } = app.runWithContext(() => l1.loader())
    const { data: two } = app.runWithContext(() => l2.loader())
    expect(l1.spy).toHaveBeenCalledTimes(1)
    expect(l2.spy).toHaveBeenCalledTimes(1)

    // it waits for both to be resolved
    expect(one.value).toEqual(undefined)
    l2.resolve('two')
    await vi.runOnlyPendingTimersAsync()
    await p
    expect(one.value).toEqual('one')
    expect(two.value).toEqual('two')
  })

  it.each([new NavigationResult(false), new Error('ko')] as const)(
    'does not commit new data if loader returns %s',
    async (resolvedValue) => {
      const l1 = mockedLoader({ lazy: false, commit: 'after-load', key: 'l1' })
      const l2 = mockedLoader({ lazy: false, commit: 'after-load', key: 'l2' })
      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component: defineComponent({
          template: `<p></p>`,
        }),
        meta: {
          loaders: [l1.loader, l2.loader],
        },
      })

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [
            [DataLoaderPlugin, { router }],
            ...(plugins?.(customContext!) || []),
          ],
        },
      })
      const app: App = wrapper.vm.$.appContext.app

      const p = router.push('/fetch').catch(() => {})
      await vi.runOnlyPendingTimersAsync()
      l1.resolve('ko')
      await vi.runOnlyPendingTimersAsync()
      expect(l1.spy).toHaveBeenCalledTimes(1)
      expect(l2.spy).toHaveBeenCalledTimes(1)
      if (resolvedValue instanceof NavigationResult) {
        l2.resolve(resolvedValue)
      } else {
        l2.reject(resolvedValue)
      }
      await vi.runOnlyPendingTimersAsync()
      await p
      const { data: one, error: e1 } = app.runWithContext(() => l1.loader())
      const { data: two, error: e2 } = app.runWithContext(() => l2.loader())
      expect(one.value).toBeUndefined()
      expect(e1.value).toBeUndefined()
      expect(two.value).toBeUndefined()
      expect(e2.value).toBeUndefined()
    }
  )

  it('awaits for a lazy loader if used as a nested loader', async () => {
    const l1 = mockedLoader({ lazy: true, key: 'nested' })
    const { useData, router } = singleLoaderOneRoute(
      loaderFactory({
        fn: async (to) => {
          const data = await l1.loader()
          return `${data},${to.query.p}`
        },
        key: 'root',
      })
    )

    router.push('/fetch?p=one')
    await vi.runOnlyPendingTimersAsync()

    const { data } = useData()
    expect(data.value).toEqual(undefined)

    l1.resolve('ok')
    await vi.runOnlyPendingTimersAsync()
    expect(data.value).toEqual('ok,one')
  })

  it(`reuses a nested loader result even if it's called first from another loader`, async () => {
    const l1 = mockedLoader({ key: 'search-results', lazy: false })
    const spy = vi.fn(async (to: RouteLocationNormalizedLoaded) => {
      // get search results from the search loader
      const data = await l1.loader()
      // then fetch images in high res
      return `${data},${to.query.p}`
    })
    const l2 = loaderFactory({
      fn: spy,
      key: 'images-from-search',

      // to ensure this is not awaited
      lazy: true,
      server: false,
    })

    let useDataResult!: ReturnType<typeof l1.loader>

    const component = defineComponent({
      setup() {
        // it shouldn't matter if l2 is used or not, what matters is the order
        useDataResult = l1.loader()
        l2()
        return {}
      },
      template: `<p>a</p>`,
    })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      meta: {
        // the images should run first to simulate the issue
        // in practice the user does not control the order of the loaders and it shouldn't matter
        loaders: [l2, l1.loader],
        // this scenario would work
        // loaders: [l1.loader, l2],
      },
      component,
    })

    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
        ],
      },
    })

    router.push('/fetch?p=one')
    await vi.runOnlyPendingTimersAsync()
    l1.resolve('search')
    await flushPromises()

    const app: App = wrapper.vm.$.appContext.app
    const l2Data = app.runWithContext(() => l2())

    expect(useDataResult?.data.value).toEqual('search')
    expect(l2Data.data.value).toEqual('search,one')
    expect(l1.spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it.todo('passes to and from to the function version of lazy', async () => {})
  it.todo('can be first non-lazy then lazy', async () => {})
  it.todo('can be first non-lazy then lazy', async () => {})

  // https://github.com/posva/unplugin-vue-router/issues/495
  // in the issue above we have one page with a loader
  // this page is conditionally rendered based on an error state
  // when resetting the error state, there is also a duplicated navigation
  // that invalidates any pendingLoad and renders the page again
  // since there is no navigation, loaders are not called again and
  // there is no pendingLoad
  it('gracefully handles a loader without a pendingLoad', async () => {
    const l1 = mockedLoader({ lazy: false, key: 'l1' })
    const router = getRouter()
    router.addRoute({
      name: 'a',
      path: '/a',
      component: defineComponent({
        setup() {
          const { data } = l1.loader()
          return { data }
        },
        template: `<p>{{ data }}</p>`,
      }),
      meta: {
        loaders: [l1.loader],
      },
    })
    l1.spy.mockResolvedValue('ok')

    const isVisible = ref(true)


    const wrapper = mount(
      () => (isVisible.value ? h(RouterViewMock) : h('p', ['hidden'])),
      {
        global: {
          plugins: [
            [DataLoaderPlugin, { router }],
            ...(plugins?.(customContext!) || []),
          ],
        },
      }
    )

    await router.push('/a')
    expect(wrapper.text()).toBe('ok')
    isVisible.value = false
    await nextTick()
    expect(wrapper.text()).toBe('hidden')
    await router.push('/a') // failed duplicated navigation
    isVisible.value = true
    await nextTick()
    expect(wrapper.text()).toBe('ok')
  })

  describe('app.runWithContext()', () => {
    it('can inject globals', async () => {
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          async fn() {
            return inject('key', 'ko')
          },
        })
      )
      app.provide('key', 'ok')
      await router.push('/fetch')
      const { data } = useData()
      expect(data.value).toEqual('ok')
    })

    it('can inject globals in nested loaders', async () => {
      const nestedLoader = loaderFactory({
        async fn() {
          return inject('key', 'ko')
        },
        key: 'nested',
      })
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          async fn() {
            return await nestedLoader()
          },
          key: 'root',
        })
      )
      app.provide('key', 'ok')
      await router.push('/fetch')
      const { data } = useData()
      expect(data.value).toEqual('ok')
    })

    it('can inject globals in nested loaders that run after other loaders', async () => {
      const l1 = loaderFactory({
        fn: async () => {
          return inject('key', 'ko')
        },
        key: 'l1',
      })
      const l2 = loaderFactory({
        fn: async () => {
          return inject('key', 'ko')
        },
        key: 'l2',
      })
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          fn: async () => {
            // this could be written like this, but we allow both for convenience
            // const [a, b] = await Promise.all([l1(), l2()])
            const a = await l1()
            const b = await l2()
            return `${a},${b}`
          },
          key: 'root',
        })
      )
      app.provide('key', 'ok')
      await router.push('/fetch')
      const { data } = useData()
      expect(data.value).toEqual('ok,ok')
    })

    it('can inject globals when reloaded', async () => {
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          fn: async () => {
            return inject('key', 'ko')
          },
        })
      )
      await router.push('/fetch')
      const { data, reload } = useData()
      // we provide afterwards to ensure the nested child is called again
      expect(data.value).not.toBe('ok')
      app.provide('key', 'ok')
      await reload()
      expect(data.value).toBe('ok')
    })

    it('can inject globals in nested loaders when reloaded', async () => {
      const l1 = loaderFactory({
        fn: async () => {
          return inject('key', 'ko')
        },
        key: 'l1',
      })
      const l2 = loaderFactory({
        fn: async () => {
          return inject('key', 'ko')
        },
        key: 'l2',
      })
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          fn: async () => {
            // hmm FIXME: stopped here,
            const [a, b] = await Promise.all([l1(), l2()])
            // const a = await l1()
            // const b = await l2()
            return `${a},${b}`
          },
          key: 'root',
        })
      )
      await router.push('/fetch')
      const { data, reload } = useData()
      // we provide afterwards to ensure the nested child is called again
      expect(data.value).not.toBe('ok,ok')
      app.provide('key', 'ok')
      await reload()
      expect(data.value).toBe('ok,ok')
    })
  })
}
