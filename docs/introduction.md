# The types

```ts twoslash
// @filename: env.d.ts
declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router/types'
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>
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
  }
}
// @filename: index.ts
import 'unplugin-vue-router/client'
import './env.d'
// ---cut---
// @moduleResolution: bundler
// @errors: 2322 2367
// @noErrors
import { useRouter, useRoute } from 'vue-router/auto'
const router = useRouter()
router.push({ name: '' })
//                   ^|
router.push('/')

const route = useRoute()
route.name === 'foo'
//      ^?
```

```ts twoslash
// @filename: env.d.ts
declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router/types'
  export interface RouteNamedMap {
    '/': RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>
    '/users': RouteRecordInfo<
      '/users',
      '/users',
      Record<never, never>,
      Record<never, never>
    >
    '/users/[id]': RouteRecordInfo<
      '/users/[id]',
      '/users/:id',
      { id: ParamValue<true> },
      { id: ParamValue<false> }
    >
    '/users/[id]/edit': RouteRecordInfo<
      '/users/[id]/edit',
      '/users/:id/edit',
      { id: ParamValue<true> },
      { id: ParamValue<false> }
    >
  }
}
// @filename: index.ts
import 'unplugin-vue-router/client'
import './env.d'
// ---cut---
// @errors: 2322
// @moduleResolution: bundler
import { useRouter, useRoute } from 'vue-router/auto'
const router = useRouter()
router.push({ name: '/users' })
//                   ^|
router.push('/')
```

what

```ts twoslash
// @errors: 2322
type A = '@foo' | '@bar' | '/foo' | '/bar'

const a: A = '@'
//             ^|
```
