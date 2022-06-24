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

describe('RouterTyped', () => {
  it('expects the correct types', () => {
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
    function test() {
      const router = defineRouter<RouteMap>()

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
    }
  })
})
