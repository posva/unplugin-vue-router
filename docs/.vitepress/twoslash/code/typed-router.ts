/* prettier-ignore */

declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'vue-router'

  export interface RouteNamedMap {
    '/': RouteRecordInfo<
      '/',
      '/',
      Record<never, never>,
      Record<never, never>,
      | never
    >
    '/users': RouteRecordInfo<
      '/users',
      '/users',
      Record<never, never>,
      Record<never, never>,
      | never
    >
    '/users/[id]': RouteRecordInfo<
      '/users/[id]',
      '/users/:id',
      { id: ParamValue<true> },
      { id: ParamValue<false> },
      | '/users/[id]/edit'
    >
    '/users/[id]/edit': RouteRecordInfo<
      '/users/[id]/edit',
      '/users/:id/edit',
      { id: ParamValue<true> },
      { id: ParamValue<false> },
      | never
    >
  }
}
