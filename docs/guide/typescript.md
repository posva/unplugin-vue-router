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

### `typed-router.d.ts` contents

You can always take a look at the generated `typed-router.d.ts` file to inspect what are the generated types. `unplugin-vue-router` creates and exports a couple of types, among them, `RouteNamedMap` with all the route records, typed, in your application. Each route record contains the route's name, path, typed params and a list of its child route names.

Other types, prefixed with an underscore (`_`), are used internally, e.g. `_RouteFileInfoMap` by the [`sfc-typed-router` Volar plugin](#using-the-sfc-typed-router-volar-plugin) to enhance typings for `useRoute()` and `$route`, if enabled, and **are not meant to be used directly**.

### Manually typing dynamically added routes

The `RouteNamedMap` interface contains all the routes in your application along with their metadata. You can augment it to add types for **dynamic routes** that are added during runtime.

```ts
import type { RouteNamedMap } from 'vue-router/auto-routes'
```

Note that, if you are using the [`sfc-typed-router` Volar plugin](#using-the-sfc-typed-router-volar-plugin), you should also augment the `_RouteFileInfoMap` interface for every dynamically added route corresponding to a page component.

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
  } from 'vue-router'

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
      | never
    >
  }

  export interface _RouteFileInfoMap {
    // the key is the file path and should match the page component's file path
    '/added-during-runtime/[...path].vue': {
      // these are the route names that can be displayed within this component
      routes: 'custom-dynamic-name' | 'custom-dynamic-child-name'
      // these are the views that can be used in this file
      views: 'default'
    }

    '/added-during-runtime/[...path]/child.vue': {
      routes: 'custom-dynamic-child-name'
      views: never
    }
  }
}
```

You can now pass a _type param_ to the generic route location types to narrow down the type of the route. This automatically includes any child routes typings as well:

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

// Better way. Includes child routes' typings, but no autocompletion.
const userRouteWithIdTypeParam = useRoute<'/users/[id]'>()
userRouteWithIdTypeParam.params.id

// 👇 This one is the easiest to write because it both
//    autocompletes and includes child routes' typings.
const userRouteWithIdParam = useRoute('/users/[id]')
userRouteWithIdParam.name
userRouteWithIdParam.params.id
```

### Using the `sfc-typed-router` Volar plugin

This Volar plugin automatically types `useRoute()` and `$route` correctly in page components, so you don't have to write code like `useRoute('/users/[id]')`, allowing you to write less code.

To start using the plugin, add the following to the `tsconfig.json` file that includes your Vue files:

```json
{
  // ...
  "vueCompilerOptions": {
    "plugins": ["unplugin-vue-router/volar/sfc-typed-router"]
  }
}
```

As long as this plugin isn't enabled in Nuxt by default with `experimental.typedPages: true` or through any other experimental feature flag, you should manually add the plugin via `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  // ...
  typescript: {
    tsConfig: {
      vueCompilerOptions: {
        plugins: ['unplugin-vue-router/volar/sfc-typed-router'],
      },
    },
  },
})
```

When using the `sfc-typed-router` Volar plugin, `useRoute()` and `$route` are typed automatically for page components under the hood, so you don't have to do it manually.
