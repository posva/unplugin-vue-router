# unplugin-vue-router

[![NPM version](https://img.shields.io/npm/v/unplugin-vue-router?color=black&label=)](https://www.npmjs.com/package/unplugin-vue-router) [![ci status](https://github.com/posva/unplugin-vue-router/actions/workflows/ci.yml/badge.svg)](https://github.com/posva/unplugin-vue-router/actions/workflows/ci.yml)

> Automatic file based Routing in Vue with TS support ✨

<!-- https://user-images.githubusercontent.com/664177/176622756-3d10acc6-caac-40ff-a41f-9bdccadf7f1d.mp4 -->

<p align="center">
  <img src="https://user-images.githubusercontent.com/664177/176623167-0153f9fb-79cd-49a7-8575-429ce323dd11.gif" >
</p>

This build-time plugin simplifies your routing setup **and** makes it safer and easier to use thanks to TypeScript. Requires Vue Router at least 4.1.0.

⚠️ This package is still experimental. If you found any issue, design flaw, or have ideas to improve it, please, open an [issue](https://github.com/posva/unplugin-vue-router/issues/new/choose) or a [Discussion](https://github.com/posva/unplugin-vue-router/discussions).

## Install

```bash
npm i -D unplugin-vue-router
```

<details>
<summary>Vite</summary><br>

```ts
// vite.config.ts
import VueRouter from 'unplugin-vue-router/vite'

export default defineConfig({
  plugins: [
    VueRouter({
      /* options */
    }),
  ],
})
```

Example: [`playground/`](./playground/)

<br></details>

<details>
<summary>Rollup</summary><br>

```ts
// rollup.config.js
import VueRouter from 'unplugin-vue-router/rollup'

export default {
  plugins: [
    VueRouter({
      /* options */
    }),
  ],
}
```

<br></details>

<details>
<summary>Webpack</summary><br>

```ts
// webpack.config.js
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-vue-router/webpack')({
      /* options */
    }),
  ],
}
```

<br></details>

<details>
<summary>Vue CLI</summary><br>

```ts
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      require('unplugin-vue-router/webpack')({
        /* options */
      }),
    ],
  },
}
```

<br></details>

<details>
<summary>esbuild</summary><br>

```ts
// esbuild.config.js
import { build } from 'esbuild'
import VueRouter from 'unplugin-vue-router/esbuild'

build({
  plugins: [VueRouter()],
})
```

<br></details>

Then, you can run your dev server (usually `npm run dev` to generate the first version of the types) you can replace your imports from `vue-router` to `@vue-router`:

```diff
-import { createRouter, createWebHistory } from 'vue-router'
+import { createRouter, createWebHistory } from '@vue-router'

createRouter({
  history: createWebHistory(),
  // You don't need to pass the routes anymore,
  // the plugin writes it for you 🤖
})
```

If you are using [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import), make sure to remove the `vue-router` preset and use the one exported by `unplugin-vue-router`:

```diff
 import { defineConfig } from 'vite'
 import AutoImport from 'unplugin-auto-import/vite'
+import { VueRouterExports } from 'unplugin-vue-router'

 export default defineConfig({
   plugins: [
     // other plugins
     AutoImport({
       imports: [
-        'vue-router',
+        { '@vue-router': VueRouterExports },
       ],
     }),
   ],
 })
```

Make sure to also check and follow [the TypeScript section](#typescript) below **if you are using TypeScript or have a `jsconfig.json` file**.

## Configuration

Have a glimpse of all the existing configuration options with their corresponding **default values**:

```ts
VueRouter({
  // Folder(s) to scan for vue components and generate routes. Can be a string, or
  // an object, or an array of those.
  routesFolder: 'src/routes',

  // allowed extensions to be considered as routes
  extensions: ['.vue'],

  // list of glob files to exclude from the routes generation
  // e.g. ['**/__*'] will exclude all files starting with `__`
  // e.g. ['**/__*/**/*'] will exclude all files within folders starting with `__`
  exclude: [],

  // Path for the generated types. Defaults to `./typed-router.d.ts` if typescript
  // is installed. Can be disabled by passing `false`.
  dts: './typed-router.d.ts',

  // Override the name generation of routes. unplugin-vue-router exports two versions:
  // `getFileBasedRouteName()` (the default) and `getPascalCaseRouteName()`. Import any
  // of them within your `vite.config.ts` file.
  getRouteName: (routeNode) => myOwnGenerateRouteName(routeNode),

  // Customizes the default langage for `<route>` blocks
  // json5 is just a more permissive version of json
  routeBlockLang: 'json5',
})
```

## Routes folder structure

By default, this plugins checks the folder at `src/routes` for any `.vue` files and generates the corresponding routing structure basing itself in the file name. This way, you no longer need to maintain a `routes` array when adding routes to your application, **instead just add the new `.vue` component to the routes folder and let this plugin do the rest!**

Let's take a look at a simple example:

```
src/routes/
├── index.vue
├── about.vue
└── users/
    ├── index.vue
    └── [id].vue
```

This will generate the following routes:

- `/`: -> renders the `index.vue` component
- `/about`: -> renders the `about.vue` component
- `/users`: -> renders the `users/index.vue` component
- `/users/:id`: -> renders the `users/[id].vue` component. `id` becomes a route param.

### Index Routes

Any `index.vue` file will generate an empty path (similar to `index.html` files):

- `src/routes/index.vue`: generates a `/` route
- `src/routes/users/index.vue`: generates a `/users` route

### Nested Routes

Nested routes are automatically defined by defining a `.vue` file alongside a folder **with the same name**. If you create both a `src/routes/users/index.vue` and a `src/routes/users.vue` components, the `src/routes/users/index.vue` will be rendered within the `src/routes/users.vue`'s `<RouterView>`.

In other words, given this folder structure:

```
src/routes/
├── users/
│   └── index.vue
└── users.vue
```

You will get this `routes` array:

```js
const routes = [
  {
    path: '/users',
    component: () => import('src/routes/users.vue'),
    children: [
      { path: '', component: () => import('src/routes/users/index.vue') },
    ],
  },
]
```

While omitting the `src/routes/users.vue` component will generate the following routes:

```js
const routes = [
  {
    path: '/users',
    // notice how there is no component here
    children: [
      { path: '', component: () => import('src/routes/users/index.vue') },
    ],
  },
]
```

Note `users/` could be any valid route like `my-[id]-param/`.

#### Nested routes without nesting layouts

Sometimes you might want to add _nesting to the URL_ in the form of slashes but you don't want it to impact your UI hierarchy. Consider the following folder structure:

```
src/routes/
├── users/
│   ├── index.vue
│   ├── [id].vue
│   └── index.vue
└── users.vue
```

### Named routes

All generated routes that have a `component` property will have a `name` property. This avoid accidentally directing your users to a parent route. By default, names are generated using the file path, but you can override this behavior by passing a custom `getRouteName()` function. You will get TypeScript validation almost everywhere, so changing this should be easy.

### Dynamic Routes

You can add [route params](https://router.vuejs.org/guide/essentials/dynamic-matching.html) by wrapping the _param name_ with brackets, e.g. `src/routes/users/[id].vue` will create a route with the following path: `/users/:id`.

You can create [**optional params**](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#optional-parameters) by wrapping the _param name_ with an extra pair of brackets, e.g. `src/routes/users/[[id]].vue` will create a route with the following path: `/users/:id?`.

You can create [**repeatable params**](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#repeatable-params) by adding a plus character (`+`) after the closing bracket, e.g. `src/routes/articles/[slugs]+.vue` will create a route with the following path: `/articles/:slugs+`.

And you can combine both to create optional repeatable params, e.g. `src/routes/articles/[[slugs]]+.vue` will create a route with the following path: `/articles/:slugs*`.

### Catch all / 404 Not found route

To create a catch all route prepend 3 dots (`...`) to the param name, e.g. `src/routes/[...path].vue` will create a route with the following path: `/:path(.*)`. This will match any route. Note this can be done inside a folder too, e.g. `src/routes/articles/[...path].vue` will create a route with the following path: `/articles/:path(.*)`.

### Multiple routes folders

It's possible to provide multiple routes folders by passing an array to `routesFolder`:

```js
VueRouter({
  routesFolder: ['src/routes', 'src/admin/routes'],
})
```

You can also provide a path prefix for each of these folders, it will be used _as is_, and can therefor **not end in a `/`** and even contain any params you want:

```js
VueRouter({
  routesFolder: [
    'src/routes',
    {
      src: 'src/admin/routes',
      // note there is always a trailing slash and never a leading one
      path: 'admin/',
    },
    {
      src: 'src/docs',
      path: 'docs/:lang/',
    },
    {
      src: 'src/promos',
      // produces paths like /promos-some-file-name
      path: 'promos-',
    },
  ],
})
```

Note that the provided folders must be separate and one _route folder_ cannot contain another specified _route folder_.

## TypeScript

This plugin generates a `d.ts` file with all the typing overrides when the dev or build server is ran. Make sure to include it in your `tsconfig.json`'s (or `jsconfig.json`'s) `include` or `files` property:

```js
{
  // ...
  "include": [/* ... */ "typed-router.d.ts"]
  // ...
}
```

Then, you will be able to import from `@vue-router` (instead of `vue-router`) to get access to the typed APIs. You can commit the `typed-router.d.ts` file to your repository to make your life easier.

### Extra types

You can always take a look at the generated `typed-router.d.ts` file to inspect what are the generated types. `unplugin-vue-router` improves upon many of the existing types in `vue-router` and adds a few ones as well:

#### `RouteNamedMap`

The `RouteNamedMap` interface gives you access to all the metadata associated with a route. It can also be extended to enable types for **dynamic routes** that are added during runtime.

```ts
import type { RouteNamedMap } from '@vue-router/routes'
```

Extending types with dynamically added routes:

```ts
declare module '@vue-router/routes' {
  import type {
    RouteRecordInfo,
    ParamValue,
    // these are other param helper types
    ParamValueOneOrMore,
    ParamValueZeroOrMore,
    ParamValueZeroOrOne,
  } from 'unplugin-vue-router'
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

#### `RouterTyped`

The `RouterTyped` type gives you access to the typed version of the router instance. It's also the _ReturnType_ of the `useRouter()` function.

```ts
import type { RouterTyped } from '@vue-router'
```

#### `RouterLocationResolved`

The `RouterLocationResolved` type exposed by `@vue-router` allows passing a generic (which autocomplete) to type a route **whenever checking the name doesn't makes sense because you know the type**. This is useful for cases like `<RouterLink v-slot="{ route }">`:

```vue
<RouterLink v-slot="{ route }">
  User {{ (route as RouterLocationResolved<'/users/[id]'>).params.id }}
</RouterLink>
```

This type corresponds to the return type of `router.resolve()`.

You have the same equivalents for `RouterLocation`, `RouterLocationNormalized`, and `RouterLocationNormalizedLoaded`. All of them exist in `vue-router` but the one exposed by `@vue-router` accept a generic:

```ts
// these are all valid
let userWithId: RouterLocationNormalizedLoaded<'/users/[id]'> = useRoute()
userWithId = useRoute<'/users/[id]'>()
userWithId = useRoute('/users/[id]') // 👈  this one is the easiest to write
```

## Named views

It is possible to define [named views](https://router.vuejs.org/guide/essentials/named-views.html#named-views) by appending an `@` + a name to their filename, e.g. a file named `src/routes/index@aux.vue` will generate a route of:

```js
{
  path: '/',
  component: {
    aux: () => import('src/routes/index@aux.vue')
  }
}
```

Note that by default a non named route is named `default` and that you don't need to name your file `index@default.vue` even if there are other named views (e.g. having `index@aux.vue` and `index.vue` is the same as having `index@aux.vue` and `index@default.vue`).

## Extending existing routes

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

Note you can specify the language to use with `<route lang="yaml">`. By default, the language is JSON5 (more flexible version of JSON) but yaml and JSON are also supported. **This will also add Syntax Highlighting**.

### `extendRoutes()`

You can extend existing routes by passing an `extendRoutes` function to `createRouter()`. **This should be used as a last resort** (or until a feature is natively available here):

```js
import { createWebHistory, createRouter } from '@vue-router'

const router = createRouter({
  extendRoutes: (routes) => {
    const adminRoute = routes.find((r) => r.name === '/admin')
    if (!adminRoute) {
      adminRoute.meta ??= {}
      adminRoute.meta.requiresAuth = true
    }
    // completely optional since we are modifying the routes in place
    return routes
  },
  history: createWebHistory(),
})
```

As this plugin evolves, this function should be used less and less and only become necessary in unique edge cases.

One example of this is using [vite-plugin-vue-layouts](https://github.com/JohnCampionJr/vite-plugin-vue-layouts) which can only be used alongside `extendRoutes()`:

```ts
import { createRouter } from '@vue-router'
import { setupLayouts } from 'virtual:generated-layouts'

const router = createRouter({
  // ...
  extendRoutes: (routes) => setupLayouts(routes),
})
```

## Rationale

This project idea came from trying [to type the router directly using Typescript](https://github.com/vuejs/router/pull/1397/commits/c577998f3edaa6a1eb9474c27ab6c58f6e2d7c8a), finding out it's not fast enough to be pleasant to use and, ending up using build-based tools, taking some inspiration from other projects like:

- [Nuxt](https://nuxtjs.org/) - The Vue.js Framework
- [vite-plugin-pages](https://github.com/hannoeru/vite-plugin-pages) - Framework agnostic file based routing
- [Typed Router for Nuxt](https://github.com/victorgarciaesgi/nuxt-typed-router) - A module to add typed routing to Nuxt

## License

[MIT](http://opensource.org/licenses/MIT)
