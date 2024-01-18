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
    '/[fooo]': RouteRecordInfo<
      '/[fooo]',
      '/:fooo',
      { fooo: ParamValue<true> },
      { fooo: ParamValue<false> }
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
router.push({ name: '' })
//      ^|
router.push('/')
```
