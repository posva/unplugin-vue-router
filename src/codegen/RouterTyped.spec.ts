import { describe, it } from 'vitest'
import { expectType } from 'ts-expect'
import type {
  RouteLocationTyped,
  RouteRecordInfo,
  _RouteMapGeneric,
  _RouterTyped as RouterTyped,
} from './generateRouteMap'
import type {
  _ParamValue,
  _ParamValueOneOrMore,
  _ParamValueZeroOrOne,
  _ParamValueZeroOrMore,
} from './generateRouteParams'

function defineRouter<RM extends _RouteMapGeneric>(): RouterTyped<RM> {
  return {} as RouterTyped<RM>
}

function typeTest(fn: () => any) {
  return fn
}

describe('RouterTyped', () => {
  // type is needed instead of an interface
  // https://github.com/microsoft/TypeScript/issues/15300
  type RouteMap = {
    '/[...path]': RouteRecordInfo<
      '/[...path]',
      '/:path(.*)',
      { path: _ParamValue<true> },
      { path: _ParamValue<false> }
    >
    '/[a]': RouteRecordInfo<
      '/[a]',
      '/:a',
      { a: _ParamValue<true> },
      { a: _ParamValue<false> }
    >
    '/a': RouteRecordInfo<
      '/a',
      '/a',
      Record<never, never>,
      Record<never, never>
    >
    '/[id]+': RouteRecordInfo<
      '/[id]+',
      '/:id+',
      { id: _ParamValueOneOrMore<true> },
      { id: _ParamValueOneOrMore<false> }
    >
  }
  const router = defineRouter<RouteMap>()

  it('resolve', () => {
    typeTest(() => {
      expectType<Record<never, never>>(router.resolve({ name: '/a' }).params)
      expectType<{ a: _ParamValue<true> }>(
        router.resolve({ name: '/[a]' }).params
      )

      expectType<RouteLocationTyped<RouteMap, '/a'>>(
        router.resolve({ name: '/a' })
      )
      expectType<'/a'>(
        // @ts-expect-error: cannot infer based on path
        router.resolve({ path: '/a' }).name
      )
      expectType<keyof RouteMap>(router.resolve({ path: '/a' }).name)
    })
  })

  it('resolve', () => {
    typeTest(() => {
      router.push({ name: '/a', params: { a: 2 } })
      // @ts-expect-error
      router.push({ name: '/[a]', params: {} })
      // still allow relative params
      router.push({ name: '/[a]' })
      // @ts-expect-error
      router.push({ name: '/[a]', params: { a: [2] } })
      router.push({ name: '/[id]+', params: { id: [2] } })
      router.push({ name: '/[id]+', params: { id: [2, '3'] } })
      // @ts-expect-error
      router.push({ name: '/[id]+', params: { id: 2 } })
    })
  })

  it('beforeEach', () => {
    typeTest(() => {
      router.beforeEach((to, from) => {
        // @ts-expect-error: no route named this way
        if (to.name === '/[id]') {
        } else if (to.name === '/[a]') {
          expectType<{ a: _ParamValue<true> }>(to.params)
        }
        // @ts-expect-error: no route named this way
        if (from.name === '/[id]') {
        } else if (to.name === '/[a]') {
          expectType<{ a: _ParamValue<true> }>(to.params)
        }
        if (Math.random()) {
          return { name: '/[a]', params: { a: 2 } }
        } else if (Math.random()) {
          return '/any route does'
        }
        return true
      })
    })
  })

  it('beforeResolve', () => {
    typeTest(() => {
      router.beforeResolve((to, from) => {
        // @ts-expect-error: no route named this way
        if (to.name === '/[id]') {
        } else if (to.name === '/[a]') {
          expectType<{ a: _ParamValue<true> }>(to.params)
        }
        // @ts-expect-error: no route named this way
        if (from.name === '/[id]') {
        } else if (to.name === '/[a]') {
          expectType<{ a: _ParamValue<true> }>(to.params)
        }
        if (Math.random()) {
          return { name: '/[a]', params: { a: 2 } }
        } else if (Math.random()) {
          return '/any route does'
        }
        return true
      })
    })
  })

  it('afterEach', () => {
    typeTest(() => {
      router.afterEach((to, from) => {
        // @ts-expect-error: no route named this way
        if (to.name === '/[id]') {
        } else if (to.name === '/[a]') {
          expectType<{ a: _ParamValue<true> }>(to.params)
        }
        // @ts-expect-error: no route named this way
        if (from.name === '/[id]') {
        } else if (to.name === '/[a]') {
          expectType<{ a: _ParamValue<true> }>(to.params)
        }
        if (Math.random()) {
          return { name: '/[a]', params: { a: 2 } }
        } else if (Math.random()) {
          return '/any route does'
        }
        return true
      })
    })
  })
})
