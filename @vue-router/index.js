// @ts-nocheck
/**
 * This allows us to override imports from 'vue-router'
 */
import { routes } from '@vue-router/routes'
import { createRouter as _createRouter } from 'vue-router'

export * from 'vue-router'

export function createRouter(options) {
  return _createRouter({
    routes,
    ...options,
  })
}

// TODO: is there any case where this is necessary?
export { createRouter as createSmartRouter }
