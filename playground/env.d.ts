/// <reference types="vite/client" />

declare module '@vue-router/routes' {
  import type {
    RouteRecordInfo,
    _ParamValue,
    _ParamValueOneOrMore,
    _ParamValueZeroOrMore,
    _ParamValueZeroOrOne,
  } from 'unplugin-vue-router'
  export interface RouteNamedMap {
    'custom-dynamic-name': RouteRecordInfo<
      'custom-dynamic-name',
      '/added-during-runtime/[...path]',
      { path: _ParamValue<true> },
      { path: _ParamValue<false> }
    >
  }
}
