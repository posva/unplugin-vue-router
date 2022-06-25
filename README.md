# unplugin-vue-router

[![NPM version](https://img.shields.io/npm/v/unplugin-vue-router?color=black&label=)](https://www.npmjs.com/package/unplugin-vue-router)

> Zero-config File based type safe Routing

This build-time plugin simplifies your routing setup **and** makes it safer and easier to use thanks to TypeScript.

⚠️ This package is still experimental. If you found any issue, design flaw, or have ideas to improve it, please, open an [issue](https://github.com/posva/unplugin-vue-router/issues/new/choose) or a [Discussion](https://github.com/posva/unplugin-vue-router/discussions).

## Install

```bash
npm i unplugin-vue-router
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
<summary>Nuxt</summary><br>

```ts
// nuxt.config.js
export default {
  buildModules: [
    [
      'unplugin-vue-router/nuxt',
      {
        /* options */
      },
    ],
  ],
}
```

> This module works for both Nuxt 2 and [Nuxt Vite](https://github.com/nuxt/vite)

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

Make sure to also check [the TypeScript section](#typescript) below if you are using TypeScript.

## Configuration

Have a glimpse of all the existing configuration options with their corresponding **default values**:

```ts
VueRouter({
  // Folder(s) to scan for vue components and generate routes. Can be a string or an array of strings.
  routesFolder: 'src/routes'
  // Path for the generated types. Defaults to `./typed-router.d.ts` if typescript
  // is installed. Can be disabled by passing `false`.
  dts: './typed-router.d.ts',
})
```

## TypeScript

## Rationale

This project idea came from trying to [type the router directly using Typescript](https://github.com/vuejs/router/pull/1397/commits/c577998f3edaa6a1eb9474c27ab6c58f6e2d7c8a), finding it out it's not fast enough to be pleasant to use and recurring to build-based tools, taking some Inspiration from other projects like:

- [Nuxt](https://nuxtjs.org/) - The Vue.js Framework
- [vite-plugin-pages](https://github.com/hannoeru/vite-plugin-pages) - Framework agnostic file based routing
- [Typed Router for Nuxt](https://github.com/victorgarciaesgi/nuxt-typed-router) - A module to add typed routing to Nuxt

## License

[MIT](http://opensource.org/licenses/MIT)
