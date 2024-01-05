import { describe, it, expectTypeOf } from 'vitest'
import {
  RouteLocationNormalized,
  RouteRecordName,
  _TypesConfig,
} from '../types'
import { ParamValue, ParamValueZeroOrMore, RouteRecordInfo } from '../types'

declare module '../types' {
  // Extend with some custom routes
  interface _TypesConfig {
    RouteNamedMap: {
      home: RouteRecordInfo<
        '/',
        '/',
        Record<never, never>,
        Record<never, never>
      >
      '/[other]': RouteRecordInfo<
        '/[other]',
        '/:other',
        { other: ParamValue<true> },
        { other: ParamValue<false> }
      >
      '/[name]': RouteRecordInfo<
        '/[name]',
        '/:name',
        { name: ParamValue<true> },
        { name: ParamValue<false> }
      >
      '/[...path]': RouteRecordInfo<
        '/[...path]',
        '/:path(.*)',
        { path: ParamValue<true> },
        { path: ParamValue<false> }
      >
      '/deep/nesting/works/[[files]]+': RouteRecordInfo<
        '/deep/nesting/works/[[files]]+',
        '/deep/nesting/works/:files*',
        { files?: ParamValueZeroOrMore<true> },
        // @ts-expect-error: FIXME: shouldn't be nullable, only undefined
        { files?: ParamValueZeroOrMore<false> }
      >
    }
  }
}

describe('Route Location types', () => {
  it('RouteLocationNormalized', () => {
    function withRoute(fn: (to: RouteLocationNormalized) => void): void
    function withRoute<Name extends RouteRecordName>(
      name: Name,
      fn: (to: RouteLocationNormalized<Name>) => void
    ): void
    function withRoute<Name extends RouteRecordName>(...args: unknown[]) {}

    withRoute('/[name]', (to) => {
      expectTypeOf(to.params).toEqualTypeOf<{ name: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ notExisting: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ other: string }>()
    })

    withRoute('/[name]' as RouteRecordName, (to) => {
      // @ts-expect-error: no all params have this
      to.params.name
      if (to.name === '/[name]') {
        to.params.name
        // @ts-expect-error: no param other
        to.params.other
      }
    })

    withRoute((to) => {
      // @ts-expect-error: not all params object have a name
      to.params.name
      // @ts-expect-error: no route named like that
      if (to.name === '') {
      }
      if (to.name === '/[name]') {
        expectTypeOf(to.params).toEqualTypeOf<{ name: string }>()
        // @ts-expect-error: no param other
        to.params.other
      }
    })
  })
})
