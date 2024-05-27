# Extending Routes

## Extending routes in config

You can extend the routes at build time with the `extendRoute` or the `beforeWriteFiles` options. Both can return a Promise:

```ts twoslash
import VueRouter from 'unplugin-vue-router/vite'
import path from 'node:path'
/**
 * In ESM environments, you can use `import.meta.url` to get the current file path:
 *
 * ```ts
 * import { dirname } from 'node:path'
 * import { fileURLToPath } from 'node:url'
 *
 * const __filename = fileURLToPath(import.meta.url)
 * const __dirname = dirname(__filename)
 * ```
 */
const __dirname: string = '...'
// ---cut---
// @moduleResolution: bundler
VueRouter({
  extendRoute(route) {
    if (route.name === '/[name]') {
      route.addAlias('/hello-vite-:name')
    }
  },

  beforeWriteFiles(root) {
    root.insert('/from-root', path.join(__dirname, './src/pages/index.vue'))
  },
})
```

Routes modified this way will be reflected in the generated `typed-router.d.ts` file.

## In-Component Routing

It's possible to override the route configuration directly in the page component file. These changes are picked up by the plugin and reflected in the generated `typed-router.d.ts` file.

### `definePage()`

You can modify and extend any page component with the `definePage()` macro from `vue-router/auto`. This is useful for adding meta information, or modifying the route object. If you have configured auto imports, you won't need to import `definePage` from `vue-router/auto` as it is already available.

```vue{2,4-9} twoslash
<script setup lang="ts">
// ---cut-start---
import 'unplugin-vue-router/client'
import './typed-router.d'
export {}
// ---cut-end---
// @errors: 2322 2339
// @moduleResolution: bundler
import { definePage } from 'vue-router/auto'

definePage({
  alias: ['/n/:name'],
  meta: {
    requiresAuth: true,
  },
})
</script>

<template>
  <!-- ... -->
</template>
```

::: danger
You cannot use variables in `definePage()` as its passed parameter gets extracted at build time and is removed from `<script setup>`. Similar to other macros like `definePageMeta()` in Nuxt.
:::

### SFC `<route>` custom block

The `<route>` custom block is a way to extend existing routes. It can be used to add new `meta` fields, override the `path`, the `name`, or anything else in a route. **It has to be added to a `.vue` component inside of the [routes folder](#routes-folder-structure)**. It is similar to [the same feature in vite-plugin-pages](https://github.com/hannoeru/vite-plugin-pages#sfc-custom-block-for-route-data) to facilitate migration.

```vue
<route lang="json">
{
  "name": "name-override",
  "meta": {
    "requiresAuth": false
  }
}
</route>
```

Note you can specify the language to use with `<route lang="yaml">`. By default, the language is JSON5 (more flexible version of JSON) but yaml and JSON are also supported.

## `extendRoutes()`

As an escape-hatch, it's possible to extend the routes **at runtime** with the `extendRoutes` option in `createRouter()`. Since these changes are made at runtime, they are not reflected in the generated `typed-router.d.ts` file.

```js{4-12}
import { createWebHistory, createRouter } from 'vue-router/auto'

const router = createRouter({
  extendRoutes: (routes) => {
    const adminRoute = routes.find((r) => r.name === '/admin')
    if (adminRoute) {
      adminRoute.meta ??= {}
      adminRoute.meta.requiresAuth = true
    }
    // the return is completely optional since we are modifying the routes in place
    return routes
  },
  history: createWebHistory(),
})
```

As this plugin evolves, this function should be used less and less and only become necessary in unique edge cases.

One example of this is using [vite-plugin-vue-layouts](https://github.com/JohnCampionJr/vite-plugin-vue-layouts) which can only be used alongside `extendRoutes()`:

```ts
import { createRouter } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'

const router = createRouter({
  // ...
  extendRoutes: (routes) => setupLayouts(routes),
})
```
