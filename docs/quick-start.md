# Quick start

## Installation

Install using your favorite package manager:

```bash
npm install -D unplugin-vue-router
```

Add the plugin to your bundler:

::: code-group

```ts [vite.config.ts]
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

```ts [rollup.config.js]
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

```ts [webpack.config.js]
module.exports = {
  /* ... */
  plugins: [
    require('unplugin-vue-router/webpack')({
      /* options */
    }),
  ],
}
```

```ts [vue.config.js]
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

```ts [esbuild.config.js]
import { build } from 'esbuild'
import VueRouter from 'unplugin-vue-router/esbuild'

build({
  plugins: [VueRouter()],
})
```

:::

## Setup

### From scratch

Start your development server, usually with `npm run dev`. This will create a few necessary files.

- Create a `src/pages` folder and add an `index.vue` component to it. This will render your home page at `/`.
- Add Vue Router using `vue-router/auto` instead of `vue-router`. These types are augmented to be fully typed.

::: code-group

```ts{2,5-8} [src/main.ts]
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router/auto'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  // the routes property is handled by the plugin
})

createApp(App).use(router).mount('#app')
```

```vue [src/pages/index.vue]
<template>
  <h1>Home</h1>
</template>
```

:::

### Migrating an existing project

Move your page components to `src/pages` and renaming accordingly. Here is an example of migration:

Given the following route configuration:

::: code-group

```ts [src/router.ts]
import { createRouter, createWebHistory } from 'vue-router' // [!code --]
import { createRouter, createWebHistory } from 'vue-router/auto' // [!code ++]

export const router = createRouter({
  history: createWebHistory(),
  routes: [ // [!code --]
    { // [!code --]
      path: '/', // [!code --]
      component: () => import('src/pages/Home.vue'), // [!code --]
    }, // [!code --]
    { // [!code --]
      path: '/users/:id', // [!code --]
      component: () => import('src/pages/User.vue'), // [!code --]
    } // [!code --]
    { // [!code --]
      path: '/about', // [!code --]
      component: () => import('src/pages/About.vue'), // [!code --]
    }, // [!code --]
  ] // [!code --]
})
```

```ts [main.ts]
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router/auto'
import App from './App.vue'

const router = createRouter({
  history: createWebHistory(),
  // the routes property is handled by the plugin
})

createApp(App).use(router).mount('#app')
```

:::

- Rename `src/pages/Home.vue` to `src/pages/index.vue`
- Rename `src/pages/User.vue` to `src/pages/users/[id].vue`
- Rename `src/pages/About.vue` to `src/pages/about.vue`

Check the [file-based routing](/guide/file-based-routing) guide for more information about the naming conventions.
