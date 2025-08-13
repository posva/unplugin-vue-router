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

The generated _Route Map_ is picked up by `unplugin-vue-router/client` types and configures the `vue-router` types to be aware of the routes in your application. Making everything type safe!

::: tip
You can commit the newly added `.d.ts` files to your repository to make your life easier.
:::

```ts twoslash
// ---cut-start---
import 'unplugin-vue-router/client'
import './typed-router.d'
// ---cut-end---
// @moduleResolution: bundler
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
router.push('')
//           ^|
```

## Extra types

You can always take a look at the generated `typed-router.d.ts` file to inspect what are the generated types. `unplugin-vue-router` creates a `RouteNamedMap` interface and exports it from `'vue-router/auto-routes'`.

```ts
import type { RouteNamedMap } from 'vue-router/auto-routes'
```

This interface contains all the routes in your application along with their metadata. Augment it to add types for **dynamic routes** that are added during runtime:

```ts
export {} // needed in .d.ts files
import type {
  RouteRecordInfo,
  ParamValue,
  // these are other param helper types
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,
} from 'vue-router'
declare module 'vue-router/auto-routes' {
  export interface RouteNamedMap {
    // the key is the name and should match the first generic of RouteRecordInfo
    'custom-dynamic-name': RouteRecordInfo<
      'custom-dynamic-name',
      '/added-during-runtime/[...path]',
      // these are the raw param types (accept numbers, strings, booleans, etc)
      { path: ParamValue<true> },
      // these are the normalized params as found in useRoute().params
      { path: ParamValue<false> },
      // this is a union of all children route names
      // if the route does not have nested routes, pass `never` or omit this generic entirely
      | 'custom-dynamic-child-name'
    >
    'custom-dynamic-child-name': RouteRecordInfo<
      'custom-dynamic-child-name',
      '/added-during-runtime/[...path]/child',
      { path: ParamValue<true> },
      { path: ParamValue<false> },
      never
    >
  }
}
```

You can now pass a _type param_ to the generic route location types to narrow down the type of the route:

```ts twoslash
// ---cut-start---
import 'unplugin-vue-router/client'
import './typed-router.d'
import { useRoute, type RouteLocationNormalizedLoaded } from 'vue-router'
// ---cut-end---
// @errors: 2322 2339
// @moduleResolution: bundler
// These are all valid ways to get a typed route and return the
// provided route's and any of its child routes' typings.
// Note that `/users/[id]/edit` is a child route
// of `/users/[id]` in this example.

// Not recommended, since this leaves out any child routes' typings.
const userRouteWithIdCasted =
  useRoute() as RouteLocationNormalizedLoaded<'/users/[id]'>
userRouteWithIdCasted.params.id
// Better way, but no autocompletion.
const userRouteWithIdTypeParam = useRoute<'/users/[id]'>()
userRouteWithIdTypeParam.params.id
// 👇 This one is the easiest to write because it autocompletes.
const userRouteWithIdParam = useRoute('/users/[id]')
userRouteWithIdParam.name
//                   ^?
```
