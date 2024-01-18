# The types

```ts
// no
```

```ts twoslash
import "unplugin-vue-router/client"
declare module 'vue-router/auto-routes' {
   import type {
    RouteRecordInfo,
    ParamValue,
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router/types' 
  export interface RouteNamedMap {
    '/': RouteRecordInfo<
      '/',
      '/',
      Record<never, never>,
      Record<never, never>
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
  }
}
// ---cut---
// @moduleResolution: bundler
// @esModuleInterop: true
// @skipLibCheck: true
import { useRouter } from 'vue-router/auto'
const router = useRouter()
router.push({ name: 'nope' })
router.push('/')
// if (route.name === 'home') {
//   // 
// }
```
