import {
  VueRouterMock,
  createRouterMock as _createRouterMock,
  injectRouterMock,
  RouterMockOptions,
} from 'vue-router-mock'
import { config } from '@vue/test-utils'
import { beforeEach, vi, SpyInstance } from 'vitest'

export function createRouterMock(options?: RouterMockOptions) {
  return _createRouterMock({
    ...options,
    spy: {
      create: (fn) => vi.fn(fn),
      reset: (spy: SpyInstance) => spy.mockClear(),
      ...options?.spy,
    },
  })
}

export function setupRouterMock() {
  if (typeof global.document === 'undefined') {
    // skip this plugin in non jsdom environments
    return
  }

  const router = createRouterMock()

  beforeEach(() => {
    router.reset()
    injectRouterMock(router)
  })

  config.plugins.VueWrapper.install(VueRouterMock)
}

setupRouterMock()
