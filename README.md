# unplugin-vue-router

[![NPM version](https://img.shields.io/npm/v/unplugin-vue-router?color=black&label=)](https://www.npmjs.com/package/unplugin-vue-router) [![ci status](https://github.com/posva/unplugin-vue-router/actions/workflows/ci.yml/badge.svg)](https://github.com/posva/unplugin-vue-router/actions/workflows/ci.yml)

> Automatic file based Routing in Vue with TS support ✨

<!-- https://user-images.githubusercontent.com/664177/176622756-3d10acc6-caac-40ff-a41f-9bdccadf7f1d.mp4 -->

<p align="center">
  <img src="https://user-images.githubusercontent.com/664177/176623167-0153f9fb-79cd-49a7-8575-429ce323dd11.gif" >
</p>

- [StackBlitz Demo](https://stackblitz.com/github/posva/uvr-demo)

This build-time plugin simplifies your routing setup **and** makes it safer and easier to use thanks to TypeScript. Requires Vue Router at least 4.1.0.

⚠️ This package is still experimental. If you found any issue, design flaw, or have ideas to improve it, please, open an [issue](https://github.com/posva/unplugin-vue-router/issues/new/choose) or a [Discussion](https://github.com/posva/unplugin-vue-router/discussions).

## Install

```bash
npm i -D unplugin-vue-router
```

Add VueRouter plugin **before** Vue plugin:

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
    // ⚠️ Vue must be placed after VueRouter()
    Vue(),
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
    // ⚠️ Vue must be placed after VueRouter()
    Vue(),
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

## Setup

After installing, **you should run your dev server** (usually `npm run dev`) **to generate the first version of the types**. Then you need to add the types to your `tsconfig.json`:

```json
{
  "include": [
    // ...
    "./typed-router.d.ts"
  ],
  // ...
  "compilerOptions": {
    // ...
    "moduleResolution": "Bundler",
    "types": [
      // ...
      "unplugin-vue-router/client"
    ]
  }
}
```

Finally, you should replace your imports from `vue-router` to `vue-router/auto`:

```diff
-import { createRouter, createWebHistory } from 'vue-router'
+import { createRouter, createWebHistory } from 'vue-router/auto'

createRouter({
  history: createWebHistory(),
  // You don't need to pass the routes anymore,
  // the plugin writes it for you 🤖
})
```

Alternatively, **you can also import the `routes` array** and create the router manually or pass it to some plugin. Here is an example with [Vitesse starter](https://github.com/antfu/vitesse/blob/main/src/main.ts):

```diff
 import { ViteSSG } from 'vite-ssg'
 import { setupLayouts } from 'virtual:generated-layouts'
 import App from './App.vue'
 import type { UserModule } from './types'
-import generatedRoutes from '~pages'
+import { routes } from 'vue-router/auto-routes'

 import '@unocss/reset/tailwind.css'
 import './styles/main.css'
 import 'uno.css'

-const routes = setupLayouts(generatedRoutes)

 // https://github.com/antfu/vite-ssg
 export const createApp = ViteSSG(
   App,
   {
-   routes,
+   routes: setupLayouts(routes),
    base: import.meta.env.BASE_URL
  },
   (ctx) => {
     // install all modules under `modules/`
     Object.values(import.meta.glob<{ install: UserModule }>('./modules/*.ts', { eager: true }))
       .forEach(i => i.install?.(ctx))
   },
 )
```

- [📖 Check more in the Documentation](https://uvr.esm.is).

## License

[MIT](http://opensource.org/licenses/MIT)
