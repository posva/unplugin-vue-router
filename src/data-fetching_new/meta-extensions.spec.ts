import { describe, it } from 'vitest'
import { defineComponent } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineLoader } from './defineLoader'

describe('meta-extensions', () => {
  it('has tds', () => {})
})

async function _dts() {
  const component = defineComponent({})
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      // empty
      {
        path: '/',
        component,
        meta: {
          loaders: [],
        },
      },

      // mixed
      {
        path: '/',
        component,
        meta: {
          loaders: [
            defineLoader(async () => ({ name: 'foo' })),
            defineLoader(async () => ({ name: 'foo' }), {}),
            defineLoader(async () => ({ name: 'foo' }), { lazy: true }),
            defineLoader(async () => ({ name: 'foo' }), { lazy: false }),
          ],
        },
      },

      // only lazy: true
      {
        path: '/',
        component,
        meta: {
          loaders: [
            defineLoader(async () => ({ name: 'foo' }), { lazy: true }),
            defineLoader(async () => ({ name: 'foo' }), { lazy: true }),
          ],
        },
      },

      // only lazy: false
      {
        path: '/',
        component,
        meta: {
          loaders: [
            defineLoader(async () => ({ name: 'foo' }), { lazy: false }),
            defineLoader(async () => ({ name: 'foo' }), { lazy: false }),
          ],
        },
      },
    ],
  })

  router.addRoute({
    path: '/',
    component,
    meta: {
      loaders: [
        defineLoader(async () => ({ name: 'foo' }), { lazy: false }),
        defineLoader(async () => ({ name: 'foo' }), { lazy: false }),
      ],
    },
  })

  router.addRoute({
    path: '/',
    component,
    meta: {
      loaders: [
        defineLoader(async () => ({ name: 'foo' }), { lazy: true }),
        defineLoader(async () => ({ name: 'foo' }), { lazy: true }),
      ],
    },
  })
}
