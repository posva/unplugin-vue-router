# Typed Routes

This plugin generates a `d.ts` file with all the typing overrides when the dev or build server is ran. Make sure to include it in your `tsconfig.json`'s (or `jsconfig.json`'s) `include` or `files` property:

```js
{
  // ...
  "include": [
    /* ... */
    "./typed-router.d.ts",
  ]
  // ...
}
```

Then, you will be able to import from `vue-router/auto` (instead of `vue-router`) to get access to the typed APIs.

::: tip
You can commit the newly added `.d.ts` files to your repository to make your life easier.
:::

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
// @errors: 2322 2339
// @moduleResolution: bundler
import { useRouter, useRoute } from 'vue-router/auto'
const router = useRouter()
router.push('')
//           ^|
```

## Extra types

You can always take a look at the generated `typed-router.d.ts` file to inspect what are the generated types. `unplugin-vue-router` improves upon many of the existing types in `vue-router` and adds a few ones as well:

### `RouteNamedMap`

The `RouteNamedMap` interface gives you access to all the metadata associated with a route. It can also be extended to enable types for **dynamic routes** that are added during runtime.

```ts
import type { RouteNamedMap } from 'vue-router/auto-routes'
```

Extending types with dynamically added routes:

```ts
export {} // needed in .d.ts files
declare module 'vue-router/auto-routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    // these are other param helper types
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router/types'

  export interface RouteNamedMap {
    // the key is the name and should match the first generic of RouteRecordInfo
    'custom-dynamic-name': RouteRecordInfo<
      'custom-dynamic-name',
      '/added-during-runtime/[...path]',
      // these are the raw param types (accept numbers, strings, booleans, etc)
      { path: ParamValue<true> },
      // these are the normalized params as found in useRoute().params
      { path: ParamValue<false> }
    >
  }
}
```

### `Router`

The `Router` type gives you access to the typed version of the router instance. It's also the _ReturnType_ of the `useRouter()` function.

```ts
import type { Router } from 'vue-router/auto'
```

### `RouteLocationResolved`

The `RouteLocationResolved` type exposed by `vue-router/auto` allows passing a generic (which autocomplete) to type a route **whenever checking the name doesn't makes sense because you know the type**. This is useful for cases like `<RouterLink v-slot="{ route }">`:

```vue
<RouterLink v-slot="{ route }">
  User {{ (route as RouteLocationResolved<'/users/[id]'>).params.id }}
</RouterLink>
```

This type is also the return type of `router.resolve()`.

You have the same equivalents for `RouteLocation`, `RouteLocationNormalized`, and `RouteLocationNormalizedLoaded`. All of them exist in `vue-router` but `vue-router/auto` override them to provide a type safe version of them. In addition to that, you can pass the name of the route as a generic:

```ts twoslash
import 'unplugin-vue-router/client'
import { type RouteLocationNormalizedLoaded, useRoute } from 'vue-router/auto'
// ---cut---
// @moduleResolution: bundler
// these are all valid
let userWithId: RouteLocationNormalizedLoaded<'/users/[id]'> = useRoute()
userWithId = useRoute<'/users/[id]'>()
// 👇 this one is the easiest to write because it autocompletes
userWithId = useRoute('/users/[id]')
```
