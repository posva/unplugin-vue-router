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

You can modify and extend any page component with the `definePage()` macro. This is useful for adding meta information, or modifying the route object. It's globally available in Vue components but you can import it from `unplugin-vue-router/runtime` if needed.

```vue{2-7} twoslash
<script setup lang="ts">
// ---cut-start---
import 'unplugin-vue-router/client'
import './typed-router.d'
export {}
// ---cut-end---
// @errors: 2322 2339
// @moduleResolution: bundler
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

If you are using ESLint, you will need [to declare it as a global variable](../guide/eslint.md#definepage).

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

## Extending routes at runtime

As an escape-hatch, it's possible to extend the routes **at runtime** by simply changing or cloning the `routes` array before passing it to `createRouter()`. Since these changes are made at runtime, they are not reflected in the generated `typed-router.d.ts` file.

```js{4-9}
import { createWebHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

for (const route of routes) {
  if (route.name === '/admin') {
    route.meta ??= {}
    route.meta.requiresAuth = true
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes,
})
```

As this plugin evolves, this should be used less and less and only become necessary in specific scenarios.

One example of this is using [vite-plugin-vue-layouts](https://github.com/JohnCampionJr/vite-plugin-vue-layouts) which can only be used this way:

```ts
import { createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { setupLayouts } from 'virtual:generated-layouts'

const router = createRouter({
  // ...
  routes: setupLayouts(routes),
})
```

Another one is adding _redirect_ records to the router:

```ts
import { routes } from 'vue-router/auto-routes'

routes.push({
  path: '/path-to-redirect',
  redirect: '/redirected-path',
})

routes.push({
  path: '/path-to-redirect/:id',
  redirect: (to) => `/redirected-path/${to.params.id}`,
})
```

One benefit of adding redirects at runtime only is that they are not reflected in the generated `typed-router.d.ts` and won't appear in autocompletion but will still work as expected when the user enters the URL or clicks on a link.
