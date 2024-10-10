import { describe, expectTypeOf, it } from 'vitest'
import { defineComponent } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineBasicLoader } from './defineLoader'
import { UseDataLoader } from './createDataLoader'

describe('meta-extensions', () => {
  it('works when adding routes', () => {
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
              defineBasicLoader(async () => ({ name: 'foo' })),
              defineBasicLoader(async () => ({ name: 'foo' }), {}),
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
            ],
          },
        },

        // only lazy: true
        {
          path: '/',
          component,
          meta: {
            loaders: [
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
            ],
          },
        },

        // only lazy: false
        {
          path: '/',
          component,
          meta: {
            loaders: [
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
              defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
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
          defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
          defineBasicLoader(async () => ({ name: 'foo' }), { lazy: false }),
        ],
      },
    })

    router.addRoute({
      path: '/',
      component,
      meta: {
        loaders: [
          defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
          defineBasicLoader(async () => ({ name: 'foo' }), { lazy: true }),
        ],
      },
    })
  })

  it('works when checking the type of meta', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [],
    })

    expectTypeOf<UseDataLoader[] | undefined>(
      // @ts-expect-error: FIXME: is this possible to test with the meta extension of vue-router module
      router.currentRoute.value.meta.loaders
    )
  })
})
