// @ts-nocheck
/**
 * This allows us to override imports from 'vue-router'
 */
import { routes } from '~routes'
import { createRouter as _createRouter } from 'vue-router'

export * from 'vue-router'

export function createRouter(options) {
  return _createRouter({
    routes,
    ...options,
  })
}

export { createRouter as createSmartRouter }
