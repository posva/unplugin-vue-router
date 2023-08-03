/**
 * @vitest-environment happy-dom
 */
import { Ref, defineComponent, shallowRef } from 'vue'
import { defineLoader } from './defineLoader'
import { expectType } from 'ts-expect'
import {
  MockInstance,
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { setCurrentContext } from './utils'
import { config, mount } from '@vue/test-utils'
import {
  VueRouterMock,
  createRouterMock,
  getRouter,
  injectRouterMock,
} from 'vue-router-mock'
import { setupRouter } from './navigation-guard'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function mockPromise<T, E>(resolved: T, rejected?: E) {
  let _resolve: null | ((resolvedValue: T) => void) = null
  let _reject: null | ((rejectedValue?: E) => void) = null
  function resolve(resolvedValue?: T) {
    if (!_resolve || !promise)
      throw new Error('Resolve called with no active promise')
    _resolve(resolvedValue ?? resolved)
    _resolve = null
    _reject = null
    promise = null
  }
  function reject(rejectedValue?: E) {
    if (!_reject || !promise)
      throw new Error('Resolve called with no active promise')
    _reject(rejectedValue ?? rejected)
    _resolve = null
    _reject = null
    promise = null
  }

  let promise: Promise<T> | null = null
  const spy = vi.fn<any[], Promise<T>>().mockImplementation(() => {
    return (promise = new Promise<T>((res, rej) => {
      _resolve = res
      _reject = rej
    }))
  })

  return [spy, resolve, reject] as const
}

// config.plugins.VueWrapper.install(VueRouterMock)

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

  function factory() {
    const useData = defineLoader('/users/:id', async ({ params }) => {
      return { id: params.id }
    })
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

    return mount(component)
  }

  describe('initial fetch', () => {
    it('sets the value', async () => {
      const wrapper = factory()
      const router = getRouter()
      await router.push('/fetch')
      console.log(wrapper.html())
      expect(wrapper.text()).toBe('/fetch')
      expect(wrapper.vm.$route.path).toBe('/fetch')
    })
  })
})
